// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * Owner-operated Privy client for the work X account + Hai X Money card.
 *
 * Hard rules:
 * - Use the Privy app the operator created. Never send Authorize to KARAM
 *   or any other external Privy app.
 * - X OAuth 2.0 scopes stay at tweet.read + users.read.
 * - Embedded wallets stay inside Privy. This process never reads, logs, or
 *   stores private keys / mnemonics / seeds in plaintext.
 * - Bot wallet and card-funding wallet are created and used as separate
 *   records. A bot compromise must not be enough to move card funds.
 */

export const WORK_X_HANDLE = "wshin84847";

export const X_OAUTH_SCOPES = ["tweet.read", "users.read"] as const;
export type XOAuthScope = (typeof X_OAUTH_SCOPES)[number];

export const WALLET_ROLES = ["bot", "funding"] as const;
export type WalletRole = (typeof WALLET_ROLES)[number];

export const PRIVY_API_BASE = "https://api.privy.io/v1";
export const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
export const X_ME_URL = "https://api.twitter.com/2/users/me";

const PRIVATE_KEY_FIELD_NAMES = new Set([
  "private_key",
  "privatekey",
  "private_key_hex",
  "privatekeyhex",
  "secret_key",
  "secretkey",
  "mnemonic",
  "seed",
  "seedphrase",
  "seed_phrase",
  "wallet_private_key",
  "walletprivatekey",
]);

export class PrivyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivyConfigError";
  }
}

export class XOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XOAuthError";
  }
}

export class WalletIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletIsolationError";
  }
}

export type PrivyEnv = {
  PRIVY_APP_ID?: string;
  PRIVY_APP_SECRET?: string;
  PRIVY_OWNER_APP_ID?: string;
  PRIVY_BOT_WALLET_ID?: string;
  PRIVY_FUNDING_WALLET_ID?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  X_REDIRECT_URI?: string;
  X_ALLOWED_HANDLE?: string;
};

export type PrivyDeps = {
  env?: PrivyEnv;
  fetch?: typeof fetch;
  now?: () => number;
  randomBytes?: (size: number) => Uint8Array;
};

export type OwnerPrivyConfig = {
  appId: string;
  appSecret: string;
};

export type PublicWalletRecord = {
  role: WalletRole;
  walletId: string;
  address: string;
  chainType: string;
};

export type IsolatedWallets = {
  bot: PublicWalletRecord;
  funding: PublicWalletRecord;
};

export type LinkedXIdentity = {
  xUserId: string;
  username: string;
  name?: string;
};

export type XAuthorizeRequest = {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
};

function readEnv(deps?: PrivyDeps): PrivyEnv {
  return deps?.env ?? (process.env as PrivyEnv);
}

function required(env: PrivyEnv, key: keyof PrivyEnv): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new PrivyConfigError(`${key} is not set`);
  }
  return value;
}

