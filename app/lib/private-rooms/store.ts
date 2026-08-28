// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { decryptJson, encryptJson } from "./crypto.ts";
import { canUseFileStore, readStoreFile, writeStoreFile } from "./fs-store.ts";
import { storeSecret } from "./secrets.ts";
import {
  emptyPrivateRoomsState,
  isPrivateRoomId,
  type BokbulbokDraw,
  type BokbulbokSlip,
  type PrivateRoomEntry,
  type PrivateRoomId,
  type PrivateRoomsState,
  type PrivateRoomSeat,
  type StoreHealth,
} from "./types.ts";

const STATE_FILE = "rooms.enc";
const MAX_BODY = 32_000;
const MAX_SLIPS = 200;

let memoryState: PrivateRoomsState | null = null;
let fileBackend: boolean | null = null;

export async function storeHealth(): Promise<StoreHealth> {
  if (fileBackend === null) {
    fileBackend = await canUseFileStore();
  }
  return {
    durable: fileBackend,
    backend: fileBackend ? "file" : "memory",
  };
}

async function readState(): Promise<PrivateRoomsState> {
  const secret = await storeSecret();
  const packed = await readStoreFile(STATE_FILE);
  if (packed) {
    try {
      const state = await decryptJson<PrivateRoomsState>(secret, packed);
      if (state?.version === 1) {
        memoryState = state;
        return state;
      }
    } catch {
      // fall through to memory / empty
    }
  }
  if (memoryState) return memoryState;
  memoryState = emptyPrivateRoomsState();
  return memoryState;
}

async function writeState(state: PrivateRoomsState): Promise<StoreHealth> {
  memoryState = state;
  const secret = await storeSecret();
  const packed = await encryptJson(secret, state);
  const saved = await writeStoreFile(STATE_FILE, packed);
  const health = await storeHealth();
  return { ...health, durable: saved && health.durable };
}

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function notesFor(state: PrivateRoomsState, room: PrivateRoomId): PrivateRoomEntry[] {
  return room === "diary" ? state.diary : state.bokbulbokNotes;
}

export async function listEntries(room: PrivateRoomId): Promise<PrivateRoomEntry[]> {
  const state = await readState();
  return [...notesFor(state, room)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function addEntry(
  room: PrivateRoomId,
  body: string,
  authorSeat: PrivateRoomSeat,
): Promise<PrivateRoomEntry> {
  if (!isPrivateRoomId(room)) throw new Error("BAD_ROOM");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("EMPTY");
  if (trimmed.length > MAX_BODY) throw new Error("TOO_LONG");

  const entry: PrivateRoomEntry = {
    id: newId(),
    room,
    body: trimmed,
    authorSeat,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const state = await readState();
  notesFor(state, room).push(entry);
  await writeState(state);
  return entry;
}

export async function updateEntry(
  room: PrivateRoomId,
  id: string,
  body: string,
): Promise<PrivateRoomEntry | null> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("EMPTY");
  if (trimmed.length > MAX_BODY) throw new Error("TOO_LONG");

  const state = await readState();
  const list = notesFor(state, room);
  const entry = list.find((item) => item.id === id);
  if (!entry) return null;
  entry.body = trimmed;
  entry.updatedAt = nowIso();
  await writeState(state);
  return entry;
}

export async function deleteEntry(room: PrivateRoomId, id: string): Promise<boolean> {
  const state = await readState();
  const list = notesFor(state, room);
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return false;
  if (room === "diary") state.diary = next;
  else state.bokbulbokNotes = next;
  await writeState(state);
  return true;
}

export async function listSlips(): Promise<BokbulbokSlip[]> {
  const state = await readState();
  return [...state.slips].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addSlip(text: string, authorSeat: PrivateRoomSeat): Promise<BokbulbokSlip> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("EMPTY");
  if (trimmed.length > MAX_BODY) throw new Error("TOO_LONG");

  const state = await readState();
  if (state.slips.length >= MAX_SLIPS) throw new Error("TOO_MANY");

  const slip: BokbulbokSlip = {
    id: newId(),
    text: trimmed,
    authorSeat,
    createdAt: nowIso(),
  };
  state.slips.push(slip);
  await writeState(state);
  return slip;
}

export async function deleteSlip(id: string): Promise<boolean> {
  const state = await readState();
  const next = state.slips.filter((item) => item.id !== id);
  if (next.length === state.slips.length) return false;
  state.slips = next;
  await writeState(state);
  return true;
}

export async function listDraws(): Promise<BokbulbokDraw[]> {
  const state = await readState();
  return [...state.draws].sort((a, b) => b.drawnAt.localeCompare(a.drawnAt));
}

export async function drawSlip(
  authorSeat: PrivateRoomSeat,
  pickIndex: (size: number) => number,
): Promise<BokbulbokDraw> {
  const state = await readState();
  if (state.slips.length === 0) throw new Error("NO_SLIPS");
  const slip = state.slips[pickIndex(state.slips.length)];
  const draw: BokbulbokDraw = {
    id: newId(),
    slipId: slip.id,
    text: slip.text,
    authorSeat,
    drawnAt: nowIso(),
  };
  state.draws.unshift(draw);
  state.draws = state.draws.slice(0, 50);
  await writeState(state);
  return draw;
}

export async function replaceState(state: PrivateRoomsState): Promise<void> {
  await writeState(state);
}
