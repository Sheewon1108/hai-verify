// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * Hai X Money card funding.
 *
 * POST /api/hai/fund creates a pending top-up. Money does not move until
 * Slack/Telegram approval hits /api/hai/fund/approve.
 *
 * Only the funding wallet may source a top-up. The bot wallet is rejected.
 */

import {
  assertFundingSource,
  assertNoPrivateKeyMaterial,
  assertWalletIsolation,
  signingSecret,
  verifyWorkXAccount,
  type EnvMap,
  type IsolatedWalletPair,
  type VerifiedXUser,
} from "../../lib/privy";
import { randomId, signJson, verifySignedJson } from "../../lib/web-crypto";

export const HAI_FUND_CURRENCY = "USD" as const;
export const DEFAULT_FUND_MAX_CENTS = 50_000;
export const DEFAULT_APPROVAL_TTL_MS = 30 * 60 * 1000;

export type FundStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

export type FundDecision = "approve" | "reject";

export interface HaiFundRequest {
  id: string;
  status: FundStatus;
  amountCents: number;
  currency: typeof HAI_FUND_CURRENCY;
  fundingWalletId: string;
  fundingWalletAddress: string;
  xUsername: string;
  xUserId: string;
  memo?: string;
  createdAt: string;
  decidedAt?: string;
  settlementId?: string;
  failureReason?: string;
}

export interface FundApprovalToken {
  requestId: string;
  action: FundDecision;
  amountCents: number;
  currency: typeof HAI_FUND_CURRENCY;
  fundingWalletId: string;
  fundingWalletAddress: string;
  xUsername: string;
  xUserId: string;
  memo?: string;
  exp: number;
}

export interface RequestFundInput {
  amountCents: number;
  currency?: string;
  fundingWalletId: string;
  xAccount: VerifiedXUser;
  memo?: string;
}

export interface FundStore {
  put(request: HaiFundRequest): Promise<void> | void;
  get(id: string): Promise<HaiFundRequest | undefined> | HaiFundRequest | undefined;
  update(request: HaiFundRequest): Promise<void> | void;
}

export class MemoryFundStore implements FundStore {
  private readonly items = new Map<string, HaiFundRequest>();

  put(request: HaiFundRequest): void {
    assertNoPrivateKeyMaterial(request);
    this.items.set(request.id, { ...request });
  }

  get(id: string): HaiFundRequest | undefined {
    const found = this.items.get(id);
    return found ? { ...found } : undefined;
  }

  update(request: HaiFundRequest): void {
    assertNoPrivateKeyMaterial(request);
    this.items.set(request.id, { ...request });
  }
}

export interface ApprovalNotifier {
  notify(input: {
    request: HaiFundRequest;
    approveUrl: string;
    rejectUrl: string;
  }): Promise<{ slack: boolean; telegram: boolean }>;
}

export interface HaiCardFunder {
  fund(input: {
    requestId: string;
    fundingWalletId: string;
    amountCents: number;
    currency: typeof HAI_FUND_CURRENCY;
  }): Promise<{ settlementId: string }>;
}

/** Records an approved intent. Plug the real Hai card processor here later. */
export class RecordOnlyHaiCardFunder implements HaiCardFunder {
  async fund(input: {
    requestId: string;
    fundingWalletId: string;
    amountCents: number;
    currency: typeof HAI_FUND_CURRENCY;
  }): Promise<{ settlementId: string }> {
    assertNoPrivateKeyMaterial(input);
    return { settlementId: `hai-card:${input.requestId}` };
  }
}

export class HaiFundError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "HaiFundError";
    this.code = code;
    this.status = status;
  }
}

export function publicFundView(request: HaiFundRequest): Omit<HaiFundRequest, never> {
  assertNoPrivateKeyMaterial(request);
  return {
    id: request.id,
    status: request.status,
    amountCents: request.amountCents,
    currency: request.currency,
    fundingWalletId: request.fundingWalletId,
    fundingWalletAddress: request.fundingWalletAddress,
    xUsername: request.xUsername,
    xUserId: request.xUserId,
    memo: request.memo,
    createdAt: request.createdAt,
    decidedAt: request.decidedAt,
    settlementId: request.settlementId,
    failureReason: request.failureReason,
  };
}

export async function issueFundDecisionToken(
  secret: string,
  payload: FundApprovalToken,
): Promise<string> {
  assertNoPrivateKeyMaterial(payload);
  return signJson(secret, payload);
}

