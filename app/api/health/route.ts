// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import { TRUSTED_PUBLIC_AI_TOOLS } from "@/app/lib/access-control";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return jsonWithCors(
    {
      ok: true,
      service: "HAI Verify",
      mode: process.env.HAI_ACCESS_MODE === "open" ? "open" : "protected",
      access: {
        auth: "Bearer hv_... or X-HAI-API-Key (external); same-origin browser + loopback Host bypass only",
        trustedAiTools: TRUSTED_PUBLIC_AI_TOOLS,
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
