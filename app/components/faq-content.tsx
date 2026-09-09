'use client';

import { useState } from 'react';
import Link from 'next/link';

type FaqItem = {
  question: string;
  answer: string[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '1. What exactly is HAI Verify?',
    answer: [
      'HAI Verify verifies AI-generated outputs before they are trusted or acted upon. It helps organizations identify risky, inconsistent, or potentially hallucinated responses and provides a documented verification process.',
    ],
  },
  {
    question: '2. Why do I need HAI Verify if I already use ChatGPT, Claude, Gemini, Grok…?',
    answer: [
      'Those tools generate. HAI Verify scores whether the request is clear enough to act on. Generation and verification are different jobs.',
    ],
  },
  {
    question: '3. Does HAI Verify replace my AI?',
    answer: [
      'No. It sits in front of action. Your model still writes. HAI decides if the intent is ready.',
    ],
  },
  {
    question: '4. Who is HAI Verify designed for?',
    answer: [
      'Operators who use AI for real work — legal, ops, sales, product — and need a record before they execute.',
    ],
  },
  {
    question: '5. What problem does HAI Verify solve?',
    answer: [
      'AI answers that look finished but the ask was vague. HAI measures intent confidence 0–100 and only proceeds in Sincere Mode (75+).',
    ],
  },
  {
    question: '6. How is HAI Verify different from prompt engineering?',
    answer: [
      'Prompt engineering rewrites the ask. HAI scores the ask as it is, then gates action.',
    ],
  },
  {
    question: '7. What do I receive?',
    answer: [
      'A confidence score, a short gap list, a risk note, and a documented pass/hold before action.',
    ],
  },
  {
    question: '8. Do I need to change my existing AI workflow?',
    answer: ['No. Keep your models. Add HAI before you execute or send.'],
  },
  {
    question: '9. Is my data used to train AI models?',
    answer: ['No. Pilot inputs are for your verification run, not model training.'],
  },
  {
    question: '10. How can we start?',
    answer: ['Open https://hai-ic.com and start the Paid Pilot.'],
  },
  {
    question: '11. Why should I trust HAI Verify?',
    answer: [
      'You get a written score and a hold/go rule. You keep the decision. HAI does not hide behind a chat answer.',
    ],
  },
  {
    question: '12. How long does implementation take?',
    answer: ['Pilot is same day. API / workflow wiring is scoped after pilot.'],
  },
  {
    question: '13. What happens if HAI Verify disagrees with the AI?',
    answer: ['The AI draft is held. Missing conditions are listed. You confirm or stop.'],
  },
  {
    question: '14. Can I integrate it with my existing system?',
    answer: ['Yes, after pilot. Web first, then API.'],
  },
  {
    question: '15. Do you support API integration?',
    answer: ['Yes. Analyze is gated. Access is issued after pilot.'],
  },
  {
    question: '16. What does the audit log include?',
    answer: ['Time, score, missing conditions, risk note, and go/hold. No passwords. No keys.'],
  },
  {
    question: '17. How much human review is required?',
    answer: ['Below 75: human confirms. 75+: proceed, human still owns the outcome.'],
  },
  {
    question: '18. Can I test it before committing?',
    answer: [
      'Yes. Use the live site. Paid Pilot is the paid start. No password, bank statement, or remote-access request to begin.',
    ],
  },
];

function FaqRow({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
      >
        <span className="text-sm sm:text-base font-semibold text-white">{item.question}</span>
        <span
          aria-hidden
          className={`shrink-0 text-xl leading-none text-zinc-500 transition-transform duration-200 ${
            open ? 'rotate-45 text-red-400' : ''
          }`}
        >
          +
        </span>
      </button>
      {open ? (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-3">
          {item.answer.map((paragraph) => (
            <p key={paragraph} className="text-sm sm:text-base leading-relaxed text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FaqContent() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-black/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/hai-ic" className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">HAI Verify</span>
            <span className="text-lg font-bold text-white">FAQ</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/hai-ic" className="hover:text-white">
              Hai-ic
            </Link>
            <Link href="/verify" className="hover:text-white">
              Verify
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
            <span className="text-red-400 text-sm font-medium tracking-widest">FAQ</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.02em] text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about HAI Verify — verification for AI-generated outputs.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqRow key={item.question} item={item} defaultOpen={i === 0} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-zinc-500">
          Still have questions?{' '}
          <Link href="/order" className="text-red-400 hover:text-red-300 underline underline-offset-2">
            Request a pilot
          </Link>
          .
        </p>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        Human + Heart + AI + Law = Verification · Hai-ic by XGOMA Inc · KARAM SHIN
      </footer>
    </div>
  );
}
