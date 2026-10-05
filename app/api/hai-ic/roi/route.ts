import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";

type RoiEvent = {
  decision?: "ALLOW" | "CLARIFY" | "BLOCK";
  baselineCostUsd?: number;
  haiCostUsd?: number;
  realizedPreventedCostUsd?: number;
  gateMode?: "shadow" | "enforce";
  humanOverride?: boolean;
};

function n(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
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
  const events = Array.isArray(record.events) ? (record.events as RoiEvent[]) : [];
  if (events.length === 0) {
    return jsonWithCors({ ok: false, error: "Field 'events' must contain at least one ROI event" }, { status: 400, requestOrigin: origin });
  }
  if (events.length > 100_000) {
    return jsonWithCors({ ok: false, error: "Maximum 100000 events per ROI calculation" }, { status: 413, requestOrigin: origin });
  }

  let baselineCostUsd = 0;
  let haiCostUsd = 0;
  let realizedPreventedCostUsd = 0;
  let blocked = 0;
  let clarified = 0;
  let allowed = 0;
  let enforced = 0;
  let humanOverrides = 0;

  for (const event of events) {
    baselineCostUsd += n(event.baselineCostUsd);
    haiCostUsd += n(event.haiCostUsd);
    realizedPreventedCostUsd += n(event.realizedPreventedCostUsd);
    if (event.decision === "BLOCK") blocked += 1;
    else if (event.decision === "CLARIFY") clarified += 1;
    else if (event.decision === "ALLOW") allowed += 1;
    if (event.gateMode === "enforce") enforced += 1;
    if (event.humanOverride === true) humanOverrides += 1;
  }

  const actualCostUsd = Math.max(0, baselineCostUsd - realizedPreventedCostUsd) + haiCostUsd;
  const netSavingsUsd = baselineCostUsd - actualCostUsd;
  const savingsRate = baselineCostUsd > 0 ? (netSavingsUsd / baselineCostUsd) * 100 : 0;
  const executionReductionRate = events.length > 0 ? ((blocked + clarified) / events.length) * 100 : 0;
  const falseBlockRate = blocked > 0 ? (humanOverrides / blocked) * 100 : 0;

  return jsonWithCors(
    {
      ok: true,
      requests: events.length,
      allowed,
      clarified,
      blocked,
      enforced,
      baselineCostUsd: round(baselineCostUsd),
      actualCostUsd: round(actualCostUsd),
      haiCostUsd: round(haiCostUsd),
      realizedPreventedCostUsd: round(realizedPreventedCostUsd),
      netSavingsUsd: round(netSavingsUsd),
      savingsRatePct: round(savingsRate),
      executionReductionRatePct: round(executionReductionRate),
      humanOverrides,
      falseBlockRatePct: round(falseBlockRate),
    },
    { requestOrigin: origin },
  );
}
