/**
 * Legacy adapter — source of truth is hai-ic/modules.
 * Prefer: import { analyzeIntent } from "@/hai-ic/modules"
 */
export {
  analyzeIntent,
  haiIcAnalyzer,
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
  type HaiIcBreakdown,
  type HaiIcResult,
} from "@/hai-ic/modules";
