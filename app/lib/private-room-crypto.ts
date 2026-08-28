// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import {
  PRIVATE_ROOM_MIN_KEY_LENGTH,
  PRIVATE_ROOM_PROTOCOL,
  assertDiaryPayload,
  emptyDiaryPayload,
  parseEncryptedRoomBlob,
  type DiaryPayload,
  type EncryptedRoomBlob,
} from "./private-room.ts";

const TEXT = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** Public domain separator only — not a secret. Same key on any device → same locker. */
const APP_SALT = TEXT.encode("hai-verify/pair-5050/v1");

export interface UnlockedRoom {
  lookupId: string;
  key: CryptoKey;
}

function subtle(): SubtleCrypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("WEB_CRYPTO_UNAVAILABLE");
  }
  return cryptoApi.subtle;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function unlockRoomKey(passphrase: string): Promise<UnlockedRoom> {
  const trimmed = passphrase.normalize("NFKC").trim();
  if (trimmed.length < PRIVATE_ROOM_MIN_KEY_LENGTH) {
    throw new Error("ROOM_KEY_TOO_SHORT");
  }

  const material = await subtle().importKey(
    "raw",
    TEXT.encode(trimmed),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = new Uint8Array(
    await subtle().deriveBits(
      {
        name: "PBKDF2",
        salt: APP_SALT,
        iterations: 80_000,
        hash: "SHA-256",
      },
      material,
      512,
    ),
  );

  const lookupId = bytesToHex(bits.slice(0, 32));
  const key = await subtle().importKey(
    "raw",
    bits.slice(32, 64),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );

  bits.fill(0);
  return { lookupId, key };
}

export async function encryptDiaryPayload(
  key: CryptoKey,
  payload: DiaryPayload,
): Promise<EncryptedRoomBlob> {
  const safe = assertDiaryPayload(payload);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = TEXT.encode(JSON.stringify(safe));
  const cipher = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );

  return {
    v: 1,
    protocol: PRIVATE_ROOM_PROTOCOL,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(cipher),
  };
}

export async function decryptDiaryPayload(
  key: CryptoKey,
  blob: EncryptedRoomBlob,
): Promise<DiaryPayload> {
  const safeBlob = parseEncryptedRoomBlob(blob);
  const iv = base64ToBytes(safeBlob.iv);
  const cipher = base64ToBytes(safeBlob.ct);
  const plain = await subtle().decrypt({ name: "AES-GCM", iv }, key, cipher);
  const parsed = JSON.parse(TEXT_DECODER.decode(plain)) as unknown;
  return assertDiaryPayload(parsed);
}

export async function decryptDiaryPayloadOrEmpty(
  key: CryptoKey,
  blob: EncryptedRoomBlob | null,
): Promise<DiaryPayload> {
  if (!blob) return emptyDiaryPayload();
  return decryptDiaryPayload(key, blob);
}
