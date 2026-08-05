export const HAI_PAYMENT_CTA_LABEL = "Start $300 Evaluation";
export const HAI_PAYMENT_LINK = process.env.NEXT_PUBLIC_HAI_PAYMENT_LINK?.trim() ?? "";
export const HAI_PAYMENT_SUCCESS_PATH = "/payment-success";
export const HAI_INTAKE_PATH = "/intake";

export function hasHaiPaymentLink(): boolean {
  return HAI_PAYMENT_LINK.length > 0;
}
