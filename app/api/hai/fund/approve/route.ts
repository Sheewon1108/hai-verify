// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import { decideHaiCardFund, fundErrorToResponse } from "@/src/api/hai/fund";

export const dynamic = "force-dynamic";

function tokenFromRequest(request: NextRequest, body: unknown): string {
  const queryToken = request.nextUrl.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;
  if (typeof body === "object" && body !== null) {
    const token = (body as Record<string, unknown>).token;
    if (typeof token === "string") return token.trim();
  }
  return "";
}

async function handle(request: NextRequest, body: unknown): Promise<Response> {
  const origin = request.headers.get("origin");
  const token = tokenFromRequest(request, body);
  if (!token) {
    return jsonWithCors(
      { ok: false, error: "token is required", code: "INVALID_TOKEN" },
      { status: 401, requestOrigin: origin },
    );
  }

  try {
    const result = await decideHaiCardFund(token);
    return jsonWithCors(result, { requestOrigin: origin });
  } catch (error) {
    const mapped = fundErrorToResponse(error);
    return jsonWithCors(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status, requestOrigin: origin },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request, null);
}

export async function POST(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  return handle(request, body);
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
