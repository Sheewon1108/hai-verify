import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";

type IntakePayload = {
  plan?: string;
  sessionId?: string;
  company?: string;
  name?: string;
  email?: string;
  notes?: string;
};

function createIntakeId(): string {
  return `intake_${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: IntakePayload;
  try {
    body = (await request.json()) as IntakePayload;
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin: origin },
    );
  }

  const company = typeof body.company === "string" ? body.company.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!company || !name || !email) {
    return jsonWithCors(
      {
        ok: false,
        error: "Fields 'company', 'name', and 'email' are required",
      },
      { status: 400, requestOrigin: origin },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonWithCors(
      { ok: false, error: "Valid 'email' is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  return jsonWithCors(
    {
      ok: true,
      intakeId: createIntakeId(),
      receivedAt: new Date().toISOString(),
    },
    { requestOrigin: origin },
  );
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/intake",
      method: "POST",
      body: {
        company: "string",
        name: "string",
        email: "string",
        notes: "string (optional)",
        plan: "string (optional)",
        sessionId: "string (optional)",
      },
    },
    { requestOrigin: origin },
  );
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
