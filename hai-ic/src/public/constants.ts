/**
 * HAI-IC public constants — stable contract for integrators.
 * Product display name: HAI-IC only.
 */

export const HAI_IC_PRODUCT = "hai-ic" as const;
export const HAI_IC_PRODUCT_DISPLAY = "HAI-IC" as const;
export const HAI_IC_VERSION = "1.0.0-mvp" as const;

/** Sincere Mode opens only at this Intent Confidence or higher. */
export const HAI_IC_CONFIDENCE_THRESHOLD = 75;

/** Due-diligence scoring bounds (no artificial inflation). */
export const HAI_IC_DD_FLOOR = 65;
export const HAI_IC_DD_MAX_PENALTY = 15;

/** Must stay 0 — score inflation is forbidden. */
export const HAI_IC_HOURLY_BOOST = 0;

export const HAI_IC_MAX_INPUT_LENGTH = 8_000;
