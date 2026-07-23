'use client';

import { HaiIcDemo } from './hai-ic-demo';

const INTEGRATION = `curl -X POST https://hai-verify.workers.dev/api/hai-ic/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer hv_dev_..." \\
  -d '{"input":"Ship 200 units to Seoul by July 15, budget $50k"}'`;

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
            <a href="#api" className="hover:text-foreground">API</a>
            <a href="#xai" className="hover:text-foreground">xAI Integration</a>
            <a href="/verify" className="hover:text-foreground">HAI Verify</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* ===== HERO ===== */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 text-center">
          {/* Logo */}
          <div className="mb-10">
            <span className="text-4xl font-black tracking-tight">
              <span className="text-[#ff0033]">H</span>
              <span className="text-white">ai-ic</span>
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[1.05] text-white max-w-4xl">
            Before AI takes action,<br />
            <span className="text-[#ff0033]">measure intent first.</span>
          </h1>

          {/* Philosophy - small */}
          <p className="mt-8 text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Humans understand AI with Heart,<br className="hidden md:block" />
            and AI protects the Heart of Humanity.
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <a
              href="#demo"
              className="px-10 py-4 bg-[#ff0033] hover:bg-[#ff1a4d] text-white font-semibold rounded-full transition-all text-lg"
            >
              Try Live Demo
            </a>
            <a
              href="#pricing"
              className="px-10 py-4 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white font-medium rounded-full transition-all text-lg"
            >
              View Pricing
            </a>
          </div>
        </section>

        <section id="demo">
          <HaiIcDemo />
        </section>

        <section id="api" className="py-16 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted mb-3">API</p>
            <h3 className="text-3xl font-semibold mb-4">Drop-in pre-execution check</h3>
            <p className="text-muted leading-relaxed mb-6">
              POST 한 번으로 confidence, breakdown, clarifying questions, response mode를 받습니다.
              에이전트가 도구를 호출하기 전에 Hai-ic을 통과시키면 잘못된 실행을 줄일 수 있습니다.
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li>• <code className="text-foreground">POST /api/hai-ic/analyze</code></li>
              <li>• <code className="text-foreground">GET /api/hai-ic/health</code></li>
              <li>• Threshold: 75%</li>
            </ul>
          </div>
          <pre className="rounded-2xl border border-white/10 bg-surface p-5 text-xs md:text-sm overflow-x-auto leading-relaxed">
            {INTEGRATION}
          </pre>
        </section>

        <section id="xai" className="py-16 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.25em] text-muted mb-3">For xAI</p>
          <h3 className="text-3xl font-semibold mb-6">Why Hai-ic for Grok & agent stacks</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Before action',
                body: 'Grok가 답하기 전에 intent confidence를 노출해 사용자 신뢰를 높입니다.',
              },
              {
                title: 'Honest scoring',
                body: '모호하면 점수를 낮추고 질문합니다. 과장하지 않습니다.',
              },
              {
                title: 'Enterprise ready',
                body: 'HAI Verify 생태계의 1번 제품. 감사·승인 워크플로와 연결 가능.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-surface p-5">
                <h4 className="font-semibold mb-2">{card.title}</h4>
                <p className="text-sm text-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
          <div id="pricing" className="mt-10 rounded-2xl border border-red-accent/30 bg-red-accent/5 p-6">
            <p className="text-sm font-semibold text-red-accent mb-2">Production Ready · KARAM SHIN</p>
            <p className="text-sm text-muted leading-relaxed mb-3">
              Intent Confidence Gate for Grok, Gemini, Claude — reduces business risk from hallucination-driven actions.
            </p>
            <p className="text-xs text-muted">Licensing $8.5k–$25k/yr · OEM · Enterprise · Status: Ready to Sell</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        Human + Heart + AI + Law = Verification · Hai-ic by KARAM SHIN
      </footer>
    </div>
  );
}