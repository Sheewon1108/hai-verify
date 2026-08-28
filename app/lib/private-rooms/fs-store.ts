// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import path from "node:path";

export function privateRoomsDir(): string {
  const override = process.env.PRIVATE_ROOMS_DIR?.trim();
  if (override) return override;
  return path.join(process.cwd(), "data", "private-rooms");
}

export async function readStoreFile(name: string): Promise<string | null> {
  try {
    const fs = await import("node:fs/promises");
    return await fs.readFile(path.join(privateRoomsDir(), name), "utf8");
  } catch {
    return null;
  }
}

export async function writeStoreFile(name: string, contents: string): Promise<boolean> {
  try {
    const fs = await import("node:fs/promises");
    const dir = privateRoomsDir();
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const target = path.join(dir, name);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, contents, { encoding: "utf8", mode: 0o600 });
    await fs.rename(tmp, target);
    return true;
  } catch {
    return false;
  }
}

export async function canUseFileStore(): Promise<boolean> {
  const marker = ".write-check";
  const ok = await writeStoreFile(marker, "ok");
  if (!ok) return false;
  const read = await readStoreFile(marker);
  return read === "ok";
}
