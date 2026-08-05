export const PRIMARY_PAYMENT_CTA_LABEL = "Start $300 Evaluation";

export function getPublicPaymentLink(): string {
  return process.env.NEXT_PUBLIC_HAI_PAYMENT_LINK ?? "/payment-success";
}
