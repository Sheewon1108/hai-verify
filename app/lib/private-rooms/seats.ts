// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { hashPassphrase, randomBytes, bytesToBase64url, base64urlToBytes, timingSafeEqual } from "./crypto.ts";
import { readStoreFile, writeStoreFile } from "./fs-store.ts";
import { emPassFromEnv, ownerPassFromEnv } from "./secrets.ts";
import {
  isPrivateRoomSeat,
  type PrivateRoomSeat,
  type SeatFile,
  type SeatRecord,
} from "./types.ts";

const SEATS_FILE = "seats.json";
const MIN_PASS_LEN = 10;

const memorySeats: SeatFile = { version: 1, seats: {} };

export function passphraseTooShort(passphrase: string): boolean {
  return passphrase.length < MIN_PASS_LEN;
}

async function dummyHash(): Promise<void> {
  await hashPassphrase("timing-dummy-passphrase", randomBytes(16));
}

async function loadSeatFile(): Promise<SeatFile> {
  const raw = await readStoreFile(SEATS_FILE);
  if (!raw) return memorySeats;
  try {
    const parsed = JSON.parse(raw) as SeatFile;
    if (parsed.version !== 1 || !parsed.seats) return memorySeats;
    Object.assign(memorySeats.seats, parsed.seats);
    return parsed;
  } catch {
    return memorySeats;
  }
}

async function saveSeatFile(file: SeatFile): Promise<boolean> {
  memorySeats.seats = file.seats;
  return writeStoreFile(SEATS_FILE, JSON.stringify(file));
}

export async function configuredSeats(): Promise<PrivateRoomSeat[]> {
  const ready: PrivateRoomSeat[] = [];
  if (ownerPassFromEnv()) ready.push("owner");
  if (emPassFromEnv()) ready.push("em");

  const file = await loadSeatFile();
  if (file.seats.owner && !ready.includes("owner")) ready.push("owner");
  if (file.seats.em && !ready.includes("em")) ready.push("em");
  return ready;
}

export async function needsSetup(): Promise<boolean> {
  const ready = await configuredSeats();
  return ready.length < 2;
}

async function recordFromPassphrase(passphrase: string): Promise<SeatRecord> {
  const salt = randomBytes(16);
  const hash = await hashPassphrase(passphrase, salt);
  return {
    salt: bytesToBase64url(salt),
    hash,
    createdAt: new Date().toISOString(),
  };
}

export async function setupSeats(ownerPass: string, emPass: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (passphraseTooShort(ownerPass) || passphraseTooShort(emPass)) {
    return { ok: false, error: "PASS_TOO_SHORT" };
  }
  if (!(await needsSetup())) {
    return { ok: false, error: "ALREADY_SET" };
  }
  if (ownerPassFromEnv() || emPassFromEnv()) {
    return { ok: false, error: "ENV_LOCKED" };
  }

  const file: SeatFile = {
    version: 1,
    seats: {
      owner: await recordFromPassphrase(ownerPass),
      em: await recordFromPassphrase(emPass),
    },
  };
  const saved = await saveSeatFile(file);
  if (!saved && !memorySeats.seats.owner) {
    return { ok: false, error: "STORE_FAILED" };
  }
  return { ok: true };
}

async function matchRecord(passphrase: string, record: SeatRecord): Promise<boolean> {
  const hash = await hashPassphrase(passphrase, base64urlToBytes(record.salt));
  return timingSafeEqual(hash, record.hash);
}

export async function verifySeatPassphrase(
  seat: unknown,
  passphrase: string,
): Promise<PrivateRoomSeat | null> {
  if (!isPrivateRoomSeat(seat) || typeof passphrase !== "string") {
    await dummyHash();
    return null;
  }

  const envPass = seat === "owner" ? ownerPassFromEnv() : emPassFromEnv();
  if (envPass) {
    const ok = timingSafeEqual(envPass, passphrase);
    if (!ok) await dummyHash();
    return ok ? seat : null;
  }

  const file = await loadSeatFile();
  const record = file.seats[seat];
  if (!record) {
    await dummyHash();
    return null;
  }

  const ok = await matchRecord(passphrase, record);
  return ok ? seat : null;
}
