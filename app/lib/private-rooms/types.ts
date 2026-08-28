// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

export const PRIVATE_ROOM_SEATS = ["owner", "em"] as const;
export type PrivateRoomSeat = (typeof PRIVATE_ROOM_SEATS)[number];

export const PRIVATE_ROOM_IDS = ["diary", "bokbulbok"] as const;
export type PrivateRoomId = (typeof PRIVATE_ROOM_IDS)[number];

export interface PrivateRoomEntry {
  id: string;
  room: PrivateRoomId;
  body: string;
  authorSeat: PrivateRoomSeat;
  createdAt: string;
  updatedAt: string;
}

export interface BokbulbokSlip {
  id: string;
  text: string;
  authorSeat: PrivateRoomSeat;
  createdAt: string;
}

export interface BokbulbokDraw {
  id: string;
  slipId: string;
  text: string;
  authorSeat: PrivateRoomSeat;
  drawnAt: string;
}

export interface PrivateRoomsState {
  version: 1;
  diary: PrivateRoomEntry[];
  bokbulbokNotes: PrivateRoomEntry[];
  slips: BokbulbokSlip[];
  draws: BokbulbokDraw[];
}

export interface SeatRecord {
  salt: string;
  hash: string;
  createdAt: string;
}

export interface SeatFile {
  version: 1;
  seats: Partial<Record<PrivateRoomSeat, SeatRecord>>;
}

export interface SessionPayload {
  seat: PrivateRoomSeat;
  iat: number;
  exp: number;
}

export interface StoreHealth {
  durable: boolean;
  backend: "file" | "memory";
}

export function emptyPrivateRoomsState(): PrivateRoomsState {
  return {
    version: 1,
    diary: [],
    bokbulbokNotes: [],
    slips: [],
    draws: [],
  };
}

export function isPrivateRoomSeat(value: unknown): value is PrivateRoomSeat {
  return value === "owner" || value === "em";
}

export function isPrivateRoomId(value: unknown): value is PrivateRoomId {
  return value === "diary" || value === "bokbulbok";
}
