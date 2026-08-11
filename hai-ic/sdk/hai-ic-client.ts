/**
 * HAI-IC drop-in client — plug-and-play for external engineers.
 * Usage: gate LLM calls — only proceed when sincereMode === true;
 * human still retains final responsibility before side effects.
 */

import {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_PRODUCT,
} from "../src/public/constants";
import type {
  HaiIcAnalyzeResponse,
  HaiIcBreakdown,
  HaiIcErrorResponse,
  HaiIcGateDecision,
  HaiIcHealthResponse,
} from "../src/public/types";
import { toGateDecision } from "../src/gate/policy";

/** @deprecated Prefer HAI_IC_CONFIDENCE_THRESHOLD */
export const HAI_IC_THRESHOLD = HAI_IC_CONFIDENCE_THRESHOLD;
export { HAI_IC_CONFIDENCE_THRESHOLD };

export type { HaiIcBreakdown, HaiIcAnalyzeResponse, HaiIcGateDecision };

export interface HaiIcClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class HaiIcClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: HaiIcClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchFn = options.fetchImpl ?? fetch;
  }

  async health(): Promise<HaiIcHealthResponse> {
    const res = await this.fetchFn(`${this.baseUrl}/api/hai-ic/health`);
    return res.json();
  }

  async analyze(input: string): Promise<HaiIcAnalyzeResponse | HaiIcErrorResponse> {
    const res = await this.fetchFn(`${this.baseUrl}/api/hai-ic/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    return res.json();
  }

  /**
   * Returns full response if sincere; otherwise questions only (no fake answer).
   * `humanFinalResponsibility` is always true — do not auto-execute side effects.
   */
  async gate(input: string): Promise<HaiIcGateDecision> {
    const result = await this.analyze(input);
    if (!result.ok) {
      throw new Error(result.error ?? `${HAI_IC_PRODUCT} analyze failed`);
    }
    const decision = toGateDecision(result);
    if (decision.allowed && result.confidence < HAI_IC_CONFIDENCE_THRESHOLD) {
      return { ...decision, allowed: false, sincereMode: false, response: undefined };
    }
    return decision;
  }
}
