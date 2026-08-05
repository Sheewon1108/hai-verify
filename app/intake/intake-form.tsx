'use client';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FIELD_CLASS =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition';

const LABEL_CLASS = 'block text-sm font-medium text-zinc-300 mb-1.5';

export function IntakeForm() {
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
      execution: (form.elements.namedItem('execution') as HTMLTextAreaElement).value.trim(),
      expectedResult: (form.elements.namedItem('expectedResult') as HTMLTextAreaElement).value.trim(),
      relevantUrl: (form.elements.namedItem('relevantUrl') as HTMLInputElement).value.trim(),
      context: (form.elements.namedItem('context') as HTMLTextAreaElement).value.trim(),
    };

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json() as { ok: boolean; error?: string };

      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Submission failed. Please try again.');
        setState('error');
        return;
      }

      setState('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-10 text-center">
        <span className="mb-4 flex justify-center">
          <svg
            className="size-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </span>
        <h2 className="text-xl font-semibold text-white mb-3">Request received</h2>
        <p className="text-zinc-400 leading-relaxed">
          Evaluation request received. HAI will review the submitted execution flow and contact you
          using the email provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="name" className={LABEL_CLASS}>
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Your full name"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="email" className={LABEL_CLASS}>
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@company.com"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="company" className={LABEL_CLASS}>
          Company or project <span className="text-red-400">*</span>
        </label>
        <input
          id="company"
          name="company"
          type="text"
          required
          maxLength={160}
          placeholder="Company or project name"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="execution" className={LABEL_CLASS}>
          AI command, workflow, or execution to evaluate <span className="text-red-400">*</span>
        </label>
        <textarea
          id="execution"
          name="execution"
          required
          maxLength={4000}
          rows={5}
          placeholder="Describe the AI command, prompt, workflow, or execution you want evaluated for Intent Confidence."
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="expectedResult" className={LABEL_CLASS}>
          Expected result <span className="text-red-400">*</span>
        </label>
        <textarea
          id="expectedResult"
          name="expectedResult"
          required
          maxLength={2000}
          rows={3}
          placeholder="What outcome do you expect from this AI execution?"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="relevantUrl" className={LABEL_CLASS}>
          Relevant URL <span className="text-zinc-500 font-normal">(optional)</span>
        </label>
        <input
          id="relevantUrl"
          name="relevantUrl"
          type="url"
          maxLength={500}
          placeholder="https://..."
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="context" className={LABEL_CLASS}>
          Additional context <span className="text-zinc-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="context"
          name="context"
          maxLength={2000}
          rows={3}
          placeholder="Anything else HAI should know about your use case."
          className={FIELD_CLASS}
        />
      </div>

      {state === 'error' && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-600/30 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit Evaluation Request'}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        By submitting you confirm you have paid for the $300 Evaluation Pilot.
      </p>
    </form>
  );
}
