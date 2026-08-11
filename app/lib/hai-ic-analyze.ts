/**
 * Compatibility re-export — source of truth: hai-ic/src/
 * Prefer: import from "@/hai-ic/src/public"
 */

export {
  analyzeIntent,
  HAI_IC_PRODUCT,
  HAI_IC_VERSION,
} from "@/hai-ic/src/core/analyze";

export type { HaiIcBreakdown, HaiIcResult } from "@/hai-ic/src/public/types";
