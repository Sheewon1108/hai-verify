// Copyright 2026 KARAM. All Rights Reserved.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRequestHeaders } from "@/app/lib/access-control";
import { corsHeaders } from "@/app/lib/cors";
import {
  HAI_HEADERS,
  HAI_RULESET_VERSION,
  HAI_FLOW_STEPS,
} from "@/app/lib/hai-ruleset";

/**
 * HAI Verify Middleware
 *
 * Flow: AI (1번) → HAI Verification → Human Approval → XGOMA
 *
 * Injects HAI Verify ruleset headers on EVERY request so that:
 * - All downstream API handlers know the ruleset was applied
 * - XGOMA orchestrator can confirm uncontaminated data ingestion
 * - Human-approval layer has a consistent audit trail
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const now = new Date().toISOString();

  // ── HAI Ruleset stamp (all routes) ──────────────────────────────────────
  const haiHeaders: Record<string, string> = {
    [HAI_HEADERS.RULESET_ACTIVE]: "1",
    [HAI_HEADERS.RULESET_VERSION]: HAI_RULESET_VERSION,
    [HAI_HEADERS.RULESET_APPLIED_AT]: now,
    [HAI_HEADERS.FLOW_STEP]: HAI_FLOW_STEPS.AI_INPUT,
  };

  // ── Non-API pages: pass through with HAI stamp only ─────────────────────
  if (!pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(haiHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // ── API routes: access control + CORS + HAI stamp ───────────────────────
  const access = checkRequestHeaders(request);

  if (access.blocked) {
    return NextResponse.json(
      { ok: false, error: access.reason ?? "Access denied" },
      { status: 403, headers: corsHeaders(origin) },
    );
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(key, value);
  }
  for (const [key, value] of Object.entries(haiHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
