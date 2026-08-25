// Copyright 2026 KARAM. All Rights Reserved.

/**
 * Owner-operated Privy + X OAuth 2.0 (work account) + isolated embedded wallets.
 *
 * Rules:
 * - Use ONLY the owner's Privy app (env). Do not authorize KARAM or any third-party app.
 * - X scopes stay at tweet.read + users.read.
 * - Embedded wallets stay in Privy TEE/MPC. This server stores wallet id + address only.
 * - Bot wallet and funding wallet are separate Privy identities. Compromise of one
 *   must not expose the other.
 */

import {
  base64urlEncode,
  randomId,
  signPayload,
  verifyPayload,
} from "@/src/lib/signed-token";

export const HAI_X_WORK_HANDLE = "wshin84847";

/** Minimum X OAuth 2.0 scopes. Do not add tweet.write / offline.access here. */
export const X_OAUTH_SCOPES = ["tweet.read", "users.read"] as const;

export const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
export const X_USER_ME_URL = "https://api.x.com/2/users/me";

export const PRIVY_AUTH_API = "https://auth.privy.io/api/v1";
export const PRIVY_WALLET_API = "https://api.privy.io/v1";

export const WALLET_ROLES = ["bot", "funding"] as const;
export type WalletRole = (typeof WALLET_ROLES)[number];

const FORBIDDEN_KEY_FIELDS = [
  "private_key",
  "privateKey",
  "privatekey",
  "secret_key",
  "secretKey",
  "mnemonic",
  "seed",
  "seedPhrase",
  "wallet_secret",
] as const;

export type IsolatedWallet<R extends WalletRole = WalletRole> = {
  role: R;
  privyUserId: string;
  privyWalletId: string;
  address: string;
  chainType: "ethereum";
};

export type BotWallet = IsolatedWallet<"bot">;
export type FundingWallet = IsolatedWallet<"funding">;

export type IsolatedWalletPair = {
  bot: BotWallet;
  funding: FundingWallet;
};

export type XWorkProfile = {
  id: string;
  username: string;
  name: string;
};

export type XOAuthStart = {
  authorizationUrl: string;
  state: string;
  cookieName: string;
  cookieValue: string;
  scopes: readonly string[];
};

export type PrivyAppConfig = {
  appId: string;
  appSecret: string;
  ownerMode: "self";
};

export type EnvReader = (name: string) => string | undefined;

export type HttpRequest = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type HttpResponse = {
  status: number;
  json: unknown;
};

export type HttpClient = (request: HttpRequest) => Promise<HttpResponse>;

export class PrivyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivyConfigError";
  }
}

export class WalletIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletIsolationError";
  }
}

export class XOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XOAuthError";
  }
}

type OAuthStatePayload = {
  nonce: string;
  exp: number;
};

type OAuthCookiePayload = {
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  exp: number;
};

const defaultEnv: EnvReader = (name) => process.env[name];

export const X_OAUTH_COOKIE = "hai_x_oauth";

function requiredEnv(env: EnvReader, name: string): string {
  const value = env(name)?.trim();
  if (!value) {
    throw new PrivyConfigError(`${name} is not set`);
  }
  return value;
}

function optionalEnv(env: EnvReader, name: string): string | undefined {
  const value = env(name)?.trim();
  return value || undefined;
}

/**
 * Owner Privy app only. Request-supplied app IDs / KARAM-delegated apps are rejected.
 */
