import { NextRequest } from "next/server";
import {
  analyzeIntent,
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
  HAI_IC_CONFIDENCE_THRESHOLD,
} from "@/hai-ic/core";
import { jsonWithCors } from "@/app/lib/cors";

const MAX_INPUT_LENGTH = 8_000;

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      product: HAI_IC_PRODUCT,
      version: HAI_IC_VERSION,
      endpoint: "/api/hai-ic/analyze",
      method: "POST",
      description: "Hai-ic Intent Confidence Analyzer — pre-execution intent scoring",
      threshold: HAI_IC_CONFIDENCE_THRESHOLD,
      body: { input: "string (required)" },
      example: {
        input: "Restart logistics partnership with Woosung Group via Transla by Q3, budget $50k",
      },
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ ok: false, error: "Invalid JSON body" }, { status: 400, requestOrigin: origin });
  }

  const record = body as Record<string, unknown>;
  const raw = record.input ?? record.text ?? record.content;
  const input = typeof raw === "string" ? raw.trim() : "";

  if (!input) {
    return jsonWithCors(
      { ok: false, error: "Field 'input' (or 'text') is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return jsonWithCors(
      { ok: false, error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
      { status: 413, requestOrigin: origin },
    );
  }

  const result = analyzeIntent(input);
  return jsonWithCors({ ok: true, ...result }, { requestOrigin: origin });
}