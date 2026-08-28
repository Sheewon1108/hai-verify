// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { roomsDenied, roomsJson, seatFromRequest } from "@/app/lib/private-rooms/http";
import { addEntry, deleteEntry, listEntries, storeHealth, updateEntry } from "@/app/lib/private-rooms/store";
import { isPrivateRoomId } from "@/app/lib/private-rooms/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const seat = await seatFromRequest(request);
  if (!seat) return roomsDenied();

  const room = request.nextUrl.searchParams.get("room");
  if (!isPrivateRoomId(room)) {
    return roomsJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }

  return roomsJson({
    ok: true,
    seat,
    room,
    entries: await listEntries(room),
    store: await storeHealth(),
  });
}

export async function POST(request: NextRequest) {
  const seat = await seatFromRequest(request);
  if (!seat) return roomsDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return roomsJson({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const room = (body as { room?: unknown }).room;
  const text = String((body as { body?: unknown }).body ?? "");
  if (!isPrivateRoomId(room)) {
    return roomsJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }

  try {
    const entry = await addEntry(room, text, seat);
    return roomsJson({ ok: true, entry, store: await storeHealth() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WRITE_FAILED";
    return roomsJson({ ok: false, error: code }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const seat = await seatFromRequest(request);
  if (!seat) return roomsDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return roomsJson({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const room = (body as { room?: unknown }).room;
  const id = String((body as { id?: unknown }).id ?? "");
  const text = String((body as { body?: unknown }).body ?? "");
  if (!isPrivateRoomId(room) || !id) {
    return roomsJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }

  try {
    const entry = await updateEntry(room, id, text);
    if (!entry) return roomsJson({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return roomsJson({ ok: true, entry });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WRITE_FAILED";
    return roomsJson({ ok: false, error: code }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const seat = await seatFromRequest(request);
  if (!seat) return roomsDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return roomsJson({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const room = (body as { room?: unknown }).room;
  const id = String((body as { id?: unknown }).id ?? "");
  if (!isPrivateRoomId(room) || !id) {
    return roomsJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }

  const removed = await deleteEntry(room, id);
  if (!removed) return roomsJson({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return roomsJson({ ok: true });
}
