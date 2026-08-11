/**
 * HAI-IC public types — external engineer contract.
 * Product name: HAI-IC only.
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
  confidence: number;
  sincereMode: boolean;
  mode: string;
  breakdown: HaiIcBreakdown;
  questions: string[];
  response: string;
  analyzedAt: string;
  isDueDiligence?: boolean;
}

export interface HaiIcAnalyzeRequest {
  /** Natural-language intent to score. Alias fields `text` / `content` accepted at HTTP edge only. */
  input: string;
}

export interface HaiIcHealthStatus {
  ok: boolean;
  product: "hai-ic";
  version: string;
  status: "healthy" | "degraded" | "down";
  timestamp: string;
}

/** Gate decision: human still owns final approve/reject. */
export interface HaiIcGateDecision {
  allowed: boolean;
  confidence: number;
  questions: string[];
  response?: string;
  /** Always true in doctrine — machine never replaces human responsibility. */
  humanFinalResponsibility: true;
}
