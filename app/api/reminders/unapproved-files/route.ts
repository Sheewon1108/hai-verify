// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import {
  listOpenFiles,
  listUnapprovedImportant,
} from "@/app/lib/open-file-approvals";
import { runUnapprovedFileReminder } from "@/app/lib/unapproved-file-reminder";

export const dynamic = "force-dynamic";

function reminderPayload() {
  const pending = listUnapprovedImportant();
  return {
    openFiles: listOpenFiles().map((file) => ({
      id: file.id,
      path: file.path,
      title: file.title,
      important: file.important,
      approved: file.approved,
    })),
    pendingCount: pending.length,
    pending: pending.map((file) => ({
      id: file.id,
      path: file.path,
      title: file.title,
    })),
  };
}

export async function GET(request: NextRequest) {
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/reminders/unapproved-files",
      method: "POST",
      description: "Hourly Owner reminder — important open files still unapproved",
      ...reminderPayload(),
    },
    { requestOrigin: request.headers.get("origin") },
  );
}

export async function POST(request: NextRequest) {
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const result = await runUnapprovedFileReminder({ dryRun });

  return jsonWithCors(
    {
      ok: result.ok,
      sent: result.sent,
      skipped: result.skipped,
      reason: result.reason,
      error: result.error,
      pendingCount: result.pending.length,
      pending: result.pending.map((file) => ({
        id: file.id,
        path: file.path,
        title: file.title,
      })),
    },
    {
      status: result.ok ? 200 : 503,
      requestOrigin: request.headers.get("origin"),
    },
  );
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
