import { NextRequest } from "next/server";
import { corsHeaders, jsonWithCors } from "@/app/lib/cors";

type IntakePayload = {
  name: string;
  email: string;
  company: string;
  goal: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePayload(body: unknown): IntakePayload {
  const record = body as Record<string, unknown>;

  return {
    name: cleanString(record.name),
    email: cleanString(record.email).toLowerCase(),
    company: cleanString(record.company),
    goal: cleanString(record.goal),
  };
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

  const payload = parsePayload(body);

  if (!payload.name) {
    return jsonWithCors(
      { ok: false, error: "Name is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return jsonWithCors(
      { ok: false, error: "Valid email is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  if (!payload.goal) {
    return jsonWithCors(
      { ok: false, error: "Evaluation context is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  return jsonWithCors(
    {
      ok: true,
      intakeId: crypto.randomUUID(),
      tier: "hai_evaluation_300",
      received: {
        name: payload.name,
        email: payload.email,
        company: payload.company,
        goalLength: payload.goal.length,
      },
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
