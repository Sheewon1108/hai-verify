// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

/** 50/50 pair seats only. Agent is not a third writer. */
export const PRIVATE_ROOM_SEATS = ["owner", "partner"] as const;
export type PrivateRoomSeat = (typeof PRIVATE_ROOM_SEATS)[number];

export const PRIVATE_ROOM_KINDS = ["bok", "nakseo"] as const;
export type PrivateRoomKind = (typeof PRIVATE_ROOM_KINDS)[number];

export const PRIVATE_ROOM_PROTOCOL = "hai-pair-5050-v1";
export const PRIVATE_ROOM_MIN_KEY_LENGTH = 10;
export const PRIVATE_ROOM_MAX_BLOB_BYTES = 256 * 1024;
export const PRIVATE_ROOM_LOOKUP_HEX_LENGTH = 64;

export interface DiaryEntry {
  id: string;
  kind: PrivateRoomKind;
  seat: PrivateRoomSeat;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryPayload {
  protocol: typeof PRIVATE_ROOM_PROTOCOL;
  seats: PrivateRoomSeat[];
  entries: DiaryEntry[];
}

export interface EncryptedRoomBlob {
  v: 1;
  protocol: typeof PRIVATE_ROOM_PROTOCOL;
  iv: string;
  ct: string;
}

export function isPrivateRoomSeat(value: string): value is PrivateRoomSeat {
  return (PRIVATE_ROOM_SEATS as readonly string[]).includes(value);
}

export function isPrivateRoomKind(value: string): value is PrivateRoomKind {
  return (PRIVATE_ROOM_KINDS as readonly string[]).includes(value);
}

export function isSafeLookupId(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export function emptyDiaryPayload(): DiaryPayload {
  return {
    protocol: PRIVATE_ROOM_PROTOCOL,
    seats: [...PRIVATE_ROOM_SEATS],
    entries: [],
  };
}

export function assertDiaryPayload(value: unknown): DiaryPayload {
  if (!value || typeof value !== "object") {
    throw new Error("INVALID_DIARY_PAYLOAD");
  }

  const record = value as Partial<DiaryPayload>;
  if (record.protocol !== PRIVATE_ROOM_PROTOCOL) {
    throw new Error("INVALID_DIARY_PROTOCOL");
  }
  if (!Array.isArray(record.entries)) {
    throw new Error("INVALID_DIARY_ENTRIES");
  }

  const entries: DiaryEntry[] = record.entries.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("INVALID_DIARY_ENTRY");
    }
    const row = entry as Partial<DiaryEntry>;
    if (typeof row.id !== "string" || row.id.length < 8 || row.id.length > 80) {
      throw new Error("INVALID_DIARY_ENTRY_ID");
    }
    if (!row.kind || !isPrivateRoomKind(row.kind)) {
      throw new Error("INVALID_DIARY_ENTRY_KIND");
    }
    if (!row.seat || !isPrivateRoomSeat(row.seat)) {
      throw new Error("INVALID_DIARY_ENTRY_SEAT");
    }
    if (typeof row.body !== "string" || row.body.length > 20_000) {
      throw new Error("INVALID_DIARY_ENTRY_BODY");
    }
    if (typeof row.createdAt !== "string" || typeof row.updatedAt !== "string") {
      throw new Error("INVALID_DIARY_ENTRY_TIME");
    }
    return {
      id: row.id,
      kind: row.kind,
      seat: row.seat,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return {
    protocol: PRIVATE_ROOM_PROTOCOL,
    seats: [...PRIVATE_ROOM_SEATS],
    entries,
  };
}

export function mergeDiaryPayloads(...payloads: DiaryPayload[]): DiaryPayload {
  const byId = new Map<string, DiaryEntry>();

  for (const payload of payloads) {
    const safe = assertDiaryPayload(payload);
    for (const entry of safe.entries) {
      const previous = byId.get(entry.id);
      if (!previous || previous.updatedAt < entry.updatedAt) {
        byId.set(entry.id, entry);
      }
    }
  }

  const entries = [...byId.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );

  return {
    protocol: PRIVATE_ROOM_PROTOCOL,
    seats: [...PRIVATE_ROOM_SEATS],
    entries,
  };
}

export function parseEncryptedRoomBlob(value: unknown): EncryptedRoomBlob {
  if (!value || typeof value !== "object") {
    throw new Error("INVALID_ROOM_BLOB");
  }
  const record = value as Partial<EncryptedRoomBlob>;
  if (record.v !== 1 || record.protocol !== PRIVATE_ROOM_PROTOCOL) {
    throw new Error("INVALID_ROOM_BLOB");
  }
  if (typeof record.iv !== "string" || typeof record.ct !== "string") {
    throw new Error("INVALID_ROOM_BLOB");
  }
  if (record.iv.length > 64 || record.ct.length > PRIVATE_ROOM_MAX_BLOB_BYTES) {
    throw new Error("ROOM_BLOB_TOO_LARGE");
  }
  return {
    v: 1,
    protocol: PRIVATE_ROOM_PROTOCOL,
    iv: record.iv,
    ct: record.ct,
  };
}

export function isPrivateRoomRequestAllowed(request: Request): boolean {
  const host = requestHost(request);
  if (isLoopbackHost(host)) {
    return !request.headers.get("x-localtunnel-agent-ips");
  }

  if (request.headers.get("sec-fetch-site") === "same-origin") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function requestHost(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  }

  const host = request.headers.get("host");
  if (host) {
    return host.split(":")[0]?.trim().toLowerCase() ?? "";
  }

  return new URL(request.url).hostname.toLowerCase();
}
