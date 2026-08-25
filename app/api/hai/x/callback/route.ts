// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import {
  X_OAUTH_COOKIE,
  ensureIsolatedWallets,
  finishXOauth,
} from "@/src/lib/privy";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieValue = request.cookies.get(X_OAUTH_COOKIE)?.value;

  if (!code || !state || !cookieValue) {
    return jsonWithCors(
      { ok: false, error: "Missing X OAuth code, state, or PKCE cookie" },
      { status: 400, requestOrigin: origin },
    );
  }

  try {
    const profile = await finishXOauth({ code, state, cookieValue });
    const wallets = await ensureIsolatedWallets({ profile });
    return jsonWithCors(
      {
        ok: true,
        x: { username: profile.username, id: profile.id },
        wallets: {
          bot: { role: wallets.bot.role, address: wallets.bot.address },
          funding: { role: wallets.funding.role, address: wallets.funding.address },
        },
        privateKeysStored: false,
      },
      { requestOrigin: origin },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "X OAuth callback failed";
    return jsonWithCors({ ok: false, error: message }, { status: 400, requestOrigin: origin });
  }
}
