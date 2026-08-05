import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface-elevated p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-accent">
          HAI Verify
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
          Payment received
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Thank you for starting the $300 Evaluation. Complete the intake so
          KARAM can review the request and prepare the evaluation.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center rounded-2xl bg-red-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-accent/25 transition hover:brightness-110"
          >
            Continue to intake
          </Link>
          <Link
            href="/hai-ic"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/20"
          >
            Back to HAI-IC
          </Link>
        </div>
      </section>
    </main>
  );
}
