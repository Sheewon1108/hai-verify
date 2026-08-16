// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import { TRUSTED_PUBLIC_AI_TOOLS } from "@/app/lib/access-control";
import { readHaiRequestMeta } from "@/app/lib/hai-request-meta";
import { HAI_FLOW_STEPS } from "@/app/lib/hai-ruleset";
import {
  PHONE_AREA_POLICY_EN,
  TIMEZONE_MODEL_POLICY_EN,
  US_TIMEZONE_POLICY_EN,
  USER_CONTEXT_POLICY_EN,
  USER_CONTEXT_RULES,
  areaCodeZoneHint,
  describeContextDecoupling,
  inferenceRuleForModel,
  listMultiTimezoneCountries,
  resolveTimezoneModel,
} from "@/app/lib/user-context-policy";
import { PRODUCT_PITCH_EN, PRODUCT_TIERS } from "@/app/lib/user-context-product";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return jsonWithCors(
    {
      ok: true,
      service: "HAI Verify",
      mode: process.env.HAI_ACCESS_MODE === "open" ? "open" : "protected",
      haiRuleset: readHaiRequestMeta(request, HAI_FLOW_STEPS.AI_INPUT),
      access: {
        auth: "Bearer hv_... or X-HAI-API-Key (external); same-origin browser + loopback Host bypass only",
        trustedAiTools: TRUSTED_PUBLIC_AI_TOOLS,
      },
      userContext: {
        policy: USER_CONTEXT_POLICY_EN,
        usTimezonePolicy: US_TIMEZONE_POLICY_EN,
        phoneAreaPolicy: PHONE_AREA_POLICY_EN,
        timezoneModelPolicy: TIMEZONE_MODEL_POLICY_EN,
        country: process.env.USER_COUNTRY ?? null,
        residence: process.env.USER_REGION ?? null,
        timezone: process.env.USER_TIMEZONE ?? null,
        timezoneModel: resolveTimezoneModel(
          process.env.USER_REGION ?? "",
          process.env.USER_COUNTRY,
        ),
        timezoneInferenceRule: inferenceRuleForModel(
          resolveTimezoneModel(process.env.USER_REGION ?? "", process.env.USER_COUNTRY),
        ),
        displayLocale: process.env.USER_DISPLAY_LOCALE ?? null,
        contactPhone: process.env.USER_CONTACT_PHONE ?? null,
        phoneAreaHint: process.env.USER_CONTACT_PHONE
          ? areaCodeZoneHint(process.env.USER_CONTACT_PHONE)
          : null,
        decouplingNotes: describeContextDecoupling({
          region: process.env.USER_REGION ?? "",
          timezone: process.env.USER_TIMEZONE ?? "",
          country: process.env.USER_COUNTRY,
          contactPhone: process.env.USER_CONTACT_PHONE,
        }),
        rules: USER_CONTEXT_RULES,
        multiTimezoneCountries: listMultiTimezoneCountries(),
        product: {
          pitch: PRODUCT_PITCH_EN,
          free: PRODUCT_TIERS.free,
          paid: PRODUCT_TIERS.paid,
        },
      },
      endpoints: {
        verify: {
          method: "POST",
          path: "/api/verify",
          body: { content: "string", locale: "ko | en (optional)" },
        },
        checkout: {
          method: "POST",
          path: "/api/checkout",
          body: { planId: "starter | trust_pilot", email: "string", orderId: "string" },
        },
        stripeCheckout: {
          method: "POST",
          path: "/api/stripe/checkout",
          body: { plan: "starter | pro", email: "string" },
          note: "Real Stripe — returns checkoutUrl",
        },
        xgomaSearch: {
          method: "POST",
          path: "/api/xgoma/search",
          body: { query: "string", results: "SearchResult[]", locale: "ko | en (optional)" },
        },
        health: { method: "GET", path: "/api/health" },
      },
      pages: {
        order: "/order",
        verify: "/verify",
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
