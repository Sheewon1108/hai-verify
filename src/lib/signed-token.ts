// Copyright 2026 KARAM. All Rights Reserved.

/**
 * HMAC-SHA-256 signed tokens (payload + signature).
 * Used for OAuth state and Hai card funding approvals.
 * Never put private keys or OAuth access tokens inside these payloads.
 */

export function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/\//g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return new Uint8Array([...binary].map((ch) => ch.charCodeAt(0)));
}

export function base64urlEncodeJson(value: unknown): string {
  return base64urlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

export function base64urlDecodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64urlDecode(value))) as T;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(new Uint8Array(sig));
}

export async function hmacVerify(secret: string, data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function signPayload(secret: string, payload: unknown): Promise<string> {
  const encoded = base64urlEncodeJson(payload);
  const signature = await hmacSign(secret, encoded);
  return `${encoded}.${signature}`;
}

export async function verifyPayload<T>(secret: string, token: string): Promise<T> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) {
    throw new Error("Malformed signed token");
  }
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const ok = await hmacVerify(secret, encoded, signature);
  if (!ok) {
    throw new Error("Invalid signed token");
  }
  return base64urlDecodeJson<T>(encoded);
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}_${base64urlEncode(bytes)}`;
}
