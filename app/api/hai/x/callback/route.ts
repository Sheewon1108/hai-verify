// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * GET /api/hai/x/callback
 *
 * Finishes X OAuth 2.0, verifies @wshin84847, then provisions
 * isolated Privy embedded wallets (bot vs funding).
 */

import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import {
  PKCE_COOKIE,
  XOAuthError,
  X_SESSION_COOKIE,
  createLivePrivyPort,
  createXSessionCookieValue,
  exchangeXAuthorizationCode,
  fetchVerifiedWorkXUser,
  provisionIsolatedWallets,
  readXOauthCredentials,
  readXOauthSessionCookieValue,
  resolveWalletPair,
  signingSecret,
} from "@/src/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return jsonWithCors(
      { ok: false, error: oauthError, code: "X_OAUTH_DENIED" },
      { status: 401, requestOrigin: origin },
    );
  }

  if (!code || !state) {
    return jsonWithCors(
      { ok: false, error: "Missing code or state", code: "X_OAUTH" },
      { status: 400, requestOrigin: origin },
    );
  }

  try {
    const secret = signingSecret();
    const pkce = request.cookies.get(PKCE_COOKIE)?.value;
    if (!pkce) {
      throw new XOAuthError("Missing PKCE cookie — restart /api/hai/x/login", "PKCE_MISSING");
    }
    const session = await readXOauthSessionCookieValue(secret, pkce);
    if (session.nonce !== state) {
      throw new XOAuthError("OAuth state mismatch", "STATE_MISMATCH");
    }

    const oauth = readXOauthCredentials();
    const tokens = await exchangeXAuthorizationCode({
      code,
      redirectUri: oauth.redirectUri,
      codeVerifier: session.verifier,
      clientId: oauth.clientId,
      clientSecret: oauth.clientSecret,
    });
    const xUser = await fetchVerifiedWorkXUser({ accessToken: tokens.accessToken });

    let wallets;
    try {
      const port = await createLivePrivyPort();
      wallets = await provisionIsolatedWallets(port, xUser);
    } catch (error) {
      try {
        wallets = resolveWalletPair();
      } catch {
        throw error;
      }
    }

    const response = NextResponse.json({
      ok: true,
      x: { id: xUser.id, username: xUser.username },
      scopes: tokens.scopes,
      wallets: {
        bot: {
          id: wallets.bot.id,
          address: wallets.bot.address,
          role: wallets.bot.role,
        },
        funding: {
          id: wallets.funding.id,
          address: wallets.funding.address,
          role: wallets.funding.role,
        },
      },
      next: "POST /api/hai/fund with fundingWalletId — approval required before settlement",
    });
    response.cookies.set(X_SESSION_COOKIE, await createXSessionCookieValue(secret, xUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
    response.cookies.set(PKCE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "X callback failed";
    const code = error instanceof XOAuthError ? error.code : "X_CALLBACK";
    const status = error instanceof XOAuthError ? 401 : 500;
    return jsonWithCors({ ok: false, error: message, code }, { status, requestOrigin: origin });
  }
}
