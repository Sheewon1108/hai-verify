// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";
import {
  getPendingApprovalsWatch,
  listUnapprovedImportantOpen,
  sendPendingApprovalReminder,
} from "@/app/lib/pending-approval-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const watch = getPendingApprovalsWatch();
  const pending = listUnapprovedImportantOpen(watch.files);

  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/reminders/pending-approvals",
      method: "POST",
      openFileCount: watch.files.filter((file) => file.open).length,
      pendingCount: pending.length,
      shouldEmail: pending.length > 0,
      pending: pending.map((file) => ({
        id: file.id,
        path: file.path,
        title: file.title,
        note: file.note ?? "",
      })),
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let dryRun = false;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    dryRun = body.dryRun === true;
  } catch {
    dryRun = false;
  }

  const result = await sendPendingApprovalReminder({ dryRun });

  if (!result.ok) {
    return jsonWithCors(
      {
        ok: false,
        sent: false,
        error: result.error,
        pendingCount: result.pending.length,
        pending: result.pending.map((file) => ({ id: file.id, path: file.path, title: file.title })),
      },
      { status: 503, requestOrigin: origin },
    );
  }

  if (result.reason === "none_pending") {
    return jsonWithCors(
      { ok: true, sent: false, reason: "none_pending" },
      { requestOrigin: origin },
    );
  }

  const pending = result.pending.map((file) => ({
    id: file.id,
    path: file.path,
    title: file.title,
  }));

  return jsonWithCors(
    {
      ok: true,
      sent: result.sent,
      reason: result.reason,
      to: result.to,
      pendingCount: pending.length,
      pending,
    },
    { requestOrigin: origin },
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}
