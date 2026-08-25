// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * Privy + X work-account helpers for Hai X Money.
 *
 * - Privy app is the Owner's app only (`PRIVY_APP_ID`). External apps (including
 *   any KARAM-branded third-party app) never receive X Authorize.
 * - X OAuth 2.0 scopes are exactly `tweet.read` and `users.read`.
 * - Embedded wallets stay inside Privy. This server persists wallet id + address only.
 * - Bot wallet and funding wallet are different Privy users and different wallets.
 */

import { base64urlEncode, sha256Bytes, signJson, verifySignedJson } from "./web-crypto";

export const WORK_X_HANDLE = "wshin84847";

export const X_OAUTH_SCOPES = ["tweet.read", "users.read"] as const;
export type XOAuthScope = (typeof X_OAUTH_SCOPES)[number];

export const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
export const X_USERS_ME_URL = "https://api.twitter.com/2/users/me";

export const WALLET_ROLE = {
  BOT: "bot",
  FUNDING: "funding",
} as const;

export type WalletRole = (typeof WALLET_ROLE)[keyof typeof WALLET_ROLE];

export const CHAIN_TYPE = "ethereum" as const;

export const PKCE_COOKIE = "hai_x_pkce";
export const X_SESSION_COOKIE = "hai_x_session";

const SECRET_FIELD_NAME =
  /^(private[_-]?key|pvt[_-]?key|secret[_-]?key|mnemonic|seed[_-]?phrase|wallet[_-]?json|hex[_-]?key|privkey|encrypted[_-]?private[_-]?key)$/i;
const HEX_PRIVATE_KEY = /^(0x)?[0-9a-fA-F]{64}$/;
const PEM_PRIVATE_KEY = /-----BEGIN ([A-Z ]+)?PRIVATE KEY-----/;

export class PrivyConfigError extends Error {
  readonly code: string;
  constructor(message: string, code = "PRIVY_CONFIG") {
    super(message);
    this.name = "PrivyConfigError";
    this.code = code;
  }
}

export class WalletIsolationError extends Error {
  readonly code: string;
  constructor(message: string, code = "WALLET_ISOLATION") {
    super(message);
    this.name = "WalletIsolationError";
    this.code = code;
  }
}

export class XOAuthError extends Error {
  readonly code: string;
  constructor(message: string, code = "X_OAUTH") {
    super(message);
    this.name = "XOAuthError";
    this.code = code;
  }
}

export interface VerifiedXUser {
  id: string;
  username: string;
  name: string;
}

export interface PersistableWallet {
  id: string;
  address: string;
  role: WalletRole;
  ownerUserId: string;
}

export interface IsolatedWalletPair {
  xUserId: string;
  xUsername: string;
  bot: PersistableWallet;
  funding: PersistableWallet;
}

export interface PrivyUserCreateInput {
  linked_accounts: Array<
    | { type: "custom_auth"; custom_user_id: string }
    | {
        type: "twitter_oauth";
        subject: string;
        username: string;
        name: string;
        profile_picture_url?: string;
      }
  >;
  custom_metadata?: Record<string, string>;
}

export interface PrivyWalletCreateInput {
  chain_type: typeof CHAIN_TYPE;
  owner: { user_id: string };
  display_name: string;
  external_id: string;
  policy_ids?: string[];
}

export interface HaiPrivyPort {
  appId: string;
  createUser(input: PrivyUserCreateInput): Promise<{ id: string }>;
  createWallet(input: PrivyWalletCreateInput): Promise<{ id: string; address: string }>;
}

export interface XOAuthSession {
  nonce: string;
  verifier: string;
  exp: number;
}

export interface SignedXSession {
  id: string;
  username: string;
  name: string;
  exp: number;
}

export type EnvMap = Record<string, string | undefined>;

export function allowedXHandle(env: EnvMap = process.env): string {
  return normalizeXHandle(env.X_ALLOWED_HANDLE || WORK_X_HANDLE);
}

