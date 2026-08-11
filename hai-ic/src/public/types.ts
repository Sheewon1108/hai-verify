/**
 * HAI-IC public interfaces — plug-and-play contract.
 * External engineers depend on this file only (plus constants).
 */

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcResult {
  product: "hai-ic";
  version: string;
  /** Intent Confidence 0–100 */
  confidence: number;
  /** true only when confidence >= HAI_IC_CONFIDENCE_THRESHOLD */
  sincereMode: boolean;
  mode: string;
  breakdown: HaiIcBreakdown;
  questions: string[];
  response: string;
  analyzedAt: string;
  isDueDiligence?: boolean;
}

export interface HaiIcAnalyzeRequest {
  input: string;
}

export interface HaiIcAnalyzeResponse extends HaiIcResult {
  ok: true;
}

export interface HaiIcErrorResponse {
  ok: false;
  error: string;
}

export interface HaiIcHealthResponse {
  ok: boolean;
  product: "hai-ic";
  version: string;
  status: "healthy" | string;
  timestamp: string;
}

/** Gate decision after analyze — human still retains final responsibility. */
export interface HaiIcGateDecision {
  allowed: boolean;
  confidence: number;
  sincereMode: boolean;
  questions: string[];
  response?: string;
  /** Explicit: integrator must still require human approval before side effects. */
  humanFinalResponsibility: true;
}

export interface HaiIcAnalyzer {
  analyze(input: string): HaiIcResult | Promise<HaiIcResult>;
}

export interface HaiIcGate {
  gate(input: string): HaiIcGateDecision | Promise<HaiIcGateDecision>;
}
