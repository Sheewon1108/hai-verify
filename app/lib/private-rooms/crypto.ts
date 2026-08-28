// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { base64ToBytes, bytesToBase64, timingSafeEqual, utf8ToBytes } from "./bytes";
import { VAULT_PBKDF2_ITERATIONS } from "./types";

export async function pbkdf2Bits(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = VAULT_PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(passphrase) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = VAULT_PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  return pbkdf2Bits(passphrase, salt, iterations);
}

export async function verifyPassphrase(
  passphrase: string,
  salt: Uint8Array,
  expectedHash: Uint8Array,
  iterations: number = VAULT_PBKDF2_ITERATIONS,
): Promise<boolean> {
  const actual = await hashPassphrase(passphrase, salt, iterations);
  return timingSafeEqual(actual, expectedHash);
}

export async function deriveVaultKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = VAULT_PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const raw = await pbkdf2Bits(passphrase, salt, iterations);
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptText(
  key: CryptoKey,
  plaintext: string,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    utf8ToBytes(plaintext) as BufferSource,
  );
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
  };
}

export async function decryptText(
  key: CryptoKey,
  iv: string,
  ciphertext: string,
): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) as BufferSource },
    key,
    base64ToBytes(ciphertext) as BufferSource,
  );
  return new TextDecoder().decode(plain);
}

export async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8ToBytes(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8ToBytes(data) as BufferSource);
  return new Uint8Array(sig);
}
