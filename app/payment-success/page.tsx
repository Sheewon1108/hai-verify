import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl shadow-black/20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          Payment received
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">Start your HAI evaluation intake</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Your payment is complete. Continue to intake so KARAM has the company, contact,
          and use-case details needed to begin the $300 evaluation.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/intake?tier=starter&ref=payment-success"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
          >
            Continue to intake
          </Link>
          <Link
            href="/hai-ic"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3 text-base text-white/90 transition hover:bg-white/5"
          >
            Back to Hai-ic
          </Link>
        </div>
      </section>
    </main>
  );
}
