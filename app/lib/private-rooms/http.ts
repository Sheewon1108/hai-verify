// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  "Referrer-Policy": "no-referrer",
  "Access-Control-Allow-Origin": "null",
} as const;

export function privateJson(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...PRIVATE_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export const PRIVATE_ROOM_HEADERS = PRIVATE_HEADERS;
