'use client';

import { useMemo, useState } from 'react';
import { analyzeIntent, type HaiIcResult } from '@/app/lib/hai-ic-analyze';

const EXAMPLES = [
  'I want to restart business with Woosung Group through Transla Logistics. How should I approach them?',
  'Finish this project by July 15 with a $50k budget and a four-person team.',
  'I want to send xAI a proposal to integrate the HAI-IC API.',
];

export function HaiIcDemo({ compact = false }: { compact?: boolean }) {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [result, setResult] = useState<HaiIcResult | null>(null);

  const confidenceColor = useMemo(() => {
    if (!result) return 'text-foreground';
    if (result.confidence >= 75) return 'text-emerald-400';
    if (result.confidence >= 60) return 'text-amber-400';
    return 'text-red-accent';
  }, [result]);

  const runAnalyze = () => {
    if (!input.trim()) return;
    setResult(analyzeIntent(input));
  };

  return (
    <section className={compact ? '' : 'py-8'}>
      <video
        src="/hai-ic-demo.mp4"
        controls
        autoPlay
        muted
        loop
        playsInline
        className="w-full max-w-3xl mx-auto rounded-2xl mb-8"
      />
      <div className="rounded-3xl border border-white/10 bg-surface p-6 md:p-8 shadow-2xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">Live Demo</p>
            <h2 className="text-2xl md:text-3xl font-semibold mt-1">Intent Confidence Analyzer</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setInput(sample);
                  setResult(analyzeIntent(sample));
                }}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted hover:border-red-accent hover:text-foreground transition"
              >
                Example
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runAnalyze();
          }}
          placeholder="Enter a natural-language request..."
          className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-background px-5 py-4 text-base md:text-lg outline-none focus:border-red-accent resize-none"
        />

        <button
          type="button"
          onClick={runAnalyze}
          disabled={!input.trim()}
          className="mt-4 w-full rounded-2xl bg-red-accent py-4 font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40 transition"
        >
          Analyze Intent
        </button>
        <p className="mt-2 text-center text-xs text-muted">Ctrl+Enter · instant local analysis</p>
      </div>

      {result && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-surface p-6 md:p-8 animate-[fade-in-up_0.35s_ease-out]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-end gap-4">
              <div className={`text-6xl md:text-7xl font-bold tabular-nums ${confidenceColor}`}>
                {result.confidence}%
              </div>
              <div>
                <p className="text-xl font-semibold">{result.mode}</p>
                <p className="text-sm text-muted">Intent Confidence</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background px-4 py-3 text-sm">
              <p className="text-muted">Product</p>
              <p className="font-mono">{result.product} v{result.version}</p>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-background overflow-hidden mb-8">
            <div
              className={`h-full transition-all duration-500 ${result.sincereMode ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            {[
              ['Core Intent', result.breakdown.core],
              ['Understood', result.breakdown.understood],
              ['Missing / Ambiguous', result.breakdown.missing],
              ['Potential Risk', result.breakdown.risk],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted mb-2">{label}</p>
                <p className="text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          {result.questions.length > 0 && (
            <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-300 mb-2">Clarifying Questions</p>
              <ul className="space-y-1 text-sm text-muted">
                {result.questions.map((q) => (
                  <li key={q}>• {q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted mb-3">Response</p>
            <div className="text-sm md:text-base leading-relaxed whitespace-pre-line">{result.response}</div>
          </div>
        </div>
      )}
    </section>
  );
}