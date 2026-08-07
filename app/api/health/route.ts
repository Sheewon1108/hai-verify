// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";

/** Public liveness only — no auth hints, env, policy, or endpoint catalog. */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return jsonWithCors(
    {
      ok: true,
      service: "HAI Verify",
      status: "healthy",
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
