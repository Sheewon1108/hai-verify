// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";
import {
  gmailReadonlyGrantMissingCode,
  gmailReadonlyStatus,
  pollWatchedGmailRepliesAndNotify,
} from "@/app/lib/gmail-readonly";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const status = gmailReadonlyStatus();
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/outreach/gmail-readonly-poll",
      method: "POST",
      note: "Gmail read-only. Never sends mail from Gmail. Grant missing is a system error, not an empty inbox.",
      ...status,
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

  const result = await pollWatchedGmailRepliesAndNotify({ dryRun });
  if (!result.ok) {
    const missing = result.error === gmailReadonlyGrantMissingCode();
    return jsonWithCors(
      {
        ok: false,
        readonly: true,
        error: result.error,
        systemError: missing,
      },
      { status: 503, requestOrigin: origin },
    );
  }

  return jsonWithCors(result, { requestOrigin: origin });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
