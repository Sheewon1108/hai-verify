// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * Hai X Money card funding — isolated from the X bot wallet.
 *
 * POST /api/hai/fund never moves money. It only opens a pending request
 * and pings Slack + Telegram for a human approve/reject.
 * Execution uses the funding wallet only after that approval.
 */

import {
  assertFundingWallet,
  assertNoPrivateKeyMaterial,
  getIsolatedWallets,
  PrivyConfigError,
  WalletIsolationError,
  XOAuthError,
  type IsolatedWallets,
  type PrivyDeps,
  type PublicWalletRecord,
  WORK_X_HANDLE,
} from "../../lib/privy";

export const FUND_TOKEN_PREFIX = "hf_";
export const DEFAULT_FUND_MAX_CENTS = 50_000;
export const DEFAULT_FUND_TTL_MS = 15 * 60 * 1000;

export type FundCurrency = "USD" | "USDC";
export type FundDecision = "approve" | "reject";
export type FundStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

export type FundEnv = PrivyDeps["env"] & {
  HAI_FUND_APPROVAL_SECRET?: string;
  HAI_FUND_MAX_AMOUNT_CENTS?: string;
  HAI_FUND_TTL_MS?: string;
  HAI_PUBLIC_BASE_URL?: string;
  HAI_CARD_FUND_URL?: string;
  SLACK_FUND_WEBHOOK_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

export type FundRequestInput = {
  amountCents: number;
  currency?: FundCurrency;
  memo?: string;
  idempotencyKey?: string;
  xHandle?: string;
};

export type FundRequestRecord = {
  requestId: string;
  amountCents: number;
  currency: FundCurrency;
  memo?: string;
  xHandle: string;
  fundingWalletId: string;
  fundingAddress: string;
  createdAt: number;
  expiresAt: number;
  status: FundStatus;
};

export type ApprovalTokenPayload = {
  requestId: string;
  action: FundDecision;
  amountCents: number;
  currency: FundCurrency;
  fundingWalletId: string;
  exp: number;
};

export type PendingFundResult = {
  ok: true;
  status: "pending_approval";
  request: FundRequestRecord;
  approval: {
    approveUrl: string;
    rejectUrl: string;
    channels: Array<"slack" | "telegram">;
  };
};

export type FundDecisionResult =
  | {
      ok: true;
      status: "rejected" | "executed";
      requestId: string;
      cardFund?: CardFundReceipt;
    }
  | {
      ok: false;
      error: string;
      code: string;
    };

export type CardFundReceipt = {
  provider: "hai-x-money";
  mode: "queued" | "provider";
  requestId: string;
  fundingWalletId: string;
  amountCents: number;
  currency: FundCurrency;
  providerReference?: string;
};

export type FundStore = {
  put(record: FundRequestRecord): Promise<void>;
  get(requestId: string): Promise<FundRequestRecord | null>;
  markUsed(requestId: string, status: FundStatus): Promise<boolean>;
};

export type FundDeps = PrivyDeps & {
  env?: FundEnv;
  store?: FundStore;
  notify?: (message: FundAlertMessage) => Promise<Array<"slack" | "telegram">>;
  cardProvider?: (input: ApprovedFundExecution) => Promise<CardFundReceipt>;
};

export type FundAlertMessage = {
  text: string;
  approveUrl: string;
  rejectUrl: string;
};

export type ApprovedFundExecution = {
  request: FundRequestRecord;
  fundingWallet: PublicWalletRecord;
  isolated: IsolatedWallets;
};

class MemoryFundStore implements FundStore {
  private readonly records = new Map<string, FundRequestRecord>();

  async put(record: FundRequestRecord): Promise<void> {
    this.records.set(record.requestId, record);
  }

  async get(requestId: string): Promise<FundRequestRecord | null> {
    return this.records.get(requestId) ?? null;
  }

  async markUsed(requestId: string, status: FundStatus): Promise<boolean> {
    const current = this.records.get(requestId);
    if (!current) return false;
    const allowed =
      (current.status === "pending_approval" &&
        (status === "approved" || status === "rejected")) ||
      (current.status === "approved" && (status === "executed" || status === "failed"));
    if (!allowed) return false;
    this.records.set(requestId, { ...current, status });
    return true;
  }
}

const defaultStore = new MemoryFundStore();

export function createMemoryFundStore(): FundStore {
  return new MemoryFundStore();
}

export class FundError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "FundError";
  }
}

function readEnv(deps?: FundDeps): FundEnv {
  return deps?.env ?? (process.env as FundEnv);
}

