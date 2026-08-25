// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * POST /api/hai/fund
 *
 * Queues a Hai X Money card top-up from the funding wallet.
 * Slack/Telegram get an approve link. Money does not move until approval.
 */

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import {
  createDefaultHaiFundService,
  publicFundView,
} from "@/src/api/hai/fund";
import { fundErrorResponse } from "@/app/api/hai/fund/errors";
import {
  XOAuthError,
  X_SESSION_COOKIE,
  assertNoPrivateKeyMaterial,
  fetchVerifiedWorkXUser,
  readXSessionCookieValue,
  resolveWalletPair,
  signingSecret,
  verifyWorkXAccount,
} from "@/src/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/hai/fund",
      method: "POST",
      description:
        "Queue a Hai X Money card top-up from the isolated funding wallet. Requires Slack/Telegram approval before settlement.",
      xAccount: "@wshin84847",
      scopes: ["tweet.read", "users.read"],
      wallets: { bot: "automation only", funding: "card top-up only" },
      body: {
        amountCents: "positive integer",
        currency: "USD",
        fundingWalletId: "Privy funding wallet id",
        xAccessToken: "optional if hai_x_session cookie is present",
        memo: "optional",
      },
    },
    { requestOrigin: request.headers.get("origin") },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin: origin },
    );
  }

  try {
    assertNoPrivateKeyMaterial(body);
    const record = body as Record<string, unknown>;
    const xAccount = await resolveFundXAccount(request, record);
    const wallets = resolveWalletPair();
    const service = createDefaultHaiFundService({
      wallets,
      requestUrl: request.url,
    });

    const result = await service.requestFund({
      amountCents: Number(record.amountCents),
      currency: typeof record.currency === "string" ? record.currency : undefined,
      fundingWalletId:
        typeof record.fundingWalletId === "string"
          ? record.fundingWalletId
          : wallets.funding.id,
      xAccount,
      memo: typeof record.memo === "string" ? record.memo : undefined,
    });

    return jsonWithCors(
      {
        ok: true,
        approvalRequired: true,
        request: publicFundView(result.request),
        notified: result.notified,
        ...(result.approvalToken
          ? { approvalToken: result.approvalToken, rejectToken: result.rejectToken }
          : {}),
      },
      { status: 202, requestOrigin: origin },
    );
  } catch (error) {
    return fundErrorResponse(error, origin);
  }
}

async function resolveFundXAccount(
  request: NextRequest,
  record: Record<string, unknown>,
) {
  const accessToken =
    typeof record.xAccessToken === "string" ? record.xAccessToken.trim() : "";
  if (accessToken) {
    return fetchVerifiedWorkXUser({ accessToken });
  }

  const cookie = request.cookies.get(X_SESSION_COOKIE)?.value;
  if (cookie) {
    return readXSessionCookieValue(signingSecret(), cookie);
  }

  if (record.xAccount && typeof record.xAccount === "object") {
    return verifyWorkXAccount(record.xAccount as { id?: string; username?: string; name?: string });
  }

  throw new XOAuthError(
    "Link @wshin84847 first (/api/hai/x/login) or pass xAccessToken",
    "X_SESSION_MISSING",
  );
}
