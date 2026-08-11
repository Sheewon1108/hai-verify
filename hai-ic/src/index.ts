/**
 * HAI-IC modular entry — external engineer plug-and-play.
 *
 * Import:
 *   import { analyzeIntent, gateIntent, HAI_IC_CONFIDENCE_THRESHOLD } from "@/hai-ic/src";
 *   import type { HaiIcAnalyzeResult, HaiIcEngine } from "@/hai-ic/interfaces/public";
 *
 * Boundaries: see hai-ic/MODULE.md
 */

export {
  HAI_IC_PRODUCT,
  HAI_IC_PRODUCT_NAME,
  HAI_IC_VERSION,
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_HOURLY_BOOST,
  HAI_IC_DD_MAX_PENALTY_LIVE,
  HAI_IC_DD_FLOOR,
} from "./constants";

export { analyzeIntent, gateIntent, defaultHaiIcEngine } from "./engine";
export type { HaiIcResult, HaiIcBreakdown } from "./engine";

export type {
  HaiIcAnalyzeRequest,
  HaiIcAnalyzeResult,
  HaiIcAnalyzeHttpResponse,
  HaiIcHealthResponse,
  HaiIcGateDecision,
  HaiIcEngine,
  HaiIcHttpPort,
} from "../interfaces/public";
