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
 *   URL: https://hai-verify.workers.dev/api/stripe/webhook
 *   Events: checkout.session.completed
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateApiKey, type ApiKeyPlan } from "@/app/lib/api-keys";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[webhook] verification failed:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.metadata?.email ?? session.customer_email ?? "";
    const plan = (session.metadata?.plan ?? "starter") as ApiKeyPlan;

    if (!email) {
      console.error("[webhook] no email in session", session.id);
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
    } catch (err) {
      console.error("[webhook] key generation failed:", err);
      return NextResponse.json({ ok: false, error: "Key generation failed" }, { status: 500 });
    }

    // Never log or return the raw API key — deliver via email only.
    console.log(
      `[webhook] HAI API key issued for ${email} (plan: ${plan}) session=${session.id}`,
    );

    // TODO: Send apiKey to email via Resend / SendGrid / SES
    // await sendApiKeyEmail({ email, plan, apiKey });
    void apiKey;

    return NextResponse.json({
      ok: true,
      received: true,
      event: event.type,
      plan,
      email,
      keyDelivered: false,
      delivery: "email_pending",
    });
  }

  // Acknowledge all other events
  return NextResponse.json({ ok: true, received: true, event: event.type });
}
