// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { randomBytes, bytesToBase64url } from "./crypto.ts";
import { readStoreFile, writeStoreFile } from "./fs-store.ts";

const SESSION_FILE = "session.secret";
const STORE_FILE = "store.secret";

function envOrEmpty(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function ownerPassFromEnv(): string {
  return envOrEmpty("PRIVATE_ROOMS_OWNER_PASS");
}

export function emPassFromEnv(): string {
  return envOrEmpty("PRIVATE_ROOMS_EM_PASS");
}

async function persistedSecret(fileName: string, envName: string): Promise<string> {
  const fromEnv = envOrEmpty(envName);
  if (fromEnv) return fromEnv;

  const fallbackApi = envOrEmpty("HAI_API_KEY_SECRET");
  const existing = await readStoreFile(fileName);
  if (existing?.trim()) return existing.trim();

  const generated = fallbackApi || bytesToBase64url(randomBytes(32));
  await writeStoreFile(fileName, generated);
  return generated;
}

export async function sessionSecret(): Promise<string> {
  return persistedSecret(SESSION_FILE, "PRIVATE_ROOMS_SESSION_SECRET");
}

export async function storeSecret(): Promise<string> {
  return persistedSecret(STORE_FILE, "PRIVATE_ROOMS_STORE_SECRET");
}
