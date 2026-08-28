// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import {
  isPrivateRoomRequestAllowed,
  isSafeLookupId,
  parseEncryptedRoomBlob,
} from "@/app/lib/private-room";
import {
  readEncryptedRoomBlob,
  writeEncryptedRoomBlob,
} from "@/app/lib/private-room-store";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
} as const;

function roomJson(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: NO_STORE,
  });
}

function deny(): Response {
  return roomJson({ ok: false, error: "ROOM_DENIED" }, 403);
}

function lookupFrom(request: NextRequest): string | null {
  const id = request.nextUrl.searchParams.get("id")?.trim().toLowerCase() ?? "";
  return isSafeLookupId(id) ? id : null;
}

export async function GET(request: NextRequest) {
  if (!isPrivateRoomRequestAllowed(request)) return deny();

  const lookupId = lookupFrom(request);
  if (!lookupId) return roomJson({ ok: false, error: "INVALID_LOOKUP_ID" }, 400);

  try {
    const blob = await readEncryptedRoomBlob(lookupId);
    return roomJson({ ok: true, blob });
  } catch {
    return roomJson({ ok: false, error: "ROOM_READ_FAILED" }, 400);
  }
}

export async function PUT(request: NextRequest) {
  if (!isPrivateRoomRequestAllowed(request)) return deny();

  const lookupId = lookupFrom(request);
  if (!lookupId) return roomJson({ ok: false, error: "INVALID_LOOKUP_ID" }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return roomJson({ ok: false, error: "INVALID_JSON" }, 400);
  }

  try {
    const blob = parseEncryptedRoomBlob(
      body && typeof body === "object" && "blob" in body
        ? (body as { blob: unknown }).blob
        : body,
    );
    await writeEncryptedRoomBlob(lookupId, blob);
    return roomJson({ ok: true });
  } catch {
    return roomJson({ ok: false, error: "ROOM_WRITE_FAILED" }, 400);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...NO_STORE,
      Allow: "GET, PUT, OPTIONS",
    },
  });
}
