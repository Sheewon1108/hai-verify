// Copyright 2026 KARAM. Mock Stripe Checkout — no real payment processor connected.

import { NextRequest, NextResponse } from "next/server";
import { processMockCheckout } from "@/app/lib/mock-stripe";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const result = processMockCheckout({
    planId: record.planId,
    email: record.email,
    orderId: record.orderId,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  // Simulate Stripe authorization latency for demo realism.
  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json(result);
}
