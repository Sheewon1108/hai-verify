"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white outline-none transition placeholder:text-muted/60 focus:border-red-accent/60";

export default function IntakePage() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company"),
          goal: formData.get("goal"),
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Intake failed");
      }

      form.reset();
      setSubmitState("success");
      setMessage("Intake received. KARAM can follow up from here.");
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Intake failed");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface-elevated p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-accent">
          HAI Verify Intake
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
          $300 Evaluation intake
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Share the minimum context needed to begin the HAI evaluation.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-white/90">
            Name
            <input
              name="name"
              required
              autoComplete="name"
              className={INPUT_CLASS}
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-medium text-white/90">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={INPUT_CLASS}
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-white/90">
            Company or project
            <input
              name="company"
              autoComplete="organization"
              className={INPUT_CLASS}
              placeholder="Company, project, or team"
            />
          </label>

          <label className="block text-sm font-medium text-white/90">
            What should HAI evaluate?
            <textarea
              name="goal"
              required
              rows={6}
              className={INPUT_CLASS}
              placeholder="Paste the workflow, AI action, claim, or sales page to evaluate."
            />
          </label>

          <button
            type="submit"
            disabled={submitState === "submitting"}
            className="w-full rounded-2xl bg-red-accent px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-accent/25 transition hover:brightness-110 disabled:opacity-50"
          >
            {submitState === "submitting" ? "Submitting..." : "Submit intake"}
          </button>

          {message ? (
            <p
              className={`rounded-xl border px-4 py-3 text-sm ${
                submitState === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/20 bg-red-500/10 text-red-200"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