export function loadPrivyAppConfig(
  env: EnvReader = defaultEnv,
  requestedAppId?: string,
): PrivyAppConfig {
  const appId = requiredEnv(env, "PRIVY_APP_ID");
  const appSecret = requiredEnv(env, "PRIVY_APP_SECRET");
  const ownerMode = (optionalEnv(env, "PRIVY_APP_OWNER_MODE") ?? "self").toLowerCase();

  if (ownerMode !== "self") {
    throw new PrivyConfigError(
      "PRIVY_APP_OWNER_MODE must be 'self'. External / delegated Privy apps are refused.",
    );
  }

  if (optionalEnv(env, "PRIVY_ALLOW_EXTERNAL_APP") === "true") {
    throw new PrivyConfigError("PRIVY_ALLOW_EXTERNAL_APP is forbidden. Use the owner Privy app only.");
  }

  if (requestedAppId && requestedAppId.trim() !== appId) {
    throw new PrivyConfigError(
      "Refusing external Privy app id. Authorize only the owner-created Privy app.",
    );
  }

  return { appId, appSecret, ownerMode: "self" };
}

export function loadWorkXHandle(env: EnvReader = defaultEnv): string {
  return (optionalEnv(env, "HAI_X_WORK_HANDLE") ?? HAI_X_WORK_HANDLE).replace(/^@/, "").toLowerCase();
}

export function assertXOauthScopes(scopes: readonly string[] = X_OAUTH_SCOPES): readonly string[] {
  const extra = scopes.filter((scope) => !X_OAUTH_SCOPES.includes(scope as (typeof X_OAUTH_SCOPES)[number]));
  if (extra.length > 0) {
    throw new XOAuthError(`X OAuth scopes must stay at tweet.read users.read. Refused: ${extra.join(", ")}`);
  }
  if (!X_OAUTH_SCOPES.every((required) => scopes.includes(required))) {
    throw new XOAuthError("X OAuth scopes must include tweet.read and users.read");
  }
  return X_OAUTH_SCOPES;
}

