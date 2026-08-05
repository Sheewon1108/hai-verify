"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type IntakeResponse =
  | { ok: true; message: string }
  | { ok: false; error: string };

type IntakeFormState = {
  name: string;
  email: string;
  companyOrProject: string;
  workflowToEvaluate: string;
  expectedResult: string;
  relevantUrl: string;
  additionalContext: string;
};

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-white/12 bg-background/90 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20";
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[140px] resize-y`;

const INITIAL_FORM: IntakeFormState = {
  name: "",
  email: "",
  companyOrProject: "",
  workflowToEvaluate: "",
  expectedResult: "",
  relevantUrl: "",
  additionalContext: "",
};

export default function IntakePage() {
  const [form, setForm] = useState<IntakeFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateField<K extends keyof IntakeFormState>(field: K, value: IntakeFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as IntakeResponse;

      if (!response.ok || !data.ok) {
        setError("error" in data ? data.error : "Unable to submit your request right now.");
        return;
      }

      setSuccess(data.message);
      setForm(INITIAL_FORM);
    } catch {
      setError("Unable to submit your request right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-2xl shadow-black/30 sm:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-accent">
            HAI Evaluation Intake
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Submit Evaluation Request
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Share the exact AI command, workflow, or execution path you want HAI to
            evaluate after payment.
          </p>
          <p className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
            Do not submit API keys, passwords, access tokens, private credentials, or
            unrelated personal information.
          </p>
        </div>

        {success ? (
          <section
            className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm leading-relaxed text-emerald-100"
            aria-live="polite"
          >
            <p>{success}</p>
            <Link
              href="/hai-ic"
              className="mt-4 inline-flex text-sm font-medium text-white underline underline-offset-4"
            >
              Return to Hai-ic
            </Link>
          </section>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-white/90">Name</span>
              <input
                required
                maxLength={100}
                autoComplete="name"
                className={INPUT_CLASS}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">Email</span>
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">Company or project</span>
              <input
                required
                maxLength={160}
                className={INPUT_CLASS}
                value={form.companyOrProject}
                onChange={(event) => updateField("companyOrProject", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">
                AI command, workflow, or execution to evaluate
              </span>
              <textarea
                required
                maxLength={2000}
                className={TEXTAREA_CLASS}
                value={form.workflowToEvaluate}
                onChange={(event) => updateField("workflowToEvaluate", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">
                What result the customer expects
              </span>
              <textarea
                required
                maxLength={1600}
                className={TEXTAREA_CLASS}
                value={form.expectedResult}
                onChange={(event) => updateField("expectedResult", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">Relevant URL</span>
              <input
                type="url"
                maxLength={500}
                placeholder="https://"
                className={INPUT_CLASS}
                value={form.relevantUrl}
                onChange={(event) => updateField("relevantUrl", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white/90">Additional context</span>
              <textarea
                maxLength={2000}
                className={TEXTAREA_CLASS}
                value={form.additionalContext}
                onChange={(event) => updateField("additionalContext", event.target.value)}
              />
            </label>

            {error ? (
              <p
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                aria-live="polite"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Evaluation Request"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
