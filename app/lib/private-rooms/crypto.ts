// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function bytesToBase64url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64urlToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function deriveAesKey(secret: string, purpose: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${secret}\0${purpose}`),
  );
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJson(secret: string, value: unknown): Promise<string> {
  const key = await deriveAesKey(secret, "private-rooms-store");
  const iv = Uint8Array.from(randomBytes(12));
  const plaintext = encoder.encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `${bytesToBase64url(iv)}.${bytesToBase64url(new Uint8Array(cipher))}`;
}

export async function decryptJson<T>(secret: string, packed: string): Promise<T> {
  const [ivPart, dataPart] = packed.split(".");
  if (!ivPart || !dataPart) {
    throw new Error("STORE_CORRUPT");
  }

  const key = await deriveAesKey(secret, "private-rooms-store");
  const iv = Uint8Array.from(base64urlToBytes(ivPart));
  const data = Uint8Array.from(base64urlToBytes(dataPart));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(decoder.decode(plain)) as T;
}

export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64url(new Uint8Array(sig));
}

export async function hashPassphrase(passphrase: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt),
      iterations: 210_000,
    },
    key,
    256,
  );
  return bytesToBase64url(new Uint8Array(bits));
}

export function unbiasedIndex(size: number): number {
  if (size <= 0) throw new Error("EMPTY");
  const max = 0x100000000;
  const limit = max - (max % size);
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % size;
}
