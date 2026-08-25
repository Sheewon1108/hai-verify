// Copyright 2026 KARAM. All Rights Reserved.

/**
 * POST /api/hai/fund — Hai X Money card top-up.
 *
 * Money never moves on this call. Each request:
 * 1. Accepts the funding wallet only (bot wallet is rejected).
 * 2. Signs an approval token.
 * 3. Pings Slack + Telegram for a human approve/deny.
 *
 * Actual card credit runs only after a valid approval token is presented.
 */

import { jsonWithCors } from "@/app/lib/cors";
import {
  type EnvReader,
  type FundingWallet,
  type HttpClient,
  type IsolatedWallet,
  WalletIsolationError,
  loadIsolatedWallets,
  requireFundingWallet,
  toPublicWallet,
} from "@/src/lib/privy";
import { randomId, signPayload, verifyPayload } from "@/src/lib/signed-token";

export const FUND_PATH = "/api/hai/fund";
export const FUND_APPROVE_PATH = "/api/hai/fund/approve";

export type FundDecision = "approve" | "deny";
export type FundStatus =
  | "pending_approval"
  | "approved"
  | "denied"
  | "approved_pending_card_api"
  | "card_funded";

export type FundRequest = {
  requestId: string;
  amountUsd: number;
  currency: string;
  memo?: string;
  fundingWallet: FundingWallet;
  createdAt: number;
  exp: number;
};

export type FundApprovalToken = FundRequest & {
  purpose: "hai-card-fund";
};

export type ApprovalNotifyResult = {
  slack: { sent: boolean; error?: string };
  telegram: { sent: boolean; error?: string };
};

export type CardFundResult = {
  attempted: boolean;
  funded: boolean;
  status: Extract<FundStatus, "approved" | "approved_pending_card_api" | "card_funded">;
  providerReference?: string;
  error?: string;
};

export type UsedTokenStore = {
  has(requestId: string): boolean | Promise<boolean>;
  mark(requestId: string, decision: FundDecision): void | Promise<void>;
};

const defaultEnv: EnvReader = (name) => process.env[name];

const usedTokens = new Map<string, FundDecision>();

export const memoryUsedTokenStore: UsedTokenStore = {
  has: (requestId) => usedTokens.has(requestId),
  mark: (requestId, decision) => {
    usedTokens.set(requestId, decision);
  },
};

export class FundError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "FundError";
    this.status = status;
  }
}

function envValue(env: EnvReader, name: string): string | undefined {
  const value = env(name)?.trim();
  return value || undefined;
}

function approvalSecret(env: EnvReader): string {
  const secret = envValue(env, "HAI_FUND_APPROVAL_SECRET") ?? envValue(env, "HAI_API_KEY_SECRET");
  if (!secret) {
    throw new FundError("HAI_FUND_APPROVAL_SECRET or HAI_API_KEY_SECRET is required", 503);
  }
  return secret;
}

function publicBaseUrl(env: EnvReader, requestUrl?: string): string {
  const configured = envValue(env, "HAI_PUBLIC_BASE_URL");
  if (configured) return configured.replace(/\/$/, "");
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }
  return "http://127.0.0.1:3001";
}

export function parseFundAmount(raw: unknown): number {
  const amount = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FundError("amountUsd must be a positive number");
  }
  if (amount > 5_000) {
    throw new FundError("amountUsd exceeds the $5000 per-request cap");
  }
  return Math.round(amount * 100) / 100;
}

export function parseFundCurrency(raw: unknown): string {
  const currency = (typeof raw === "string" ? raw : "USDC").trim().toUpperCase();
  if (!["USDC", "USD"].includes(currency)) {
    throw new FundError("currency must be USDC or USD");
  }
  return currency;
}

export async function createFundRequest(input: {
  amountUsd: unknown;
  currency?: unknown;
  memo?: unknown;
  wallet: IsolatedWallet;
  env?: EnvReader;
  nowMs?: number;
  ttlMs?: number;
}): Promise<{ request: FundRequest; token: string }> {
  const fundingWallet = requireFundingWallet(input.wallet);
  const request: FundRequest = {
    requestId: randomId("hf"),
    amountUsd: parseFundAmount(input.amountUsd),
    currency: parseFundCurrency(input.currency),
    memo: typeof input.memo === "string" ? input.memo.slice(0, 200) : undefined,
    fundingWallet: toPublicWallet(fundingWallet),
    createdAt: input.nowMs ?? Date.now(),
    exp: (input.nowMs ?? Date.now()) + (input.ttlMs ?? 30 * 60 * 1000),
  };

  const token = await signPayload(approvalSecret(input.env ?? defaultEnv), {
    ...request,
    purpose: "hai-card-fund",
  } satisfies FundApprovalToken);

  return { request, token };
}

