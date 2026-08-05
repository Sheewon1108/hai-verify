"use client";

import { FormEvent, useState } from "react";

type IntakeApiResponse =
  | { ok: true; intakeId: string; receivedAt: string }
  | { ok: false; error: string };

export default function IntakePage() {
  const sessionId = "";
  const plan = "starter";

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          sessionId,
          company,
          name,
          email,
          notes,
        }),
      });

      const data = (await response.json()) as IntakeApiResponse;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Could not submit intake. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <section className="rounded-2xl border border-white/[0.08] bg-surface-elevated p-6">
        <p className="text-[11px] font-medium tracking-wider text-accent uppercase">Intake</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white/95">
          Submit delivery details
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Final step: share your delivery details after payment so the evaluation can start.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-white/85">Company</span>
            <input
              required
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.12] bg-background px-3 py-2 text-sm text-white/90"
              placeholder="Company name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/85">Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.12] bg-background px-3 py-2 text-sm text-white/90"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/85">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/[0.12] bg-background px-3 py-2 text-sm text-white/90"
              placeholder="billing@company.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/85">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-white/[0.12] bg-background px-3 py-2 text-sm text-white/90"
              placeholder="What should we evaluate first?"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit intake"}
          </button>
        </form>

        {result ? (
          <div className="mt-5 rounded-lg border border-white/[0.08] bg-background/40 px-4 py-3 text-sm">
            {result.ok ? (
              <p className="text-emerald-300">
                Intake submitted. Reference: <span className="font-mono">{result.intakeId}</span>
              </p>
            ) : (
              <p className="text-red-300">{result.error}</p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
