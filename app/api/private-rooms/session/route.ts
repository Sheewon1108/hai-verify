// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { PRIVATE_ROOM_TRACE_LIMITS } from "@/app/lib/private-rooms/traces";
import { configuredSeats, needsSetup, setupSeats, verifySeatPassphrase } from "@/app/lib/private-rooms/seats";
import { clientIp, consumeRateLimit, rateLimitKey } from "@/app/lib/private-rooms/rate-limit";
import { sessionSecret } from "@/app/lib/private-rooms/secrets";
import { cookieOptions, SESSION_COOKIE, signSession } from "@/app/lib/private-rooms/session";
import { storeHealth } from "@/app/lib/private-rooms/store";
import {
  requestIsSecure,
  roomsDenied,
  roomsJson,
  seatFromRequest,
} from "@/app/lib/private-rooms/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const seat = await seatFromRequest(request);
  const setup = await needsSetup();
  const health = await storeHealth();
  if (!seat) {
    return roomsJson({
      ok: true,
      authed: false,
      setupRequired: setup,
      seatsReady: await configuredSeats(),
      store: health,
      limits: PRIVATE_ROOM_TRACE_LIMITS,
    });
  }

  return roomsJson({
    ok: true,
    authed: true,
    seat,
    setupRequired: false,
    store: health,
    rooms: ["diary", "bokbulbok"],
    limits: PRIVATE_ROOM_TRACE_LIMITS,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return roomsJson({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const action = (body as { action?: unknown }).action;
  const ip = clientIp(request);

  if (action === "logout") {
    const res = roomsJson({ ok: true, authed: false });
    res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(requestIsSecure(request), 0), maxAge: 0 });
    return res;
  }

  if (action === "setup") {
    if (!consumeRateLimit(rateLimitKey(ip, "setup"))) {
      return roomsJson({ ok: false, error: "SLOW_DOWN" }, { status: 429 });
    }
    const ownerPass = String((body as { ownerPass?: unknown }).ownerPass ?? "");
    const emPass = String((body as { emPass?: unknown }).emPass ?? "");
    const result = await setupSeats(ownerPass, emPass);
    if (!result.ok) {
      return roomsJson({ ok: false, error: result.error }, { status: 400 });
    }
    return roomsJson({ ok: true, setupRequired: false });
  }

  if (action === "login") {
    if (!consumeRateLimit(rateLimitKey(ip, "login"))) {
      return roomsJson({ ok: false, error: "SLOW_DOWN" }, { status: 429 });
    }
    const seat = (body as { seat?: unknown }).seat;
    const passphrase = String((body as { passphrase?: unknown }).passphrase ?? "");
    const okSeat = await verifySeatPassphrase(seat, passphrase);
    if (!okSeat) return roomsDenied();

    const token = await signSession(await sessionSecret(), okSeat);
    const res = roomsJson({
      ok: true,
      authed: true,
      seat: okSeat,
      rooms: ["diary", "bokbulbok"],
      store: await storeHealth(),
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(requestIsSecure(request)));
    return res;
  }

  return roomsJson({ ok: false, error: "BAD_ACTION" }, { status: 400 });
}
