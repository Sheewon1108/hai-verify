import { NextRequest } from "next/server";
import { analyzeIntent } from "@/app/lib/hai-ic-analyze";
import { jsonWithCors } from "@/app/lib/cors";

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

  const result = analyzeIntent(input);
  return jsonWithCors({ ok: true, ...result }, { requestOrigin: origin });
}