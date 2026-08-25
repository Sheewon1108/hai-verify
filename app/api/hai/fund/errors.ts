// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { jsonWithCors } from "@/app/lib/cors";
import { HaiFundError } from "@/src/api/hai/fund";
import { PrivyConfigError, WalletIsolationError, XOAuthError } from "@/src/lib/privy";

export function fundErrorResponse(error: unknown, origin: string | null): Response {
  if (error instanceof HaiFundError) {
    return jsonWithCors(
      { ok: false, error: error.message, code: error.code },
      { status: error.status, requestOrigin: origin },
    );
  }
  if (error instanceof WalletIsolationError) {
    return jsonWithCors(
      { ok: false, error: error.message, code: error.code },
      { status: 403, requestOrigin: origin },
    );
  }
  if (error instanceof XOAuthError || error instanceof PrivyConfigError) {
    const status =
      error.code.includes("NOT_CONFIGURED") || error.code.includes("MISSING") ? 503 : 401;
    return jsonWithCors(
      { ok: false, error: error.message, code: error.code },
      { status, requestOrigin: origin },
    );
  }

  const message = error instanceof Error ? error.message : "Fund request failed";
  return jsonWithCors(
    { ok: false, error: message },
    { status: 500, requestOrigin: origin },
  );
}
