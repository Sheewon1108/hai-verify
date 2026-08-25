// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WALLET_ROLE,
  WORK_X_HANDLE,
  X_OAUTH_SCOPES,
  assertExactXScopes,
  assertFundingSource,
  assertNoPrivateKeyMaterial,
  assertOwnPrivyApp,
  assertWalletIsolation,
  buildXAuthorizationUrl,
  codeChallengeS256,
  createXSessionCookieValue,
  exchangeXAuthorizationCode,
  fetchVerifiedWorkXUser,
  generateCodeVerifier,
  normalizeXHandle,
  persistableWalletRecord,
  provisionIsolatedWallets,
  readXSessionCookieValue,
  verifyWorkXAccount,
  type HaiPrivyPort,
  type IsolatedWalletPair,
} from "./privy";

const workUser = {
  id: "123456789",
  username: WORK_X_HANDLE,
  name: "KARAM work",
};

function pair(overrides: Partial<IsolatedWalletPair> = {}): IsolatedWalletPair {
  return {
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
    ...overrides,
  };
}

describe("X OAuth scopes", () => {
  it("accepts only tweet.read and users.read", () => {
    assert.doesNotThrow(() => assertExactXScopes([...X_OAUTH_SCOPES]));
  });

  it("rejects extra or missing scopes", () => {
    assert.throws(() => assertExactXScopes(["tweet.read", "users.read", "offline.access"]), {
      code: "SCOPE_VIOLATION",
    });
    assert.throws(() => assertExactXScopes(["tweet.read", "users.read", "tweet.write"]), {
      code: "SCOPE_VIOLATION",
    });
    assert.throws(() => assertExactXScopes(["tweet.read"]), { code: "SCOPE_VIOLATION" });
  });

  it("builds an authorize URL with the minimum scopes only", () => {
    const url = new URL(
      buildXAuthorizationUrl({
        clientId: "owner-x-app",
        redirectUri: "http://127.0.0.1:3000/api/hai/x/callback",
        state: "state-1",
        codeChallenge: "challenge-1",
      }),
    );
    assert.equal(url.searchParams.get("scope"), "tweet.read users.read");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.equal(url.searchParams.get("client_id"), "owner-x-app");
  });
});

describe("private key refusal", () => {
  it("rejects private_key fields and hex keys", () => {
    assert.throws(
      () => assertNoPrivateKeyMaterial({ private_key: "0xabc" }),
      { code: "PRIVATE_KEY_FORBIDDEN" },
    );
    assert.throws(
      () =>
        assertNoPrivateKeyMaterial({
          note: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        }),
      { code: "PRIVATE_KEY_FORBIDDEN" },
    );
  });

  it("allows wallet id + address records", () => {
    assert.doesNotThrow(() =>
      persistableWalletRecord(
        { id: "wal_1", address: "0x2222222222222222222222222222222222222222" },
        WALLET_ROLE.FUNDING,
        "did:privy:funding",
      ),
    );
  });
});

describe("wallet isolation", () => {
  it("rejects shared id, address, or owner", () => {
    assert.throws(
      () =>
        assertWalletIsolation(
          pair({
            funding: persistableWalletRecord(
              { id: "bot-wallet", address: "0x2222222222222222222222222222222222222222" },
              WALLET_ROLE.FUNDING,
              "did:privy:funding",
            ),
          }),
        ),
      { code: "SAME_WALLET_ID" },
    );
    assert.throws(
      () =>
        assertWalletIsolation(
          pair({
            funding: persistableWalletRecord(
              { id: "fund-wallet", address: "0x1111111111111111111111111111111111111111" },
              WALLET_ROLE.FUNDING,
              "did:privy:funding",
            ),
          }),
        ),
      { code: "SAME_WALLET_ADDRESS" },
    );
    assert.throws(
      () =>
        assertWalletIsolation(
          pair({
            funding: persistableWalletRecord(
              { id: "fund-wallet", address: "0x2222222222222222222222222222222222222222" },
              WALLET_ROLE.FUNDING,
              "did:privy:bot",
            ),
          }),
        ),
      { code: "SAME_OWNER" },
    );
  });

  it("blocks the bot wallet from funding", () => {
    const wallets = pair();
    assert.throws(() => assertFundingSource(wallets.bot.id, wallets), {
      code: "BOT_WALLET_BLOCKED",
    });
    assert.equal(assertFundingSource(wallets.funding.id, wallets).role, "funding");
  });
});

