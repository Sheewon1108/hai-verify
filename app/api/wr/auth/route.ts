// Copyright 2026 KARAM. All Rights Reserved.
// WR private rooms — key check only. No entry data is touched here.

import { NextRequest, NextResponse } from "next/server";
import { resolveRole, roomsForRole } from "@/app/lib/wr-room";

export async function POST(request: NextRequest) {
  let key: unknown;
  try {
    const body = (await request.json()) as { key?: unknown };
    key = body.key;
  } catch {
    key = null;
  }

  const role = await resolveRole(typeof key === "string" ? key : null);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: "INVALID_KEY" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, role, rooms: roomsForRole(role) });
}
