// Copyright 2026 KARAM. All Rights Reserved.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Confirmed · HAI Verify",
  description: "Your $300 evaluation has been confirmed. Complete your intake to get started.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-muted mb-3">HAI Verify · Evaluation</p>
        <h1 className="text-3xl font-bold text-white mb-4">Payment Confirmed</h1>
        <p className="text-zinc-400 leading-relaxed mb-8">
          Your $300 evaluation payment was received. Complete the intake form so the team can begin
          your Intent Confidence assessment.
        </p>

        <Link
          href="/intake"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-600/30 transition hover:brightness-110"
        >
          Complete Intake →
        </Link>

        <p className="mt-6 text-xs text-zinc-500">
          Already submitted?{" "}
          <a href="mailto:support@hai-verify.com" className="underline underline-offset-2 hover:text-zinc-300">
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}
