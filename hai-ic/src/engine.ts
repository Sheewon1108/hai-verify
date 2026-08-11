/**
 * HAI-IC Intent Confidence engine (core module).
 * Plug-and-play: import { analyzeIntent } from "hai-ic/src" (path alias @/hai-ic/src).
 * Boundary: scoring only — never takes final human decision / side effects.
 */

import type { HaiIcAnalyzeResult, HaiIcBreakdown, HaiIcEngine } from "../interfaces/public";
import {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_FLOOR,
  HAI_IC_DD_MAX_PENALTY_LIVE,
  HAI_IC_HOURLY_BOOST,
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
} from "./constants";

export type HaiIcResult = HaiIcAnalyzeResult;
export type { HaiIcBreakdown };

const VAGUE_PATTERNS = [
  /how should|what should|help me|any ideas|recommend|advice|suggest/i,
  /reconnect|restart|resume|restore|again/i,
  /business|deal|partner|partnership|vendor|supplier|customer|logistics/i,
];

const DD_PATTERNS = [
  /before\s*\/\s*after|real\s*data|numeric\s*evidence|benchmark/i,
  /latency|false\s*positive|hallucination\s*rate/i,
  /verification|compatibility|integration\s*difficulty|integrat(e|ion)/i,
  /training\s*data|bias|contamination/i,
  /licensing|exclusive|pricing|price\s*range|ROI|ip\s*ownership|modify/i,
  /due\s*diligence|poc|roadmap|align/i,
];

const SPECIFIC_PATTERNS = [
  /\d{4}[-./]\s*\d{1,2}/,
  /\d+\s*(usd|dollars?|krw|won|%|tons?|months?|k|m|million|billion)/i,
  /(group|corp|inc|ltd|llc|company)/i,
  /(logistics|export|import|purchase|sales|delivery|shipping|procurement)/i,
];

function hasProperNoun(text: string): boolean {
  return /[A-Z][a-z]+/.test(text);
}

function isDueDiligenceQuestion(text: string): boolean {
  return DD_PATTERNS.filter((p) => p.test(text)).length >= 1;
}

function clip(text: string, max = 120): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function buildQuestions(text: string, wantsBusiness: boolean, wantsRestart: boolean, isDD: boolean): string[] {
  const questions: string[] = [];

  if (isDD) {
    questions.push("What evidence can you provide now for this DD item, such as metrics, POC results, or benchmarks?");
    questions.push("What measurement period, sample size, and baseline should be used?");
    questions.push("What can be shared before the xAI or partner meeting, including any NDA limits?");
    return questions;
  }

  if (wantsBusiness) {
    questions.push("What is your relationship to the target company and any intermediary channel, such as a logistics partner?");
  }
  if (wantsRestart) {
    questions.push("What did you previously trade, and why or when did the relationship stop?");
  }
  if (!/\d/.test(text)) {
    questions.push("What deadline, scale, budget, or shipment volume should this request target?");
  }
  if (questions.length < 2) {
    questions.push("Can you define the success criteria for this request in one sentence?");
  }
  if (questions.length < 3) {
    questions.push("Is there any legal, budget, or approval constraint that must be resolved first?");
  }

  return questions.slice(0, 3);
}

function buildSincereResponse(text: string, entities: string[], isDD: boolean): string {
  if (isDD) {
    return [
      "This is classified as a due diligence question. Sincere Mode will provide a practical response frame.",
      "",
      "**Current answer scope**",
      "- Architecture and integration: explainable as an API pre-check layer",
      "- Metrics and verification: POC design plus measurement indicators can be proposed",
      "",
      "**Next actions before the meeting**",
      "1. Draft a one-page technical brief for this question",
      "2. Share a two-week POC scope and latency / FP benchmark plan",
      "3. Prepare the list of materials that can be shared under NDA",
      "",
      "If needed, draft a dedicated answer for this DD item next.",
    ].join("\n");
  }

  const target = entities[0] ?? "the target";
  return [
    "The context is clear enough. Proceeding in Sincere Mode.",
    "",
    `**Lock the goal** - Document "${clip(text, 60)}" as a one-line objective.`,
    "",
    `**Contact sequence (${target})**`,
    "1. Confirm the previous owner or department",
    "2. Write three sentences covering the reason for reconnecting and the value offered",
    "3. Propose a specific timeline, scale, and next action",
    "",
    "**Risk check**",
    "- Resolve any past payment, quality, or contract issues first",
    "- Confirm internal approval owners and budget availability",
    "",
    "If needed, draft the first outreach email or message next.",
  ].join("\n");
}

function buildLowScoreResponse(questions: string[], isDD: boolean, confidence: number): string {
  const hope = isDD
    ? "This is a DD item. Even with a low score now, **POC or pilot data** can raise trust quickly."
    : "The intent direction is visible. A little more specificity will raise Intent Confidence quickly.";

  const actions = isDD
    ? [
        "**Next actions**",
        "1. Create a one-page brief for each DD item: available now / in progress / unknown",
        "2. Align on a two-week POC schedule and measurement metrics such as latency and FP rate",
        "3. Share the checklist for Growth Loops or xAI meetings",
      ]
    : [
        "**Next actions**",
        "1. Answer two or three of the questions below",
        "2. Lock the success criteria in one sentence",
        "3. Run the analysis again",
      ];

  return [
    `Intent Confidence ${confidence}% - still below the 75% Sincere Mode gate.`,
    "",
    `**Signal** - ${hope}`,
    "",
    ...actions,
    "",
    "**Please clarify**",
    ...questions.map((q, i) => `${i + 1}. ${q}`),
  ].join("\n");
}

