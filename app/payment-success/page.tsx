import Link from "next/link";

export const metadata = {
  title: "Payment received | HAI Verify",
  description: "Payment received. Submit your evaluation request to continue.",
};

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-white/10 bg-surface-elevated p-8 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">HAI Verify</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Payment received</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The next step is submitting your evaluation request so HAI can review your execution flow.
        </p>
        <Link
          href="/intake"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          Submit Evaluation Request
        </Link>
      </section>
    </main>
  );
}
