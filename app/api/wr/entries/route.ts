// Copyright 2026 KARAM. All Rights Reserved.
// WR private rooms API — AGENT-BLIND DATA. Contents live in KV only.

import { NextRequest, NextResponse } from "next/server";
import {
  canAccessRoom,
  createWrEntry,
  deleteWrEntry,
  isWrRoom,
  listWrEntries,
  resolveRole,
  type WrRole,
  type WrRoom,
} from "@/app/lib/wr-room";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ ok: false, error: "NO_ROOM_ACCESS" }, { status: 403 });
}

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

async function authorize(
  request: NextRequest,
  room: string | null,
): Promise<{ role: WrRole; room: WrRoom } | NextResponse> {
  const role = await resolveRole(request.headers.get("x-wr-key"));
  if (!role) return unauthorized();
  if (!room || !isWrRoom(room)) return badRequest("INVALID_ROOM");
  if (!canAccessRoom(role, room)) return forbidden();
  return { role, room };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const auth = await authorize(request, url.searchParams.get("room"));
  if (auth instanceof NextResponse) return auth;

  const entries = await listWrEntries(
    auth.room,
    url.searchParams.get("q") ?? undefined,
  );
  return NextResponse.json({ ok: true, entries });
}

export async function POST(request: NextRequest) {
  let body: { room?: unknown; text?: unknown };
  try {
    body = (await request.json()) as { room?: unknown; text?: unknown };
  } catch {
    return badRequest("INVALID_JSON");
  }

  const auth = await authorize(
    request,
    typeof body.room === "string" ? body.room : null,
  );
  if (auth instanceof NextResponse) return auth;

  if (typeof body.text !== "string" || !body.text.trim()) {
    return badRequest("EMPTY_TEXT");
  }

  try {
    const entry = await createWrEntry(auth.room, auth.role, body.text);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SAVE_FAILED";
    return badRequest(message);
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const auth = await authorize(request, url.searchParams.get("room"));
  if (auth instanceof NextResponse) return auth;

  const id = url.searchParams.get("id");
  if (!id) return badRequest("MISSING_ID");

  const deleted = await deleteWrEntry(auth.room, id);
  return NextResponse.json({ ok: deleted });
}
