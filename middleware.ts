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
 * HAI Verify Middleware (Edge)
 *
 * Cloudflare/OpenNext requires Edge middleware — not Next.js 16 proxy.ts (Node).
 * Flow: AI (1번) → HAI Verification → Human Approval → XGOMA
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const now = new Date().toISOString();
  const isPrivateSurface =
    pathname === "/private"
    || pathname.startsWith("/private/")
    || pathname.startsWith("/api/private-rooms");

  if (isPrivateSurface) {
    const response = request.method === "OPTIONS" && pathname.startsWith("/api/private-rooms")
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  const haiHeaders: Record<string, string> = {
    [HAI_HEADERS.RULESET_ACTIVE]: "1",
    [HAI_HEADERS.RULESET_VERSION]: HAI_RULESET_VERSION,
    [HAI_HEADERS.RULESET_APPLIED_AT]: now,
    [HAI_HEADERS.FLOW_STEP]: HAI_FLOW_STEPS.AI_INPUT,
  };

  if (!pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(haiHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const access = await checkRequestHeaders(request);

  if (access.blocked) {
    return NextResponse.json(
      { ok: false, error: access.reason ?? "Access denied" },
      {
        status: access.status ?? 403,
        headers: corsHeaders(origin),
      },
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
  // Keep static public assets (incl. mp4) out of Edge middleware so
  // Cloudflare Workers ASSETS / OpenNext can serve them directly.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:mp4|webm|mov|avi|mkv|png|jpg|jpeg|gif|svg|ico|webp|txt|xml|json|js|css|map|woff2?)$).*)",
  ],
};