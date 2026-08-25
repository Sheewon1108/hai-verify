// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import { startXOauth, xOAuthCookieHeader } from "@/src/lib/privy";

function redirectUri(request: NextRequest): string {
  const configured = process.env.X_OAUTH_REDIRECT_URI?.trim();
  if (configured) return configured;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/hai/x/callback`;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const started = await startXOauth({ redirectUri: redirectUri(request) });
    return jsonWithCors(
      {
        ok: true,
        authorizationUrl: started.authorizationUrl,
        scopes: started.scopes,
        note: "Owner Privy app only. X scopes are tweet.read and users.read.",
      },
      {
        requestOrigin: origin,
        headers: { "Set-Cookie": xOAuthCookieHeader(started.cookieValue) },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "X OAuth start failed";
    return jsonWithCors({ ok: false, error: message }, { status: 503, requestOrigin: origin });
  }
}