function asciiBase64(value: string): string {
  return btoa(value);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function defaultRandomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Walk any Privy / wallet payload and refuse private-key material.
 * Call this before returning or persisting a wallet record.
 */
export function assertNoPrivateKeyMaterial(payload: unknown, path = "root"): void {
  if (Array.isArray(payload)) {
    payload.forEach((item, index) => {
      assertNoPrivateKeyMaterial(item, `${path}[${index}]`);
    });
    return;
  }

  if (!isRecord(payload)) {
    return;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (PRIVATE_KEY_FIELD_NAMES.has(normalizeFieldName(key))) {
      throw new WalletIsolationError(
        `Refusing private-key material at ${path}.${key}. Embedded wallet keys stay in Privy.`,
      );
    }
    assertNoPrivateKeyMaterial(value, `${path}.${key}`);
  }
}

export function toPublicWalletRecord(
  role: WalletRole,
  wallet: {
    id?: unknown;
    walletId?: unknown;
    address?: unknown;
    chain_type?: unknown;
    chainType?: unknown;
  },
): PublicWalletRecord {
  assertNoPrivateKeyMaterial(wallet);
  const walletId =
    (typeof wallet.walletId === "string" && wallet.walletId.trim()) ||
    (typeof wallet.id === "string" && wallet.id.trim()) ||
    "";
  const address = typeof wallet.address === "string" ? wallet.address.trim() : "";
  const chainType =
    (typeof wallet.chainType === "string" && wallet.chainType) ||
    (typeof wallet.chain_type === "string" && wallet.chain_type) ||
    "";

  if (!walletId || !address || !chainType) {
    throw new WalletIsolationError(`Privy wallet response for ${role} is missing public fields`);
  }

  return { role, walletId, address, chainType };
}

export function assertWalletsIsolated(wallets: IsolatedWallets): IsolatedWallets {
  if (wallets.bot.role !== "bot") {
    throw new WalletIsolationError("Bot wallet record has the wrong role");
  }
  if (wallets.funding.role !== "funding") {
    throw new WalletIsolationError("Funding wallet record has the wrong role");
  }
  if (wallets.bot.walletId === wallets.funding.walletId) {
    throw new WalletIsolationError("Bot and funding wallets must not share a Privy wallet id");
  }
  if (wallets.bot.address.toLowerCase() === wallets.funding.address.toLowerCase()) {
    throw new WalletIsolationError("Bot and funding wallets must not share an address");
  }
  return wallets;
}

export function assertFundingWallet(
  wallet: PublicWalletRecord,
  isolated: IsolatedWallets,
): PublicWalletRecord {
  if (wallet.role !== "funding") {
    throw new WalletIsolationError("Hai card funding must use the funding wallet, not the bot wallet");
  }
  if (wallet.walletId !== isolated.funding.walletId) {
    throw new WalletIsolationError("Funding request wallet does not match the isolated funding wallet");
  }
  if (wallet.walletId === isolated.bot.walletId) {
    throw new WalletIsolationError("Refusing to spend from the bot wallet");
  }
  return wallet;
}

/**
 * Owner Privy app only. If PRIVY_OWNER_APP_ID is set, PRIVY_APP_ID must match.
 * This blocks an accidental Authorize against a KARAM / shared external app.
 */
export function getOwnerPrivyConfig(deps?: PrivyDeps): OwnerPrivyConfig {
  const env = readEnv(deps);
  const appId = required(env, "PRIVY_APP_ID");
  const appSecret = required(env, "PRIVY_APP_SECRET");
  const ownerAppId = env.PRIVY_OWNER_APP_ID?.trim();

  if (ownerAppId && ownerAppId !== appId) {
    throw new PrivyConfigError(
      "PRIVY_APP_ID does not match PRIVY_OWNER_APP_ID. This process will not authorize an external Privy app.",
    );
  }

  return { appId, appSecret };
}

export function allowedXHandle(deps?: PrivyDeps): string {
  const configured = readEnv(deps).X_ALLOWED_HANDLE?.trim().replace(/^@/, "");
  return (configured || WORK_X_HANDLE).toLowerCase();
}

export function assertMinimalXScopes(scopes: readonly string[]): readonly XOAuthScope[] {
  const requested = scopes.map((scope) => scope.trim()).filter(Boolean);
  if (requested.length === 0) {
    throw new XOAuthError("X OAuth scopes are required");
  }

  const extra = requested.filter(
    (scope) => !X_OAUTH_SCOPES.includes(scope as XOAuthScope),
  );
  if (extra.length > 0) {
    throw new XOAuthError(
      `X OAuth scopes must stay at ${X_OAUTH_SCOPES.join(", ")}. Refusing: ${extra.join(", ")}`,
    );
  }

  const missing = X_OAUTH_SCOPES.filter((scope) => !requested.includes(scope));
  if (missing.length > 0) {
    throw new XOAuthError(`X OAuth is missing required scopes: ${missing.join(", ")}`);
  }

  return X_OAUTH_SCOPES;
}

export function xOAuthScopeString(): string {
  return X_OAUTH_SCOPES.join(" ");
}

export async function createPkcePair(deps?: PrivyDeps): Promise<{
  verifier: string;
  challenge: string;
}> {
  const randomBytes = deps?.randomBytes ?? defaultRandomBytes;
  const verifier = bytesToBase64Url(randomBytes(32));
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return { verifier, challenge: bytesToBase64Url(digest) };
}

export function buildXAuthorizeUrl(input: XAuthorizeRequest): string {
  assertMinimalXScopes(X_OAUTH_SCOPES);
  const url = new URL(X_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", xOAuthScopeString());
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function getXOAuthClient(deps?: PrivyDeps): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const env = readEnv(deps);
  return {
    clientId: required(env, "X_CLIENT_ID"),
    clientSecret: required(env, "X_CLIENT_SECRET"),
    redirectUri: required(env, "X_REDIRECT_URI"),
  };
}

async function readJson(response: Response, label: string): Promise<unknown> {
  const text = await response.text();
  if (!response.ok) {
    throw new PrivyConfigError(`${label} failed (${response.status})`);
  }
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PrivyConfigError(`${label} returned non-JSON`);
  }
}

export async function exchangeXAuthorizationCode(
  input: { code: string; codeVerifier: string },
  deps?: PrivyDeps,
): Promise<{ accessToken: string; scope: string }> {
  const client = getXOAuthClient(deps);
  const fetchFn = deps?.fetch ?? fetch;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: client.redirectUri,
    code_verifier: input.codeVerifier,
  });

  const response = await fetchFn(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${asciiBase64(`${client.clientId}:${client.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await readJson(response, "X OAuth token exchange")) as Record<string, unknown>;
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  const scope = typeof payload.scope === "string" ? payload.scope : "";
  if (!accessToken) {
    throw new XOAuthError("X OAuth token response did not include an access token");
  }

  assertMinimalXScopes(scope.split(/\s+/));
  return { accessToken, scope };
}

export async function verifyWorkXAccount(
  accessToken: string,
  deps?: PrivyDeps,
): Promise<LinkedXIdentity> {
  const fetchFn = deps?.fetch ?? fetch;
  const response = await fetchFn(`${X_ME_URL}?user.fields=username,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await readJson(response, "X users/me")) as {
    data?: { id?: string; username?: string; name?: string };
  };
  const username = payload.data?.username?.replace(/^@/, "") ?? "";
  const xUserId = payload.data?.id ?? "";
  if (!username || !xUserId) {
    throw new XOAuthError("X users/me did not return id/username");
  }

  if (username.toLowerCase() !== allowedXHandle(deps)) {
    throw new XOAuthError(
      `Linked X account @${username} is not the work account @${allowedXHandle(deps)}`,
    );
  }

  return {
    xUserId,
    username,
    name: payload.data?.name,
  };
}

function privyHeaders(config: OwnerPrivyConfig): HeadersInit {
  return {
    Authorization: `Basic ${asciiBase64(`${config.appId}:${config.appSecret}`)}`,
    "privy-app-id": config.appId,
    "Content-Type": "application/json",
  };
}

async function privyJson(
  path: string,
  init: RequestInit,
  deps: PrivyDeps | undefined,
  label: string,
): Promise<unknown> {
  const fetchFn = deps?.fetch ?? fetch;
  const response = await fetchFn(`${PRIVY_API_BASE}${path}`, init);
  const payload = await readJson(response, label);
  assertNoPrivateKeyMaterial(payload);
  return payload;
}

export async function fetchPrivyWallet(
  walletId: string,
  deps?: PrivyDeps,
): Promise<PublicWalletRecord & { roleHint?: string }> {
  const config = getOwnerPrivyConfig(deps);
  const payload = (await privyJson(
    `/wallets/${encodeURIComponent(walletId)}`,
    { headers: privyHeaders(config) },
    deps,
    "Privy get wallet",
  )) as { id?: string; address?: string; chain_type?: string };
  return toPublicWalletRecord("bot", payload);
}

async function createPrivyWallet(
  role: WalletRole,
  deps?: PrivyDeps,
): Promise<PublicWalletRecord> {
  const config = getOwnerPrivyConfig(deps);
  const payload = (await privyJson(
    "/wallets",
    {
      method: "POST",
      headers: {
        ...privyHeaders(config),
        "privy-idempotency-key": `hai-${role}-wallet`,
      },
      body: JSON.stringify({ chain_type: "ethereum" }),
    },
    deps,
    `Privy create ${role} wallet`,
  )) as { id?: string; address?: string; chain_type?: string };

  return toPublicWalletRecord(role, payload);
}

/**
 * Resolve or create the bot wallet and the Hai-card funding wallet.
 * Returns public addresses / ids only. Private keys never leave Privy.
 */
export async function getIsolatedWallets(deps?: PrivyDeps): Promise<IsolatedWallets> {
  const env = readEnv(deps);
  const botId = env.PRIVY_BOT_WALLET_ID?.trim();
  const fundingId = env.PRIVY_FUNDING_WALLET_ID?.trim();

  const bot = botId
    ? { ...(await fetchPrivyWallet(botId, deps)), role: "bot" as const }
    : await createPrivyWallet("bot", deps);
  const funding = fundingId
    ? { ...(await fetchPrivyWallet(fundingId, deps)), role: "funding" as const }
    : await createPrivyWallet("funding", deps);

  return assertWalletsIsolated({ bot, funding });
}
