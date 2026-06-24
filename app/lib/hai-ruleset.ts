// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

/**
 * HAI Verify Ruleset — injected by middleware before every request.
 *
 * Flow: AI (1번) → HAI Verification → Human Approval → XGOMA
 *
 * All AI output and search-engine data MUST pass through this ruleset
 * before reaching the XGOMA orchestrator or any downstream consumer.
 */

export const HAI_RULESET_VERSION = "1.0" as const;

/**
 * Header names stamped on every inbound request by middleware.
 * Downstream handlers read these to confirm the ruleset was applied.
 */
export const HAI_HEADERS = {
  RULESET_ACTIVE: "x-hai-ruleset-active",
  RULESET_VERSION: "x-hai-ruleset-version",
  RULESET_APPLIED_AT: "x-hai-ruleset-applied-at",
  FLOW_STEP: "x-hai-flow-step",
} as const;

/**
 * HAI Verify flow step labels.
 *
 * 1 = AI input received
 * 2 = HAI verification running
 * 3 = Human approval required
 * 4 = XGOMA execution
 */
export const HAI_FLOW_STEPS = {
  AI_INPUT: "1:ai-input",
  HAI_VERIFY: "2:hai-verify",
  HUMAN_APPROVAL: "3:human-approval",
  XGOMA_EXECUTE: "4:xgoma-execute",
} as const;

/**
 * Mandatory risk thresholds for search-engine / AI result ingestion.
 * XGOMA orchestrator applies these before accepting any external data.
 */
export const HAI_THRESHOLDS = {
  /** Minimum Trust Index to pass as "clean" without human review. */
  TRUST_INDEX_PASS: 70,
  /** Trust Index below this always requires human approval. */
  TRUST_INDEX_BLOCK: 50,
  /** Max hallucination risk before result is quarantined. */
  HALLUCINATION_RISK_MAX: 55,
} as const;

/** Domains that must always trigger human review regardless of Trust Index. */
export const HAI_REGULATED_DOMAINS = [
  "legal",
  "medical",
  "financial",
  "security",
  "family",
] as const;

export type HaiFlowStep = (typeof HAI_FLOW_STEPS)[keyof typeof HAI_FLOW_STEPS];

export interface HaiRulesetContext {
  version: string;
  appliedAt: string;
  flowStep: HaiFlowStep;
  active: true;
}

export function buildRulesetContext(step: HaiFlowStep = HAI_FLOW_STEPS.AI_INPUT): HaiRulesetContext {
  return {
    version: HAI_RULESET_VERSION,
    appliedAt: new Date().toISOString(),
    flowStep: step,
    active: true,
  };
}
