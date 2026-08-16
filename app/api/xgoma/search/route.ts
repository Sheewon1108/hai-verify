// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * XGOMA Orchestrator — Search Ingestion
 *
 * Receives raw search-engine results (Google, Bing, Perplexity, etc.) and
 * runs every result through the HAI Verify engine before returning clean,
 * scored data. No contaminated content reaches XGOMA execution layer.
 *
 * Flow: AI (1번) → [this endpoint] HAI Verification → Human Approval → XGOMA
 *
 * POST /api/xgoma/search
 */

import { NextRequest } from "next/server";
import { jsonWithCors } from "@/app/lib/cors";
import { readHaiRequestMeta } from "@/app/lib/hai-request-meta";
import { analyzeOutput, parseRequestLocale } from "@/app/lib/verification";
import {
  HAI_THRESHOLDS,
  HAI_FLOW_STEPS,
  HAI_RULESET_VERSION,
} from "@/app/lib/hai-ruleset";

const MAX_RESULTS = 20;
const MAX_SNIPPET_LENGTH = 4_000;

export interface SearchResultInput {
  title: string;
  snippet: string;
  url?: string;
  source?: string;
}

export interface VerifiedSearchResult extends SearchResultInput {
  trustIndex: number;
  hallucinationRisk: number;
  humanReviewRequired: boolean;
  riskFlags: string[];
  overallStatus: "cleared" | "review" | "blocked";
  haiVerified: true;
}

function classifyResult(
  trustIndex: number,
  hallucinationRisk: number,
  humanReviewRequired: boolean,
): VerifiedSearchResult["overallStatus"] {
  if (trustIndex < HAI_THRESHOLDS.TRUST_INDEX_BLOCK || hallucinationRisk > HAI_THRESHOLDS.HALLUCINATION_RISK_MAX) {
    return "blocked";
  }
  if (humanReviewRequired || trustIndex < HAI_THRESHOLDS.TRUST_INDEX_PASS) {
    return "review";
  }
  return "cleared";
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  return jsonWithCors(
    {
      ok: true,
      endpoint: "/api/xgoma/search",
      method: "POST",
      description:
        "XGOMA Orchestrator — verifies search-engine results via HAI Verify engine before XGOMA execution.",
      haiRuleset: {
        version: HAI_RULESET_VERSION,
        thresholds: HAI_THRESHOLDS,
        flowStep: HAI_FLOW_STEPS.HAI_VERIFY,
      },
      body: {
        query: "string (required) — original search query",
        results: "SearchResult[] (required, max 20) — [{title, snippet, url?, source?}]",
        locale: "ko | en (optional, default ko)",
      },
      example: {
        query: "AI hallucination risk 2026",
        results: [
          {
            title: "AI Models Guarantee 100% Accuracy",
            snippet: "Every modern LLM is definitely accurate. There are no errors.",
            url: "https://example.com/article",
            source: "google",
          },
        ],
        locale: "en",
      },
    },
    { requestOrigin: origin },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, requestOrigin: origin },
    );
  }

  const record = body as Record<string, unknown>;

  // ── Validate query ────────────────────────────────────────────────────────
  const query = typeof record.query === "string" ? record.query.trim() : "";
  if (!query) {
    return jsonWithCors(
      { ok: false, error: "Field 'query' is required and cannot be empty" },
      { status: 400, requestOrigin: origin },
    );
  }

  // ── Validate results array ────────────────────────────────────────────────
  const rawResults = record.results;
  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    return jsonWithCors(
      { ok: false, error: "Field 'results' must be a non-empty array" },
      { status: 400, requestOrigin: origin },
    );
  }

  if (rawResults.length > MAX_RESULTS) {
    return jsonWithCors(
      { ok: false, error: `Maximum ${MAX_RESULTS} results per request` },
      { status: 413, requestOrigin: origin },
    );
  }

  const locale = parseRequestLocale(record.locale, request.headers.get("accept-language"));

  // ── Run HAI Verify on each result ─────────────────────────────────────────
  const verifiedResults: VerifiedSearchResult[] = [];

  for (const raw of rawResults) {
    const item = raw as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const snippet = typeof item.snippet === "string" ? item.snippet.trim() : "";
    const url = typeof item.url === "string" ? item.url.trim() : undefined;
    const source = typeof item.source === "string" ? item.source.trim() : undefined;

    if (!title && !snippet) continue;

    const textToAnalyze = [title, snippet].filter(Boolean).join(" ").slice(0, MAX_SNIPPET_LENGTH);

    const analysis = analyzeOutput(textToAnalyze, locale);

    verifiedResults.push({
      title,
      snippet,
      url,
      source,
      trustIndex: analysis.trustIndex,
      hallucinationRisk: analysis.hallucinationRisk,
      humanReviewRequired: analysis.humanReviewRequired,
      riskFlags: analysis.publicRiskFlags,
      overallStatus: classifyResult(
        analysis.trustIndex,
        analysis.hallucinationRisk,
        analysis.humanReviewRequired,
      ),
      haiVerified: true,
    });
  }

  const safeCount = verifiedResults.filter((r) => r.overallStatus === "cleared").length;
  const reviewCount = verifiedResults.filter((r) => r.overallStatus === "review").length;
  const blockedCount = verifiedResults.filter((r) => r.overallStatus === "blocked").length;

  return jsonWithCors(
    {
      ok: true,
      query,
      locale,
      verifiedResults,
      orchestratorMeta: {
        ...readHaiRequestMeta(request, HAI_FLOW_STEPS.HAI_VERIFY),
        processedAt: new Date().toISOString(),
        totalResults: verifiedResults.length,
        safeResults: safeCount,
        reviewRequired: reviewCount,
        blocked: blockedCount,
        thresholds: HAI_THRESHOLDS,
      },
    },
    { requestOrigin: origin },
  );
}
