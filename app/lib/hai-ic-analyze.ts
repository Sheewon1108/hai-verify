/**
 * App adapter — re-exports HAI-IC core engine.
 * Implementation lives in `hai-ic/src` (modular plug-and-play boundary).
 */

export {
  analyzeIntent,
  gateIntent,
  defaultHaiIcEngine,
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
} from "@/hai-ic/src";

export type { HaiIcResult, HaiIcBreakdown, HaiIcAnalyzeResult } from "@/hai-ic/src";
