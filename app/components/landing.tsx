"use client";

import { useLocale } from "./locale-provider";

export function Hero() {
  const { t } = useLocale();
  const l = t.landing;

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,rgba(255,0,51,0.11),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="animate-fade-in-up text-[11px] font-medium tracking-[0.2em] text-accent uppercase">
          {l.heroEyebrow}
        </p>
        <h1 className="animate-fade-in-up stagger-1 mt-4 max-w-3xl text-balance text-3xl font-normal tracking-tight text-white/95 sm:text-4xl sm:leading-[1.15] lg:text-[2.75rem]">
          {l.heroTitle}
        </h1>
        <p className="animate-fade-in-up stagger-2 mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          {l.heroBody}
        </p>

        <div className="animate-fade-in-up stagger-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            {l.heroDemo}
          </a>
          <a
            href="/order"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-surface px-5 py-2.5 text-sm text-white/85 transition-colors hover:bg-surface-elevated"
          >
            {l.heroOrder}
          </a>
          <a
            href="#workflow"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.1] bg-surface px-5 py-2.5 text-sm text-white/85 transition-colors hover:bg-surface-elevated"
          >
            {l.heroWorkflow}
          </a>
        </div>

        <p className="animate-fade-in-up stagger-4 mt-10 text-xs text-muted">{l.heroTagline}</p>
      </div>
    </section>
  );
}

export function TrustIndicators() {
  const { t } = useLocale();
  const l = t.landing;

  return (
    <section className="border-y border-white/[0.06] bg-surface/50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-medium tracking-wider text-muted uppercase">
          {l.trustTitle}
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {l.trustItems.map((item, i) => (
            <li
              key={item.label}
              className={[
                "animate-fade-in-up rounded-xl border border-white/[0.07] bg-background/40 px-4 py-4",
                ["stagger-1", "stagger-2", "stagger-3", "stagger-4"][i],
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                <p className="text-sm font-medium text-white/90">{item.label}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WorkflowSection() {
  const { t } = useLocale();
  const l = t.landing;

  return (
    <section id="workflow" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={l.workflowEyebrow}
          title={l.workflowTitle}
          description={l.workflowDesc}
        />

        <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {l.workflowSteps.map((item, i) => (
            <li
              key={item.step}
              className={[
                "animate-fade-in-up group flex min-h-[240px] flex-col rounded-xl border border-white/[0.07] bg-surface p-5 transition-colors hover:border-white/[0.1] hover:bg-surface-elevated",
                ["stagger-1", "stagger-2", "stagger-3", "stagger-4"][i],
              ].join(" ")}
            >
              <span className="font-mono text-xs text-accent">{item.step}</span>
              <h3 className="mt-2 text-base font-medium text-white/92">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CTASection() {
  const { t } = useLocale();
  const l = t.landing;

  return (
    <section
      id="contact"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-elevated px-6 py-10 sm:px-10 sm:py-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(255,0,51,0.08),transparent)]"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-medium tracking-wider text-accent uppercase">
              {l.ctaEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-normal tracking-tight text-white/95 sm:text-3xl">
              {l.ctaTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{l.ctaDesc}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-col">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:scale-105 hover:opacity-90"
                >
                  {l.ctaDemo}
                </a>
                <p className="mt-3 text-center text-sm text-gray-400">
                  Powered by HAI Verification • Monetized by XGOMA Execution
                </p>
              </div>
              <a
                href="mailto:verify@hai.example"
                className="inline-flex h-fit items-center justify-center rounded-lg border border-white/[0.1] px-5 py-2.5 text-sm text-white/85 transition-colors hover:bg-background/50"
              >
                {l.ctaEnterprise}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ scanId }: { scanId: string | null }) {
  const { t } = useLocale();
  const l = t.landing;
  const n = t.common.nav;

  return (
    <footer className="border-t border-white/[0.06] bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20"
              aria-hidden
            >
              <svg
                className="size-4 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-white/90">{l.footerHumanVerified}</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">{l.footerDesc}</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted" aria-label="Footer">
            <a href="#origin" className="hover:text-white/80">
              {n.origin}
            </a>
            <a href="#workflow" className="hover:text-white/80">
              {n.workflow}
            </a>
            <a href="#demo" className="hover:text-white/80">
              {n.demo}
            </a>
            <a href="#contact" className="hover:text-white/80">
              {n.contact}
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} XGOMA Inc · HAI Verify. {l.footerCopyright}</p>
          {scanId ? (
            <p className="font-mono">
              {l.session} · {scanId}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium tracking-wider text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-normal tracking-tight text-white/95 sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
