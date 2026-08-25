// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import {
  buildXAuthorizeUrl,
  createPkcePair,
  getXOAuthClient,
  WORK_X_HANDLE,
  X_OAUTH_SCOPES,
} from "@/src/lib/privy";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "hai_x_oauth_state";
const VERIFIER_COOKIE = "hai_x_oauth_verifier";

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/hai/x-oauth",
    maxAge: 10 * 60,
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const client = getXOAuthClient();
    const pkce = await createPkcePair();
    const stateBytes = new Uint8Array(16);
    crypto.getRandomValues(stateBytes);
    const state = btoa(String.fromCharCode(...stateBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const location = buildXAuthorizeUrl({
      clientId: client.clientId,
      redirectUri: client.redirectUri,
      state,
      codeChallenge: pkce.challenge,
    });

    const response = NextResponse.redirect(location);
    response.cookies.set(STATE_COOKIE, state, cookieBase());
    response.cookies.set(VERIFIER_COOKIE, pkce.verifier, cookieBase());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "X OAuth is not configured";
    return jsonWithCors(
      {
        ok: false,
        error: message,
        xAccount: `@${WORK_X_HANDLE}`,
        scopes: X_OAUTH_SCOPES,
      },
      { status: 503, requestOrigin: origin },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
