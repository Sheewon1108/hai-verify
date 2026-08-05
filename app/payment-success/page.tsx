"use client";

import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
        <p className="text-[11px] font-medium tracking-wider text-emerald-300 uppercase">
          Payment complete
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white/95">
          Your $300 evaluation payment was received
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Continue to intake so the team can collect delivery details for your evaluation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Continue to intake
          </Link>
          <Link
            href="/order"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-surface px-5 py-2.5 text-sm text-white/85 transition-colors hover:bg-surface-elevated"
          >
            Back to order
          </Link>
        </div>
      </section>
    </main>
  );
}
