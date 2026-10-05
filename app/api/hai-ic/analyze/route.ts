import { NextRequest } from "next/server";
import { analyzeIntent, HAI_IC_PRODUCT, HAI_IC_VERSION } from "@/app/lib/hai-ic-analyze";
import { HAI_IC_CONFIDENCE_THRESHOLD } from "@/app/lib/hai-ic-system-prompt";
import { calculateExecutionEconomics, decisionFromConfidence, type ExecutionEconomicsInput } from "@/app/lib/hai-ic-economics";
import { jsonWithCors } from "@/app/lib/cors";

const MAX_INPUT_LENGTH = 8_000;

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      product: HAI_IC_PRODUCT,
      version: HAI_IC_VERSION,
      endpoint: "/api/hai-ic/analyze",
      method: "POST",
      description: "Hai-ic Intent Confidence Analyzer — pre-execution intent scoring and ROI gate",
      threshold: HAI_IC_CONFIDENCE_THRESHOLD,
      body: {
        input: "string (required)",
        execution: {
          model: "string (optional)",
          estimatedInputTokens: "number >= 0",
          estimatedOutputTokens: "number >= 0",
          inputCostPerMillion: "USD per 1M input tokens",
          outputCostPerMillion: "USD per 1M output tokens",
          estimatedToolCostUsd: "optional external tool/API cost",
          estimatedRetries: "optional expected retries",
          haiCostUsd: "measured HAI gate cost",
          gateMode: "shadow | enforce",
        },
      },
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ ok: false, error: "Invalid JSON body" }, { status: 400, requestOrigin: origin });
  }

  const record = body as Record<string, unknown>;
  const raw = record.input ?? record.text ?? record.content;
  const input = typeof raw === "string" ? raw.trim() : "";

  if (!input) {
    return jsonWithCors(
      { ok: false, error: "Field 'input' (or 'text') is required" },
      { status: 400, requestOrigin: origin },
    );
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return jsonWithCors(
      { ok: false, error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
      { status: 413, requestOrigin: origin },
    );
  }

  const result = analyzeIntent(input);
  const decision = decisionFromConfidence(result.confidence, HAI_IC_CONFIDENCE_THRESHOLD);
  const execution =
    record.execution && typeof record.execution === "object"
      ? (record.execution as ExecutionEconomicsInput)
      : undefined;
  const economics = calculateExecutionEconomics(decision, execution);

  return jsonWithCors(
    {
      ok: true,
      ...result,
      decision,
      wouldExecute: decision === "ALLOW",
      economics,
      roiEvent: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        decision,
        confidence: result.confidence,
        downstreamModel: economics.model,
        baselineCostUsd: economics.baselineCostUsd,
        haiCostUsd: economics.haiCostUsd,
        potentialPreventedCostUsd: economics.potentialPreventedCostUsd,
        realizedPreventedCostUsd: economics.realizedPreventedCostUsd,
        netSavingsUsd: economics.netSavingsUsd,
        gateMode: economics.gateMode,
      },
    },
    { requestOrigin: origin },
  );
}