function approvalSecret(env: FundEnv): string {
  const secret = env.HAI_FUND_APPROVAL_SECRET?.trim();
  if (!secret) {
    throw new FundError("HAI_FUND_APPROVAL_SECRET is not set", "CONFIG", 503);
  }
  return secret;
}

function maxAmountCents(env: FundEnv): number {
  const raw = env.HAI_FUND_MAX_AMOUNT_CENTS?.trim();
  if (!raw) return DEFAULT_FUND_MAX_CENTS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FUND_MAX_CENTS;
}

function ttlMs(env: FundEnv): number {
  const raw = env.HAI_FUND_TTL_MS?.trim();
  if (!raw) return DEFAULT_FUND_TTL_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FUND_TTL_MS;
}

function publicBaseUrl(env: FundEnv): string {
  const raw = env.HAI_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (!raw) {
    throw new FundError("HAI_PUBLIC_BASE_URL is not set", "CONFIG", 503);
  }
  return raw;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return new Uint8Array([...binary].map((ch) => ch.charCodeAt(0)));
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8(data) as BufferSource);
  return bytesToBase64Url(new Uint8Array(sig));
}

async function hmacEqual(secret: string, data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function randomId(deps?: FundDeps): string {
  const bytes = (deps?.randomBytes ?? ((size) => {
    const out = new Uint8Array(size);
    crypto.getRandomValues(out);
    return out;
  }))(16);
  return bytesToBase64Url(bytes);
}

export function parseFundRequestInput(body: unknown): FundRequestInput {
  if (typeof body !== "object" || body === null) {
    throw new FundError("JSON body is required", "INVALID_INPUT");
  }
  const record = body as Record<string, unknown>;
  const amountCents = Number(record.amountCents ?? record.amount_cents);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new FundError("amountCents must be a positive integer", "INVALID_INPUT");
  }

  const currencyRaw = typeof record.currency === "string" ? record.currency.toUpperCase() : "USD";
  if (currencyRaw !== "USD" && currencyRaw !== "USDC") {
    throw new FundError("currency must be USD or USDC", "INVALID_INPUT");
  }

  const memo = typeof record.memo === "string" ? record.memo.trim().slice(0, 200) : undefined;
  const idempotencyKey =
    typeof record.idempotencyKey === "string"
      ? record.idempotencyKey.trim().slice(0, 80)
      : undefined;
  const xHandle =
    typeof record.xHandle === "string" ? record.xHandle.replace(/^@/, "").trim() : undefined;

  return {
    amountCents,
    currency: currencyRaw,
    memo: memo || undefined,
    idempotencyKey: idempotencyKey || undefined,
    xHandle: xHandle || undefined,
  };
}

export function validateFundAmount(amountCents: number, env: FundEnv): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new FundError("amountCents must be a positive integer", "INVALID_INPUT");
  }
  const max = maxAmountCents(env);
  if (amountCents > max) {
    throw new FundError(`amountCents exceeds max ${max}`, "AMOUNT_CAP");
  }
}

export async function signApprovalToken(
  payload: ApprovalTokenPayload,
  deps?: FundDeps,
): Promise<string> {
  const body = JSON.stringify(payload);
  const sig = await hmacSign(approvalSecret(readEnv(deps)), body);
  return `${FUND_TOKEN_PREFIX}${bytesToBase64Url(utf8(body))}.${sig}`;
}

export async function verifyApprovalToken(
  token: string,
  deps?: FundDeps,
): Promise<ApprovalTokenPayload> {
  if (!token.startsWith(FUND_TOKEN_PREFIX)) {
    throw new FundError("Invalid approval token", "INVALID_TOKEN", 401);
  }
  const raw = token.slice(FUND_TOKEN_PREFIX.length);
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) {
    throw new FundError("Invalid approval token", "INVALID_TOKEN", 401);
  }
  const body = new TextDecoder().decode(base64UrlToBytes(raw.slice(0, dot)));
  const sig = raw.slice(dot + 1);
  if (!(await hmacEqual(approvalSecret(readEnv(deps)), body, sig))) {
    throw new FundError("Approval token signature mismatch", "INVALID_TOKEN", 401);
  }

  const payload = JSON.parse(body) as ApprovalTokenPayload;
  const now = deps?.now?.() ?? Date.now();
  if (!payload.requestId || payload.exp <= now) {
    throw new FundError("Approval token expired or incomplete", "TOKEN_EXPIRED", 401);
  }
  if (payload.action !== "approve" && payload.action !== "reject") {
    throw new FundError("Approval token action is invalid", "INVALID_TOKEN", 401);
  }
  return payload;
}

