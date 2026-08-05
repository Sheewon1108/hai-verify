'use client';

import { useState } from 'react';
import { HaiIcDemo } from './hai-ic-demo';
import { HAI_PAYMENT_CTA_LABEL, HAI_PAYMENT_LINK } from '@/app/lib/hai-payment';

const PILOT_ORDER_URL = HAI_PAYMENT_LINK || '#';

const PILOT_CTA_CLASS =
  'inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-red-600/40 transition hover:brightness-110';

const INTEGRATION = `curl -X POST https://hai-verify.workers.dev/api/hai-ic/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer hv_dev_..." \\
  -d '{"input":"Ship 200 units to Seoul by July 15, budget $50k"}'`;

function RequestPilotLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={PILOT_ORDER_URL}
      aria-disabled={!HAI_PAYMENT_LINK}
      data-cta="stripe-pilot"
      className={`${className || PILOT_CTA_CLASS} ${HAI_PAYMENT_LINK ? '' : 'pointer-events-none opacity-50'}`}
    >
      {HAI_PAYMENT_CTA_LABEL}
    </a>
  );
}

function CurlCopyBlock() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INTEGRATION);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-zinc-700 bg-black p-4 sm:p-6 md:p-8 shadow-2xl">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-zinc-800 hover:text-white transition"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto whitespace-pre text-[13px] sm:text-base md:text-lg leading-relaxed text-zinc-100 pr-16 sm:pr-20 font-mono">
        {INTEGRATION}
      </pre>
    </div>
  );
}

export function HaiIcLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">HAI Verify · Product #1</p>
            <p className="text-2xl font-bold">Hai-ic</p>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-muted">
            <a href="#demo" className="hover:text-foreground">Demo</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#api" className="hover:text-foreground">API</a>
            <a href="#xai" className="hover:text-foreground">xAI Integration</a>
            <a href="/faq" className="hover:text-foreground">FAQ</a>
            <a href="/verify" className="hover:text-foreground">HAI Verify</a>
          </nav>
          <RequestPilotLink className="hidden rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:brightness-110 md:inline-flex" />
        </div>
      </header>

      <main>
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-full mb-8">
              <span className="text-red-400 text-sm font-medium tracking-widest">PRODUCT #1</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-[-0.04em] leading-none text-white mb-8">
              Before AI takes action,<br />
              <span className="bg-gradient-to-r from-[#ff0033] via-[#ff1a4d] to-[#ff6699] bg-clip-text text-transparent">
                measure intent first.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              Hai-ic measures <span className="text-red-400 font-semibold">Intent Confidence</span> of natural language requests
              <br />
              in real-time from 0 to 100. Executes only in <span className="text-red-400">Sincere Mode (75%+)</span>.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <RequestPilotLink />
              <a
                href="#demo"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-8 py-4 text-lg font-semibold text-white transition hover:border-white/25 hover:bg-white/5"
              >
                Open live demo
              </a>
            </div>
            <p className="mt-4 text-sm text-zinc-500">Stripe checkout → payment success → evaluation intake</p>
            <p className="mt-10 mx-auto max-w-3xl text-center text-lg md:text-xl font-medium text-zinc-100 leading-relaxed tracking-[0.01em]">
              Humans understand AI with Heart, and AI protects the Heart of Humanity.
            </p>
          </div>

          <section id="demo" className="mt-16 sm:mt-20">
            <HaiIcDemo />
          </section>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <section id="pricing" className="py-16 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted mb-3">Pricing</p>
            <h2 className="text-3xl font-semibold mb-4 text-white">Start with a $300 Evaluation Pilot</h2>
            <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              Pay once, then submit one real AI command, workflow, or execution path for HAI review. Broader licensing can follow after the evaluation if it is a fit.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] mb-10">
              <div className="rounded-3xl border border-red-500/30 bg-zinc-900 p-8 shadow-2xl shadow-red-950/30">
                <p className="text-red-400 text-sm font-medium mb-2">Evaluation Pilot</p>
                <p className="text-5xl font-black tracking-tight text-white mb-4">$300</p>
                <ul className="space-y-3 text-sm text-zinc-300 leading-relaxed">
                  <li>• Pay immediately with the Stripe Payment Link.</li>
                  <li>• Submit one real AI command, workflow, or execution path after payment.</li>
                  <li>• HAI reviews the submitted execution flow and responds through the email you provide.</li>
                </ul>
                <div className="mt-8">
                  <RequestPilotLink className={PILOT_CTA_CLASS} />
                </div>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
                <p className="text-sm font-medium text-white mb-3">What happens next</p>
                <ol className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                  <li>1. Complete the $300 payment.</li>
                  <li>2. Stripe redirects to the intake step.</li>
                  <li>3. Submit the exact execution flow you want evaluated.</li>
                  <li>4. HAI reviews the submitted workflow and follows up by email.</li>
                </ol>
                <p className="mt-6 text-xs text-zinc-500">
                  Enterprise, OEM, and annual licensing stay available after the paid evaluation instead of before it.
                </p>
              </div>
            </div>
          </section>

          <section id="api" className="py-16 border-t border-white/10">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.25em] text-muted mb-3">API</p>
              <h3 className="text-3xl md:text-4xl font-semibold mb-4">Drop-in pre-execution check</h3>
              <p className="text-muted text-base md:text-lg leading-relaxed mb-6">
                One POST returns confidence, breakdown, clarifying questions, and response mode. Route agent traffic through Hai-ic before tools run to cut bad executions.
              </p>
              <ul className="space-y-2 text-sm md:text-base text-muted">
                <li>• <code className="text-foreground">POST /api/hai-ic/analyze</code></li>
                <li>• <code className="text-foreground">GET /api/hai-ic/health</code></li>
                <li>• Threshold: 75%</li>
              </ul>
            </div>
            <CurlCopyBlock />
          </section>

          <section id="xai" className="py-16 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-muted mb-3">For xAI</p>
            <h2 className="text-3xl font-semibold mb-6">Why Hai-ic for Grok & agent stacks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 rounded-2xl p-6">
                <div className="text-emerald-400 font-medium">Before action</div>
                <p className="text-zinc-400">
                  Grok & agents get Intent Confidence score before execution. No hallucination-driven actions.
                </p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-6">
                <div className="text-emerald-400 font-medium">Honest scoring</div>
                <p className="text-zinc-400">
                  Real-time 0-100% scoring. Sincere Mode only above 75%.
                </p>
              </div>
              <div className="bg-zinc-900 rounded-2xl p-6">
                <div className="text-emerald-400 font-medium">Enterprise ready</div>
                <p className="text-zinc-400">
                  HAI-IC is built for serious AI stacks. Ready to sell.
                </p>
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-red-accent/30 bg-red-accent/5 p-6">
              <p className="text-sm font-semibold text-red-accent mb-2">Production Ready · KARAM SHIN</p>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Intent Confidence Gate for Grok, Gemini, Claude — reduces business risk from hallucination-driven actions.
              </p>
              <p className="text-xs text-muted">Licensing $8.5k–$25k/yr · OEM · Enterprise · Status: Ready to Sell</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6">
          <RequestPilotLink className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:brightness-110" />
          <p>Human + Heart + AI + Law = Verification · Hai-ic by KARAM SHIN</p>
        </div>
      </footer>
    </div>
  );
}
