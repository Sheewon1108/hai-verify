// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * POST /api/stripe/webhook
 *
 * Stripe sends events here after payment.
 * On checkout.session.completed → generate HAI Verify API key and email it.
 *
 * Set webhook endpoint in Stripe Dashboard:
 *   https://dashboard.stripe.com/webhooks
 *   URL: https://hai-ic.com/api/stripe/webhook
 *     (fallback Workers URL if custom domain not wired)
 *   Events: checkout.session.completed
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { deliverApiKeyByEmail } from "@/app/lib/api-key-delivery";
import { generateApiKey, type ApiKeyPlan } from "@/app/lib/api-keys";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] missing webhook secret");
    return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    console.error("[webhook] verification failed");
    return NextResponse.json({ ok: false, error: "Webhook verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.metadata?.email ?? session.customer_email ?? "";
    const plan = (session.metadata?.plan ?? "starter") as ApiKeyPlan;

    if (!email) {
      console.error("[webhook] missing recipient on completed session");
      return NextResponse.json({ ok: false, error: "No email in session" }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = await generateApiKey({
        email,
        plan,
        issuedAt: Math.floor(Date.now() / 1000),
        stripeSessionId: session.id,
      });
    } catch {
      console.error("[webhook] key generation failed");
      return NextResponse.json({ ok: false, error: "Key generation failed" }, { status: 500 });
    }

    // Never log or return the raw API key, email, or session id.
    const delivery = await deliverApiKeyByEmail({
      email,
      plan,
      apiKey,
      sessionId: session.id,
    });

    console.log("[webhook] key_issued", { plan, delivered: delivery.ok });

    return NextResponse.json({
      ok: true,
      received: true,
      event: event.type,
      plan,
      keyDelivered: delivery.ok,
      delivery: delivery.ok ? "email_sent" : "email_failed",
    });
  }

  // Acknowledge all other events
  return NextResponse.json({ ok: true, received: true, event: event.type });
}
