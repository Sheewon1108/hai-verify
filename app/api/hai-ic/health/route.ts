import { NextRequest } from "next/server";
import { HAI_IC_PRODUCT, HAI_IC_VERSION } from "@/app/lib/hai-ic-analyze";
import { jsonWithCors } from "@/app/lib/cors";
import { readHaiRequestMeta } from "@/app/lib/hai-request-meta";
import { HAI_FLOW_STEPS } from "@/app/lib/hai-ruleset";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      product: HAI_IC_PRODUCT,
      version: HAI_IC_VERSION,
      status: "healthy",
      timestamp: new Date().toISOString(),
      haiRuleset: readHaiRequestMeta(request, HAI_FLOW_STEPS.HAI_VERIFY),
    },
    { requestOrigin: origin },
  );
}