/**
 * HAI-IC public interfaces — external engineer contract.
 * Stable boundary: integrate against these types only.
 * Product name: HAI-IC only.
 */

/** Canonical product id (API wire format). */
export const HAI_IC_PRODUCT = "hai-ic" as const;

/** Display / legal product name. */
export const HAI_IC_PRODUCT_NAME = "HAI-IC" as const;

export const HAI_IC_VERSION = "1.0.0-mvp" as const;

/** Sincere Mode gate — non-negotiable. */
export const HAI_IC_CONFIDENCE_THRESHOLD = 75 as const;

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcAnalyzeRequest {
  /** Natural-language intent to score. Alias fields `text` / `content` accepted by HTTP layer. */
  input: string;
}

export interface HaiIcAnalyzeResult {
  product: typeof HAI_IC_PRODUCT;
  version: string;
  /** Intent Confidence 0–100 (honest; no manual inflation). */
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

export interface HaiIcAnalyzeHttpResponse extends HaiIcAnalyzeResult {
  ok: boolean;
  error?: string;
}

export interface HaiIcHealthResponse {
  ok: boolean;
  product: typeof HAI_IC_PRODUCT;
  version: string;
  status: string;
  timestamp?: string;
}

export interface HaiIcGateDecision {
  /** Proceed only when sincereMode and confidence >= threshold. */
  allowed: boolean;
  confidence: number;
  questions: string[];
  response?: string;
  /** Human must still approve before any side-effecting action. */
  humanFinalDecisionRequired: true;
}

/** Engine surface an integrator or swap-in scorer must implement. */
export interface HaiIcEngine {
  analyze(input: string): HaiIcAnalyzeResult;
}

/** HTTP adapter boundary (Next route / Workers / other host). */
export interface HaiIcHttpPort {
  health(): Promise<HaiIcHealthResponse>;
  analyze(req: HaiIcAnalyzeRequest): Promise<HaiIcAnalyzeHttpResponse>;
}
