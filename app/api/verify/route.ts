// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

import { NextRequest } from "next/server";
import { parseRequestLocale, runVerification } from "@/app/lib/verification";
import { jsonWithCors } from "@/app/lib/cors";
import { readHaiRequestMeta } from "@/app/lib/hai-request-meta";
import { HAI_FLOW_STEPS, HAI_RULESET_VERSION } from "@/app/lib/hai-ruleset";

const MAX_CONTENT_LENGTH = 32_000;

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/verify",
      method: "POST",
      description: "HAI Verify — 75-point Trust Index engine",
      grok: { allowed: true },
      haiRuleset: {
        version: HAI_RULESET_VERSION,
        flowStep: HAI_FLOW_STEPS.HAI_VERIFY,
      },
      body: {
        content: "string (required)",
        locale: "ko | en (optional, default ko)",
      },
      example: {
        content: "Paste AI-generated text here.",
        locale: "ko",
      },
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin: request.headers.get("origin") },
    );
  }
  const record = body as Record<string, unknown>;
  const raw = record.content ?? record.text;
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) {
    return jsonWithCors(
      { ok: false, error: "Field 'content' (or 'text') is required and cannot be empty" },
      { status: 400, requestOrigin: request.headers.get("origin") },
    );
  }

  if (text.length > MAX_CONTENT_LENGTH) {
    return jsonWithCors(
      { ok: false, error: `Text exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
      { status: 413, requestOrigin: request.headers.get("origin") },
    );
  }
  const locale = parseRequestLocale(record.locale, request.headers.get("accept-language"));

  try {
    const result = runVerification(text, locale);

    return jsonWithCors(
      {
        ok: true,
        locale: result.locale,
        trustIndex: result.trustIndex,
        hallucinationRisk: result.hallucinationRisk,
        humanReviewRequired: result.humanReviewRequired,
        riskFlags: result.riskFlags,
        summary: result.summary,
        recommendedNextStep: result.recommendedNextStep,
        haiRuleset: readHaiRequestMeta(request, HAI_FLOW_STEPS.HAI_VERIFY),
      },
      { requestOrigin: request.headers.get("origin") },
    );
  } catch (error) {
    console.error("Error in /api/verify:", error);
    return jsonWithCors(
      { ok: false, error: "Verification processing failed" },
      { status: 500, requestOrigin: request.headers.get("origin") },
    );
  }
}