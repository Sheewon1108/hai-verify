// Copyright 2026 KARAM. All Rights Reserved.
// POST /api/intake — receives evaluation intake form submissions.

import { NextRequest, NextResponse } from "next/server";

interface IntakeBody {
  name: string;
  email: string;
  company?: string;
  useCase: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const company = typeof record.company === "string" ? record.company.trim() : "";
  const useCase = typeof record.useCase === "string" ? record.useCase.trim() : "";

  if (!name) {
    return NextResponse.json({ ok: false, error: "Full name is required." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Valid work email is required." }, { status: 400 });
  }
  if (!useCase || useCase.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Please describe your use case (at least 20 characters)." },
      { status: 400 },
    );
  }

  const submission: IntakeBody = { name, email, company, useCase };

  // Log intake server-side (Cloudflare Workers writes to stdout → Workers Logs).
  console.log("[intake]", JSON.stringify({ ...submission, ts: new Date().toISOString() }));

  return NextResponse.json({ ok: true, received: true });
}
