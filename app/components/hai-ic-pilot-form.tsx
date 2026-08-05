'use client';

import { HAI_PAYMENT_LINK } from './payment-cta';

/**
 * Disabled: Pilot intake modal must never open.
 * Primary sales actions use the Stripe Payment Link from NEXT_PUBLIC_HAI_PAYMENT_LINK.
 */
export const HAI_IC_STRIPE_PILOT_URL = HAI_PAYMENT_LINK;

/** @deprecated Modal removed — do not render. */
export function HaiIcPilotForm() {
  return null;
}

export default HaiIcPilotForm;
