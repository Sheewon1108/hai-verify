'use client';

import { HAI_PAYMENT_LINK } from '@/app/lib/hai-payment';

/**
 * Disabled: Pilot intake modal must never open.
 * Request a Pilot uses the Stripe Payment Link in hai-ic-landing.tsx.
 */
export const HAI_IC_STRIPE_PILOT_URL = HAI_PAYMENT_LINK;

/** @deprecated Modal removed — do not render. */
export function HaiIcPilotForm() {
  return null;
}

export default HaiIcPilotForm;