export function assertNoPrivateKeyMaterial(value: unknown, path = "root"): void {
  if (value == null) return;

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("-----begin") ||
      lower.startsWith("0x") && value.length >= 64 && /private/i.test(path)
    ) {
      throw new WalletIsolationError(`Refusing to persist key material at ${path}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateKeyMaterial(item, `${path}[${index}]`));
    return;
  }

  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEY_FIELDS.includes(key as (typeof FORBIDDEN_KEY_FIELDS)[number])) {
        throw new WalletIsolationError(`Server must never store ${key}. Strip it before persist.`);
      }
      assertNoPrivateKeyMaterial(nested, `${path}.${key}`);
    }
  }
}

export function toPublicWallet<R extends WalletRole>(wallet: IsolatedWallet<R>): IsolatedWallet<R> {
  assertNoPrivateKeyMaterial(wallet);
  return {
    role: wallet.role,
    privyUserId: wallet.privyUserId,
    privyWalletId: wallet.privyWalletId,
    address: wallet.address,
    chainType: "ethereum",
  };
}

export function assertDistinctWallets(bot: BotWallet, funding: FundingWallet): IsolatedWalletPair {
  if (bot.role !== "bot") {
    throw new WalletIsolationError("Bot wallet role mismatch");
  }
  if (funding.role !== "funding") {
    throw new WalletIsolationError("Funding wallet role mismatch");
  }
  if (bot.privyWalletId === funding.privyWalletId || bot.address.toLowerCase() === funding.address.toLowerCase()) {
    throw new WalletIsolationError("Bot and funding wallets must be different addresses");
  }
  if (bot.privyUserId === funding.privyUserId) {
    throw new WalletIsolationError("Bot and funding wallets must use separate Privy users");
  }
  assertNoPrivateKeyMaterial({ bot, funding });
  return { bot: toPublicWallet(bot), funding: toPublicWallet(funding) };
}

export function requireFundingWallet(wallet: IsolatedWallet): FundingWallet {
  if (wallet.role !== "funding") {
    throw new WalletIsolationError("Card funding may use the funding wallet only. Bot wallet is blocked.");
  }
  return toPublicWallet({ ...wallet, role: "funding" });
}

export function requireBotWallet(wallet: IsolatedWallet): BotWallet {
  if (wallet.role !== "bot") {
    throw new WalletIsolationError("Bot operations may use the bot wallet only. Funding wallet is blocked.");
  }
  return toPublicWallet({ ...wallet, role: "bot" });
}

function signingSecret(env: EnvReader): string {
  return (
    optionalEnv(env, "HAI_FUND_APPROVAL_SECRET") ??
    optionalEnv(env, "HAI_API_KEY_SECRET") ??
    requiredEnv(env, "X_OAUTH_STATE_SECRET")
  );
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return base64urlEncode(new Uint8Array(digest));
}

function randomVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

export async function startXOauth(input: {
  redirectUri: string;
  env?: EnvReader;
  nowMs?: number;
  ttlMs?: number;
}): Promise<XOAuthStart> {
  const env = input.env ?? defaultEnv;
  const clientId = requiredEnv(env, "X_OAUTH_CLIENT_ID");
  const scopes = assertXOauthScopes(X_OAUTH_SCOPES);
  const nowMs = input.nowMs ?? Date.now();
  const exp = nowMs + (input.ttlMs ?? 10 * 60 * 1000);
  const nonce = randomId("xstate");
  const codeVerifier = randomVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const secret = signingSecret(env);

  const state = await signPayload(secret, { nonce, exp } satisfies OAuthStatePayload);
  const cookieValue = await signPayload(secret, {
    nonce,
    codeVerifier,
    redirectUri: input.redirectUri,
    exp,
  } satisfies OAuthCookiePayload);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: input.redirectUri,
    scope: scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    authorizationUrl: `${X_AUTHORIZE_URL}?${params.toString()}`,
    state,
    cookieName: X_OAUTH_COOKIE,
    cookieValue,
    scopes,
  };
}

export async function finishXOauth(input: {
  code: string;
  state: string;
  cookieValue: string;
  env?: EnvReader;
  http?: HttpClient;
  nowMs?: number;
}): Promise<XWorkProfile> {
  const env = input.env ?? defaultEnv;
  const secret = signingSecret(env);
  const nowMs = input.nowMs ?? Date.now();
  const state = await verifyPayload<OAuthStatePayload>(secret, input.state);
  const cookie = await verifyPayload<OAuthCookiePayload>(secret, input.cookieValue);

  if (state.nonce !== cookie.nonce) {
    throw new XOAuthError("X OAuth state nonce mismatch");
  }
  if (state.exp < nowMs || cookie.exp < nowMs) {
    throw new XOAuthError("X OAuth state expired");
  }

  const clientId = requiredEnv(env, "X_OAUTH_CLIENT_ID");
  const clientSecret = requiredEnv(env, "X_OAUTH_CLIENT_SECRET");
  const http = input.http ?? defaultHttp;

  // X confidential clients expect standard Basic base64, not base64url.
  const basicStd = btoa(`${clientId}:${clientSecret}`);

  const tokenRes = await http({
    url: X_TOKEN_URL,
    method: "POST",
    headers: {
      Authorization: `Basic ${basicStd}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: cookie.redirectUri,
      code_verifier: cookie.codeVerifier,
      client_id: clientId,
    }).toString(),
  });

  if (tokenRes.status >= 400) {
    throw new XOAuthError("X OAuth token exchange failed");
  }

  const tokenJson = tokenRes.json as { access_token?: string; scope?: string };
  if (!tokenJson.access_token) {
    throw new XOAuthError("X OAuth token response missing access_token");
  }
  if (tokenJson.scope) {
    const granted = tokenJson.scope.split(/[ ]+/).filter(Boolean);
    const extra = granted.filter((scope) => !X_OAUTH_SCOPES.includes(scope as (typeof X_OAUTH_SCOPES)[number]));
    if (extra.length > 0) {
      throw new XOAuthError(`X granted extra scopes that this app refuses: ${extra.join(", ")}`);
    }
  }

  const meRes = await http({
    url: `${X_USER_ME_URL}?user.fields=id,name,username`,
    method: "GET",
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (meRes.status >= 400) {
    throw new XOAuthError("X users/me failed");
  }

  const data = (meRes.json as { data?: { id?: string; username?: string; name?: string } }).data;
  if (!data?.id || !data.username) {
    throw new XOAuthError("X users/me missing profile");
  }

  const expected = loadWorkXHandle(env);
  if (data.username.replace(/^@/, "").toLowerCase() !== expected) {
    throw new XOAuthError(`X account @${data.username} is not the work handle @${expected}`);
  }

  return {
    id: data.id,
    username: data.username.replace(/^@/, ""),
    name: data.name ?? data.username,
  };
}

function defaultHttp(request: HttpRequest): Promise<HttpResponse> {
  return fetch(request.url, {
    method: request.method ?? "GET",
    headers: request.headers,
    body: request.body,
  }).then(async (res) => ({
    status: res.status,
    json: await res.json().catch(() => ({})),
  }));
}

function privyHeaders(config: PrivyAppConfig, extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${config.appId}:${config.appSecret}`)}`,
    "privy-app-id": config.appId,
    "Content-Type": "application/json",
    ...extra,
  };
}

