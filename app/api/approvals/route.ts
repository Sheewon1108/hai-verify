// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";
import {
  applyApproval,
  pendingImportantFiles,
  shouldSendReminder,
} from "@/app/lib/approval-reminder";
import { loadWatchState, saveWatchState } from "@/app/lib/approval-reminder-store";

export const dynamic = "force-dynamic";

function snapshot(state: Awaited<ReturnType<typeof loadWatchState>>, now = new Date()) {
  const pending = pendingImportantFiles(state.files);
  const reminder = shouldSendReminder({
    pending,
    lastSentAt: state.lastReminderSentAt,
    now,
  });

  return {
    ok: true as const,
    files: state.files,
    pendingImportant: pending,
    reminderDue: reminder.send,
    reminderReason: reminder.reason,
    lastReminderSentAt: state.lastReminderSentAt,
    intervalMinutes: 60,
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const state = await loadWatchState();
    return jsonWithCors(snapshot(state), { requestOrigin: origin });
  } catch (error) {
    console.error("[approvals] load failed:", error);
    return jsonWithCors(
      { ok: false, error: "Failed to load approval watch list" },
      { status: 500, requestOrigin: origin },
    );
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin: origin },
    );
  }

  const record = body as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!id) {
    return jsonWithCors(
      { ok: false, error: "Field 'id' is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  const approved = record.approved !== false;
  const approvedAt = approved ? new Date().toISOString() : null;

  try {
    const current = await loadWatchState();
    const next = await saveWatchState(applyApproval(current, id, approvedAt));
    return jsonWithCors(snapshot(next), { requestOrigin: origin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval update failed";
    const status = message.startsWith("Unknown watched file") ? 404 : 500;
    return jsonWithCors({ ok: false, error: message }, { status, requestOrigin: origin });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
