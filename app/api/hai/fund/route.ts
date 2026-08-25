// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import {
  fundErrorToResponse,
  parseFundRequestInput,
  requestHaiCardFund,
} from "@/src/api/hai/fund";
import { WORK_X_HANDLE, X_OAUTH_SCOPES } from "@/src/lib/privy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/hai/fund",
      method: "POST",
      description:
        "Request a Hai X Money card top-up from the isolated funding wallet. Money does not move until Slack/Telegram approval.",
      xAccount: `@${WORK_X_HANDLE}`,
      xScopes: X_OAUTH_SCOPES,
      wallets: {
        bot: "never used by this route",
        funding: "only wallet that can fund the card",
      },
      body: {
        amountCents: "positive integer",
        currency: "USD | USDC",
        memo: "optional string",
        idempotencyKey: "optional string",
      },
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body", code: "INVALID_INPUT" },
      { status: 400, requestOrigin: origin },
    );
  }

  try {
    const input = parseFundRequestInput(body);
    const result = await requestHaiCardFund(input);
    return jsonWithCors(result, { status: 202, requestOrigin: origin });
  } catch (error) {
    const mapped = fundErrorToResponse(error);
    return jsonWithCors(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status, requestOrigin: origin },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
