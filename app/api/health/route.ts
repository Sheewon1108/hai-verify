// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors, corsHeaders } from "@/app/lib/cors";
import packageJson from "@/package.json";

const PUBLIC_ENDPOINT_PATHS = [
  "/api/health",
  "/api/hai-ic/health",
  "/api/hai-ic/analyze",
] as const;

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  return jsonWithCors(
    {
      ok: true,
      service: "HAI Verify",
      version: packageJson.version,
      status: "healthy",
      endpoints: PUBLIC_ENDPOINT_PATHS,
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
