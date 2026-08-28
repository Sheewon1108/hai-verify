// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { hmacSign, timingSafeEqual } from "./crypto.ts";
import { isPrivateRoomSeat, type PrivateRoomSeat, type SessionPayload } from "./types.ts";

export const SESSION_COOKIE = "hv_pr_s";
export const SESSION_TTL_SEC = 12 * 60 * 60;

export async function signSession(
  secret: string,
  seat: PrivateRoomSeat,
  now = Date.now(),
): Promise<string> {
  const payload: SessionPayload = {
    seat,
    iat: now,
    exp: now + SESSION_TTL_SEC * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await hmacSign(secret, body);
  return `${body}.${sig}`;
}

export async function verifySession(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(secret, body);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!isPrivateRoomSeat(payload.seat)) return null;
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (typeof payload.iat !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieOptions(secure: boolean, maxAge = SESSION_TTL_SEC) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure,
    path: "/",
    maxAge,
  };
}