export function normalizeXHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export function parseXScopes(scope: string | readonly string[]): string[] {
  const list = Array.isArray(scope) ? [...scope] : String(scope).split(/[\s,]+/);
  return list.map((item) => item.trim()).filter(Boolean);
}

export function assertExactXScopes(scopes: string[]): void {
  const got = new Set(scopes);
  if (got.size !== X_OAUTH_SCOPES.length) {
    throw new XOAuthError(
      "X OAuth scopes must be exactly tweet.read and users.read",
      "SCOPE_VIOLATION",
    );
  }
  for (const required of X_OAUTH_SCOPES) {
    if (!got.has(required)) {
      throw new XOAuthError(
        "X OAuth scopes must be exactly tweet.read and users.read",
        "SCOPE_VIOLATION",
      );
    }
  }
}

export function deniedPrivyAppIds(env: EnvMap = process.env): string[] {
  return (env.PRIVY_DENIED_APP_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function assertOwnPrivyApp(
  appId: string,
  env: EnvMap = process.env,
): void {
  const id = appId.trim();
  if (!id) {
    throw new PrivyConfigError("PRIVY_APP_ID is required", "PRIVY_APP_MISSING");
  }
  if (deniedPrivyAppIds(env).includes(id)) {
    throw new PrivyConfigError(
      "This Privy app id is denied — use the Owner's own Privy app, not an external/KARAM app",
      "PRIVY_APP_DENIED",
    );
  }
}

export function readPrivyAppCredentials(env: EnvMap = process.env): {
  appId: string;
  appSecret: string;
} {
  const appId = env.PRIVY_APP_ID?.trim() ?? "";
  const appSecret = env.PRIVY_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) {
    throw new PrivyConfigError(
      "Set PRIVY_APP_ID and PRIVY_APP_SECRET for the Owner's Privy app",
      "PRIVY_NOT_CONFIGURED",
    );
  }
  assertOwnPrivyApp(appId, env);
  return { appId, appSecret };
}

export function readXOauthCredentials(env: EnvMap = process.env): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = env.X_OAUTH_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.X_OAUTH_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = env.X_OAUTH_REDIRECT_URI?.trim() ?? "";
  if (!clientId || !clientSecret || !redirectUri) {
    throw new XOAuthError(
      "Set X_OAUTH_CLIENT_ID, X_OAUTH_CLIENT_SECRET, and X_OAUTH_REDIRECT_URI",
      "X_OAUTH_NOT_CONFIGURED",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function signingSecret(env: EnvMap = process.env): string {
  const secret =
    env.HAI_FUND_APPROVAL_SECRET?.trim() ||
    env.HAI_API_KEY_SECRET?.trim() ||
    "";
  if (!secret) {
    throw new PrivyConfigError(
      "Set HAI_FUND_APPROVAL_SECRET (or HAI_API_KEY_SECRET) to sign X/fund tokens",
      "SIGNING_SECRET_MISSING",
    );
  }
  return secret;
}

/**
 * Walk a payload and refuse private-key / mnemonic material.
 * Server storage is wallet id + address only — never a plaintext key.
 */
export function assertNoPrivateKeyMaterial(value: unknown, path = "root"): void {
  if (value == null) return;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (PEM_PRIVATE_KEY.test(trimmed) || HEX_PRIVATE_KEY.test(trimmed)) {
      throw new WalletIsolationError(
        `Refusing to accept private-key material at ${path}`,
        "PRIVATE_KEY_FORBIDDEN",
      );
    }
    const words = trimmed.toLowerCase().split(/\s+/);
    if (words.length >= 12 && words.length <= 24 && words.every((w) => /^[a-z]+$/.test(w))) {
      throw new WalletIsolationError(
        `Refusing to accept seed-phrase material at ${path}`,
        "PRIVATE_KEY_FORBIDDEN",
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateKeyMaterial(item, `${path}[${index}]`));
    return;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_FIELD_NAME.test(key)) {
        throw new WalletIsolationError(
          `Refusing to persist secret field '${key}'`,
          "PRIVATE_KEY_FORBIDDEN",
        );
      }
      assertNoPrivateKeyMaterial(child, `${path}.${key}`);
    }
  }
}

export function persistableWalletRecord(
  wallet: { id: string; address: string },
  role: WalletRole,
  ownerUserId: string,
): PersistableWallet {
  assertNoPrivateKeyMaterial(wallet);
  if (!wallet.id || !wallet.address) {
    throw new WalletIsolationError("Wallet id and address are required", "WALLET_INCOMPLETE");
  }
  return {
    id: wallet.id,
    address: wallet.address,
    role,
    ownerUserId,
  };
}

export function assertWalletIsolation(pair: IsolatedWalletPair): IsolatedWalletPair {
  assertNoPrivateKeyMaterial(pair);

  if (pair.bot.role !== WALLET_ROLE.BOT || pair.funding.role !== WALLET_ROLE.FUNDING) {
    throw new WalletIsolationError("Wallet roles are swapped or missing", "ROLE_MISMATCH");
  }
  if (pair.bot.id === pair.funding.id) {
    throw new WalletIsolationError("Bot and funding wallets share an id", "SAME_WALLET_ID");
  }
  if (pair.bot.address.toLowerCase() === pair.funding.address.toLowerCase()) {
    throw new WalletIsolationError(
      "Bot and funding wallets share an address",
      "SAME_WALLET_ADDRESS",
    );
  }
  if (pair.bot.ownerUserId === pair.funding.ownerUserId) {
    throw new WalletIsolationError(
      "Bot and funding wallets share a Privy user — compromise would share control",
      "SAME_OWNER",
    );
  }
  return pair;
}

export function assertFundingSource(walletId: string, pair: IsolatedWalletPair): PersistableWallet {
  assertWalletIsolation(pair);
  if (walletId === pair.bot.id) {
    throw new WalletIsolationError(
      "Bot wallet cannot fund the Hai card",
      "BOT_WALLET_BLOCKED",
    );
  }
  if (walletId !== pair.funding.id) {
    throw new WalletIsolationError(
      "Only the funding wallet may source a Hai card top-up",
      "NOT_FUNDING_WALLET",
    );
  }
  return pair.funding;
}

export function verifyWorkXAccount(
  user: { id?: string; username?: string; name?: string },
  env: EnvMap = process.env,
): VerifiedXUser {
  const username = normalizeXHandle(user.username ?? "");
  const expected = allowedXHandle(env);
  if (!user.id || !username) {
    throw new XOAuthError("X user id and username are required", "X_USER_INCOMPLETE");
  }
  if (username !== expected) {
    throw new XOAuthError(
      `X account @${username} is not the work account @${expected}`,
      "X_HANDLE_DENIED",
    );
  }
  return {
    id: user.id,
    username,
    name: (user.name ?? username).slice(0, 50) || username,
  };
}

export function generateCodeVerifier(): string {
  return base64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export async function codeChallengeS256(verifier: string): Promise<string> {
  return base64urlEncode(await sha256Bytes(verifier));
}

export function buildXAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scopes?: string[];
}): string {
  const scopes = input.scopes ?? [...X_OAUTH_SCOPES];
  assertExactXScopes(scopes);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    scope: scopes.join(" "),
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTHORIZE_URL}?${params.toString()}`;
}

export async function createXOauthSessionCookieValue(
  secret: string,
  session: XOAuthSession,
): Promise<string> {
  return signJson(secret, session);
}

export async function readXOauthSessionCookieValue(
  secret: string,
  token: string,
): Promise<XOAuthSession> {
  const session = await verifySignedJson<XOAuthSession>(secret, token);
  if (!session.nonce || !session.verifier || session.exp < Date.now()) {
    throw new XOAuthError("X OAuth PKCE session expired", "PKCE_EXPIRED");
  }
  return session;
}

export async function createXSessionCookieValue(
  secret: string,
  user: VerifiedXUser,
  ttlMs = 60 * 60 * 1000,
): Promise<string> {
  const payload: SignedXSession = {
    id: user.id,
    username: user.username,
    name: user.name,
    exp: Date.now() + ttlMs,
  };
  return signJson(secret, payload);
}

export async function readXSessionCookieValue(
  secret: string,
  token: string,
): Promise<VerifiedXUser> {
  const session = await verifySignedJson<SignedXSession>(secret, token);
  if (session.exp < Date.now()) {
    throw new XOAuthError("X session expired", "X_SESSION_EXPIRED");
  }
  return verifyWorkXAccount(session);
}

export async function exchangeXAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
}): Promise<{ accessToken: string; scopes: string[] }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const basic = btoa(`${input.clientId}:${input.clientSecret}`);

  const response = await fetchImpl(X_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
      client_id: input.clientId,
    }),
  });

  void basic;
  const payload = (await response.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new XOAuthError(
      payload.error_description || payload.error || "X token exchange failed",
      "X_TOKEN_EXCHANGE",
    );
  }

  const scopes = parseXScopes(payload.scope ?? X_OAUTH_SCOPES.join(" "));
  assertExactXScopes(scopes);
  return { accessToken: payload.access_token, scopes };
}

export async function fetchVerifiedWorkXUser(input: {
  accessToken: string;
  env?: EnvMap;
  fetchImpl?: typeof fetch;
}): Promise<VerifiedXUser> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(`${X_USERS_ME_URL}?user.fields=username,name`, {
    headers: { Authorization: `Bearer ${input.accessToken}` },
  });
  const payload = (await response.json()) as {
    data?: { id?: string; username?: string; name?: string };
    title?: string;
    detail?: string;
  };
  if (!response.ok || !payload.data) {
    throw new XOAuthError(payload.detail || payload.title || "X users/me failed", "X_USERS_ME");
  }
  return verifyWorkXAccount(payload.data, input.env);
}

function policyIds(value: string | undefined): string[] | undefined {
  const id = value?.trim();
  return id ? [id] : undefined;
}

function externalId(role: WalletRole, xUserId: string): string {
  const compact = xUserId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return `${role}-x-${compact || "unknown"}`;
}

export async function provisionIsolatedWallets(
  port: HaiPrivyPort,
  xUser: VerifiedXUser,
  env: EnvMap = process.env,
): Promise<IsolatedWalletPair> {
  verifyWorkXAccount(xUser, env);
  assertOwnPrivyApp(port.appId, env);

  const botUser = await port.createUser({
    linked_accounts: [{ type: "custom_auth", custom_user_id: `hai-bot:x:${xUser.id}` }],
    custom_metadata: {
      role: WALLET_ROLE.BOT,
      x_username: xUser.username,
      purpose: "automation-only-no-card-funds",
    },
  });

  const fundingUser = await port.createUser({
    linked_accounts: [
      {
        type: "twitter_oauth",
        subject: xUser.id,
        username: xUser.username,
        name: xUser.name,
      },
      { type: "custom_auth", custom_user_id: `hai-funding:x:${xUser.id}` },
    ],
    custom_metadata: {
      role: WALLET_ROLE.FUNDING,
      x_username: xUser.username,
      purpose: "hai-card-funding-only",
    },
  });

  if (botUser.id === fundingUser.id) {
    throw new WalletIsolationError(
      "Privy returned the same user for bot and funding",
      "SAME_OWNER",
    );
  }

  const botWallet = await port.createWallet({
    chain_type: CHAIN_TYPE,
    owner: { user_id: botUser.id },
    display_name: "hai-bot",
    external_id: externalId(WALLET_ROLE.BOT, xUser.id),
    policy_ids: policyIds(env.PRIVY_BOT_POLICY_ID),
  });

  const fundingWallet = await port.createWallet({
    chain_type: CHAIN_TYPE,
    owner: { user_id: fundingUser.id },
    display_name: "hai-funding",
    external_id: externalId(WALLET_ROLE.FUNDING, xUser.id),
    policy_ids: policyIds(env.PRIVY_FUNDING_POLICY_ID),
  });

  const pair = assertWalletIsolation({
    xUserId: xUser.id,
    xUsername: xUser.username,
    bot: persistableWalletRecord(botWallet, WALLET_ROLE.BOT, botUser.id),
    funding: persistableWalletRecord(fundingWallet, WALLET_ROLE.FUNDING, fundingUser.id),
  });

  rememberProvisionedPair(pair);
  return pair;
}

let lastProvisionedPair: IsolatedWalletPair | null = null;

export function rememberProvisionedPair(pair: IsolatedWalletPair): IsolatedWalletPair {
  lastProvisionedPair = assertWalletIsolation(pair);
  return lastProvisionedPair;
}

export function clearRememberedWalletPair(): void {
  lastProvisionedPair = null;
}

export function loadWalletPairFromEnv(env: EnvMap = process.env): IsolatedWalletPair | null {
  const xUserId = env.PRIVY_X_USER_ID?.trim() ?? "";
  const xUsername = normalizeXHandle(env.PRIVY_X_USERNAME || env.X_ALLOWED_HANDLE || WORK_X_HANDLE);
  const botId = env.PRIVY_BOT_WALLET_ID?.trim() ?? "";
  const botAddress = env.PRIVY_BOT_WALLET_ADDRESS?.trim() ?? "";
  const botUserId = env.PRIVY_BOT_USER_ID?.trim() ?? "";
  const fundingId = env.PRIVY_FUNDING_WALLET_ID?.trim() ?? "";
  const fundingAddress = env.PRIVY_FUNDING_WALLET_ADDRESS?.trim() ?? "";
  const fundingUserId = env.PRIVY_FUNDING_USER_ID?.trim() ?? "";

  if (!botId || !botAddress || !botUserId || !fundingId || !fundingAddress || !fundingUserId) {
    return null;
  }

  return assertWalletIsolation({
    xUserId: xUserId || "env",
    xUsername,
    bot: persistableWalletRecord(
      { id: botId, address: botAddress },
      WALLET_ROLE.BOT,
      botUserId,
    ),
    funding: persistableWalletRecord(
      { id: fundingId, address: fundingAddress },
      WALLET_ROLE.FUNDING,
      fundingUserId,
    ),
  });
}

export function resolveWalletPair(env: EnvMap = process.env): IsolatedWalletPair {
  const fromEnv = loadWalletPairFromEnv(env);
  if (fromEnv) return fromEnv;
  if (lastProvisionedPair) return lastProvisionedPair;
  throw new PrivyConfigError(
    "No isolated wallet pair. Link @wshin84847 via /api/hai/x/login or set PRIVY_*_WALLET_ID env vars",
    "WALLETS_NOT_PROVISIONED",
  );
}

export async function createLivePrivyPort(
  env: EnvMap = process.env,
): Promise<HaiPrivyPort> {
  const { appId, appSecret } = readPrivyAppCredentials(env);
  const { PrivyClient } = await import("@privy-io/node");
  const client = new PrivyClient({ appId, appSecret });

  return {
    appId,
    async createUser(input) {
      assertNoPrivateKeyMaterial(input);
      const user = await client.users().create({
        linked_accounts: input.linked_accounts,
        custom_metadata: input.custom_metadata,
      });
      return { id: user.id };
    },
    async createWallet(input) {
      assertNoPrivateKeyMaterial(input);
      const wallet = await client.wallets().create({
        chain_type: input.chain_type,
        owner: { user_id: input.owner.user_id },
        policy_ids: input.policy_ids,
      });
      return { id: wallet.id, address: wallet.address };
    },
  };
}
