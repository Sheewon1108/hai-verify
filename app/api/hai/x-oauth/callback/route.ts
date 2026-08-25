// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import {
  exchangeXAuthorizationCode,
  getIsolatedWallets,
  verifyWorkXAccount,
  WORK_X_HANDLE,
  X_OAUTH_SCOPES,
} from "@/src/lib/privy";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "hai_x_oauth_state";
const VERIFIER_COOKIE = "hai_x_oauth_verifier";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const expectedState = request.cookies.get(STATE_COOKIE)?.value ?? "";
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value ?? "";

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return jsonWithCors(
      { ok: false, error: "X OAuth state mismatch or missing code", code: "OAUTH_STATE" },
      { status: 401, requestOrigin: origin },
    );
  }

  try {
    const tokens = await exchangeXAuthorizationCode({
      code,
      codeVerifier: verifier,
    });
    const identity = await verifyWorkXAccount(tokens.accessToken);
    const wallets = await getIsolatedWallets();

    return jsonWithCors(
      {
        ok: true,
        x: {
          handle: `@${identity.username}`,
          userId: identity.xUserId,
          scopes: X_OAUTH_SCOPES,
        },
        wallets: {
          bot: {
            walletId: wallets.bot.walletId,
            address: wallets.bot.address,
            role: wallets.bot.role,
          },
          funding: {
            walletId: wallets.funding.walletId,
            address: wallets.funding.address,
            role: wallets.funding.role,
          },
        },
        note: "X access token was used in-memory only and is not stored. Private keys stay in Privy.",
        workAccount: `@${WORK_X_HANDLE}`,
      },
      { requestOrigin: origin },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "X OAuth callback failed";
    return jsonWithCors(
      { ok: false, error: message, code: "OAUTH_CALLBACK" },
      { status: 403, requestOrigin: origin },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
