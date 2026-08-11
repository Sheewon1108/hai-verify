import { NextRequest } from "next/server";
import { HAI_IC_PRODUCT, HAI_IC_VERSION } from "@/hai-ic/src/public";
import { jsonWithCors } from "@/app/lib/cors";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      product: HAI_IC_PRODUCT,
      version: HAI_IC_VERSION,
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    { requestOrigin: origin },
  );
}