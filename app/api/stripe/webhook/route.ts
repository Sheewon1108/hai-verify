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

async function queueApiKeyDelivery(input: {
  email: string;
  plan: ApiKeyPlan;
  apiKey: string;
  sessionId: string;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.HAI_API_KEY_DELIVERY_FROM?.trim();
  if (!resendApiKey || !from) {
    throw new Error("API key delivery is not configured");
  }

  const subject = "Your HAI Verify API key";
  const text = [
    "HAI Verify API key delivery",
    "",
    `Plan: ${input.plan}`,
    `Session: ${input.sessionId}`,
    "",
    "API key:",
    input.apiKey,
    "",
    "Keep this key secret. Do not share it in chat, screenshots, or public code.",
  ].join("\n");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject,
      text,
    }),
  });

  if (!emailResponse.ok) {
    throw new Error("API key delivery request failed");
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
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
    return NextResponse.json({ ok: false, error: "Webhook verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.metadata?.email ?? session.customer_email ?? "";
    const plan = (session.metadata?.plan ?? "starter") as ApiKeyPlan;

    if (!email) {
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
      return NextResponse.json({ ok: false, error: "Key generation failed" }, { status: 500 });
    }

    try {
      await queueApiKeyDelivery({
        email,
        plan,
        apiKey,
        sessionId: session.id,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "API key delivery queue failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      received: true,
      event: event.type,
      deliveryQueued: true,
    });
  }

  // Acknowledge all other events
  return NextResponse.json({ ok: true, received: true, event: event.type });
}
