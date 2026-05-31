// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * Access control — FULLY OPEN (MVP)
 *
 * No blocking for any region, org, or tool — including:
 * Grok (x.ai), ChatGPT (OpenAI), Google / Gemini, Cursor, or any other client.
 *
 * checkAccess() always returns allowed. Future WAF rules are deferred.
 */

export interface AccessCheckInput {
  countryCode: string | null;
  userAgent: string | null;
  referer: string | null;
  source?: string;
  useCase?: string;
  content: string;
}

export interface AccessCheckResult {
  blocked: boolean;
  reason?: string;
}

/** Trusted AI tools — documentation only; not used to block others in MVP. */
export const TRUSTED_PUBLIC_AI_TOOLS = [
  "grok",
  "x.ai",
  "openai.com",
  "chatgpt.com",
  "google.com",
  "gemini",
  "deepmind.google",
  "cursor.com",
  "cursor.sh",
] as const;

/** @deprecated Reserved label — not enforced. */
export const ALLOWED_PARTNERS = [
  "openai.com",
  "chatgpt.com",
  "discord.com",
  "google.com",
  "deepmind.google",
  "x.ai",
  "meta.com",
  "cursor.com",
] as const;

/** @deprecated Not enforced — kept for future WAF docs only. */
export const BLOCKED_ORG_KEYWORDS = [] as const;

export function checkAccess(_input: AccessCheckInput): AccessCheckResult {
  return { blocked: false };
}

export function getRequestCountryCode(headers: Headers): string | null {
  return (
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    headers.get("x-geo-country") ??
    null
  );
}

export function checkRequestHeaders(request: Request): AccessCheckResult {
  return checkAccess({
    countryCode: getRequestCountryCode(request.headers),
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    content: "",
  });
}
