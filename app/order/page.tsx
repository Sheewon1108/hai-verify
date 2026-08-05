import { PaymentCta } from "../components/payment-cta";

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface-elevated p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-400">
          HAI-IC Evaluation
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
          Start the $300 Evaluation
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
          The order path now goes directly to the real Stripe payment page. After payment, Stripe
          should redirect back to the payment success page so you can submit the evaluation request.
        </p>
        <div className="mt-8">
          <PaymentCta />
        </div>
      </section>
    </main>
  );
}
