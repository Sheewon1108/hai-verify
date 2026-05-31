// Copyright 2026 KARAM. All Rights Reserved.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRequestHeaders } from "@/app/lib/access-control";
import { corsHeaders } from "@/app/lib/cors";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
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
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
