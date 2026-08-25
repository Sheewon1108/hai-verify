import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertFundingWallet,
  assertMinimalXScopes,
  assertNoPrivateKeyMaterial,
  assertWalletsIsolated,
  buildXAuthorizeUrl,
  getIsolatedWallets,
  getOwnerPrivyConfig,
  toPublicWalletRecord,
  verifyWorkXAccount,
  WalletIsolationError,
  WORK_X_HANDLE,
  X_OAUTH_SCOPES,
  type IsolatedWallets,
  type PublicWalletRecord,
} from "./privy";

const bot: PublicWalletRecord = {
  role: "bot",
  walletId: "wal_bot_1",
  address: "0x1111111111111111111111111111111111111111",
  chainType: "ethereum",
};

const funding: PublicWalletRecord = {
  role: "funding",
  walletId: "wal_fund_1",
  address: "0x2222222222222222222222222222222222222222",
  chainType: "ethereum",
};

const isolated: IsolatedWallets = { bot, funding };

describe("X OAuth scopes", () => {
  it("accepts only tweet.read and users.read", () => {
    assert.deepEqual(assertMinimalXScopes([...X_OAUTH_SCOPES]), X_OAUTH_SCOPES);
  });

  it("rejects extra scopes including offline.access", () => {
    assert.throws(
      () => assertMinimalXScopes(["tweet.read", "users.read", "offline.access"]),
      /offline.access/,
    );
    assert.throws(() => assertMinimalXScopes(["tweet.read", "users.read", "tweet.write"]), /tweet.write/);
  });

  it("puts only the minimum scopes on the authorize URL", () => {
    const url = buildXAuthorizeUrl({
      clientId: "client",
      redirectUri: "http://127.0.0.1:3000/api/hai/x-oauth/callback",
      state: "state",
      codeChallenge: "challenge",
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("scope"), "tweet.read users.read");
    assert.equal(parsed.searchParams.get("code_challenge_method"), "S256");
  });
});

describe("owner Privy app", () => {
  it("refuses a Privy app id that is not the owner app", () => {
    assert.throws(
      () =>
        getOwnerPrivyConfig({
          env: {
            PRIVY_APP_ID: "karam-shared-app",
            PRIVY_APP_SECRET: "secret",
            PRIVY_OWNER_APP_ID: "owner-app",
          },
        }),
      /external Privy app/,
    );
  });

  it("accepts the operator-owned Privy app", () => {
    const config = getOwnerPrivyConfig({
      env: {
        PRIVY_APP_ID: "owner-app",
        PRIVY_APP_SECRET: "secret",
        PRIVY_OWNER_APP_ID: "owner-app",
      },
    });
    assert.equal(config.appId, "owner-app");
  });
});

describe("private keys stay out of this process", () => {
  it("throws when a wallet payload includes a private key", () => {
    assert.throws(
      () =>
        assertNoPrivateKeyMaterial({
          id: "wal_1",
          address: "0xabc",
          private_key: "0xdead",
        }),
      WalletIsolationError,
    );
  });

  it("strips a Privy wallet down to public fields", () => {
    const record = toPublicWalletRecord("funding", {
      id: "wal_fund_1",
      address: funding.address,
      chain_type: "ethereum",
    });
    assert.equal(record.walletId, "wal_fund_1");
    assert.equal("private_key" in record, false);
  });
});

describe("wallet isolation", () => {
  it("rejects a shared wallet id or address", () => {
    assert.throws(
      () =>
        assertWalletsIsolated({
          bot,
          funding: { ...funding, walletId: bot.walletId },
        }),
      /share a Privy wallet id/,
    );
    assert.throws(
      () =>
        assertWalletsIsolated({
          bot,
          funding: { ...funding, address: bot.address },
        }),
      /share an address/,
    );
  });

  it("refuses to treat the bot wallet as the funding wallet", () => {
    assert.throws(() => assertFundingWallet(bot, isolated), /not the bot wallet/);
  });

  it("creates two distinct wallets and never asks Privy for a private key", async () => {
    const paths: string[] = [];
    const wallets = await getIsolatedWallets({
      env: {
        PRIVY_APP_ID: "owner-app",
        PRIVY_APP_SECRET: "secret",
        PRIVY_OWNER_APP_ID: "owner-app",
      },
      fetch: async (input, init) => {
        const url = String(input);
        paths.push(url);
        assert.equal(init?.method, "POST");
        const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        assert.equal(body.export, undefined);
        assert.equal(body.include_private_key, undefined);
        const headers = new Headers(init?.headers);
        const role = headers.get("privy-idempotency-key") ?? "";
        const isBot = role.includes("bot") || paths.length === 1;
        return new Response(
          JSON.stringify({
            id: isBot ? bot.walletId : funding.walletId,
            address: isBot ? bot.address : funding.address,
            chain_type: "ethereum",
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(wallets.bot.walletId, bot.walletId);
    assert.equal(wallets.funding.walletId, funding.walletId);
    assert.notEqual(wallets.bot.address, wallets.funding.address);
    assert.equal(paths.length, 2);
  });
});

describe("work X account", () => {
  it(`only links @${WORK_X_HANDLE}`, async () => {
    await assert.rejects(
      () =>
        verifyWorkXAccount("token", {
          fetch: async () =>
            new Response(
              JSON.stringify({ data: { id: "1", username: "someoneelse", name: "No" } }),
              { status: 200 },
            ),
        }),
      /not the work account/,
    );

    const identity = await verifyWorkXAccount("token", {
      fetch: async () =>
        new Response(
          JSON.stringify({ data: { id: "99", username: WORK_X_HANDLE, name: "Work" } }),
          { status: 200 },
        ),
    });
    assert.equal(identity.username, WORK_X_HANDLE);
  });
});
