'use client';

/**
 * Disabled: Pilot intake modal must never open.
 * Request a Pilot uses the Stripe Payment Link in hai-ic-landing.tsx.
 */
export const HAI_IC_STRIPE_PILOT_URL =
  process.env.NEXT_PUBLIC_HAI_PAYMENT_LINK ??
  'https://buy.stripe.com/14A8wI6sV3CffST2UT4AU00';

/** @deprecated Modal removed — do not render. */
export function HaiIcPilotForm() {
  return null;
}

export default HaiIcPilotForm;
