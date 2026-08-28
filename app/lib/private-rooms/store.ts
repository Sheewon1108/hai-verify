// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import path from "node:path";
import { bytesToBase64, randomBytes } from "./bytes";
import {
  MAX_NOTES_PER_ROOM,
  VAULT_VERSION,
  type EncryptedNote,
  type PersistMode,
  type PrivateRoomId,
  type VaultFile,
} from "./types";

const VAULT_KEY = "vault";

export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

let memoryVault: VaultFile | null = null;
let persistOverride: PersistMode | null = null;
let kvOverride: KvLike | null = null;

export function resetPrivateRoomStoreForTests(): void {
  memoryVault = null;
  persistOverride = null;
  kvOverride = null;
}

export function useMemoryStoreForTests(vault: VaultFile | null = null): void {
  persistOverride = "memory";
  memoryVault = vault;
}

export function useKvStoreForTests(kv: KvLike): void {
  persistOverride = "kv";
  kvOverride = kv;
}

function defaultDataDir(): string {
  return process.env.PRIVATE_ROOMS_DATA_DIR?.trim()
    || path.join(process.cwd(), "data", "private-rooms");
}

export function isCloudflareWorkerRuntime(): boolean {
  const ua = (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent;
  return ua === "Cloudflare-Workers";
}

async function getKvBinding(): Promise<KvLike | null> {
  if (kvOverride) return kvOverride;
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx.env as { PRIVATE_ROOMS?: KvLike };
    return env.PRIVATE_ROOMS ?? null;
  } catch {
    return null;
  }
}

export async function resolvePersistMode(): Promise<PersistMode> {
  if (persistOverride) return persistOverride;
  if (await getKvBinding()) return "kv";
  if (isCloudflareWorkerRuntime()) return "memory";
  return "file";
}

export function emptyVault(): VaultFile {
  return {
    version: VAULT_VERSION,
    passSalt: "",
    passHash: "",
    partnerPassSalt: null,
    partnerPassHash: null,
    vaultSalt: bytesToBase64(randomBytes(16)),
    sessionSecret: bytesToBase64(randomBytes(32)),
    notes: [],
  };
}

export function vaultIsConfigured(vault: VaultFile): boolean {
  return Boolean(vault.passSalt && vault.passHash);
}

async function readFileVault(): Promise<VaultFile | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(path.join(defaultDataDir(), "vault.json"), "utf8");
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed.version !== VAULT_VERSION || !Array.isArray(parsed.notes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeFileVault(vault: VaultFile): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = defaultDataDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "vault.json"), JSON.stringify(vault), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export async function loadVault(): Promise<VaultFile> {
  const mode = await resolvePersistMode();
  if (mode === "memory") {
    if (!memoryVault) memoryVault = emptyVault();
    return structuredClone(memoryVault);
  }
  if (mode === "kv") {
    const kv = await getKvBinding();
    if (!kv) {
      if (!memoryVault) memoryVault = emptyVault();
      return structuredClone(memoryVault);
    }
    const raw = await kv.get(VAULT_KEY);
    if (!raw) return emptyVault();
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed.version !== VAULT_VERSION || !Array.isArray(parsed.notes)) return emptyVault();
    return parsed;
  }
  return (await readFileVault()) ?? emptyVault();
}

export async function saveVault(vault: VaultFile): Promise<PersistMode> {
  const mode = await resolvePersistMode();
  if (mode === "memory") {
    memoryVault = structuredClone(vault);
    return "memory";
  }
  if (mode === "kv") {
    const kv = await getKvBinding();
    if (!kv) {
      memoryVault = structuredClone(vault);
      return "memory";
    }
    await kv.put(VAULT_KEY, JSON.stringify(vault));
    return "kv";
  }
  await writeFileVault(vault);
  return "file";
}

export function notesForRoom(vault: VaultFile, room: PrivateRoomId): EncryptedNote[] {
  return vault.notes
    .filter((note) => note.room === room)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function assertRoomCapacity(vault: VaultFile, room: PrivateRoomId): void {
  if (notesForRoom(vault, room).length >= MAX_NOTES_PER_ROOM) {
    throw new Error("ROOM_FULL");
  }
}

export function upsertNote(vault: VaultFile, note: EncryptedNote): VaultFile {
  const next = { ...vault, notes: [...vault.notes] };
  const index = next.notes.findIndex((item) => item.id === note.id);
  if (index === -1) {
    assertRoomCapacity(next, note.room);
    next.notes.push(note);
  } else {
    const prev = next.notes[index]!;
    next.notes[index] = { ...prev, ...note, createdAt: prev.createdAt };
  }
  return next;
}

export function deleteNote(vault: VaultFile, id: string): VaultFile {
  return { ...vault, notes: vault.notes.filter((note) => note.id !== id) };
}
