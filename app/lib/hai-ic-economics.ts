export type HaiIcDecision = "ALLOW" | "CLARIFY" | "BLOCK";
export type HaiIcGateMode = "shadow" | "enforce";

export interface ExecutionEconomicsInput {
  model?: string;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  estimatedToolCostUsd?: number;
  estimatedRetries?: number;
  haiCostUsd?: number;
  gateMode?: HaiIcGateMode;
}

export interface HaiIcEconomicsResult {
  model: string | null;
  gateMode: HaiIcGateMode;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedRetries: number;
  baseExecutionCostUsd: number;
  baselineCostUsd: number;
  haiCostUsd: number;
  potentialPreventedCostUsd: number;
  realizedPreventedCostUsd: number;
  netSavingsUsd: number;
}

function finiteNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function decisionFromConfidence(confidence: number, threshold: number): HaiIcDecision {
  if (confidence >= threshold) return "ALLOW";
  if (confidence >= 55) return "CLARIFY";
  return "BLOCK";
}

export function calculateExecutionEconomics(
  decision: HaiIcDecision,
  execution?: ExecutionEconomicsInput,
): HaiIcEconomicsResult {
  const estimatedInputTokens = finiteNonNegative(execution?.estimatedInputTokens);
  const estimatedOutputTokens = finiteNonNegative(execution?.estimatedOutputTokens);
  const inputCostPerMillion = finiteNonNegative(execution?.inputCostPerMillion);
  const outputCostPerMillion = finiteNonNegative(execution?.outputCostPerMillion);
  const estimatedToolCostUsd = finiteNonNegative(execution?.estimatedToolCostUsd);
  const estimatedRetries = Math.floor(finiteNonNegative(execution?.estimatedRetries));
  const haiCostUsd = finiteNonNegative(execution?.haiCostUsd);
  const gateMode: HaiIcGateMode = execution?.gateMode === "enforce" ? "enforce" : "shadow";

  const tokenCost =
    (estimatedInputTokens / 1_000_000) * inputCostPerMillion +
    (estimatedOutputTokens / 1_000_000) * outputCostPerMillion;
  const baseExecutionCostUsd = tokenCost + estimatedToolCostUsd;
  const baselineCostUsd = baseExecutionCostUsd * (1 + estimatedRetries);

  const potentialPreventedCostUsd =
    decision === "BLOCK"
      ? baselineCostUsd
      : decision === "CLARIFY"
        ? baseExecutionCostUsd * estimatedRetries
        : 0;
  const realizedPreventedCostUsd = gateMode === "enforce" && decision === "BLOCK" ? baselineCostUsd : 0;
  const netSavingsUsd = realizedPreventedCostUsd - haiCostUsd;

  return {
    model: typeof execution?.model === "string" && execution.model.trim() ? execution.model.trim() : null,
    gateMode,
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedRetries,
    baseExecutionCostUsd: roundUsd(baseExecutionCostUsd),
    baselineCostUsd: roundUsd(baselineCostUsd),
    haiCostUsd: roundUsd(haiCostUsd),
    potentialPreventedCostUsd: roundUsd(potentialPreventedCostUsd),
    realizedPreventedCostUsd: roundUsd(realizedPreventedCostUsd),
    netSavingsUsd: roundUsd(netSavingsUsd),
  };
}
