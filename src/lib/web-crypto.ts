// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/** Web Crypto helpers shared by Privy session cookies and fund-approval tokens. */

export function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

export function randomId(prefix: string, bytes = 16): string {
  return `${prefix}${base64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)))}`;
}

export async function sha256Bytes(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

export async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(new Uint8Array(sig));
}

export async function hmacEqual(secret: string, data: string, signature: string): Promise<boolean> {
  const expected = await hmacSha256(secret, data);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function signJson(secret: string, payload: unknown): Promise<string> {
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSha256(secret, body);
  return `${body}.${sig}`;
}

export async function verifySignedJson<T>(secret: string, token: string): Promise<T> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) throw new Error("INVALID_SIGNED_TOKEN");
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const ok = await hmacEqual(secret, body, sig);
  if (!ok) throw new Error("INVALID_SIGNED_TOKEN");
  return JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as T;
}
