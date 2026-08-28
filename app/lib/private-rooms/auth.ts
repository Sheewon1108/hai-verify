// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { base64ToBytes, bytesToBase64, randomBytes } from "./bytes";
import { isPrivateLoopback } from "./request";
import { hashPassphrase, verifyPassphrase } from "./crypto";
import { VAULT_PBKDF2_ITERATIONS } from "./types";
import { emptyVault, loadVault, resolvePersistMode, saveVault, vaultIsConfigured } from "./store";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  type PersistMode,
  type PrivateSeat,
  type VaultFile,
} from "./types";

const attempts = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown"
  );
}

export function allowLoginAttempt(key: string, now = Date.now()): boolean {
  const current = attempts.get(key);
  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (current.count >= LOGIN_MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

export function resetLoginAttempts(key: string): void {
  attempts.delete(key);
}

export function resetLoginAttemptsForTests(): void {
  attempts.clear();
}

function hashIterations(): number {
  const raw = process.env.PRIVATE_ROOMS_PBKDF2_ITERS;
  if (!raw) return VAULT_PBKDF2_ITERATIONS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : VAULT_PBKDF2_ITERATIONS;
}

export function setupAllowed(request: Request): boolean {
  if (process.env.PRIVATE_ROOMS_ALLOW_SETUP === "true") return true;
  return isPrivateLoopback(request);
}

export async function getVaultStatus(): Promise<{
  configured: boolean;
  persistMode: PersistMode;
  hasPartnerKey: boolean;
  vaultSalt: string | null;
  sessionSecret: string;
}> {
  const vault = await loadVault();
  return {
    configured: vaultIsConfigured(vault),
    persistMode: await resolvePersistMode(),
    hasPartnerKey: Boolean(vault.partnerPassHash && vault.partnerPassSalt),
    vaultSalt: vaultIsConfigured(vault) ? vault.vaultSalt : null,
    sessionSecret: vault.sessionSecret || envSessionSecret() || "",
  };
}

function envSessionSecret(): string | undefined {
  return process.env.PRIVATE_ROOMS_SESSION_SECRET?.trim() || undefined;
}

export function sessionSecretFrom(vault: VaultFile): string {
  return envSessionSecret() || vault.sessionSecret;
}

export async function setupVault(input: {
  passphrase: string;
  partnerPassphrase?: string;
}): Promise<VaultFile> {
  const passphrase = input.passphrase.trim();
  if (passphrase.length < 8) {
    throw new Error("PASS_TOO_SHORT");
  }

  const vault = emptyVault();
  const passSalt = randomBytes(16);
  vault.passSalt = bytesToBase64(passSalt);
  vault.passHash = bytesToBase64(await hashPassphrase(passphrase, passSalt, hashIterations()));
  vault.vaultSalt = bytesToBase64(randomBytes(16));
  vault.sessionSecret = envSessionSecret() || bytesToBase64(randomBytes(32));

  const partner = input.partnerPassphrase?.trim();
  if (partner) {
    if (partner.length < 8) throw new Error("PASS_TOO_SHORT");
    const partnerSalt = randomBytes(16);
    vault.partnerPassSalt = bytesToBase64(partnerSalt);
    vault.partnerPassHash = bytesToBase64(await hashPassphrase(partner, partnerSalt, hashIterations()));
  }

  await saveVault(vault);
  return vault;
}

export async function authenticateSeat(
  passphrase: string,
  requestedSeat: PrivateSeat,
): Promise<{ seat: PrivateSeat; vault: VaultFile } | null> {
  const vault = await loadVault();
  if (!vaultIsConfigured(vault)) return null;

  const ownerOk = await verifyPassphrase(
    passphrase,
    base64ToBytes(vault.passSalt),
    base64ToBytes(vault.passHash),
    hashIterations(),
  );

  let partnerOk = false;
  if (vault.partnerPassSalt && vault.partnerPassHash) {
    partnerOk = await verifyPassphrase(
      passphrase,
      base64ToBytes(vault.partnerPassSalt),
      base64ToBytes(vault.partnerPassHash),
      hashIterations(),
    );
  }

  if (!ownerOk && !partnerOk) return null;

  if (partnerOk && !ownerOk) {
    return { seat: "partner", vault };
  }

  return { seat: requestedSeat, vault };
}
