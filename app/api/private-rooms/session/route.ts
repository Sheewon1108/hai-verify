// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { isPrivateLoopback } from "@/app/lib/private-rooms/request";
import {
  allowLoginAttempt,
  authenticateSeat,
  clientKey,
  getVaultStatus,
  resetLoginAttempts,
  sessionSecretFrom,
  setupAllowed,
  setupVault,
} from "@/app/lib/private-rooms/auth";
import { privateJson } from "@/app/lib/private-rooms/http";
import { readSession, signSession } from "@/app/lib/private-rooms/session";
import { loadVault } from "@/app/lib/private-rooms/store";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  isPrivateSeat,
} from "@/app/lib/private-rooms/types";

export const dynamic = "force-dynamic";

function cookieSecure(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

async function setSessionCookie(request: NextRequest, token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: cookieSecure(request),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function GET(request: NextRequest) {
  const status = await getVaultStatus();
  const vault = await loadVault();
  const secret = sessionSecretFrom(vault);
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = secret ? await readSession(secret, token) : null;

  return privateJson({
    ok: true,
    configured: status.configured,
    persistMode: status.persistMode,
    hasPartnerKey: status.hasPartnerKey,
    allowSetup: setupAllowed(request),
    loopback: isPrivateLoopback(request),
    authenticated: Boolean(session),
    seat: session?.seat ?? null,
    vaultSalt: session ? status.vaultSalt : null,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const action = typeof record.action === "string" ? record.action : "login";
  const passphrase = typeof record.passphrase === "string" ? record.passphrase : "";

  if (action === "setup") {
    if (!setupAllowed(request)) {
      return privateJson({ ok: false, error: "SETUP_LOCKED" }, { status: 403 });
    }
    const status = await getVaultStatus();
    if (status.configured) {
      return privateJson({ ok: false, error: "ALREADY_CONFIGURED" }, { status: 409 });
    }
    try {
      const partner =
        typeof record.partnerPassphrase === "string" ? record.partnerPassphrase : undefined;
      const vault = await setupVault({ passphrase, partnerPassphrase: partner });
      const seat = isPrivateSeat(record.seat) ? record.seat : "owner";
      const token = await signSession(sessionSecretFrom(vault), seat);
      await setSessionCookie(request, token);
      return privateJson({
        ok: true,
        configured: true,
        seat,
        vaultSalt: vault.vaultSalt,
        persistMode: status.persistMode,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SETUP_FAILED";
      return privateJson({ ok: false, error: code }, { status: 400 });
    }
  }

  const key = clientKey(request);
  if (!allowLoginAttempt(key)) {
    return privateJson({ ok: false, error: "RATE_LIMIT" }, { status: 429 });
  }

  const requestedSeat = isPrivateSeat(record.seat) ? record.seat : "owner";
  const result = await authenticateSeat(passphrase, requestedSeat);
  if (!result) {
    return privateJson({ ok: false, error: "DENIED" }, { status: 401 });
  }

  resetLoginAttempts(key);
  const token = await signSession(sessionSecretFrom(result.vault), result.seat);
  await setSessionCookie(request, token);
  return privateJson({
    ok: true,
    configured: true,
    seat: result.seat,
    vaultSalt: result.vault.vaultSalt,
    persistMode: (await getVaultStatus()).persistMode,
  });
}

export async function DELETE() {
  await clearSessionCookie();
  return privateJson({ ok: true });
}
