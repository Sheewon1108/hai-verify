import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type IsolatedWallet,
  requireFundingWallet,
} from "../../lib/privy";
import {
  createFundRequest,
  decideFundRequest,
  handleFundCreate,
  notifyApprovers,
} from "./fund";

const fundingWallet: IsolatedWallet<"funding"> = {
  role: "funding",
  privyUserId: "did:privy:funding",
  privyWalletId: "wallet_fund",
  address: "0x2222222222222222222222222222222222222222",
  chainType: "ethereum",
};

const botWallet: IsolatedWallet<"bot"> = {
  role: "bot",
  privyUserId: "did:privy:bot",
  privyWalletId: "wallet_bot",
  address: "0x1111111111111111111111111111111111111111",
  chainType: "ethereum",
};

const BASE_ENV = {
  HAI_FUND_APPROVAL_SECRET: "fund-secret-fund-secret-fund-secret",
  HAI_PUBLIC_BASE_URL: "http://127.0.0.1:3001",
  PRIVY_BOT_USER_ID: botWallet.privyUserId,
  PRIVY_BOT_WALLET_ID: botWallet.privyWalletId,
  PRIVY_BOT_WALLET_ADDRESS: botWallet.address,
  PRIVY_FUNDING_USER_ID: fundingWallet.privyUserId,
  PRIVY_FUNDING_WALLET_ID: fundingWallet.privyWalletId,
  PRIVY_FUNDING_WALLET_ADDRESS: fundingWallet.address,
  SLACK_APPROVAL_WEBHOOK_URL: "https://hooks.slack.test/hai",
  TELEGRAM_BOT_TOKEN: "telegram-token",
  TELEGRAM_CHAT_ID: "12345",
} as const;

const env = (extra: Record<string, string> = {}) => (name: string) =>
  extra[name] ?? BASE_ENV[name as keyof typeof BASE_ENV];

describe("/api/hai/fund approval + wallet split", () => {
  it("refuses the bot wallet as a card source", async () => {
    await assert.rejects(
      () =>
        createFundRequest({
          amountUsd: 25,
          wallet: botWallet,
          env: env(),
        }),
      /funding wallet only/,
    );
    assert.equal(requireFundingWallet(fundingWallet).address, fundingWallet.address);
  });

  it("does not credit the card until Slack/Telegram approval", async () => {
    const created = await createFundRequest({
      amountUsd: 40,
      currency: "USDC",
      memo: "test top-up",
      wallet: fundingWallet,
      env: env(),
    });

    const notifies: string[] = [];
    const approvals = await notifyApprovers({
      request: created.request,
      token: created.token,
      env: env(),
      http: async (request) => {
        notifies.push(request.url);
        assert.match(request.body ?? "", /human approval required/i);
        assert.match(request.body ?? "", /\/api\/hai\/fund\/approve/);
        assert.equal((request.body ?? "").includes(botWallet.address), false);
        return { status: 200, json: { ok: true } };
      },
    });

    assert.equal(approvals.slack.sent, true);
    assert.equal(approvals.telegram.sent, true);
    assert.ok(notifies.some((url) => url.includes("hooks.slack.test")));
    assert.ok(notifies.some((url) => url.includes("api.telegram.org")));

    const store = new Map<string, string>();
    const denied = await decideFundRequest({
      token: created.token,
      decision: "deny",
      env: env(),
      store: {
        has: (id) => store.has(id),
        mark: (id, decision) => {
          store.set(id, decision);
        },
      },
    });
    assert.equal(denied.status, "denied");
    assert.equal(denied.card, undefined);
  });

  it("credits only from the funding wallet after approve", async () => {
    const created = await createFundRequest({
      amountUsd: 15,
      wallet: fundingWallet,
      env: env(),
    });

    let cardBody = "";
    const result = await decideFundRequest({
      token: created.token,
      decision: "approve",
      env: env({ HAI_CARD_API_URL: "https://hai-card.test" }),
      http: async (request) => {
        cardBody = request.body ?? "";
        return { status: 200, json: { reference: "card_tx_1" } };
      },
      store: {
        has: () => false,
        mark: () => undefined,
      },
    });

    assert.equal(result.status, "card_funded");
    assert.equal(result.card?.providerReference, "card_tx_1");
    const parsed = JSON.parse(cardBody) as { sourceWallet: { role: string; address: string } };
    assert.equal(parsed.sourceWallet.role, "funding");
    assert.equal(parsed.sourceWallet.address, fundingWallet.address);
    assert.equal(cardBody.includes(botWallet.address), false);
  });

  it("HTTP create stays pending and never mentions a private key", async () => {
    const response = await handleFundCreate(
      new Request("http://127.0.0.1:3001/api/hai/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsd: 12, currency: "USDC" }),
      }),
      env(),
      async () => ({ status: 200, json: { ok: true } }),
    );
    const json = (await response.json()) as {
      ok: boolean;
      status: string;
      botWalletExcluded: boolean;
      fundingWallet: { role: string };
    };
    assert.equal(response.status, 200);
    assert.equal(json.ok, true);
    assert.equal(json.status, "pending_approval");
    assert.equal(json.botWalletExcluded, true);
    assert.equal(json.fundingWallet.role, "funding");
    assert.equal(JSON.stringify(json).toLowerCase().includes("private"), false);
  });
});
