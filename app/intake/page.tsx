import Link from "next/link";

const PILOT_ORDER_URL = "https://buy.stripe.com/14A8wI6sV3CffST2UT4AU00";

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-accent">
          Hai-ic intake
        </p>
        <h1 className="mb-5 text-5xl font-black tracking-[-0.04em] text-white">
          Start a paid Hai-ic pilot
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted">
          Pilot intake is handled through the public Stripe Payment Link. Do not
          submit private keys, credentials, or internal strategy in checkout notes.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={PILOT_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="stripe-pilot"
            className="rounded-2xl bg-red-accent px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Continue to secure payment
          </a>
          <Link
            href="/hai-ic"
            className="rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Review Hai-ic first
          </Link>
        </div>
      </div>
    </main>
  );
}
