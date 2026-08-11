/**
 * HAI-IC doctrine constants — fixed IP surface.
 * External engineers may read; must not raise boost or lower sincerity bar for optics.
 */

export const HAI_IC_PRODUCT = "hai-ic" as const;
export const HAI_IC_VERSION = "1.0.0-mvp" as const;

/** Sincere Mode only at 75%+. */
export const HAI_IC_CONFIDENCE_THRESHOLD = 75;

export const HAI_IC_DD_MAX_PENALTY = 15;
export const HAI_IC_DD_FLOOR = 65;

/** Fixed — no artificial score inflation. */
export const HAI_IC_HOURLY_BOOST = 0;

/** Fixed — live DD penalty (same as max; no tuning for optics). */
export const HAI_IC_DD_MAX_PENALTY_LIVE = 15;
