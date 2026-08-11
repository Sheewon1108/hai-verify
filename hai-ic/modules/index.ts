/**
 * HAI-IC public module surface — import from here only.
 *
 * Boundaries:
 * - modules/*     → pure product logic + contracts (engineer plug-in)
 * - app/api/*     → HTTP adapters (Next.js)
 * - app/lib/*     → thin re-exports for legacy imports
 * - secrets/vault → never imported here
 */

export type {
  HaiIcAnalyzeErr,
  HaiIcAnalyzeOk,
  HaiIcAnalyzeRequest,
  HaiIcAnalyzeResponse,
  HaiIcBreakdown,
  HaiIcGateDecision,
  HaiIcHealth,
  HaiIcResult,
  IHaiIcAnalyzer,
  IHaiIcClient,
  IntentConfidence,
} from "./interfaces";

export {
  HAI_IC_PRODUCT_ID,
  HAI_IC_PRODUCT_NAME,
  HAI_IC_VERSION,
} from "./interfaces";

export {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_FLOOR,
  HAI_IC_DD_MAX_PENALTY,
  HAI_IC_MAX_INPUT_LENGTH,
} from "./constants";

export { HAI_IC_SYSTEM_PROMPT } from "./system-prompt";
export { HAI_IC_HOURLY_BOOST } from "./boost";
export { HAI_IC_DD_MAX_PENALTY_LIVE } from "./dd-penalty";
export { analyzeIntent, haiIcAnalyzer, HAI_IC_PRODUCT } from "./analyze";
