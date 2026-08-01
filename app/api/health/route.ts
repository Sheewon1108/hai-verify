// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";

const SERVICE_VERSION = "1.0.0";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return jsonWithCors(
    {
      ok: true,
      service: "HAI Verify",
      version: SERVICE_VERSION,
      status: "healthy",
      endpoints: {
        health: "/api/health",
        haiIcHealth: "/api/hai-ic/health",
        haiIcAnalyze: "/api/hai-ic/analyze",
        verify: "/api/verify",
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