export function analyzeIntent(input: string): HaiIcAnalyzeResult {
  const text = input.trim();
  const isDD = isDueDiligenceQuestion(text);
  let confidence = 78;

  if (text.length < 15) confidence -= 18;
  else if (text.length < 40) confidence -= 6;
  else if (text.length > 120) confidence += 6;

  const vagueHits = VAGUE_PATTERNS.filter((p) => p.test(text)).length;
  const specificHits = SPECIFIC_PATTERNS.filter((p) => p.test(text)).length;

  confidence -= vagueHits * 5;
  confidence += specificHits * 7;

  if (hasProperNoun(text)) confidence += 8;
  if (!/[?.!？]/.test(text)) confidence -= 4;
  if (/(where|when|why|who|what)/i.test(text)) confidence -= 5;

  confidence = Math.max(35, Math.min(96, Math.round(confidence)));

  if (isDD) {
    confidence = Math.max(confidence - HAI_IC_DD_MAX_PENALTY_LIVE, HAI_IC_DD_FLOOR);
  }

  confidence = Math.min(96, confidence + HAI_IC_HOURLY_BOOST);

  const wantsStrategy = /approach|strategy|method|how/i.test(text);
  const wantsBusiness = /business|deal|partner|partnership|logistics/i.test(text);
  const wantsRestart = /reconnect|restart|resume|restore|again/i.test(text);

  const entities = text.match(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*/g) ?? [];

  const coreParts: string[] = [];
  if (isDD) coreParts.push("Due diligence / technical and commercial verification question");
  if (wantsBusiness) coreParts.push("Business or deal-related request");
  if (wantsStrategy) coreParts.push("Execution strategy or approach question");
  if (wantsRestart) coreParts.push("Intent to restart a relationship or deal");
  const core =
    coreParts.length > 0
      ? coreParts.join(", ")
      : "Clarify the purpose of a natural-language request and guide the next action";

  const understood: string[] = [];
  if (entities.length > 0) understood.push(`Mentioned targets: ${entities.slice(0, 3).join(", ")}`);
  if (isDD) understood.push("A due diligence question asking for metrics, verification, legal, or integration evidence");
  if (wantsStrategy) understood.push("The user wants advice on method or approach sequence");
  if (wantsBusiness) understood.push("The request involves a deal or partnership context");
  if (understood.length === 0) understood.push(`Request text: "${clip(text, 80)}"`);

  const missing: string[] = [];
  if (isDD) missing.push("No official evidence such as before/after metrics, benchmarks, or verification logs is provided");
  if (entities.length < 2 && wantsBusiness) missing.push("Some target, channel, or role details are unclear");
  if (!/\d/.test(text)) missing.push("No numeric details such as deadline, scale, or budget are provided");
  if (wantsRestart) missing.push("Past relationship, stop reason, or previous deal details are missing");
  if (vagueHits >= 2) missing.push("The request is broad, so priorities and success criteria are ambiguous");
  if (missing.length === 0) missing.push("Some detailed conditions still need confirmation");

  const risk: string[] = [];
  const sincere = confidence >= HAI_IC_CONFIDENCE_THRESHOLD;
  if (isDD && !sincere) risk.push("Claiming metrics without evidence can reduce trust in a DD meeting");
  if (!sincere) risk.push("Acting with limited information could target the wrong owner or strategy");
  if (wantsRestart) risk.push("Unresolved past issues can lead to another rejection or trust loss");
  if (wantsBusiness && !/\d/.test(text)) risk.push("Unclear scale or terms can weaken the proposal");
  if (risk.length === 0) risk.push("The context is relatively clear, but final confirmation is recommended before execution");

  const questions = sincere ? [] : buildQuestions(text, wantsBusiness, wantsRestart, isDD);

  const response = sincere
    ? buildSincereResponse(text, entities, isDD)
    : buildLowScoreResponse(questions, isDD, confidence);

  return {
    product: HAI_IC_PRODUCT,
    version: HAI_IC_VERSION,
    confidence,
    sincereMode: sincere,
    mode: sincere ? "Sincere Mode ON" : "Sincere Mode OFF",
    breakdown: {
      core,
      understood: understood.join(" · "),
      missing: missing.join(" · "),
      risk: risk.join(" · "),
    },
    questions,
    response,
    analyzedAt: new Date().toISOString(),
    isDueDiligence: isDD,
  };
}

/** Default in-process engine — swap via HaiIcEngine for OEM embeds. */
export const defaultHaiIcEngine: HaiIcEngine = {
  analyze: analyzeIntent,
};

/**
 * Gate helper: allowed only in Sincere Mode.
 * Always sets humanFinalDecisionRequired — HAI-IC never executes side effects.
 */
export function gateIntent(input: string): {
  allowed: boolean;
  confidence: number;
  questions: string[];
  response?: string;
  humanFinalDecisionRequired: true;
} {
  const result = analyzeIntent(input);
  return {
    allowed: result.sincereMode && result.confidence >= HAI_IC_CONFIDENCE_THRESHOLD,
    confidence: result.confidence,
    questions: result.questions,
    response: result.sincereMode ? result.response : undefined,
    humanFinalDecisionRequired: true,
  };
}
