// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * GET|POST /api/hai/fund/approve
 *
 * Capability URL from Slack/Telegram. HMAC token is the authenticator.
 */

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import {
  createDefaultHaiFundService,
  publicFundView,
  type FundDecision,
} from "@/src/api/hai/fund";
import { fundErrorResponse } from "@/app/api/hai/fund/errors";
import { resolveWalletPair } from "@/src/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return decide(request, request.nextUrl.searchParams.get("token"), request.nextUrl.searchParams.get("action"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let token = request.nextUrl.searchParams.get("token");
  let action = request.nextUrl.searchParams.get("action");

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token === "string") token = body.token;
    if (typeof body.action === "string") action = body.action;
  } catch {
    // Query-string-only POST is allowed for Slack/Telegram buttons.
  }

  return decide(request, token, action, origin);
}

async function decide(
  request: NextRequest,
  token: string | null,
  action: string | null,
  origin = request.headers.get("origin"),
) {
  if (!token) {
    return jsonWithCors(
      { ok: false, error: "Missing approval token", code: "APPROVAL_TOKEN" },
      { status: 400, requestOrigin: origin },
    );
  }

  try {
    const service = createDefaultHaiFundService({
      wallets: resolveWalletPair(),
      requestUrl: request.url,
    });
    const expected =
      action === "approve" || action === "reject" ? (action as FundDecision) : undefined;
    const requestRow = await service.decide(token, expected);
    return jsonWithCors(
      { ok: true, request: publicFundView(requestRow) },
      { requestOrigin: origin },
    );
  } catch (error) {
    return fundErrorResponse(error, origin);
  }
}
