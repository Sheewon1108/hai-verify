// Copyright 2026 KARAM. All Rights Reserved.

import { NextRequest } from "next/server";
import { handleFundApprove } from "@/src/api/hai/fund";

export async function GET(request: NextRequest) {
  return handleFundApprove(request);
}

export async function POST(request: NextRequest) {
  return handleFundApprove(request);
}
