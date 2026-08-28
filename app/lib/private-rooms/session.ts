// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { base64UrlToBytes, bytesToBase64Url, timingSafeEqual, utf8ToBytes } from "./bytes";
import { hmacSha256 } from "./crypto";
import {
  SESSION_TTL_SECONDS,
  type PrivateSeat,
  type SessionPayload,
  isPrivateSeat,
} from "./types";

export async function signSession(
  secret: string,
  seat: PrivateSeat,
  nowMs: number = Date.now(),
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    seat,
    iat: nowMs,
    exp: nowMs + ttlSeconds * 1000,
  };
  const body = bytesToBase64Url(utf8ToBytes(JSON.stringify(payload)));
  const sig = bytesToBase64Url(await hmacSha256(secret, body));
  return `${body}.${sig}`;
}

export async function readSession(
  secret: string,
  token: string | undefined,
  nowMs: number = Date.now(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected: Uint8Array;
  let actual: Uint8Array;
  try {
    expected = await hmacSha256(secret, body);
    actual = base64UrlToBytes(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expected, actual)) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as Partial<SessionPayload>;
    if (!isPrivateSeat(parsed.seat)) return null;
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") return null;
    if (nowMs >= parsed.exp) return null;
    return { seat: parsed.seat, iat: parsed.iat, exp: parsed.exp };
  } catch {
    return null;
  }
}
