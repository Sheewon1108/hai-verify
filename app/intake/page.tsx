"use client";

import { FormEvent, useState } from "react";

type IntakePayload = {
  name: string;
  email: string;
  companyOrProject: string;
  evaluationTarget: string;
  expectedResult: string;
  relevantUrl?: string;
  additionalContext?: string;
};

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-white/[0.18] bg-background/90 px-3.5 py-2.5 text-sm text-white/92 placeholder:text-white/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/20";

const TEXTAREA_CLASS = `${FIELD_CLASS} min-h-28 resize-y py-3 leading-relaxed`;

const INITIAL_FORM: IntakePayload = {
  name: "",
  email: "",
  companyOrProject: "",
  evaluationTarget: "",
  expectedResult: "",
  relevantUrl: "",
  additionalContext: "",
};

export default function IntakePage() {
  const [form, setForm] = useState<IntakePayload>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onChange = <K extends keyof IntakePayload>(key: K, value: IntakePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not submit evaluation request. Please try again.");
        return;
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch {
      setError("Could not submit evaluation request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="rounded-2xl border border-white/[0.08] bg-surface-elevated p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">HAI Verify</p>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Evaluation intake</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Submit the details for your paid evaluation request.
        </p>

        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
          Do not submit API keys, passwords, access tokens, private credentials, or unrelated
          personal information.
        </p>

        {submitted ? (
          <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Evaluation request received. HAI will review the submitted execution flow and contact
            you using the email provided.
          </p>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-white/90">
            Name *
            <input
              required
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              className={FIELD_CLASS}
              autoComplete="name"
            />
          </label>

          <label className="block text-sm text-white/90">
            Email *
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              className={FIELD_CLASS}
              autoComplete="email"
            />
          </label>

          <label className="block text-sm text-white/90">
            Company or project *
            <input
              required
              value={form.companyOrProject}
              onChange={(event) => onChange("companyOrProject", event.target.value)}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block text-sm text-white/90">
            AI command, workflow, or execution to evaluate *
            <textarea
              required
              value={form.evaluationTarget}
              onChange={(event) => onChange("evaluationTarget", event.target.value)}
              className={TEXTAREA_CLASS}
            />
          </label>

          <label className="block text-sm text-white/90">
            What result the customer expects *
            <textarea
              required
              value={form.expectedResult}
              onChange={(event) => onChange("expectedResult", event.target.value)}
              className={TEXTAREA_CLASS}
            />
          </label>

          <label className="block text-sm text-white/90">
            Relevant URL (optional)
            <input
              type="url"
              value={form.relevantUrl}
              onChange={(event) => onChange("relevantUrl", event.target.value)}
              className={FIELD_CLASS}
              placeholder="https://"
            />
          </label>

          <label className="block text-sm text-white/90">
            Additional context (optional)
            <textarea
              value={form.additionalContext}
              onChange={(event) => onChange("additionalContext", event.target.value)}
              className={TEXTAREA_CLASS}
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Evaluation Request"}
          </button>
        </form>
      </section>
    </main>
  );
}
