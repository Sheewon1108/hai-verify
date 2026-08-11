/**
 * HAI-IC public interfaces — engineer plug-and-play contract.
 * Boundary: external integrators depend on THIS file + OpenAPI only.
 * Do not import app/*, middleware, vault, or UI from outside the core package.
 */

/** Product name is fixed. Do not rename in public surfaces. */
export const HAI_IC_PRODUCT_NAME = "HAI-IC" as const;

export const HAI_IC_THRESHOLD = 75 as const;

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcAnalyzeRequest {
  /** Natural-language intent to score. Alias fields `text` / `content` accepted by HTTP adapter. */
  input: string;
}

export interface HaiIcAnalyzeResult {
  product: string;
  version: string;
  /** Intent Confidence 0–100 (honest; no inflation). */
  confidence: number;
  /** true only when confidence >= HAI_IC_THRESHOLD (75). */
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
  product: string;
  version: string;
  status: string;
  timestamp: string;
}

/**
 * Core analyzer port — implementors must preserve human-responsibility doctrine:
 * score → gate at 75 → never auto-execute high-stakes actions.
 */
export interface HaiIcAnalyzer {
  analyze(input: string): HaiIcAnalyzeResult;
}

/**
 * Gate port — returns allow only when Sincere Mode is ON.
 * Caller retains human final decision + responsibility.
 */
export interface HaiIcGate {
  gate(input: string): Promise<{
    allowed: boolean;
    confidence: number;
    questions: string[];
    response?: string;
  }>;
}

/** Module boundary labels for external engineers. */
export type HaiIcModuleBoundary =
  | "hai-ic/interfaces" // public contracts
  | "hai-ic/core" // scoring + doctrine constants
  | "hai-ic/sdk" // HTTP client
  | "app/api/hai-ic" // Next.js HTTP adapters only
  | "app/components" // UI — not required for API integrators
  | "secrets/vault"; // never import from core
