/**
 * HAI-IC public module surface — plug-and-play for external engineers.
 *
 * Import from `@/hai-ic/src` (or relative `hai-ic/src`).
 * Do not import private files under `app/api` or `app/components` from integrators.
 *
 * Boundaries:
 *   IN  — natural-language string
 *   OUT — Intent Confidence 0–100, Sincere Mode ON/OFF, breakdown, clarifying questions
 *   NEVER — secrets, Stripe, deploy, human final decision (always retained by caller)
 */

export {
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_FLOOR,
  HAI_IC_DD_MAX_PENALTY,
  HAI_IC_DD_MAX_PENALTY_LIVE,
  HAI_IC_HOURLY_BOOST,
  HAI_IC_SYSTEM_PROMPT,
} from "./constants";

export type {
  HaiIcBreakdown,
  HaiIcResult,
  HaiIcAnalyzeRequest,
  HaiIcHealthStatus,
  HaiIcGateDecision,
} from "./types";

export { analyzeIntent, gateIntent } from "./analyze";
