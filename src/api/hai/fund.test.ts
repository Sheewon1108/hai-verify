// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WALLET_ROLE,
  WORK_X_HANDLE,
  persistableWalletRecord,
  type IsolatedWalletPair,
} from "../../lib/privy";
import {
  MemoryFundStore,
  RecordOnlyHaiCardFunder,
  createChannelNotifier,
  createHaiFundService,
  type HaiCardFunder,
} from "./fund";

const workUser = {
  id: "123456789",
  username: WORK_X_HANDLE,
  name: "KARAM work",
};

const wallets: IsolatedWalletPair = {
  xUserId: workUser.id,
  xUsername: workUser.username,
  bot: persistableWalletRecord(
    { id: "bot-wallet", address: "0x1111111111111111111111111111111111111111" },
    WALLET_ROLE.BOT,
    "did:privy:bot",
  ),
  funding: persistableWalletRecord(
    { id: "fund-wallet", address: "0x2222222222222222222222222222222222222222" },
    WALLET_ROLE.FUNDING,
    "did:privy:funding",
  ),
};

function service(card?: HaiCardFunder) {
  const notifyCalls: Array<{ approveUrl: string; rejectUrl: string }> = [];
  const funded: Array<{ fundingWalletId: string; requestId: string }> = [];
  const impl = createHaiFundService({
    store: new MemoryFundStore(),
    wallets,
    notify: {
      async notify(input) {
        notifyCalls.push(input);
        return { slack: true, telegram: true };
      },
    },
    card: card ?? {
      async fund(input) {
        funded.push({ fundingWalletId: input.fundingWalletId, requestId: input.requestId });
        return { settlementId: `set_${input.requestId}` };
      },
    },
    approvalSecret: "fund-secret",
    publicBaseUrl: "http://127.0.0.1:3000",
    exposeApprovalToken: true,
    now: () => Date.parse("2026-08-25T00:00:00.000Z"),
    id: () => "hf_test1",
  });
  return { impl, notifyCalls, funded };
}

describe("POST /api/hai/fund request", () => {
  it("creates a pending request and pings approval channels without moving money", async () => {
    const { impl, notifyCalls, funded } = service();
    const result = await impl.requestFund({
      amountCents: 2500,
      fundingWalletId: wallets.funding.id,
      xAccount: workUser,
      memo: "weekly top-up",
    });

    assert.equal(result.request.status, "pending_approval");
    assert.equal(result.request.fundingWalletId, "fund-wallet");
    assert.equal(result.notified.slack, true);
    assert.equal(result.notified.telegram, true);
    assert.ok(result.approvalToken);
    assert.equal(funded.length, 0);
    assert.match(notifyCalls[0]!.approveUrl, /\/api\/hai\/fund\/approve\?action=approve/);
    assert.match(notifyCalls[0]!.rejectUrl, /action=reject/);
  });

  it("rejects the bot wallet and private-key payloads", async () => {
    const { impl } = service();
    await assert.rejects(
      () =>
        impl.requestFund({
          amountCents: 100,
          fundingWalletId: wallets.bot.id,
          xAccount: workUser,
        }),
      { code: "BOT_WALLET_BLOCKED" },
    );
    await assert.rejects(
      () =>
        impl.requestFund({
          amountCents: 100,
          fundingWalletId: wallets.funding.id,
          xAccount: workUser,
          // @ts-expect-error intentional secret field
          private_key: "0xdead",
        }),
      { code: "PRIVATE_KEY_FORBIDDEN" },
    );
  });

  it("rejects a non-work X account and oversized amounts", async () => {
    const { impl } = service();
    await assert.rejects(
      () =>
        impl.requestFund({
          amountCents: 100,
          fundingWalletId: wallets.funding.id,
          xAccount: { id: "9", username: "notkaram", name: "nope" },
        }),
      { code: "X_HANDLE_DENIED" },
    );
    await assert.rejects(
      () =>
        impl.requestFund({
          amountCents: 9_999_999,
          fundingWalletId: wallets.funding.id,
          xAccount: workUser,
        }),
      { code: "AMOUNT_MAX" },
    );
  });
});

describe("approval decision", () => {
  it("executes only after approve and only from the funding wallet", async () => {
    const { impl, funded } = service();
    const pending = await impl.requestFund({
      amountCents: 1200,
      fundingWalletId: wallets.funding.id,
      xAccount: workUser,
    });

    const executed = await impl.decide(pending.approvalToken!, "approve");
    assert.equal(executed.status, "executed");
    assert.equal(executed.settlementId, "set_hf_test1");
    assert.deepEqual(funded, [{ fundingWalletId: "fund-wallet", requestId: "hf_test1" }]);

    const replay = await impl.decide(pending.approvalToken!, "approve");
    assert.equal(replay.status, "executed");
    assert.equal(funded.length, 1);
  });

  it("rejects without calling the card", async () => {
    const { impl, funded } = service();
    const pending = await impl.requestFund({
      amountCents: 500,
      fundingWalletId: wallets.funding.id,
      xAccount: workUser,
    });
    const rejected = await impl.decide(pending.rejectToken!, "reject");
    assert.equal(rejected.status, "rejected");
    assert.equal(funded.length, 0);
  });

  it("does not pass the bot wallet into the card funder", async () => {
    const card: HaiCardFunder = {
      async fund(input) {
        assert.notEqual(input.fundingWalletId, wallets.bot.id);
        assert.equal(input.fundingWalletId, wallets.funding.id);
        return { settlementId: "ok" };
      },
    };
    const { impl } = service(card);
    const pending = await impl.requestFund({
      amountCents: 700,
      fundingWalletId: wallets.funding.id,
      xAccount: workUser,
    });
    const executed = await impl.decide(pending.approvalToken!);
    assert.equal(executed.status, "executed");
  });

  it("uses the record-only card funder without private keys", async () => {
    const { impl } = service(new RecordOnlyHaiCardFunder());
    const pending = await impl.requestFund({
      amountCents: 300,
      fundingWalletId: wallets.funding.id,
      xAccount: workUser,
    });
    const executed = await impl.decide(pending.approvalToken!);
    assert.equal(executed.settlementId, "hai-card:hf_test1");
  });
});

describe("Slack / Telegram notifier", () => {
  it("posts to both channels when configured", async () => {
    const calls: string[] = [];
    const notify = createChannelNotifier(
      {
        SLACK_FUND_WEBHOOK_URL: "https://hooks.slack.test/hai",
        TELEGRAM_BOT_TOKEN: "tg-token",
        TELEGRAM_CHAT_ID: "42",
      },
      async (url) => {
        calls.push(String(url));
        return new Response("ok", { status: 200 });
      },
    );

    const result = await notify.notify({
      request: {
        id: "hf_1",
        status: "pending_approval",
        amountCents: 1000,
        currency: "USD",
        fundingWalletId: "fund-wallet",
        fundingWalletAddress: "0x2222222222222222222222222222222222222222",
        xUsername: WORK_X_HANDLE,
        xUserId: "1",
        createdAt: "2026-08-25T00:00:00.000Z",
      },
      approveUrl: "http://127.0.0.1/approve",
      rejectUrl: "http://127.0.0.1/reject",
    });

    assert.deepEqual(result, { slack: true, telegram: true });
    assert.equal(calls[0], "https://hooks.slack.test/hai");
    assert.equal(calls[1], "https://api.telegram.org/bottg-token/sendMessage");
  });
});
