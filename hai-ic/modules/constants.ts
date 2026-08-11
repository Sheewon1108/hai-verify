/**
 * HAI-IC constants — public configuration boundary.
 * Threshold and sincerity locks live here; do not fork silently in app code.
 */

export {
  HAI_IC_PRODUCT_ID,
  HAI_IC_PRODUCT_NAME,
  HAI_IC_VERSION,
} from "./interfaces";

/** Sincere Mode opens only at this Intent Confidence (inclusive). */
export const HAI_IC_CONFIDENCE_THRESHOLD = 75;

/** Max characters accepted by analyze HTTP boundary. */
export const HAI_IC_MAX_INPUT_LENGTH = 8_000;

/** Due-diligence scoring floor (honest; not a marketing lift). */
export const HAI_IC_DD_FLOOR = 65;

/** Default max DD penalty (live value may re-export from dd-penalty module). */
export const HAI_IC_DD_MAX_PENALTY = 15;
