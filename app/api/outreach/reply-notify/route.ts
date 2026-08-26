// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";
import { notifyOutreachReply } from "@/app/lib/outreach-reply-notify";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/outreach/reply-notify",
      method: "POST",
      body: { from: "string", subject: "string?", text: "string?", dryRun: "boolean?" },
      note: "Watched outreach replies only. Grok writes a short Korean alert. Auth required.",
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonWithCors({ ok: false, error: "Invalid JSON body" }, { status: 400, requestOrigin: origin });
  }

  const from = typeof body.from === "string" ? body.from : "";
  if (!from.trim()) {
    return jsonWithCors({ ok: false, error: "'from' is required" }, { status: 400, requestOrigin: origin });
  }

  const subject = typeof body.subject === "string" ? body.subject : "";
  const text =
    (typeof body.text === "string" && body.text) ||
    (typeof body.body === "string" && body.body) ||
    "";
  const dryRun = body.dryRun === true;

  const result = await notifyOutreachReply({ from, subject, body: text, dryRun });
  if (!result.ok) {
    return jsonWithCors({ ok: false, error: result.error }, { status: 500, requestOrigin: origin });
  }

  return jsonWithCors(result, { requestOrigin: origin });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
