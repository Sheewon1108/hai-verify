// Copyright 2026 KARAM. All Rights Reserved.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRequestHeaders } from "@/app/lib/access-control";
import { corsHeaders } from "@/app/lib/cors";
import { HAI_CSRF_COOKIE } from "@/app/lib/security-constants";
import {
  HAI_HEADERS,
  HAI_RULESET_VERSION,
  HAI_FLOW_STEPS,
} from "@/app/lib/hai-ruleset";

/**
 * HAI Verify Middleware (Edge)
 *
 * Cloudflare/OpenNext requires Edge middleware — not Next.js 16 proxy.ts (Node).
 * Flow: AI (1번) → HAI Verification → Human Approval → XGOMA
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const now = new Date().toISOString();

  const haiHeaders: Record<string, string> = {
    [HAI_HEADERS.RULESET_ACTIVE]: "1",
    [HAI_HEADERS.RULESET_VERSION]: HAI_RULESET_VERSION,
    [HAI_HEADERS.RULESET_APPLIED_AT]: now,
    [HAI_HEADERS.FLOW_STEP]: HAI_FLOW_STEPS.AI_INPUT,
  };

  if (!pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    ensureCsrfCookie(request, response);
    for (const [key, value] of Object.entries(haiHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const access = await checkRequestHeaders(request);

  if (access.blocked) {
    const denied = NextResponse.json(
      { ok: false, error: access.reason ?? "Access denied" },
      {
        status: access.status ?? 403,
        headers: corsHeaders(origin),
      },
    );
    applySecurityHeaders(denied);
    for (const [key, value] of Object.entries(haiHeaders)) {
      denied.headers.set(key, value);
    }
    return denied;
  }

  if (request.method === "OPTIONS") {
    const preflight = new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
    applySecurityHeaders(preflight);
    for (const [key, value] of Object.entries(haiHeaders)) {
      preflight.headers.set(key, value);
    }
    return preflight;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);

  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(key, value);
  }
  for (const [key, value] of Object.entries(haiHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
}

function ensureCsrfCookie(request: NextRequest, response: NextResponse): void {
  const existing = request.cookies.get(HAI_CSRF_COOKIE)?.value?.trim();
  const token = existing || crypto.randomUUID().replace(/-/g, "");
  const secure = request.nextUrl.protocol === "https:";
  response.cookies.set({
    name: HAI_CSRF_COOKIE,
    value: token,
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};