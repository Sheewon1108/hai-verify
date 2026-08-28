// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

export const PRIVATE_ROOMS = ["nakseo", "bokbulbok"] as const;
export type PrivateRoomId = (typeof PRIVATE_ROOMS)[number];

export const PRIVATE_SEATS = ["owner", "partner"] as const;
export type PrivateSeat = (typeof PRIVATE_SEATS)[number];

export const NOTE_KINDS = ["note", "draw"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const VAULT_VERSION = 1;
export const VAULT_PBKDF2_ITERATIONS = 210_000;
export const SESSION_COOKIE_NAME = "hv_pr";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
export const MAX_NOTE_CHARS = 64_000;
export const MAX_NOTES_PER_ROOM = 500;
export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;

export type PersistMode = "file" | "kv" | "memory";

export interface EncryptedNote {
  id: string;
  room: PrivateRoomId;
  seat: PrivateSeat;
  kind: NoteKind;
  createdAt: string;
  updatedAt: string;
  iv: string;
  ciphertext: string;
}

export interface VaultFile {
  version: typeof VAULT_VERSION;
  passSalt: string;
  passHash: string;
  partnerPassSalt: string | null;
  partnerPassHash: string | null;
  vaultSalt: string;
  sessionSecret: string;
  notes: EncryptedNote[];
}

export interface SessionPayload {
  seat: PrivateSeat;
  iat: number;
  exp: number;
}

export function isPrivateRoomId(value: unknown): value is PrivateRoomId {
  return value === "nakseo" || value === "bokbulbok";
}

export function isPrivateSeat(value: unknown): value is PrivateSeat {
  return value === "owner" || value === "partner";
}

export function isNoteKind(value: unknown): value is NoteKind {
  return value === "note" || value === "draw";
}
