// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * GET /api/hai/x/login
 *
 * Starts X OAuth 2.0 against the Owner's X developer app.
 * Scopes: tweet.read users.read only. No KARAM/external app Authorize.
 */

import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import {
  PKCE_COOKIE,
  XOAuthError,
  buildXAuthorizationUrl,
  codeChallengeS256,
  createXOauthSessionCookieValue,
  generateCodeVerifier,
  readXOauthCredentials,
  signingSecret,
} from "@/src/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const oauth = readXOauthCredentials();
    const secret = signingSecret();
    const verifier = generateCodeVerifier();
    const nonce = generateCodeVerifier();
    const challenge = await codeChallengeS256(verifier);
    const cookieValue = await createXOauthSessionCookieValue(secret, {
      nonce,
      verifier,
      exp: Date.now() + 10 * 60 * 1000,
    });

    const location = buildXAuthorizationUrl({
      clientId: oauth.clientId,
      redirectUri: oauth.redirectUri,
      state: nonce,
      codeChallenge: challenge,
    });

    const response = NextResponse.redirect(location);
    response.cookies.set(PKCE_COOKIE, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    const message = error instanceof XOAuthError ? error.message : "X login is not configured";
    const code = error instanceof XOAuthError ? error.code : "X_OAUTH_NOT_CONFIGURED";
    return jsonWithCors(
      { ok: false, error: message, code },
      { status: 503, requestOrigin: origin },
    );
  }
}
