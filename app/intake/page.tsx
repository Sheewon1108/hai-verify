"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type IntakeSuccess = {
  ok: true;
  mode: "mock";
  intakeId: string;
  tier: string;
  status: "received";
  nextSteps: string[];
  mockVerification: null;
  timestamp: string;
};

type IntakeError = { ok: false; error: string };

const FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-red-500/60 focus:outline-none";

export default function IntakePage() {
  const tier = "starter";
  const referral = "payment-success";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");
  const [sampleText, setSampleText] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeSuccess | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          contact: {
            name,
            email,
            company,
            role,
          },
          useCase,
          sampleText,
          referral,
          honeypot: website,
        }),
      });

      const data = (await response.json()) as IntakeSuccess | IntakeError;
      if (!response.ok || !data.ok) {
        setError("error" in data ? data.error : "Intake submission failed");
        return;
      }

      setResult(data);
      setName("");
      setEmail("");
      setCompany("");
      setRole("");
      setUseCase("");
      setSampleText("");
      setWebsite("");
    } catch {
      setError("Unable to submit intake right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          HAI sales intake
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">Finish your $300 evaluation request</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Payment is done. Submit the company and use-case details so the evaluation can be
          reviewed without any extra back-and-forth.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-surface p-8">
          {result ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-sm font-semibold text-emerald-300">Intake received</p>
              <p className="mt-2 text-sm text-white/90">
                Intake ID: <span className="font-mono">{result.intakeId}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {result.nextSteps.map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">Recorded at {result.timestamp}</p>
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm text-white/90">
                Name
                <input
                  className={FIELD_CLASS}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="block text-sm text-white/90">
                Work email
                <input
                  className={FIELD_CLASS}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block text-sm text-white/90">
                Company
                <input
                  className={FIELD_CLASS}
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  autoComplete="organization"
                />
              </label>
              <label className="block text-sm text-white/90">
                Role
                <input
                  className={FIELD_CLASS}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  autoComplete="organization-title"
                />
              </label>
            </div>

            <label className="block text-sm text-white/90">
              What should HAI evaluate?
              <textarea
                className={`${FIELD_CLASS} min-h-32`}
                value={useCase}
                onChange={(event) => setUseCase(event.target.value)}
                minLength={20}
                required
              />
            </label>

            <label className="block text-sm text-white/90">
              Optional sample AI output
              <textarea
                className={`${FIELD_CLASS} min-h-28`}
                value={sampleText}
                onChange={(event) => setSampleText(event.target.value)}
                maxLength={2000}
              />
            </label>

            <input type="hidden" name="tier" value={tier} />
            <input type="hidden" name="referral" value={referral} />
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit intake"}
              </button>
              <Link
                href="/payment-success"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3 text-base text-white/90 transition hover:bg-white/5"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
