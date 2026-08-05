'use client';

// Copyright 2026 KARAM. All Rights Reserved.

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function IntakePage() {
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      company: (form.elements.namedItem('company') as HTMLInputElement).value.trim(),
      useCase: (form.elements.namedItem('useCase') as HTMLTextAreaElement).value.trim(),
    };

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) {
        setErrorMsg(json.error ?? 'Submission failed. Please try again.');
        setState('error');
      } else {
        setState('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted mb-3">HAI Verify · Intake</p>
          <h1 className="text-3xl font-bold text-white mb-4">Intake Received</h1>
          <p className="text-zinc-400 leading-relaxed">
            Thank you. The team will review your submission and reach out within 24–48 hours.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <p className="text-xs uppercase tracking-[0.3em] text-muted mb-3">HAI Verify · Evaluation</p>
        <h1 className="text-3xl font-bold text-white mb-2">Evaluation Intake</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Tell us about your use case so we can begin your Intent Confidence evaluation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Smith"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Work email <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jane@company.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme Corp"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition"
            />
          </div>

          <div>
            <label htmlFor="useCase" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Describe your AI use case <span className="text-red-400">*</span>
            </label>
            <textarea
              id="useCase"
              name="useCase"
              required
              rows={4}
              placeholder="We use an LLM agent to process customer orders. We want to gate execution on intent confidence before the agent acts..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition resize-none"
            />
          </div>

          {state === 'error' && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-600/30 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {state === 'submitting' ? 'Submitting…' : 'Submit Intake'}
          </button>
        </form>
      </div>
    </main>
  );
}
