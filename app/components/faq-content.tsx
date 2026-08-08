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
    question:
      '2. Why do I need HAI Verify if I already use ChatGPT, Claude, Gemini, Grok, Perplexity, DeepSeek, or local AIs (such as Naver HyperCLOVA, Doubao, or Qwen)?',
    answer: [
      'Those systems generate answers. HAI Verify checks whether those answers are reliable enough for your workflow. Think of it as quality assurance for AI decisions — model-agnostic.',
    ],
  },
  {
    question: '3. Does HAI Verify replace my AI?',
    answer: [
      'No. You keep using your preferred models. HAI Verify adds a verification layer before action. People still use natural language with their AI; HAI measures intent confidence and risk so decisions stay accountable. Hybrid by design.',
    ],
  },
  {
    question: '4. Who is HAI Verify designed for?',
    answer: [
      'Organizations that use AI where mistakes matter — legal, healthcare, finance, enterprise AI, government, and high-stakes customer support.',
    ],
  },
  {
    question: '5. What problem does HAI Verify solve?',
    answer: [
      'AI can produce convincing but incorrect outputs. HAI Verify helps teams identify high-risk responses, document review decisions, improve trust, and create audit trails.',
    ],
  },
  {
    question: '6. How is HAI Verify different from prompt engineering?',
    answer: [
      'Prompt engineering tries to improve the AI’s answer. HAI Verify evaluates the answer after it has been generated, before people rely on it.',
    ],
  },
  {
    question: '7. What do I receive?',
    answer: ['Verification Report, Risk Summary, Human Review Notes, Audit Log, and Verification Status.'],
  },
  {
    question: '8. Do I need to change my existing AI workflow?',
    answer: ['No. HAI Verify is designed to fit existing workflows with minimal disruption.'],
  },
  {
    question: '9. Is my data used to train AI models?',
    answer: [
      'No. Customer data remains under customer control. Verification results are for the customer’s workflow, not for model training.',
    ],
  },
  {
    question: '10. How can we start?',
    answer: ['Start with a small pilot on a real workflow. See how HAI Verify fits before a broader deployment.'],
  },
  {
    question: '11. Why should I trust HAI Verify?',
    answer: [
      'We don’t ask you to trust another AI. We provide a transparent verification process that humans can review, understand, and audit. Trust should come from evidence — not claims.',
      'Humans understand AI with Heart, and AI protects the Heart of Humanity.',
    ],
  },
  {
    question: '12. How long does implementation take?',
    answer: ['Pilot first; timeline depends on scope. Most teams start with a focused workflow, then expand.'],
  },
  {
    question: '13. What happens if HAI Verify disagrees with the AI?',
    answer: ['The case is flagged for human review. You decide. HAI does not silently override your process.'],
  },
  {
    question: '14. Can I integrate it with my existing system?',
    answer: ['Yes. Built to connect to existing stacks with minimal change.'],
  },
  {
    question: '15. Do you support API integration?',
    answer: ['Yes. API integration is supported for pre-execution checks and reporting.'],
  },
  {
    question: '16. What does the audit log include?',
    answer: ['Decision trail, verification status, risk notes, and review context needed for accountability.'],
  },
  {
    question: '17. How much human review is required?',
    answer: [
      'More when confidence is low; less in sincere mode (e.g. 75%+ intent confidence). You set the threshold for your risk level.',
    ],
  },
  {
    question: '18. Can I test it before committing?',
    answer: ['Yes. Use the public demo and a scoped pilot before broader rollout.'],
  },
  {
    question: 'Sensitive / confidential data',
    answer: [
      'Handled under customer control. Not used for model training. (Align final legal wording with your policy.)',
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
