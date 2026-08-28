// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { NextResponse } from "next/server";
import { sessionSecret } from "./secrets.ts";
import { SESSION_COOKIE, verifySession } from "./session.ts";
import type { PrivateRoomSeat } from "./types.ts";

export const privateRoomsHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "Referrer-Policy": "no-referrer",
} as const;

export function roomsJson(body: unknown, init: ResponseInit = {}): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...privateRoomsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

export function roomsDenied(status = 401): NextResponse {
  return roomsJson({ ok: false, error: "DENIED" }, { status });
}

export function requestIsSecure(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export async function seatFromRequest(request: Request): Promise<PrivateRoomSeat | null> {
  const token = cookieFromRequest(request, SESSION_COOKIE);
  const payload = await verifySession(await sessionSecret(), token);
  return payload?.seat ?? null;
}

function cookieFromRequest(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  const parts = header.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
