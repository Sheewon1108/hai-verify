/**
 * HAI-IC engine constants — sincerity locks.
 * External integrators: do not override threshold in production without written KARAM approval.
 */

export {
  HAI_IC_PRODUCT,
  HAI_IC_PRODUCT_NAME,
  HAI_IC_VERSION,
  HAI_IC_CONFIDENCE_THRESHOLD,
} from "../interfaces/public";

/** Fixed — no artificial boost for sincerity. */
export const HAI_IC_HOURLY_BOOST = 0;

/** Fixed — no artificial DD penalty tuning beyond this cap. */
export const HAI_IC_DD_MAX_PENALTY_LIVE = 15;

/** Floor when due-diligence classification applies. */
export const HAI_IC_DD_FLOOR = 65;
