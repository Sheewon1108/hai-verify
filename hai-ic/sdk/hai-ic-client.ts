/**
 * HAI-IC drop-in HTTP client (productization P2)
 * Usage: gate LLM calls — only proceed when sincereMode === true.
 * Human retains final decision + responsibility.
 */

import {
  HAI_IC_THRESHOLD,
  type HaiIcAnalyzeHttpResponse,
  type HaiIcBreakdown,
  type HaiIcGate,
} from "../interfaces/public";

export { HAI_IC_THRESHOLD };
export type { HaiIcBreakdown, HaiIcAnalyzeHttpResponse as HaiIcAnalyzeResponse };

export interface HaiIcClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class HaiIcClient implements HaiIcGate {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: HaiIcClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchFn = options.fetchImpl ?? fetch;
  }

  async health(): Promise<{ ok: boolean; status?: string }> {
    const res = await this.fetchFn(`${this.baseUrl}/api/hai-ic/health`);
    return res.json();
  }

  async analyze(input: string): Promise<HaiIcAnalyzeHttpResponse> {
    const res = await this.fetchFn(`${this.baseUrl}/api/hai-ic/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    return res.json();
  }

  /** Returns full response if sincere; otherwise questions only (no fake answer). */
  async gate(input: string): Promise<{
    allowed: boolean;
    confidence: number;
    questions: string[];
    response?: string;
  }> {
    const result = await this.analyze(input);
    if (!result.ok) {
      throw new Error(result.error ?? "HAI-IC analyze failed");
    }
    return {
      allowed: result.sincereMode && result.confidence >= HAI_IC_THRESHOLD,
      confidence: result.confidence,
      questions: result.questions,
      response: result.sincereMode ? result.response : undefined,
    };
  }
}
