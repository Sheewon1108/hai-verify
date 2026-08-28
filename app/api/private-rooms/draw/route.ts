// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { unbiasedIndex } from "@/app/lib/private-rooms/crypto";
import { roomsDenied, roomsJson, seatFromRequest } from "@/app/lib/private-rooms/http";
import { addSlip, deleteSlip, drawSlip, listDraws, listSlips, storeHealth } from "@/app/lib/private-rooms/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const seat = await seatFromRequest(request);
  if (!seat) return roomsDenied();

  return roomsJson({
    ok: true,
    seat,
    slips: await listSlips(),
    draws: await listDraws(),
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

  const action = (body as { action?: unknown }).action;

  try {
    if (action === "add") {
      const slip = await addSlip(String((body as { text?: unknown }).text ?? ""), seat);
      return roomsJson({ ok: true, slip });
    }
    if (action === "delete") {
      const removed = await deleteSlip(String((body as { id?: unknown }).id ?? ""));
      if (!removed) return roomsJson({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      return roomsJson({ ok: true });
    }
    if (action === "draw") {
      const draw = await drawSlip(seat, unbiasedIndex);
      return roomsJson({ ok: true, draw });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "WRITE_FAILED";
    return roomsJson({ ok: false, error: code }, { status: 400 });
  }

  return roomsJson({ ok: false, error: "BAD_ACTION" }, { status: 400 });
}
