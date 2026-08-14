/**
 * Private mock payment E2E — loopback/sandbox only.
 * Prints pass/fail. Never prints email, keys, session ids, or URLs.
 */
import { processMockCheckout } from "../app/lib/mock-stripe.ts";

function fail(reason: string): never {
  console.log(`FAIL private_e2e ${reason}`);
  process.exit(1);
}

const happy = processMockCheckout({
  planId: "starter",
  email: "e2e@example.test",
  orderId: "ord_private_e2e",
});

if (!happy.ok) fail("happy_path");
if (happy.mode !== "test") fail("mode");
if (happy.status !== "succeeded") fail("status");
if (happy.amountUsd !== 300) fail("amount");
if (happy.currency !== "usd") fail("currency");
if (happy.planId !== "starter") fail("plan");
if (!String(happy.checkoutSessionId).startsWith("cs_mock_")) fail("session_prefix");
if (!String(happy.paymentIntentId).startsWith("pi_mock_")) fail("pi_prefix");
if (!String(happy.receiptUrl).startsWith("/order?receipt=")) fail("receipt_not_relative");

const badPlan = processMockCheckout({
  planId: "pro",
  email: "e2e@example.test",
  orderId: "ord_private_e2e",
});
if (badPlan.ok) fail("bad_plan_accepted");

const badEmail = processMockCheckout({
  planId: "starter",
  email: "not-an-email",
  orderId: "ord_private_e2e",
});
if (badEmail.ok) fail("bad_email_accepted");

const badOrder = processMockCheckout({
  planId: "starter",
  email: "e2e@example.test",
  orderId: "",
});
if (badOrder.ok) fail("empty_order_accepted");

console.log("PASS private_e2e mock_checkout");