type PrivyUserJson = {
  id?: string;
  linked_accounts?: Array<Record<string, unknown>>;
  linked_wallets?: Array<Record<string, unknown>>;
};

function readPrivyUserId(json: unknown): string {
  const id = (json as PrivyUserJson).id;
  if (!id) {
    throw new PrivyConfigError("Privy user response missing id");
  }
  return id;
}

function readWalletAddress(json: unknown): { id: string; address: string } {
  const record = json as { id?: string; address?: string };
  if (!record.id || !record.address) {
    throw new PrivyConfigError("Privy wallet response missing id/address");
  }
  assertNoPrivateKeyMaterial(json);
  return { id: record.id, address: record.address };
}

export async function privyCreateUser(input: {
  config: PrivyAppConfig;
  linkedAccounts: Array<Record<string, unknown>>;
  customMetadata: Record<string, string>;
  http?: HttpClient;
}): Promise<string> {
  assertNoPrivateKeyMaterial(input.linkedAccounts);
  const http = input.http ?? defaultHttp;
  const res = await http({
    url: `${PRIVY_AUTH_API}/users`,
    method: "POST",
    headers: privyHeaders(input.config),
    body: JSON.stringify({
      linked_accounts: input.linkedAccounts,
      custom_metadata: input.customMetadata,
    }),
  });
  if (res.status >= 400) {
    throw new PrivyConfigError(`Privy user create failed (${res.status})`);
  }
  assertNoPrivateKeyMaterial(res.json);
  return readPrivyUserId(res.json);
}

export async function privyCreateEmbeddedWallet(input: {
  config: PrivyAppConfig;
  privyUserId: string;
  role: WalletRole;
  externalId: string;
  http?: HttpClient;
}): Promise<{ id: string; address: string }> {
  const http = input.http ?? defaultHttp;
  const res = await http({
    url: `${PRIVY_WALLET_API}/wallets`,
    method: "POST",
    headers: privyHeaders(input.config, {
      "privy-idempotency-key": `hai-${input.role}-${input.externalId}`.slice(0, 64),
    }),
    body: JSON.stringify({
      chain_type: "ethereum",
      owner: { user_id: input.privyUserId },
      display_name: `hai-${input.role}`,
      external_id: input.externalId,
    }),
  });
  if (res.status >= 400) {
    throw new PrivyConfigError(`Privy embedded wallet create failed (${res.status})`);
  }
  return readWalletAddress(res.json);
}

/**
 * Resolve or create the isolated bot + funding wallets for the work X account.
 * Prefers already-provisioned env wallet ids so the server never asks Privy to export keys.
 */
