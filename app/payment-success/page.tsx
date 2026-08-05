import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Received · Hai-ic',
  description: 'Your $300 Evaluation payment was received. Submit your evaluation request to begin.',
};

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <svg
              className="size-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Payment received</h1>

        <p className="text-zinc-400 mb-8 leading-relaxed">
          Your $300 Evaluation payment has been processed. The next step is to submit your evaluation
          request so HAI can review your AI command, workflow, or execution.
        </p>

        <Link
          href="/intake"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/40 transition hover:brightness-110"
        >
          Submit Evaluation Request
        </Link>

        <p className="mt-6 text-xs text-zinc-500">
          HAI will review your submitted execution flow and contact you using the email provided.
        </p>
      </div>
    </div>
  );
}
