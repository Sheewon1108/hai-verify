// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";
import {
  buildReminderEmail,
  markReminderSent,
  pendingImportantFiles,
  shouldSendReminder,
} from "@/app/lib/approval-reminder";
import { resolveReminderToEmail, sendApprovalReminderEmail } from "@/app/lib/approval-reminder-email";
import { loadWatchState, saveWatchState } from "@/app/lib/approval-reminder-store";

export const dynamic = "force-dynamic";

function approveUrl(request: NextRequest): string {
  const env = process.env["APPROVAL_REMINDER_URL"]?.trim();
  if (env) return env;
  return new URL("/approvals", request.nextUrl.origin).toString();
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let force = false;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    force = body.force === true;
  } catch {
    force = false;
  }

  try {
    const state = await loadWatchState();
    const pending = pendingImportantFiles(state.files);
    const now = new Date();
    const reminder = shouldSendReminder({
      pending,
      lastSentAt: state.lastReminderSentAt,
      now,
    });

    if (pending.length === 0) {
      return jsonWithCors(
        {
          ok: true,
          sent: false,
          reason: reminder.reason,
          pendingImportant: pending,
          lastReminderSentAt: state.lastReminderSentAt,
        },
        { requestOrigin: origin },
      );
    }

    if (!reminder.send && !force) {
      return jsonWithCors(
        {
          ok: true,
          sent: false,
          reason: reminder.reason,
          pendingImportant: pending,
          lastReminderSentAt: state.lastReminderSentAt,
        },
        { requestOrigin: origin },
      );
    }

    const email = buildReminderEmail({
      pending,
      approveUrl: approveUrl(request),
    });
    const to = resolveReminderToEmail();
    const delivery = await sendApprovalReminderEmail({
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!delivery.ok) {
      return jsonWithCors(
        {
          ok: false,
          sent: false,
          error: delivery.error,
          pendingImportant: pending,
        },
        { status: 502, requestOrigin: origin },
      );
    }

    const next = await saveWatchState(markReminderSent(state, now.toISOString()));
    return jsonWithCors(
      {
        ok: true,
        sent: true,
        reason: force && !reminder.send ? "forced" : reminder.reason,
        pendingImportant: pending,
        lastReminderSentAt: next.lastReminderSentAt,
      },
      { requestOrigin: origin },
    );
  } catch (error) {
    console.error("[approvals/remind] failed:", error);
    return jsonWithCors(
      { ok: false, sent: false, error: "Reminder tick failed" },
      { status: 500, requestOrigin: origin },
    );
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const state = await loadWatchState();
    const pending = pendingImportantFiles(state.files);
    const reminder = shouldSendReminder({
      pending,
      lastSentAt: state.lastReminderSentAt,
      now: new Date(),
    });
    return jsonWithCors(
      {
        ok: true,
        sent: false,
        dryRun: true,
        reason: reminder.reason,
        reminderDue: reminder.send,
        pendingImportant: pending,
        lastReminderSentAt: state.lastReminderSentAt,
      },
      { requestOrigin: origin },
    );
  } catch (error) {
    console.error("[approvals/remind] dry-run failed:", error);
    return jsonWithCors(
      { ok: false, error: "Reminder status failed" },
      { status: 500, requestOrigin: origin },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
