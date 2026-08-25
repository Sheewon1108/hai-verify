import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMemoryFundStore,
  decideHaiCardFund,
  fundErrorToResponse,
  parseFundRequestInput,
  requestHaiCardFund,
  signApprovalToken,
  validateFundAmount,
  type FundDeps,
} from "./fund";
import { PrivyConfigError, WalletIsolationError, type IsolatedWallets } from "../../lib/privy";

const isolated: IsolatedWallets = {
  bot: {
    role: "bot",
    walletId: "wal_bot_1",
    address: "0x1111111111111111111111111111111111111111",
    chainType: "ethereum",
  },
  funding: {
    role: "funding",
    walletId: "wal_fund_1",
    address: "0x2222222222222222222222222222222222222222",
    chainType: "ethereum",
  },
};

function mockPrivyFetch(): typeof fetch {
  let created = 0;
  return (async (_input, init) => {
    const headers = new Headers(init?.headers);
    const key = headers.get("privy-idempotency-key") ?? "";
    const isBot = key.includes("bot")
      ? true
      : key.includes("funding")
        ? false
        : init?.method === "POST" && created++ === 0;
    const wallet = isBot ? isolated.bot : isolated.funding;
    return new Response(
      JSON.stringify({
        id: wallet.walletId,
        address: wallet.address,
        chain_type: wallet.chainType,
      }),
      { status: 200 },
    );
  }) as typeof fetch;
}

function testDeps(overrides: Partial<FundDeps> = {}): FundDeps {
  const store = overrides.store ?? createMemoryFundStore();
  return {
    env: {
      PRIVY_APP_ID: "owner-app",
      PRIVY_APP_SECRET: "secret",
      PRIVY_OWNER_APP_ID: "owner-app",
      HAI_FUND_APPROVAL_SECRET: "approval-secret-for-tests",
      HAI_PUBLIC_BASE_URL: "http://127.0.0.1:3000",
      HAI_FUND_MAX_AMOUNT_CENTS: "50000",
      ...(overrides.env ?? {}),
    },
    fetch: overrides.fetch ?? mockPrivyFetch(),
    store,
    notify: overrides.notify ?? (async () => ["slack", "telegram"]),
    cardProvider: overrides.cardProvider,
    now: overrides.now ?? (() => 1_700_000_000_000),
  };
}

describe("fund request validation", () => {
  it("maps missing Privy config to HTTP 503 instead of 500", () => {
    const mapped = fundErrorToResponse(new PrivyConfigError("PRIVY_APP_ID is not set"));
    assert.equal(mapped.status, 503);
    assert.equal(mapped.code, "CONFIG");
  });

  it("requires a positive integer amount", () => {
    assert.throws(() => parseFundRequestInput({ amountCents: 0 }), /positive integer/);
    assert.throws(() => validateFundAmount(60_000, { HAI_FUND_MAX_AMOUNT_CENTS: "50000" }), /exceeds max/);
  });

  it("rejects a non-work X handle", async () => {
    await assert.rejects(
      () => requestHaiCardFund({ amountCents: 1000, xHandle: "notkaram" }, testDeps()),
      /work X account/,
    );
  });
});

describe("approval gate", () => {
  it("does not move money until Slack/Telegram approval", async () => {
    let providerCalls = 0;
    const deps = testDeps({
      cardProvider: async () => {
        providerCalls += 1;
        return {
          provider: "hai-x-money",
          mode: "queued",
          requestId: "n/a",
          fundingWalletId: isolated.funding.walletId,
          amountCents: 2500,
          currency: "USD",
        };
      },
    });

    const pending = await requestHaiCardFund({ amountCents: 2500, memo: "test top-up" }, deps);
    assert.equal(pending.status, "pending_approval");
    assert.equal(pending.request.fundingWalletId, isolated.funding.walletId);
    assert.match(pending.approval.approveUrl, /\/api\/hai\/fund\/approve\?token=/);
    assert.deepEqual(pending.approval.channels, ["slack", "telegram"]);
    assert.equal(providerCalls, 0);

    const token = new URL(pending.approval.approveUrl).searchParams.get("token");
    assert.ok(token);
    const decided = await decideHaiCardFund(token, deps);
    assert.equal(decided.ok, true);
    if (decided.ok) {
      assert.equal(decided.status, "executed");
      assert.equal(decided.cardFund?.fundingWalletId, isolated.funding.walletId);
    }
    assert.equal(providerCalls, 1);
  });

  it("never executes against the bot wallet", async () => {
    const deps = testDeps({
      cardProvider: async ({ fundingWallet, isolated: wallets }) => {
        if (fundingWallet.role !== "funding") {
          throw new WalletIsolationError("bot wallet");
        }
        if (fundingWallet.walletId === wallets.bot.walletId) {
          throw new WalletIsolationError("bot wallet");
        }
        return {
          provider: "hai-x-money",
          mode: "queued",
          requestId: "n/a",
          fundingWalletId: fundingWallet.walletId,
          amountCents: 1000,
          currency: "USD",
        };
      },
    });

    const pending = await requestHaiCardFund({ amountCents: 1000 }, deps);
    const rejectToken = new URL(pending.approval.rejectUrl).searchParams.get("token");
    assert.ok(rejectToken);
    const rejected = await decideHaiCardFund(rejectToken, deps);
    assert.equal(rejected.ok, true);
    if (rejected.ok) assert.equal(rejected.status, "rejected");

    const forged = await signApprovalToken(
      {
        requestId: pending.request.requestId,
        action: "approve",
        amountCents: 1000,
        currency: "USD",
        fundingWalletId: isolated.bot.walletId,
        exp: pending.request.expiresAt,
      },
      deps,
    );
    await assert.rejects(() => decideHaiCardFund(forged, deps), /funding wallet/);
  });

  it("rejects a tampered approval token", async () => {
    const deps = testDeps();
    const pending = await requestHaiCardFund({ amountCents: 1000 }, deps);
    const token = new URL(pending.approval.approveUrl).searchParams.get("token") ?? "";
    await assert.rejects(() => decideHaiCardFund(`${token}x`, deps), /signature mismatch|Invalid approval token/);
  });
});
