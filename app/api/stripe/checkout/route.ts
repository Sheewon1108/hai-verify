// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for HAI Verify API key purchase.
 * On payment success, Stripe calls /api/stripe/webhook which issues the API key.
 *
 * Auth (middleware): unauthenticated external POST → 401.
 * Same-origin /order and loopback Host still pass. Webhook stays public.
 *
 * Body: { plan: "starter" | "pro", email: string }
 */

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { jsonWithCors } from "@/app/lib/cors";
import { API_KEY_PLANS, type ApiKeyPlan } from "@/app/lib/api-keys";

const PAID_PLANS: ApiKeyPlan[] = ["starter", "pro"];

/** Stripe price IDs — create these in your Stripe Dashboard and set as env vars. */
const PRICE_IDS: Partial<Record<ApiKeyPlan, string>> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
};

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
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

  const record = body as Record<string, unknown>;
  const plan = record.plan as ApiKeyPlan | undefined;
  const email = typeof record.email === "string" ? record.email.trim() : "";

  if (!plan || !PAID_PLANS.includes(plan)) {
    return jsonWithCors(
      { ok: false, error: `Field 'plan' must be one of: ${PAID_PLANS.join(", ")}` },
      { status: 400, requestOrigin: origin },
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonWithCors(
      { ok: false, error: "Valid 'email' is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return jsonWithCors(
      { ok: false, error: `Stripe price not configured for plan '${plan}'. Set STRIPE_PRICE_${plan.toUpperCase()} env var.` },
      { status: 503, requestOrigin: origin },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Payment system not configured. Set STRIPE_SECRET_KEY." },
      { status: 503, requestOrigin: origin },
    );
  }

  const base = getBaseUrl(request);
  const planInfo = API_KEY_PLANS[plan];

  try {
    // One-time Evaluation Pilot / audit prices (not subscription).
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, email },
      success_url: `${base}/order?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${base}/order?cancelled=1`,
    });

    return jsonWithCors(
      {
        ok: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        plan,
        priceUsd: planInfo.priceUsd,
        callsPerDay: planInfo.callsPerDay,
      },
      { requestOrigin: origin },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return jsonWithCors(
      { ok: false, error: msg },
      { status: 500, requestOrigin: origin },
    );
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/stripe/checkout",
      method: "POST",
      description: "Create Stripe Checkout Session → receive HAI Verify API key on payment success",
      plans: Object.entries(API_KEY_PLANS)
        .filter(([p]) => PAID_PLANS.includes(p as ApiKeyPlan))
        .map(([id, info]) => ({ id, ...info })),
      body: { plan: "starter | pro", email: "string" },
    },
    { requestOrigin: origin },
  );
}
