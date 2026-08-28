// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { sessionSecretFrom } from "@/app/lib/private-rooms/auth";
import { privateJson } from "@/app/lib/private-rooms/http";
import { readSession } from "@/app/lib/private-rooms/session";
import { deleteNote, loadVault, notesForRoom, saveVault, upsertNote } from "@/app/lib/private-rooms/store";
import {
  MAX_NOTE_CHARS,
  SESSION_COOKIE_NAME,
  isNoteKind,
  isPrivateRoomId,
} from "@/app/lib/private-rooms/types";

export const dynamic = "force-dynamic";

async function requireSeat() {
  const vault = await loadVault();
  const secret = sessionSecretFrom(vault);
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await readSession(secret, token);
  if (!session) return { vault: null, seat: null as null };
  return { vault, seat: session.seat };
}

function looksEncryptedField(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_NOTE_CHARS * 2;
}

export async function GET(request: NextRequest) {
  const auth = await requireSeat();
  if (!auth.seat || !auth.vault) {
    return privateJson({ ok: false, error: "DENIED" }, { status: 401 });
  }

  const room = request.nextUrl.searchParams.get("room");
  if (!isPrivateRoomId(room)) {
    return privateJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }

  return privateJson({
    ok: true,
    room,
    seat: auth.seat,
    notes: notesForRoom(auth.vault, room),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSeat();
  if (!auth.seat || !auth.vault) {
    return privateJson({ ok: false, error: "DENIED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (!isPrivateRoomId(record.room)) {
    return privateJson({ ok: false, error: "BAD_ROOM" }, { status: 400 });
  }
  if (!looksEncryptedField(record.iv) || !looksEncryptedField(record.ciphertext)) {
    return privateJson({ ok: false, error: "BAD_NOTE" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = typeof record.id === "string" && record.id.length > 8 ? record.id : crypto.randomUUID();
  const kind = isNoteKind(record.kind) ? record.kind : "note";

  try {
    const next = upsertNote(auth.vault, {
      id,
      room: record.room,
      seat: auth.seat,
      kind,
      createdAt: now,
      updatedAt: now,
      iv: record.iv,
      ciphertext: record.ciphertext,
    });
    await saveVault(next);
    const saved = next.notes.find((note) => note.id === id);
    return privateJson({ ok: true, note: saved });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SAVE_FAILED";
    return privateJson({ ok: false, error: code }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSeat();
  if (!auth.seat || !auth.vault) {
    return privateJson({ ok: false, error: "DENIED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : "";
  const existing = auth.vault.notes.find((note) => note.id === id);
  if (!existing) {
    return privateJson({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  if (!looksEncryptedField(record.iv) || !looksEncryptedField(record.ciphertext)) {
    return privateJson({ ok: false, error: "BAD_NOTE" }, { status: 400 });
  }

  const next = upsertNote(auth.vault, {
    ...existing,
    iv: record.iv,
    ciphertext: record.ciphertext,
    updatedAt: new Date().toISOString(),
  });
  await saveVault(next);
  return privateJson({ ok: true, note: next.notes.find((note) => note.id === id) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSeat();
  if (!auth.seat || !auth.vault) {
    return privateJson({ ok: false, error: "DENIED" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    return privateJson({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const next = deleteNote(auth.vault, id);
  await saveVault(next);
  return privateJson({ ok: true });
}
