import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HAI_X_WORK_HANDLE,
  X_OAUTH_SCOPES,
  type HttpClient,
  type IsolatedWallet,
  WalletIsolationError,
  assertDistinctWallets,
  assertNoPrivateKeyMaterial,
  assertXOauthScopes,
  ensureIsolatedWallets,
  finishXOauth,
  loadPrivyAppConfig,
  requireBotWallet,
  requireFundingWallet,
  startXOauth,
} from "./privy";

const OWNER_ENV = {
  PRIVY_APP_ID: "owner-privy-app",
  PRIVY_APP_SECRET: "owner-privy-secret",
  PRIVY_APP_OWNER_MODE: "self",
  HAI_API_KEY_SECRET: "unit-test-secret-unit-test-secret",
  X_OAUTH_CLIENT_ID: "x-client",
  X_OAUTH_CLIENT_SECRET: "x-secret",
  HAI_X_WORK_HANDLE: HAI_X_WORK_HANDLE,
} as const;

const env = (name: string) => OWNER_ENV[name as keyof typeof OWNER_ENV];

const botWallet: IsolatedWallet<"bot"> = {
  role: "bot",
  privyUserId: "did:privy:bot",
  privyWalletId: "wallet_bot",
  address: "0x1111111111111111111111111111111111111111",
  chainType: "ethereum",
};

const fundingWallet: IsolatedWallet<"funding"> = {
  role: "funding",
  privyUserId: "did:privy:funding",
  privyWalletId: "wallet_fund",
  address: "0x2222222222222222222222222222222222222222",
  chainType: "ethereum",
};

describe("privy owner app + X OAuth + wallet isolation", () => {
  it("uses only tweet.read and users.read", () => {
    assert.deepEqual([...X_OAUTH_SCOPES], ["tweet.read", "users.read"]);
    assert.deepEqual([...assertXOauthScopes()], ["tweet.read", "users.read"]);
    assert.throws(() => assertXOauthScopes(["tweet.read", "users.read", "tweet.write"]), /tweet.write/);
  });

  it("refuses external or delegated Privy apps", () => {
    assert.deepEqual(loadPrivyAppConfig(env).appId, "owner-privy-app");
    assert.throws(
      () => loadPrivyAppConfig(env, "karam-external-app"),
      /external Privy app/,
    );
    assert.throws(
      () => loadPrivyAppConfig((name) => (name === "PRIVY_APP_OWNER_MODE" ? "karam" : env(name))),
      /self/,
    );
    assert.throws(
      () => loadPrivyAppConfig((name) => (name === "PRIVY_ALLOW_EXTERNAL_APP" ? "true" : env(name))),
      /PRIVY_ALLOW_EXTERNAL_APP/,
    );
  });

  it("rejects private key fields and shared bot/funding identities", () => {
    assert.throws(
      () => assertNoPrivateKeyMaterial({ privateKey: "0xabc" }),
      /never store privateKey/,
    );
    assert.throws(
      () =>
        assertDistinctWallets(botWallet, {
          ...fundingWallet,
          address: botWallet.address,
          privyWalletId: botWallet.privyWalletId,
        }),
      /different addresses/,
    );
    assert.throws(
      () =>
        assertDistinctWallets(botWallet, {
          ...fundingWallet,
          privyUserId: botWallet.privyUserId,
        }),
      /separate Privy users/,
    );
    assert.equal(requireFundingWallet(fundingWallet).role, "funding");
    assert.throws(() => requireFundingWallet(botWallet), WalletIsolationError);
    assert.throws(() => requireBotWallet(fundingWallet), WalletIsolationError);
  });

  it("starts X OAuth with PKCE and the minimum scopes", async () => {
    const started = await startXOauth({
      redirectUri: "http://127.0.0.1:3001/api/hai/x/callback",
      env,
    });
    const url = new URL(started.authorizationUrl);
    assert.equal(url.origin + url.pathname, "https://x.com/i/oauth2/authorize");
    assert.equal(url.searchParams.get("scope"), "tweet.read users.read");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.ok(url.searchParams.get("code_challenge"));
    assert.ok(started.cookieValue.includes("."));
  });

  it("exchanges X code, enforces @wshin84847, and does not keep the access token", async () => {
    const started = await startXOauth({
      redirectUri: "http://127.0.0.1:3001/api/hai/x/callback",
      env,
    });

    const http: HttpClient = async (request) => {
      if (request.url === "https://api.x.com/2/oauth2/token") {
        assert.match(request.headers?.Authorization ?? "", /^Basic /);
        assert.match(request.body ?? "", /code_verifier=/);
        return {
          status: 200,
          json: { access_token: "x-access-should-not-be-returned", scope: "tweet.read users.read" },
        };
      }
      if (request.url.startsWith("https://api.x.com/2/users/me")) {
        return {
          status: 200,
          json: { data: { id: "123", username: "wshin84847", name: "Work" } },
        };
      }
      throw new Error(`unexpected ${request.url}`);
    };

    const profile = await finishXOauth({
      code: "oauth-code",
      state: started.state,
      cookieValue: started.cookieValue,
      env,
      http,
    });
    assert.deepEqual(profile, { id: "123", username: "wshin84847", name: "Work" });
    assert.equal(JSON.stringify(profile).includes("x-access-should-not-be-returned"), false);
  });

  it("creates two Privy users/wallets and never posts a private key", async () => {
    const calls: string[] = [];
    const http: HttpClient = async (request) => {
      calls.push(`${request.method} ${request.url}`);
      assert.equal((request.body ?? "").toLowerCase().includes("private"), false);
      if (request.url.endsWith("/users")) {
        const body = JSON.parse(request.body ?? "{}") as { custom_metadata?: { role?: string } };
        return { status: 200, json: { id: `did:privy:${body.custom_metadata?.role}` } };
      }
      if (request.url.endsWith("/wallets")) {
        const body = JSON.parse(request.body ?? "{}") as { display_name?: string };
        const role = body.display_name === "hai-bot" ? "bot" : "funding";
        return {
          status: 200,
          json: {
            id: `wallet_${role}`,
            address: role === "bot" ? botWallet.address : fundingWallet.address,
          },
        };
      }
      throw new Error(`unexpected ${request.url}`);
    };

    const pair = await ensureIsolatedWallets({
      profile: { id: "123", username: "wshin84847", name: "Work" },
      env,
      http,
    });
    assert.equal(pair.bot.role, "bot");
    assert.equal(pair.funding.role, "funding");
    assert.notEqual(pair.bot.address, pair.funding.address);
    assert.notEqual(pair.bot.privyUserId, pair.funding.privyUserId);
    assert.ok(calls.some((line) => line.includes("/users")));
    assert.ok(calls.some((line) => line.includes("/wallets")));
  });
});