export async function readFundApprovalToken(token: string, env: EnvReader = defaultEnv): Promise<FundApprovalToken> {
  const payload = await verifyPayload<FundApprovalToken>(approvalSecret(env), token);
  if (payload.purpose !== "hai-card-fund") {
    throw new FundError("Token is not a Hai card funding approval");
  }
  if (payload.exp < Date.now()) {
    throw new FundError("Funding approval expired", 410);
  }
  requireFundingWallet(payload.fundingWallet);
  return payload;
}

export function approvalLinks(baseUrl: string, token: string): { approveUrl: string; denyUrl: string } {
  const approve = new URL(FUND_APPROVE_PATH, `${baseUrl}/`);
  approve.searchParams.set("decision", "approve");
  approve.searchParams.set("token", token);
  const deny = new URL(FUND_APPROVE_PATH, `${baseUrl}/`);
  deny.searchParams.set("decision", "deny");
  deny.searchParams.set("token", token);
  return { approveUrl: approve.toString(), denyUrl: deny.toString() };
}

function fundMessage(request: FundRequest, links: { approveUrl: string; denyUrl: string }): string {
  return [
    "Hai X Money card fund request — human approval required.",
    `Request: ${request.requestId}`,
    `Amount: ${request.amountUsd} ${request.currency}`,
    `Funding wallet: ${request.fundingWallet.address}`,
    `Wallet role: funding (bot wallet is not used)`,
    request.memo ? `Memo: ${request.memo}` : null,
    `Approve: ${links.approveUrl}`,
    `Deny: ${links.denyUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyApprovers(input: {
  request: FundRequest;
  token: string;
  env?: EnvReader;
  http?: HttpClient;
  requestUrl?: string;
}): Promise<ApprovalNotifyResult> {
  const env = input.env ?? defaultEnv;
  const http = input.http ?? defaultFetch;
  const links = approvalLinks(publicBaseUrl(env, input.requestUrl), input.token);
  const text = fundMessage(input.request, links);
  const result: ApprovalNotifyResult = {
    slack: { sent: false },
    telegram: { sent: false },
  };

  const slackUrl = envValue(env, "SLACK_APPROVAL_WEBHOOK_URL") ?? envValue(env, "SLACK_WEBHOOK_URL");
  if (slackUrl) {
    try {
      const res = await http({
        url: slackUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          blocks: [
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Hai card fund*\n\`\`\`${text}\`\`\`` },
            },
          ],
        }),
      });
      result.slack.sent = res.status < 400;
      if (!result.slack.sent) result.slack.error = `Slack HTTP ${res.status}`;
    } catch (error) {
      result.slack.error = error instanceof Error ? error.message : "Slack notify failed";
    }
  } else {
    result.slack.error = "SLACK_APPROVAL_WEBHOOK_URL is not set";
  }

  const telegramToken = envValue(env, "TELEGRAM_BOT_TOKEN");
  const telegramChat = envValue(env, "TELEGRAM_CHAT_ID");
  if (telegramToken && telegramChat) {
    try {
      const res = await http({
        url: `https://api.telegram.org/bot${telegramToken}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChat,
          text,
          disable_web_page_preview: true,
        }),
      });
      result.telegram.sent = res.status < 400;
      if (!result.telegram.sent) result.telegram.error = `Telegram HTTP ${res.status}`;
    } catch (error) {
      result.telegram.error = error instanceof Error ? error.message : "Telegram notify failed";
    }
  } else {
    result.telegram.error = "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set";
  }

  if (!result.slack.sent && !result.telegram.sent) {
    throw new FundError("No approval channel delivered. Set Slack webhook and/or Telegram bot env.", 503);
  }

  return result;
}

function defaultFetch(request: { url: string; method?: string; headers?: Record<string, string>; body?: string }) {
  return fetch(request.url, {
    method: request.method ?? "GET",
    headers: request.headers,
    body: request.body,
  }).then(async (res) => ({
    status: res.status,
    json: await res.json().catch(() => ({})),
  }));
}

export async function executeApprovedCardFund(input: {
  request: FundRequest;
  env?: EnvReader;
  http?: HttpClient;
}): Promise<CardFundResult> {
  requireFundingWallet(input.request.fundingWallet);
  const env = input.env ?? defaultEnv;
  const cardUrl = envValue(env, "HAI_CARD_API_URL");
  const cardKey = envValue(env, "HAI_CARD_API_KEY");

  if (!cardUrl) {
    return {
      attempted: false,
      funded: false,
      status: "approved_pending_card_api",
      error: "HAI_CARD_API_URL is not set. Approval recorded; card credit not sent.",
    };
  }

  const http = input.http ?? defaultFetch;
  const endpoint = cardUrl.replace(/\/$/, "") + "/fund";
  const res = await http({
    url: endpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cardKey ? { Authorization: `Bearer ${cardKey}` } : {}),
    },
    body: JSON.stringify({
      requestId: input.request.requestId,
      amountUsd: input.request.amountUsd,
      currency: input.request.currency,
      memo: input.request.memo,
      sourceWallet: {
        role: "funding",
        address: input.request.fundingWallet.address,
        privyWalletId: input.request.fundingWallet.privyWalletId,
      },
    }),
  });

  if (res.status >= 400) {
    return {
      attempted: true,
      funded: false,
      status: "approved_pending_card_api",
      error: `Hai card API HTTP ${res.status}`,
    };
  }

  const json = res.json as { id?: string; reference?: string };
  return {
    attempted: true,
    funded: true,
    status: "card_funded",
    providerReference: json.reference ?? json.id,
  };
}

export async function decideFundRequest(input: {
  token: string;
  decision: FundDecision;
  env?: EnvReader;
  http?: HttpClient;
  store?: UsedTokenStore;
}): Promise<{
  requestId: string;
  decision: FundDecision;
  status: FundStatus;
  card?: CardFundResult;
}> {
  const env = input.env ?? defaultEnv;
  const store = input.store ?? memoryUsedTokenStore;
  const request = await readFundApprovalToken(input.token, env);

  if (await store.has(request.requestId)) {
    throw new FundError("This funding request was already decided", 409);
  }

  await store.mark(request.requestId, input.decision);

  if (input.decision === "deny") {
    return { requestId: request.requestId, decision: "deny", status: "denied" };
  }

  const card = await executeApprovedCardFund({ request, env, http: input.http });
  return {
    requestId: request.requestId,
    decision: "approve",
    status: card.status,
    card,
  };
}

function jsonError(origin: string | null, error: unknown): Response {
  if (error instanceof FundError || error instanceof WalletIsolationError) {
    const status = error instanceof FundError ? error.status : 403;
    return jsonWithCors({ ok: false, error: error.message }, { status, requestOrigin: origin });
  }
  const message = error instanceof Error ? error.message : "Funding error";
  return jsonWithCors({ ok: false, error: message }, { status: 500, requestOrigin: origin });
}

export async function handleFundCreate(
  request: Request,
  env: EnvReader = defaultEnv,
  http?: HttpClient,
): Promise<Response> {
  const origin = request.headers.get("origin");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ ok: false, error: "Invalid JSON body" }, { status: 400, requestOrigin: origin });
  }

  const record = (body ?? {}) as Record<string, unknown>;
  if (record.walletRole === "bot" || record.useBotWallet === true) {
    return jsonWithCors(
      { ok: false, error: "Bot wallet cannot fund the Hai card" },
      { status: 403, requestOrigin: origin },
    );
  }

  try {
    const wallets = await loadIsolatedWallets(env);
    const created = await createFundRequest({
      amountUsd: record.amountUsd ?? record.amount,
      currency: record.currency,
      memo: record.memo,
      wallet: wallets.funding,
      env,
    });
    const approvals = await notifyApprovers({
      request: created.request,
      token: created.token,
      env,
      http,
      requestUrl: request.url,
    });

    return jsonWithCors(
      {
        ok: true,
        status: "pending_approval" satisfies FundStatus,
        requestId: created.request.requestId,
        amountUsd: created.request.amountUsd,
        currency: created.request.currency,
        fundingWallet: {
          role: created.request.fundingWallet.role,
          address: created.request.fundingWallet.address,
        },
        botWalletExcluded: true,
        approvalsSent: {
          slack: approvals.slack.sent,
          telegram: approvals.telegram.sent,
        },
        message: "Funding is waiting for Slack/Telegram approval. No card credit yet.",
      },
      { requestOrigin: origin },
    );
  } catch (error) {
    return jsonError(origin, error);
  }
}

export async function handleFundApprove(request: Request, env: EnvReader = defaultEnv): Promise<Response> {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);

  let decision = url.searchParams.get("decision");
  let token = url.searchParams.get("token");

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        if (typeof body.decision === "string") decision = body.decision;
        if (typeof body.token === "string") token = body.token;
      } catch {
        return jsonWithCors({ ok: false, error: "Invalid JSON body" }, { status: 400, requestOrigin: origin });
      }
    }
  }

  if (decision !== "approve" && decision !== "deny") {
    return jsonWithCors(
      { ok: false, error: "decision must be approve or deny" },
      { status: 400, requestOrigin: origin },
    );
  }
  if (!token) {
    return jsonWithCors({ ok: false, error: "token is required" }, { status: 400, requestOrigin: origin });
  }

  try {
    const result = await decideFundRequest({ token, decision, env });
    return jsonWithCors({ ok: true, ...result }, { requestOrigin: origin });
  } catch (error) {
    return jsonError(origin, error);
  }
}

export function fundCreateDescribe() {
  return {
    ok: true,
    endpoint: FUND_PATH,
    method: "POST",
    description:
      "Create a Hai X Money card fund request from the isolated funding wallet. Slack/Telegram approval is required before any credit.",
    body: {
      amountUsd: "number (required, max 5000)",
      currency: "USDC | USD",
      memo: "string (optional)",
    },
    isolation: {
      botWallet: "never used for card funding",
      fundingWallet: "only source allowed",
      privateKeys: "never stored",
    },
  };
}