export async function ensureIsolatedWallets(input: {
  profile: XWorkProfile;
  env?: EnvReader;
  http?: HttpClient;
  requestedPrivyAppId?: string;
}): Promise<IsolatedWalletPair> {
  const env = input.env ?? defaultEnv;
  const config = loadPrivyAppConfig(env, input.requestedPrivyAppId);
  const handle = loadWorkXHandle(env);
  if (input.profile.username.replace(/^@/, "").toLowerCase() !== handle) {
    throw new XOAuthError(`Refusing wallets for @${input.profile.username}; expected @${handle}`);
  }

  const existing = readExistingWalletPair(env);
  if (existing) {
    return existing;
  }

  const http = input.http ?? defaultHttp;
  const xSubject = input.profile.id;

  const botUserId = await privyCreateUser({
    config,
    http,
    linkedAccounts: [
      {
        type: "twitter_oauth",
        subject: xSubject,
        username: input.profile.username,
        name: input.profile.name,
      },
    ],
    customMetadata: {
      role: "bot",
      handle,
      isolated: "true",
    },
  });

  const fundingUserId = await privyCreateUser({
    config,
    http,
    linkedAccounts: [
      {
        type: "custom_auth",
        custom_user_id: `hai-funding:${xSubject}`,
      },
    ],
    customMetadata: {
      role: "funding",
      handle,
      isolatedFrom: "bot",
    },
  });

  const botWallet = await privyCreateEmbeddedWallet({
    config,
    http,
    privyUserId: botUserId,
    role: "bot",
    externalId: `hai-bot-${xSubject}`.slice(0, 64),
  });
  const fundingWallet = await privyCreateEmbeddedWallet({
    config,
    http,
    privyUserId: fundingUserId,
    role: "funding",
    externalId: `hai-fund-${xSubject}`.slice(0, 64),
  });

  return assertDistinctWallets(
    {
      role: "bot",
      privyUserId: botUserId,
      privyWalletId: botWallet.id,
      address: botWallet.address,
      chainType: "ethereum",
    },
    {
      role: "funding",
      privyUserId: fundingUserId,
      privyWalletId: fundingWallet.id,
      address: fundingWallet.address,
      chainType: "ethereum",
    },
  );
}

function readExistingWalletPair(env: EnvReader): IsolatedWalletPair | null {
  const botUser = optionalEnv(env, "PRIVY_BOT_USER_ID");
  const botWallet = optionalEnv(env, "PRIVY_BOT_WALLET_ID");
  const botAddress = optionalEnv(env, "PRIVY_BOT_WALLET_ADDRESS");
  const fundingUser = optionalEnv(env, "PRIVY_FUNDING_USER_ID");
  const fundingWallet = optionalEnv(env, "PRIVY_FUNDING_WALLET_ID");
  const fundingAddress = optionalEnv(env, "PRIVY_FUNDING_WALLET_ADDRESS");

  const present = [botUser, botWallet, botAddress, fundingUser, fundingWallet, fundingAddress];
  if (present.every((value) => !value)) {
    return null;
  }
  if (present.some((value) => !value)) {
    throw new PrivyConfigError(
      "Partial PRIVY_* wallet env set. Provide both bot and funding user/wallet/address, or none.",
    );
  }

  return assertDistinctWallets(
    {
      role: "bot",
      privyUserId: botUser!,
      privyWalletId: botWallet!,
      address: botAddress!,
      chainType: "ethereum",
    },
    {
      role: "funding",
      privyUserId: fundingUser!,
      privyWalletId: fundingWallet!,
      address: fundingAddress!,
      chainType: "ethereum",
    },
  );
}

export async function loadIsolatedWallets(env: EnvReader = defaultEnv): Promise<IsolatedWalletPair> {
  const existing = readExistingWalletPair(env);
  if (!existing) {
    throw new PrivyConfigError(
      "Isolated wallets are not provisioned. Complete X OAuth once or set PRIVY_BOT_* and PRIVY_FUNDING_* env vars.",
    );
  }
  return existing;
}

/** Cookie helper — HttpOnly, not readable by bot/page scripts. */
export function xOAuthCookieHeader(value: string, maxAgeSec = 600): string {
  return `${X_OAUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}; Secure`;
}
