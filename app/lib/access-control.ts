// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { extractBearerToken, validateApiKey } from "@/app/lib/api-keys";

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
  status?: number;
}

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

const BLOCKED_UA_PATTERNS = [
  "ncsoft",
  "nc-security",
  "ncsec",
  "nc_crawler",
  "ncspider",
  "nc bot",
  "shinseunghoon",
  "ssh-crawler",
] as const;

const BLOCKED_REFERER_PATTERNS = [
  "ncsoft.com",
  "nc.com.tw",
  "ncsecurity.co.kr",
  "plaync.com",
] as const;

const PUBLIC_API_ROUTES: ReadonlyArray<{ method: string; path: string }> = [
  { method: "GET", path: "/api/health" },
  { method: "GET", path: "/api/hai-ic/health" },
  { method: "POST", path: "/api/stripe/webhook" },
  // GET documents the endpoint. POST creates a paid session — not public.
  // Unauthenticated external POST /api/stripe/checkout → 401.
  // Same-origin /order and loopback Host still pass the checks below.
  { method: "GET", path: "/api/stripe/checkout" },
];

function isAccessOpen(): boolean {
  return process.env.HAI_ACCESS_MODE === "open";
}

function isLocalBypassEnabled(): boolean {
  return process.env.HAI_ACCESS_LOCAL_BYPASS !== "false";
}

function isPublicApiRoute(method: string, pathname: string): boolean {
  const normalized = method.toUpperCase();
  return PUBLIC_API_ROUTES.some(
    (route) => route.method === normalized && route.path === pathname,
  );
}

function matchesPattern(value: string, patterns: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

function checkNcBlock(input: AccessCheckInput): AccessCheckResult | null {
  const ua = input.userAgent ?? "";
  const referer = input.referer ?? "";

  if (ua && matchesPattern(ua, BLOCKED_UA_PATTERNS)) {
    return {
      blocked: true,
      reason: "BLOCKED_NC_SCRAPER",
      status: 403,
    };
  }

  if (referer && matchesPattern(referer, BLOCKED_REFERER_PATTERNS)) {
    return {
      blocked: true,
      reason: "BLOCKED_NC_SCRAPER",
      status: 403,
    };
  }

  return null;
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

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function requestHost(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  }

  const host = request.headers.get("host");
  if (host) {
    return host.split(":")[0]?.trim().toLowerCase() ?? "";
  }

  return new URL(request.url).hostname.toLowerCase();
}

/**
 * Local dev bypass: direct loopback Host only.
 * - Non-loopback Host (tunnel URL, production domain) → auth required.
 * - localtunnel sets x-localtunnel-agent-ips even when upstream is 127.0.0.1.
 * Do not trust X-Forwarded-For — proxies forward 127.0.0.1 to the app process.
 */
function isLoopbackClient(request: Request): boolean {
  const host = requestHost(request);
  if (!isLoopbackHost(host)) return false;
  if (request.headers.get("x-localtunnel-agent-ips")) return false;
  return true;
}

function isSameOriginBrowserRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin") return true;
  if (fetchSite === "cross-site" || fetchSite === "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).hostname.toLowerCase() === requestHost(request);
  } catch {
    return false;
  }
}

function extractApiKey(request: Request): string | null {
  const bearer = extractBearerToken(request.headers.get("authorization"));
  if (bearer) return bearer;

  const headerKey = request.headers.get("x-hai-api-key")?.trim();
  return headerKey || null;
}

async function hasValidApiKey(request: Request): Promise<boolean> {
  const token = extractApiKey(request);
  if (!token) return false;

  if (token.startsWith("hv_")) {
    const result = await validateApiKey(token);
    return result.valid;
  }

  const internalKey = process.env.HAI_INTERNAL_API_KEY?.trim();
  return Boolean(internalKey && token === internalKey);
}

export function checkAccess(input: AccessCheckInput): AccessCheckResult {
  if (isAccessOpen()) return { blocked: false };

  const ncBlock = checkNcBlock(input);
  if (ncBlock) return ncBlock;

  return { blocked: false };
}

export async function checkRequestHeaders(request: Request): Promise<AccessCheckResult> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const pathname = url.pathname;

  if (method === "OPTIONS") return { blocked: false };

  const base = checkAccess({
    countryCode: getRequestCountryCode(request.headers),
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    content: "",
  });
  if (base.blocked) return base;

  if (!pathname.startsWith("/api/")) return { blocked: false };
  if (isPublicApiRoute(method, pathname)) return { blocked: false };
  if (isAccessOpen()) return { blocked: false };

  if (isLocalBypassEnabled() && isLoopbackClient(request)) {
    return { blocked: false };
  }

  if (isSameOriginBrowserRequest(request)) {
    return { blocked: false };
  }

  if (await hasValidApiKey(request)) {
    return { blocked: false };
  }

  return {
    blocked: true,
    reason: "UNAUTHORIZED — Bearer hv_... or X-HAI-API-Key required",
    status: 401,
  };
}