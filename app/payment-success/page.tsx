import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-accent">
          Hai-ic pilot
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-[-0.03em] text-white">
          Payment received
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-muted">
          Thank you. Keep this page for your records; onboarding continues through the
          contact details attached to the Stripe payment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/hai-ic"
            className="rounded-2xl bg-red-accent px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Back to Hai-ic
          </Link>
          <Link
            href="/intake"
            className="rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            View intake next steps
          </Link>
        </div>
      </div>
    </main>
  );
}
