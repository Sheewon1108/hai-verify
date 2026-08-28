// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitKey(ip: string, action: string): string {
  return `${action}:${ip}`;
}

export function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("cf-connecting-ip") || "unknown";
}
