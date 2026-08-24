// Copyright 2026 KARAM. All Rights Reserved.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApprovalWatchState, WatchedOpenFile } from "./approval-reminder";

export const DEFAULT_WATCH_STATE: ApprovalWatchState = {
  files: [
    {
      id: "hai-verify-principles",
      path: "docs/hai-verify-principles.md",
      title: "HAI Verify principles",
      important: true,
      approvedAt: null,
    },
    {
      id: "hai-verify-one-pager-ko",
      path: "docs/hai-verify-one-page-summary-ko.md",
      title: "HAI Verify 한 장 요약",
      important: false,
      approvedAt: null,
    },
  ],
  lastReminderSentAt: null,
};

type GlobalWatch = typeof globalThis & {
  __haiApprovalWatch?: ApprovalWatchState;
};

function isWatchedFile(value: unknown): value is WatchedOpenFile {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.path === "string" &&
    typeof record.title === "string" &&
    typeof record.important === "boolean" &&
    (record.approvedAt === null || typeof record.approvedAt === "string")
  );
}

export function parseWatchState(value: unknown): ApprovalWatchState {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid approval watch state");
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.files) || !record.files.every(isWatchedFile)) {
    throw new Error("Invalid approval watch files");
  }
  if (record.lastReminderSentAt !== null && typeof record.lastReminderSentAt !== "string") {
    throw new Error("Invalid lastReminderSentAt");
  }
  return {
    files: record.files.map((file) => ({ ...file })),
    lastReminderSentAt: record.lastReminderSentAt,
  };
}

function seedState(): ApprovalWatchState {
  return parseWatchState(DEFAULT_WATCH_STATE);
}

function memoryState(): ApprovalWatchState | undefined {
  return (globalThis as GlobalWatch).__haiApprovalWatch;
}

function setMemoryState(state: ApprovalWatchState): ApprovalWatchState {
  const next = {
    files: state.files.map((file) => ({ ...file })),
    lastReminderSentAt: state.lastReminderSentAt,
  };
  (globalThis as GlobalWatch).__haiApprovalWatch = next;
  return next;
}

function seedFilePath(): string {
  return path.join(process.cwd(), "data", "open-file-watch.json");
}

function localFilePath(): string {
  return path.join(process.cwd(), "data", "open-file-watch.local.json");
}

export async function loadWatchState(): Promise<ApprovalWatchState> {
  const cached = memoryState();
  if (cached) return cached;

  try {
    const raw = await readFile(localFilePath(), "utf8");
    return setMemoryState(parseWatchState(JSON.parse(raw)));
  } catch {
    // fall through to committed seed
  }

  try {
    const raw = await readFile(seedFilePath(), "utf8");
    return setMemoryState(parseWatchState(JSON.parse(raw)));
  } catch {
    return setMemoryState(seedState());
  }
}

export async function saveWatchState(state: ApprovalWatchState): Promise<ApprovalWatchState> {
  const next = setMemoryState(state);
  try {
    await writeFile(localFilePath(), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  } catch {
    // Cloudflare Workers / read-only FS: memory overlay still applies for this isolate.
  }
  return next;
}
