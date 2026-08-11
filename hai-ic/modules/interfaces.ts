/**
 * HAI-IC public interfaces — external engineer contract.
 * Boundary: pure types only. No I/O, no Next.js, no secrets.
 */

export const HAI_IC_PRODUCT_ID = "hai-ic" as const;
export const HAI_IC_PRODUCT_NAME = "HAI-IC" as const;
export const HAI_IC_VERSION = "1.0.0-mvp" as const;

/** Intent Confidence score 0–100 (honest; not manually inflated). */
export type IntentConfidence = number;

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

/**
 * Result of one analyze call.
 * sincereMode === true only when confidence >= threshold (default 75).
 * Human final decision + responsibility always retained outside this result.
 */
export interface HaiIcResult {
  product: typeof HAI_IC_PRODUCT_ID;
  version: typeof HAI_IC_VERSION;
  confidence: IntentConfidence;
  sincereMode: boolean;
  mode: string;
  breakdown: HaiIcBreakdown;
  questions: string[];
  response: string;
  analyzedAt: string;
  isDueDiligence?: boolean;
}

export interface HaiIcAnalyzeRequest {
  /** Natural-language intent to score. */
  input: string;
}

export interface HaiIcAnalyzeOk extends HaiIcResult {
  ok: true;
}

export interface HaiIcAnalyzeErr {
  ok: false;
  error: string;
}

export type HaiIcAnalyzeResponse = HaiIcAnalyzeOk | HaiIcAnalyzeErr;

export interface HaiIcHealth {
  ok: boolean;
  product: typeof HAI_IC_PRODUCT_ID;
  version: typeof HAI_IC_VERSION;
  status: string;
  timestamp: string;
}

/**
 * Gate decision for LLM / agent execution.
 * allowed=true only in Sincere Mode; human still owns final action.
 */
export interface HaiIcGateDecision {
  allowed: boolean;
  confidence: IntentConfidence;
  questions: string[];
  response?: string;
}

/** Public analyzer port — implement or call; do not bypass for paid paths. */
export interface IHaiIcAnalyzer {
  analyze(input: string): HaiIcResult;
}

/** Public HTTP client port for remote gate. */
export interface IHaiIcClient {
  health(): Promise<{ ok: boolean; status?: string }>;
  analyze(input: string): Promise<HaiIcAnalyzeResponse>;
  gate(input: string): Promise<HaiIcGateDecision>;
}
