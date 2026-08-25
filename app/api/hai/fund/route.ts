// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import { fundCreateDescribe, handleFundCreate } from "@/src/api/hai/fund";

export async function GET(request: NextRequest) {
  return jsonWithCors(fundCreateDescribe(), {
    requestOrigin: request.headers.get("origin"),
  });
}

export async function POST(request: NextRequest) {
  return handleFundCreate(request);
}
