"use client";

import type { FormEvent } from "react";
import { useState } from "react";

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-white/[0.18] bg-background/90 px-3.5 py-2.5 text-sm text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/40 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20";

const TEXTAREA_CLASS = `${FIELD_CLASS} min-h-28 resize-y py-3 leading-relaxed`;

const SUCCESS_MESSAGE =
  "Evaluation request received. HAI will review the submitted execution flow and contact you using the email provided.";

type IntakeResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

export default function IntakePage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      companyProject: String(formData.get("companyProject") ?? ""),
      executionToEvaluate: String(formData.get("executionToEvaluate") ?? ""),
      expectedResult: String(formData.get("expectedResult") ?? ""),
      relevantUrl: String(formData.get("relevantUrl") ?? ""),
      additionalContext: String(formData.get("additionalContext") ?? ""),
    };

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as IntakeResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Unable to submit the evaluation request.");
        return;
      }

      form.reset();
      setSuccess(true);
    } catch {
      setError("Unable to submit the evaluation request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 sm:py-16">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-400">
            HAI-IC Evaluation Intake
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
            Submit Evaluation Request
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
            Submit the AI command, workflow, or execution path you want HAI to evaluate.
          </p>
        </div>

        {success ? (
          <div
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-emerald-100"
            role="status"
            aria-live="polite"
          >
            {SUCCESS_MESSAGE}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-surface-elevated p-5 shadow-2xl sm:p-8"
          >
            <p className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
              Do not submit API keys, passwords, access tokens, private credentials, or unrelated
              personal information.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-white/90">Name *</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  autoComplete="name"
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-white/90">Email *</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={180}
                  autoComplete="email"
                  className={FIELD_CLASS}
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/90">Company or project *</span>
              <input name="companyProject" required maxLength={180} className={FIELD_CLASS} />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/90">
                AI command, workflow, or execution to evaluate *
              </span>
              <textarea
                name="executionToEvaluate"
                required
                maxLength={2000}
                className={TEXTAREA_CLASS}
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/90">
                What result the customer expects *
              </span>
              <textarea name="expectedResult" required maxLength={1600} className={TEXTAREA_CLASS} />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/90">Relevant URL</span>
              <input
                name="relevantUrl"
                type="url"
                maxLength={500}
                placeholder="https://"
                className={FIELD_CLASS}
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-white/90">Additional context</span>
              <textarea name="additionalContext" maxLength={2000} className={TEXTAREA_CLASS} />
            </label>

            {error ? (
              <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/35 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Evaluation Request"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