export function buildApprovalUrls(
  tokens: { approve: string; reject: string },
  env: FundEnv,
): { approveUrl: string; rejectUrl: string } {
  const base = publicBaseUrl(env);
  return {
    approveUrl: `${base}/api/hai/fund/approve?token=${encodeURIComponent(tokens.approve)}`,
    rejectUrl: `${base}/api/hai/fund/approve?token=${encodeURIComponent(tokens.reject)}`,
  };
}

function formatUsd(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}

function alertText(request: FundRequestRecord): string {
  return [
    "Hai X Money card fund needs approval",
    `amount: ${formatUsd(request.amountCents)} ${request.currency}`,
    `x: @${request.xHandle}`,
    `fundingWallet: ${request.fundingWalletId}`,
    `fundingAddress: ${request.fundingAddress}`,
    `requestId: ${request.requestId}`,
    request.memo ? `memo: ${request.memo}` : "",
    "Bot wallet is not used for this transfer.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendFundApprovalAlerts(
  message: FundAlertMessage,
  deps?: FundDeps,
): Promise<Array<"slack" | "telegram">> {
  if (deps?.notify) {
    return deps.notify(message);
  }

  const env = readEnv(deps);
  const fetchFn = deps?.fetch ?? fetch;
  const sent: Array<"slack" | "telegram"> = [];

  const slackUrl = env.SLACK_FUND_WEBHOOK_URL?.trim();
  if (slackUrl) {
    const response = await fetchFn(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${message.text}\nApprove: ${message.approveUrl}\nReject: ${message.rejectUrl}`,
      }),
    });
    if (!response.ok) {
      throw new FundError("Slack approval alert failed", "NOTIFY_FAILED", 502);
    }
    sent.push("slack");
  }

  const telegramToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChat = env.TELEGRAM_CHAT_ID?.trim();
  if (telegramToken && telegramChat) {
    const response = await fetchFn(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChat,
          text: `${message.text}\nApprove: ${message.approveUrl}\nReject: ${message.rejectUrl}`,
          disable_web_page_preview: true,
        }),
      },
    );
    if (!response.ok) {
      throw new FundError("Telegram approval alert failed", "NOTIFY_FAILED", 502);
    }
    sent.push("telegram");
  }

  if (sent.length === 0) {
    throw new FundError(
      "Set SLACK_FUND_WEBHOOK_URL and/or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID",
      "CONFIG",
      503,
    );
  }

  return sent;
}

export async function defaultCardProvider(
  input: ApprovedFundExecution,
  deps?: FundDeps,
): Promise<CardFundReceipt> {
  assertNoPrivateKeyMaterial(input.fundingWallet);
  const env = readEnv(deps);
  const providerUrl = env.HAI_CARD_FUND_URL?.trim();
  const receipt: CardFundReceipt = {
    provider: "hai-x-money",
    mode: providerUrl ? "provider" : "queued",
    requestId: input.request.requestId,
    fundingWalletId: input.fundingWallet.walletId,
    amountCents: input.request.amountCents,
    currency: input.request.currency,
  };

  if (!providerUrl) {
    return receipt;
  }

  const fetchFn = deps?.fetch ?? fetch;
  const response = await fetchFn(providerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: input.request.requestId,
      amountCents: input.request.amountCents,
      currency: input.request.currency,
      fundingWalletId: input.fundingWallet.walletId,
      fundingAddress: input.fundingWallet.address,
      xHandle: input.request.xHandle,
    }),
  });
  if (!response.ok) {
    throw new FundError("Hai card provider rejected the fund", "PROVIDER_FAILED", 502);
  }
  const payload = (await response.json()) as { reference?: string };
  return { ...receipt, providerReference: payload.reference };
}

export async function requestHaiCardFund(
  input: FundRequestInput,
  deps?: FundDeps,
): Promise<PendingFundResult> {
  const env = readEnv(deps);
  validateFundAmount(input.amountCents, env);

  const handle = (input.xHandle ?? WORK_X_HANDLE).replace(/^@/, "").toLowerCase();
  if (handle !== WORK_X_HANDLE.toLowerCase()) {
    throw new FundError(
      `Funding is locked to the work X account @${WORK_X_HANDLE}`,
      "X_ACCOUNT_MISMATCH",
      403,
    );
  }

  const isolated = await getIsolatedWallets(deps);
  const fundingWallet = assertFundingWallet(isolated.funding, isolated);
  const now = deps?.now?.() ?? Date.now();
  const request: FundRequestRecord = {
    requestId: input.idempotencyKey || randomId(deps),
    amountCents: input.amountCents,
    currency: input.currency ?? "USD",
    memo: input.memo,
    xHandle: WORK_X_HANDLE,
    fundingWalletId: fundingWallet.walletId,
    fundingAddress: fundingWallet.address,
    createdAt: now,
    expiresAt: now + ttlMs(env),
    status: "pending_approval",
  };

  const store = deps?.store ?? defaultStore;
  const existing = await store.get(request.requestId);
  if (existing?.status === "pending_approval" && existing.expiresAt > now) {
    const tokens = await signPair(existing, deps);
    const urls = buildApprovalUrls(tokens, env);
    return {
      ok: true,
      status: "pending_approval",
      request: existing,
      approval: { ...urls, channels: [] },
    };
  }

  await store.put(request);
  const tokens = await signPair(request, deps);
  const urls = buildApprovalUrls(tokens, env);
  const channels = await sendFundApprovalAlerts(
    { text: alertText(request), ...urls },
    deps,
  );

  return {
    ok: true,
    status: "pending_approval",
    request,
    approval: { ...urls, channels },
  };
}

async function signPair(
  request: FundRequestRecord,
  deps?: FundDeps,
): Promise<{ approve: string; reject: string }> {
  const base = {
    requestId: request.requestId,
    amountCents: request.amountCents,
    currency: request.currency,
    fundingWalletId: request.fundingWalletId,
    exp: request.expiresAt,
  };
  return {
    approve: await signApprovalToken({ ...base, action: "approve" }, deps),
    reject: await signApprovalToken({ ...base, action: "reject" }, deps),
  };
}

export async function decideHaiCardFund(
  token: string,
  deps?: FundDeps,
): Promise<FundDecisionResult> {
  const payload = await verifyApprovalToken(token, deps);
  const store = deps?.store ?? defaultStore;
  const isolated = await getIsolatedWallets(deps);
  const fundingWallet = assertFundingWallet(isolated.funding, isolated);

  if (payload.fundingWalletId !== fundingWallet.walletId) {
    throw new FundError("Approval token is not bound to the funding wallet", "WALLET_MISMATCH", 403);
  }

  const record = await store.get(payload.requestId);
  if (!record) {
    throw new FundError("Unknown fund request", "NOT_FOUND", 404);
  }
  if (record.fundingWalletId !== fundingWallet.walletId) {
    throw new FundError("Stored request is not bound to the funding wallet", "WALLET_MISMATCH", 403);
  }
  if (record.amountCents !== payload.amountCents || record.currency !== payload.currency) {
    throw new FundError("Approval token does not match the stored amount", "AMOUNT_MISMATCH", 409);
  }

  if (payload.action === "reject") {
    const claimed = await store.markUsed(payload.requestId, "rejected");
    if (!claimed && record.status !== "rejected") {
      throw new FundError("Fund request was already decided", "ALREADY_DECIDED", 409);
    }
    return { ok: true, status: "rejected", requestId: payload.requestId };
  }

  const claimed = await store.markUsed(payload.requestId, "approved");
  if (!claimed) {
    throw new FundError("Fund request was already decided", "ALREADY_DECIDED", 409);
  }

  try {
    const provider = deps?.cardProvider ?? ((input) => defaultCardProvider(input, deps));
    const cardFund = await provider({
      request: { ...record, status: "approved" },
      fundingWallet,
      isolated,
    });
    await store.markUsed(payload.requestId, "executed");
    return { ok: true, status: "executed", requestId: payload.requestId, cardFund };
  } catch (error) {
    await store.markUsed(payload.requestId, "failed");
    if (error instanceof FundError) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Hai card fund failed after approval", code: "EXECUTE_FAILED" };
  }
}

export function fundErrorToResponse(error: unknown): {
  ok: false;
  error: string;
  code: string;
  status: number;
} {
  if (error instanceof FundError) {
    return { ok: false, error: error.message, code: error.code, status: error.status };
  }
  if (error instanceof PrivyConfigError) {
    return { ok: false, error: error.message, code: "CONFIG", status: 503 };
  }
  if (error instanceof WalletIsolationError) {
    return { ok: false, error: error.message, code: "WALLET_ISOLATION", status: 403 };
  }
  if (error instanceof XOAuthError) {
    return { ok: false, error: error.message, code: "X_OAUTH", status: 403 };
  }
  return { ok: false, error: "Unexpected fund error", code: "INTERNAL_ERROR", status: 500 };
}
