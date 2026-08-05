import type { ReactNode } from "react";

export const PAYMENT_CTA_LABEL = "Start $300 Evaluation";

export const HAI_PAYMENT_LINK = process.env.NEXT_PUBLIC_HAI_PAYMENT_LINK?.trim() ?? "";

export const PRIMARY_PAYMENT_CTA_CLASS =
  "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/40 transition hover:brightness-110";

type PaymentCtaProps = {
  className?: string;
  children?: ReactNode;
};

export function PaymentCta({ className, children }: PaymentCtaProps) {
  const configured = HAI_PAYMENT_LINK.length > 0;

  return (
    <a
      href={configured ? HAI_PAYMENT_LINK : "#payment-link-not-configured"}
      aria-disabled={configured ? undefined : true}
      data-cta="stripe-payment-link"
      className={className ?? PRIMARY_PAYMENT_CTA_CLASS}
    >
      {children ?? PAYMENT_CTA_LABEL}
    </a>
  );
}
