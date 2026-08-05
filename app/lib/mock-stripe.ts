// Copyright 2026 KARAM. Mock Stripe — demo / XGOMA internal test only. No real charges.

export const MOCK_STRIPE_MODE = "test" as const;

export type CheckoutPlanId = "starter" | "trust_pilot";

export const CHECKOUT_PLANS: Record<
  CheckoutPlanId,
  { priceUsd: number; title: string; infrastructure: string; sku: string }
> = {
  starter: {
    priceUsd: 300,
    title: "Starter Audit",
    infrastructure: "HAI Scan Infrastructure",
    sku: "hai_starter_audit",
  },
  trust_pilot: {
    priceUsd: 1500,
    title: "Trust Pilot",
    infrastructure: "OAuth Shield Setup",
    sku: "hai_trust_pilot",
  },
};

export function createMockPaymentIntentId(): string {
  return `pi_mock_${Date.now().toString(36).slice(-8).toUpperCase()}`;
}

export function createMockCheckoutSessionId(): string {
  return `cs_mock_${Date.now().toString(36).slice(-8).toUpperCase()}`;
}

export interface MockCheckoutSuccess {
  ok: true;
  mode: typeof MOCK_STRIPE_MODE;
  orderId: string;
  planId: CheckoutPlanId;
  amountUsd: number;
  currency: "usd";
  email: string;
  paymentIntentId: string;
  checkoutSessionId: string;
  status: "succeeded";
  receiptUrl: string;
  timestamp: string;
}

export interface MockCheckoutError {
  ok: false;
  error: string;
}

export type MockCheckoutResponse = MockCheckoutSuccess | MockCheckoutError;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function processMockCheckout(input: {
  planId: unknown;
  email: unknown;
  orderId: unknown;
}): MockCheckoutResponse {
  const planId = input.planId;
  if (planId !== "starter" && planId !== "trust_pilot") {
    return { ok: false, error: "Field 'planId' must be 'starter' or 'trust_pilot'" };
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Valid 'email' is required" };
  }

  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  if (!orderId) {
    return { ok: false, error: "Field 'orderId' is required" };
  }

  const plan = CHECKOUT_PLANS[planId];
  const paymentIntentId = createMockPaymentIntentId();
  const checkoutSessionId = createMockCheckoutSessionId();

  return {
    ok: true,
    mode: MOCK_STRIPE_MODE,
    orderId,
    planId,
    amountUsd: plan.priceUsd,
    currency: "usd",
    email,
    paymentIntentId,
    checkoutSessionId,
    status: "succeeded",
    receiptUrl: `/payment-success?session_id=${encodeURIComponent(checkoutSessionId)}&plan=${encodeURIComponent(planId)}`,
    timestamp: new Date().toISOString(),
  };
}
