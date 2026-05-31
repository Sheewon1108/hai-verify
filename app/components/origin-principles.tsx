"use client";

import { useLocale } from "./locale-provider";

export function OriginPrinciplesSection() {
  const { t } = useLocale();
  const o = t.origin;

  return (
    <section
      id="origin"
      className="scroll-mt-20 border-b border-white/[0.06] bg-surface/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <header className="relative">
          <p className="absolute right-0 top-0 text-[10px] tracking-wide text-white/35 sm:text-xs">
            {t.common.createdBy}
          </p>
          <div className="text-center">
            <h2 className="text-3xl font-normal tracking-tight text-white/95 sm:text-4xl">
              HAI Verify
            </h2>
            <p className="mt-3 text-sm font-medium tracking-wide text-accent sm:text-base">
              {o.tagline}
            </p>
          </div>
        </header>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-white/85 sm:text-base">
          <p>{o.intro1}</p>
          <p>
            {o.intro2a}
            <br />
            {o.intro2b}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-accent/20 bg-accent/[0.04] px-5 py-5 sm:px-6">
          <p className="text-[10px] font-medium tracking-wider text-accent uppercase">
            {o.compassEyebrow}
          </p>
          <p className="mt-3 text-base font-medium text-white/95 sm:text-lg">{o.compassHeadline}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/82 sm:text-base">{o.compassBody}</p>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {o.lenses.map((lens) => (
              <li
                key={lens.title}
                className="rounded-xl border border-white/[0.08] bg-background/50 px-3 py-3"
              >
                <p className="text-xs font-medium text-white/92">{lens.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{lens.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-background/50 px-5 py-5 sm:px-6">
          <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
            {o.principleEyebrow}
          </p>
          <ul className="mt-4 space-y-2 font-mono text-sm text-white/90 sm:text-base">
            {o.principles.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
            {o.behaviorEyebrow}
          </p>
          <ul className="mt-4 divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
            {o.behaviors.map((item) => (
              <li key={item.condition} className="px-4 py-3.5 sm:px-5">
                <p className="text-xs text-muted">{item.condition}</p>
                <p className="mt-1 text-sm text-white/88">{item.response}</p>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="mt-10 border-l-2 border-accent/50 pl-4 sm:pl-5">
          <p className="text-sm leading-relaxed text-white/90 sm:text-base">{o.quote}</p>
        </blockquote>

        <div className="mt-10">
          <p className="mb-4 text-center text-[10px] font-medium tracking-wider text-muted uppercase">
            {o.flowEyebrow}
          </p>
          <div
            className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-1"
            aria-label={o.flowEyebrow}
          >
            {o.flowSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-1 sm:gap-1">
                <span className="rounded-lg border border-white/[0.08] bg-surface px-3 py-2 text-center text-xs font-medium text-white/88 sm:text-sm">
                  {step}
                </span>
                {i < o.flowSteps.length - 1 ? (
                  <span className="hidden text-muted sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
                {i < o.flowSteps.length - 1 ? (
                  <span className="text-center text-xs text-muted sm:hidden" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-12 border-t border-white/[0.06] pt-8 text-center text-xs leading-relaxed text-muted">
          <p className="max-w-2xl mx-auto">{o.footerLegal}</p>
        </footer>
      </div>
    </section>
  );
}

/** Standalone docs-style page body (reuses same content blocks). */
export function OriginPrinciplesDocs() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <OriginPrinciplesSection />
    </article>
  );
}
