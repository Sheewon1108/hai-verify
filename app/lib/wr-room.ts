// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential.
//
// WR private rooms (낙서방 · 복불복) — AGENT-BLIND DATA.
// Entry contents live only in Cloudflare KV (WR_KV), never in git.
// The agent maintains this infrastructure but must never read entry contents.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type WrRoom = "scribble" | "bokbulbok";
export type WrRole = "owner" | "em";

export interface WrEntry {
  id: string;
  room: WrRoom;
  author: WrRole;
  text: string;
  tags: string[];
  createdAt: string;
}

const ROOM_ACCESS: Record<WrRole, readonly WrRoom[]> = {
  owner: ["scribble", "bokbulbok"],
  em: ["bokbulbok"],
};

// Minimal structural KV type — repo does not include @cloudflare/workers-types.
interface WrKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: {
    prefix: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function configuredKey(
  name: "WR_KEY_OWNER" | "WR_KEY_EM",
): Promise<string | null> {
  // Cloudflare env first (worker secrets / .dev.vars), process.env fallback.
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // No CF context (e.g. plain node) — fall through to process.env.
  }
  return process.env[name]?.trim() || null;
}

/** Resolve an access key to a role. Keys come from vault-managed secrets only. */
export async function resolveRole(
  key: string | null | undefined,
): Promise<WrRole | null> {
  const candidate = key?.trim();
  if (!candidate) return null;

  const ownerKey = await configuredKey("WR_KEY_OWNER");
  const emKey = await configuredKey("WR_KEY_EM");

  if (ownerKey && timingSafeEqual(candidate, ownerKey)) return "owner";
  if (emKey && timingSafeEqual(candidate, emKey)) return "em";
  return null;
}

export function roomsForRole(role: WrRole): readonly WrRoom[] {
  return ROOM_ACCESS[role];
}

export function canAccessRoom(role: WrRole, room: WrRoom): boolean {
  return ROOM_ACCESS[role].includes(room);
}

export function isWrRoom(value: string | null): value is WrRoom {
  return value === "scribble" || value === "bokbulbok";
}

/** Extract #태그 hashtags so entries are easy to find later. */
export function extractTags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}

// Inverted-timestamp key prefix so KV lexicographic listing returns newest first.
const MAX_EPOCH_MS = 9_999_999_999_999;

function entryKvKey(room: WrRoom, createdAtMs: number, id: string): string {
  const inverted = String(MAX_EPOCH_MS - createdAtMs).padStart(13, "0");
  return `wr:${room}:${inverted}:${id}`;
}

async function wrKv(): Promise<WrKvNamespace> {
  const { env } = await getCloudflareContext({ async: true });
  const kv = (env as { WR_KV?: WrKvNamespace }).WR_KV;
  if (!kv) {
    throw new Error(
      "WR_KV binding is not configured — add kv_namespaces WR_KV in wrangler.jsonc",
    );
  }
  return kv;
}

const MAX_TEXT_LENGTH = 20_000;

export async function createWrEntry(
  room: WrRoom,
  author: WrRole,
  text: string,
): Promise<WrEntry> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("EMPTY_TEXT");
  if (trimmed.length > MAX_TEXT_LENGTH) throw new Error("TEXT_TOO_LONG");

  const now = Date.now();
  const entry: WrEntry = {
    id: crypto.randomUUID().slice(0, 8),
    room,
    author,
    text: trimmed,
    tags: extractTags(trimmed),
    createdAt: new Date(now).toISOString(),
  };

  const kv = await wrKv();
  await kv.put(entryKvKey(room, now, entry.id), JSON.stringify(entry));
  return entry;
}

const LIST_LIMIT = 300;

export async function listWrEntries(
  room: WrRoom,
  query?: string,
): Promise<WrEntry[]> {
  const kv = await wrKv();
  const listed = await kv.list({ prefix: `wr:${room}:`, limit: LIST_LIMIT });

  const entries: WrEntry[] = [];
  for (const key of listed.keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      entries.push(JSON.parse(raw) as WrEntry);
    } catch {
      // Skip corrupt values instead of failing the whole room.
    }
  }

  const q = query?.trim().toLowerCase();
  if (!q) return entries;

  const tagQuery = q.startsWith("#") ? q.slice(1) : null;
  return entries.filter((entry) => {
    if (tagQuery !== null) {
      return entry.tags.some((tag) => tag.toLowerCase().includes(tagQuery));
    }
    return (
      entry.text.toLowerCase().includes(q) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export async function deleteWrEntry(
  room: WrRoom,
  id: string,
): Promise<boolean> {
  const kv = await wrKv();
  const listed = await kv.list({ prefix: `wr:${room}:`, limit: LIST_LIMIT });
  const match = listed.keys.find((key) => key.name.endsWith(`:${id}`));
  if (!match) return false;
  await kv.delete(match.name);
  return true;
}
