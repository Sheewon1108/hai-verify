/**
 * Hai-Ic drop-in client (productization P2)
 * Usage: gate LLM calls — only proceed when sincereMode === true
 */

export const HAI_IC_THRESHOLD = 75;

export interface HaiIcBreakdown {
  core: string;
  understood: string;
  missing: string;
  risk: string;
}

export interface HaiIcAnalyzeResponse {
  ok: boolean;
  product?: string;
  version?: string;
  confidence: number;
  sincereMode: boolean;
  mode: string;
  breakdown: HaiIcBreakdown;
  questions: string[];
  response: string;
  analyzedAt: string;
  isDueDiligence?: boolean;
  error?: string;
}

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

  async health(): Promise<{ ok: boolean; status?: string }> {
    const res = await this.fetchFn(`${this.baseUrl}/api/hai-ic/health`);
    return res.json();
  }

  async analyze(input: string): Promise<HaiIcAnalyzeResponse> {
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
      throw new Error(result.error ?? "Hai-Ic analyze failed");
    }
    return {
      allowed: result.sincereMode && result.confidence >= HAI_IC_THRESHOLD,
      confidence: result.confidence,
      questions: result.questions,
      response: result.sincereMode ? result.response : undefined,
    };
  }
}