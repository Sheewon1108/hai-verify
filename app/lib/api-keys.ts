// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * HAI Verify API Key — self-contained HMAC token (no database required).
 *
 * Format: hv_<plan>_<base64url(payload)>.<base64url(hmac-sha256)>
 *
 * The key encodes: email, plan, issuedAt, stripeSessionId.
 * Validation re-derives the HMAC and confirms it matches — no DB lookup needed.
 *
 * Plans and pricing:
 *   dev        — free tier, 100 calls/day
 *   starter    — Evaluation Pilot ($300 one-time)
 *   pro        — OEM ($8,500+/yr)
 *   enterprise — Enterprise ($25,000/yr)
 */

export type ApiKeyPlan = "dev" | "starter" | "pro" | "enterprise";

export interface ApiKeyPayload {
  email: string;
  plan: ApiKeyPlan;
  issuedAt: number;
  stripeSessionId: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  payload?: ApiKeyPayload;
  error?: string;
}

export const API_KEY_PLANS: Record<ApiKeyPlan, { priceUsd: number; callsPerDay: number; label: string }> = {
  dev: { priceUsd: 0, callsPerDay: 100, label: "Dev (Free)" },
  starter: { priceUsd: 300, callsPerDay: 10_000, label: "Evaluation Pilot ($300)" },
  pro: { priceUsd: 8500, callsPerDay: 100_000, label: "OEM ($8,500+/yr)" },
  enterprise: { priceUsd: 25000, callsPerDay: Infinity, label: "Enterprise ($25,000/yr)" },
};

function base64urlEncode(bytes: Uint8Array): string {
  const str = String.fromCharCode(...bytes);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return base64urlEncode(new Uint8Array(sig));
}

async function hmacVerify(secret: string, data: string, sig: string): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  if (expected.length !== sig.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

function getSecret(): string {
  const secret = process.env.HAI_API_KEY_SECRET;
  if (!secret) throw new Error("HAI_API_KEY_SECRET env var is not set");
  return secret;
}

/**
 * Generate a signed HAI API key.
 * Call this after confirming a successful Stripe payment.
 */
export async function generateApiKey(payload: ApiKeyPayload): Promise<string> {
  const secret = getSecret();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(new TextEncoder().encode(payloadJson));
  const sig = await hmacSign(secret, payloadB64);
  return `hv_${payload.plan}_${payloadB64}.${sig}`;
}

/**
 * Validate a HAI API key.
 * Returns the decoded payload if valid, or an error string if not.
 */
export async function validateApiKey(token: string): Promise<ApiKeyValidationResult> {
  if (!token || !token.startsWith("hv_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const parts = token.split("_");
  if (parts.length < 3) return { valid: false, error: "Malformed API key" };

  const combined = parts.slice(2).join("_");
  const dotIdx = combined.lastIndexOf(".");
  if (dotIdx === -1) return { valid: false, error: "Missing signature" };

  const payloadB64 = combined.slice(0, dotIdx);
  const sig = combined.slice(dotIdx + 1);

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return { valid: false, error: "Server configuration error" };
  }

  const ok = await hmacVerify(secret, payloadB64, sig);
  if (!ok) return { valid: false, error: "Invalid signature" };

  try {
    const payloadJson = new TextDecoder().decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as ApiKeyPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Corrupted payload" };
  }
}

/** Extract API key from Authorization header: "Bearer <token>" (hv_* or internal key). */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}
