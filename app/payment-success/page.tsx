import Link from "next/link";
import { HAI_INTAKE_PATH } from "@/app/lib/hai-payment";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-2xl shadow-black/30 sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-accent">
          HAI Evaluation Pilot
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Payment received
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The next step is submitting the evaluation request so HAI can review the AI
          command, workflow, or execution path you want evaluated.
        </p>

        <Link
          href={HAI_INTAKE_PATH}
          className="mt-8 inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Submit Evaluation Request
        </Link>
      </div>
    </main>
  );
}
