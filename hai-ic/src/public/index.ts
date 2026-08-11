/**
 * HAI-IC public surface — single import for external engineers.
 *
 * @example
 * import { analyzeIntent, HAI_IC_CONFIDENCE_THRESHOLD, toGateDecision } from "@/hai-ic/src/public";
 */

export {
  HAI_IC_PRODUCT,
  HAI_IC_PRODUCT_DISPLAY,
  HAI_IC_VERSION,
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_FLOOR,
  HAI_IC_DD_MAX_PENALTY,
  HAI_IC_HOURLY_BOOST,
  HAI_IC_MAX_INPUT_LENGTH,
} from "./constants";

export type {
  HaiIcBreakdown,
  HaiIcResult,
  HaiIcAnalyzeRequest,
  HaiIcAnalyzeResponse,
  HaiIcErrorResponse,
  HaiIcHealthResponse,
  HaiIcGateDecision,
  HaiIcAnalyzer,
  HaiIcGate,
} from "./types";

export { analyzeIntent } from "../core/analyze";
export { isSincereMode, toGateDecision, HAI_IC_INTEGRATOR_RULES } from "../gate/policy";
