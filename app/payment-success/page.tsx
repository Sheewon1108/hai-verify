import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment received | HAI-IC",
  description: "Next step after the HAI-IC $300 Evaluation payment.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface-elevated p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-400">
          HAI-IC Evaluation
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
          Payment received
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
          Thank you. The next step is submitting the evaluation request so HAI can review the
          AI command, workflow, or execution path you want evaluated.
        </p>
        <div className="mt-8">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/35 transition hover:brightness-110"
          >
            Submit Evaluation Request
          </Link>
        </div>
      </section>
    </main>
  );
}
