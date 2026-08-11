/**
 * HAI-IC gate policy — public boundary.
 * Sincere Mode only at threshold+; human final responsibility always retained.
 */

import {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_PRODUCT,
  HAI_IC_PRODUCT_DISPLAY,
} from "../public/constants";
import type { HaiIcGateDecision, HaiIcResult } from "../public/types";

export function isSincereMode(confidence: number): boolean {
  return confidence >= HAI_IC_CONFIDENCE_THRESHOLD;
}

export function toGateDecision(result: HaiIcResult): HaiIcGateDecision {
  const sincere = result.sincereMode && isSincereMode(result.confidence);
  return {
    allowed: sincere,
    confidence: result.confidence,
    sincereMode: sincere,
    questions: sincere ? [] : result.questions,
    response: sincere ? result.response : undefined,
    humanFinalResponsibility: true,
  };
}

/** Integrator checklist — do not skip. */
export const HAI_IC_INTEGRATOR_RULES = [
  `${HAI_IC_PRODUCT_DISPLAY} measures Intent Confidence before AI action.`,
  `Sincere Mode only when confidence >= ${HAI_IC_CONFIDENCE_THRESHOLD}.`,
  "If OFF: do not invent a full answer; return clarifying / evidence questions.",
  "Human final decision and responsibility always retained — gate is not auto-execute.",
  `Product id in API responses must remain "${HAI_IC_PRODUCT}".`,
] as const;