export async function readFundDecisionToken(
  secret: string,
  token: string,
  now: () => number = Date.now,
): Promise<FundApprovalToken> {
  const payload = await verifySignedJson<FundApprovalToken>(secret, token);
  if (payload.exp < now()) {
    throw new HaiFundError("Approval link expired", "APPROVAL_EXPIRED", 401);
  }
  if (payload.action !== "approve" && payload.action !== "reject") {
    throw new HaiFundError("Invalid approval action", "APPROVAL_ACTION", 400);
  }
  return payload;
}

export function createChannelNotifier(
  env: EnvMap = process.env,
  fetchImpl: typeof fetch = fetch,
): ApprovalNotifier {
  return {
    async notify({ request, approveUrl, rejectUrl }) {
      const text = [
        "Hai X Money card fund — approval required",
        `request: ${request.id}`,
        `amount: $${(request.amountCents / 100).toFixed(2)} ${request.currency}`,
        `x: @${request.xUsername}`,
        `funding wallet: ${request.fundingWalletAddress}`,
        `approve: ${approveUrl}`,
        `reject: ${rejectUrl}`,
      ].join("\n");

      const slack = await postSlack(env.SLACK_FUND_WEBHOOK_URL, text, fetchImpl);
      const telegram = await postTelegram(
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_CHAT_ID,
        text,
        fetchImpl,
      );
      return { slack, telegram };
    },
  };
}

async function postSlack(
  webhookUrl: string | undefined,
  text: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const url = webhookUrl?.trim();
  if (!url) return false;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return response.ok;
}

async function postTelegram(
  botToken: string | undefined,
  chatId: string | undefined,
  text: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const token = botToken?.trim();
  const chat = chatId?.trim();
  if (!token || !chat) return false;
  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  return response.ok;
}

export interface HaiFundService {
  requestFund(input: RequestFundInput): Promise<{
    request: HaiFundRequest;
    notified: { slack: boolean; telegram: boolean };
    approvalToken?: string;
    rejectToken?: string;
  }>;
  decide(token: string, expected?: FundDecision): Promise<HaiFundRequest>;
}