describe("work X account", () => {
  it("normalizes and allowlists @wshin84847", () => {
    assert.equal(normalizeXHandle("@Wshin84847"), WORK_X_HANDLE);
    const verified = verifyWorkXAccount({
      id: "1",
      username: "@Wshin84847",
      name: "work",
    });
    assert.equal(verified.username, WORK_X_HANDLE);
    assert.throws(
      () => verifyWorkXAccount({ id: "1", username: "someoneelse", name: "nope" }),
      { code: "X_HANDLE_DENIED" },
    );
  });

  it("denies an external Privy app id", () => {
    assert.throws(
      () => assertOwnPrivyApp("clxxkaramapp", { PRIVY_DENIED_APP_IDS: "clxxkaramapp" }),
      { code: "PRIVY_APP_DENIED" },
    );
    assert.doesNotThrow(() =>
      assertOwnPrivyApp("owner-privy-app", { PRIVY_DENIED_APP_IDS: "clxxkaramapp" }),
    );
  });
});

describe("provisionIsolatedWallets", () => {
  it("creates two Privy users and two wallets", async () => {
    const users: string[] = [];
    const wallets: Array<{ owner: string; name: string }> = [];
    const port: HaiPrivyPort = {
      appId: "owner-privy-app",
      async createUser(input) {
        const id = `did:privy:${input.custom_metadata?.role ?? users.length}`;
        users.push(id);
        return { id };
      },
      async createWallet(input) {
        wallets.push({ owner: input.owner.user_id, name: input.display_name });
        return {
          id: `${input.display_name}-id`,
          address: input.display_name === "hai-bot" ? "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" : "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        };
      },
    };

    const created = await provisionIsolatedWallets(port, workUser, {
      PRIVY_DENIED_APP_IDS: "karam-external",
    });

    assert.equal(users.length, 2);
    assert.equal(wallets.length, 2);
    assert.equal(created.bot.role, "bot");
    assert.equal(created.funding.role, "funding");
    assert.notEqual(created.bot.ownerUserId, created.funding.ownerUserId);
    assert.notEqual(created.bot.id, created.funding.id);
  });
});

describe("X token + session", () => {
  it("rejects a token response that widens scopes", async () => {
    await assert.rejects(
      () =>
        exchangeXAuthorizationCode({
          code: "code",
          redirectUri: "http://127.0.0.1/callback",
          codeVerifier: "verifier",
          clientId: "id",
          clientSecret: "secret",
          fetchImpl: async () =>
            new Response(
              JSON.stringify({
                access_token: "tok",
                scope: "tweet.read users.read offline.access",
              }),
              { status: 200 },
            ),
        }),
      { code: "SCOPE_VIOLATION" },
    );
  });

  it("verifies users/me against the work handle", async () => {
    const user = await fetchVerifiedWorkXUser({
      accessToken: "tok",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            data: { id: "99", username: "wshin84847", name: "Work" },
          }),
          { status: 200 },
        ),
    });
    assert.equal(user.username, "wshin84847");
  });

  it("round-trips a signed X session cookie", async () => {
    const token = await createXSessionCookieValue("unit-secret", workUser);
    const read = await readXSessionCookieValue("unit-secret", token);
    assert.equal(read.username, WORK_X_HANDLE);
    await assert.rejects(() => readXSessionCookieValue("other-secret", token));
  });

  it("builds a PKCE challenge", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await codeChallengeS256(verifier);
    assert.ok(challenge.length > 20);
    assert.notEqual(challenge, verifier);
  });
});
