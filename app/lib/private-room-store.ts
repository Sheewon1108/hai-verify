// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import {
  PRIVATE_ROOM_MAX_BLOB_BYTES,
  isSafeLookupId,
  parseEncryptedRoomBlob,
  type EncryptedRoomBlob,
} from "./private-room";

const memoryStore = new Map<string, string>();
const CACHE_NAME = "hai-pair-room-v1";

function cacheRequest(lookupId: string): Request {
  return new Request(`https://pair-room.local/${lookupId}`);
}

async function readFileBlob(lookupId: string): Promise<string | null> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(process.cwd(), ".data", "private-room", `${lookupId}.json`);
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function writeFileBlob(lookupId: string, raw: string): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data", "private-room");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${lookupId}.json`), raw, "utf8");
  } catch {
    // Workers / read-only FS: memory + cache only.
  }
}

async function readCacheBlob(lookupId: string): Promise<string | null> {
  try {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(cacheRequest(lookupId));
    return hit ? await hit.text() : null;
  } catch {
    return null;
  }
}

async function writeCacheBlob(lookupId: string, raw: string): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      cacheRequest(lookupId),
      new Response(raw, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=31536000",
        },
      }),
    );
  } catch {
    // Cache API optional.
  }
}

export async function readEncryptedRoomBlob(
  lookupId: string,
): Promise<EncryptedRoomBlob | null> {
  if (!isSafeLookupId(lookupId)) {
    throw new Error("INVALID_LOOKUP_ID");
  }

  const raw =
    memoryStore.get(lookupId) ??
    (await readCacheBlob(lookupId)) ??
    (await readFileBlob(lookupId));

  if (!raw) return null;
  if (raw.length > PRIVATE_ROOM_MAX_BLOB_BYTES) {
    throw new Error("ROOM_BLOB_TOO_LARGE");
  }

  memoryStore.set(lookupId, raw);
  return parseEncryptedRoomBlob(JSON.parse(raw) as unknown);
}

export async function writeEncryptedRoomBlob(
  lookupId: string,
  blob: EncryptedRoomBlob,
): Promise<void> {
  if (!isSafeLookupId(lookupId)) {
    throw new Error("INVALID_LOOKUP_ID");
  }

  const safe = parseEncryptedRoomBlob(blob);
  const raw = JSON.stringify(safe);
  if (raw.length > PRIVATE_ROOM_MAX_BLOB_BYTES) {
    throw new Error("ROOM_BLOB_TOO_LARGE");
  }

  memoryStore.set(lookupId, raw);
  await writeCacheBlob(lookupId, raw);
  await writeFileBlob(lookupId, raw);
}