export function createHaiFundService(deps: {
  store: FundStore;
  wallets: IsolatedWalletPair;
  notify: ApprovalNotifier;
  card: HaiCardFunder;
  approvalSecret: string;
  publicBaseUrl: string;
  maxAmountCents?: number;
  approvalTtlMs?: number;
  now?: () => number;
  id?: () => string;
  exposeApprovalToken?: boolean;
}): HaiFundService {
  const now = deps.now ?? Date.now;
  const maxAmountCents = deps.maxAmountCents ?? DEFAULT_FUND_MAX_CENTS;
  const approvalTtlMs = deps.approvalTtlMs ?? DEFAULT_APPROVAL_TTL_MS;
  const wallets = assertWalletIsolation(deps.wallets);

  return {
    async requestFund(input) {
      assertNoPrivateKeyMaterial(input);
      const xAccount = verifyWorkXAccount(input.xAccount);
      const funding = assertFundingSource(input.fundingWalletId, wallets);

      if (input.currency && input.currency !== HAI_FUND_CURRENCY) {
        throw new HaiFundError("Only USD card funding is supported", "CURRENCY", 400);
      }
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new HaiFundError("amountCents must be a positive integer", "AMOUNT", 400);
      }
      if (input.amountCents > maxAmountCents) {
        throw new HaiFundError(
          `amountCents exceeds max ${maxAmountCents}`,
          "AMOUNT_MAX",
          400,
        );
      }

      const request: HaiFundRequest = {
        id: deps.id?.() ?? randomId("hf_"),
        status: "pending_approval",
        amountCents: input.amountCents,
        currency: HAI_FUND_CURRENCY,
        fundingWalletId: funding.id,
        fundingWalletAddress: funding.address,
        xUsername: xAccount.username,
        xUserId: xAccount.id,
        memo: input.memo?.trim() || undefined,
        createdAt: new Date(now()).toISOString(),
      };

      await deps.store.put(request);

      const exp = now() + approvalTtlMs;
      const shared = {
        requestId: request.id,
        amountCents: request.amountCents,
        currency: request.currency,
        fundingWalletId: request.fundingWalletId,
        fundingWalletAddress: request.fundingWalletAddress,
        xUsername: request.xUsername,
        xUserId: request.xUserId,
        memo: request.memo,
        exp,
      };
      const approvalToken = await issueFundDecisionToken(deps.approvalSecret, {
        ...shared,
        action: "approve",
      });
      const rejectToken = await issueFundDecisionToken(deps.approvalSecret, {
        ...shared,
        action: "reject",
      });

      const approveUrl = `${trimSlash(deps.publicBaseUrl)}/api/hai/fund/approve?action=approve&token=${encodeURIComponent(approvalToken)}`;
      const rejectUrl = `${trimSlash(deps.publicBaseUrl)}/api/hai/fund/approve?action=reject&token=${encodeURIComponent(rejectToken)}`;

      const notified = await deps.notify.notify({ request, approveUrl, rejectUrl });

      return {
        request,
        notified,
        approvalToken: deps.exposeApprovalToken ? approvalToken : undefined,
        rejectToken: deps.exposeApprovalToken ? rejectToken : undefined,
      };
    },

    async decide(token, expected) {
      const payload = await readFundDecisionToken(deps.approvalSecret, token, now);
      if (expected && payload.action !== expected) {
        throw new HaiFundError("Approval token action mismatch", "APPROVAL_ACTION", 400);
      }

      const existing = await deps.store.get(payload.requestId);
      if (existing?.status === "executed" || existing?.status === "rejected") {
        return existing;
      }

      const reconstructed: HaiFundRequest = existing ?? {
        id: payload.requestId,
        status: "pending_approval",
        amountCents: payload.amountCents,
        currency: payload.currency,
        fundingWalletId: payload.fundingWalletId,
        fundingWalletAddress: payload.fundingWalletAddress,
        xUsername: payload.xUsername,
        xUserId: payload.xUserId,
        memo: payload.memo,
        createdAt: new Date(now()).toISOString(),
      };

      if (reconstructed.fundingWalletId !== wallets.funding.id) {
        throw new HaiFundError(
          "Token wallet is not the current funding wallet",
          "NOT_FUNDING_WALLET",
          403,
        );
      }
      assertFundingSource(reconstructed.fundingWalletId, wallets);

      if (payload.action === "reject") {
        const rejected: HaiFundRequest = {
          ...reconstructed,
          status: "rejected",
          decidedAt: new Date(now()).toISOString(),
        };
        await deps.store.update(rejected);
        return rejected;
      }

      try {
        const { settlementId } = await deps.card.fund({
          requestId: reconstructed.id,
          fundingWalletId: wallets.funding.id,
          amountCents: reconstructed.amountCents,
          currency: reconstructed.currency,
        });
        const executed: HaiFundRequest = {
          ...reconstructed,
          status: "executed",
          decidedAt: new Date(now()).toISOString(),
          settlementId,
        };
        await deps.store.update(executed);
        return executed;
      } catch (error) {
        const failed: HaiFundRequest = {
          ...reconstructed,
          status: "failed",
          decidedAt: new Date(now()).toISOString(),
          failureReason: error instanceof Error ? error.message : "card_fund_failed",
        };
        await deps.store.update(failed);
        throw new HaiFundError(failed.failureReason ?? "card_fund_failed", "CARD_FUND", 502);
      }
    },
  };
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const defaultStore = new MemoryFundStore();

export function defaultPublicBaseUrl(
  env: EnvMap = process.env,
  requestUrl?: string,
): string {
  if (env.HAI_FUND_PUBLIC_BASE_URL?.trim()) return env.HAI_FUND_PUBLIC_BASE_URL.trim();
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }
  return "http://127.0.0.1:3000";
}

export function createDefaultHaiFundService(input: {
  wallets: IsolatedWalletPair;
  env?: EnvMap;
  requestUrl?: string;
  notify?: ApprovalNotifier;
  card?: HaiCardFunder;
  exposeApprovalToken?: boolean;
}): HaiFundService {
  const env = input.env ?? process.env;
  const maxRaw = env.HAI_FUND_MAX_CENTS?.trim();
  const maxAmountCents = maxRaw ? Number(maxRaw) : DEFAULT_FUND_MAX_CENTS;
  const production = env.NODE_ENV === "production";

  return createHaiFundService({
    store: defaultStore,
    wallets: input.wallets,
    notify: input.notify ?? createChannelNotifier(env),
    card: input.card ?? new RecordOnlyHaiCardFunder(),
    approvalSecret: signingSecret(env),
    publicBaseUrl: defaultPublicBaseUrl(env, input.requestUrl),
    maxAmountCents: Number.isFinite(maxAmountCents) ? maxAmountCents : DEFAULT_FUND_MAX_CENTS,
    exposeApprovalToken:
      input.exposeApprovalToken ?? (!production || env.HAI_FUND_EXPOSE_TOKEN === "1"),
  });
}
