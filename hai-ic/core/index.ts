/**
 * HAI-IC core — modular entry for external engineers.
 *
 * Plug-and-play:
 *   import { analyzeIntent, HAI_IC_CONFIDENCE_THRESHOLD } from "@/hai-ic/core";
 *
 * HTTP adapters live in app/api/hai-ic — do not put secrets or Stripe here.
 */

export { analyzeIntent, HAI_IC_PRODUCT, HAI_IC_VERSION, type HaiIcResult, type HaiIcBreakdown } from "./analyze";
export {
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_DD_MAX_PENALTY,
  HAI_IC_DD_FLOOR,
  HAI_IC_HOURLY_BOOST,
  HAI_IC_DD_MAX_PENALTY_LIVE,
} from "./constants";
export { HAI_IC_SYSTEM_PROMPT } from "./prompt";
export type {
  HaiIcAnalyzeRequest,
  HaiIcAnalyzeResult,
  HaiIcAnalyzeHttpResponse,
  HaiIcHealthResponse,
  HaiIcAnalyzer,
  HaiIcGate,
  HaiIcModuleBoundary,
} from "../interfaces/public";
export { HAI_IC_PRODUCT_NAME, HAI_IC_THRESHOLD } from "../interfaces/public";
