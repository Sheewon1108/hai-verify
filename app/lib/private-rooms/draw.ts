// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

export function parseDrawLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function drawOne<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("NO_DRAW_OPTIONS");
  }
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return items[buf[0]! % items.length]!;
}
