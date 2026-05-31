// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential.
// Unauthorized copying or distribution of this file is strictly prohibited.

"use client";

import { useState } from "react";
import { SiteHeader } from "../components/site-header";
import { useLocale } from "../components/locale-provider";
import {
  CHECKOUT_PLANS,
  type CheckoutPlanId,
  type MockCheckoutSuccess,
} from "../lib/mock-stripe";
import {
  acceptLanguageHeader,
  formatRiskFlagsForAppLocale,
  type OrderCopy,
} from "../lib/ui-locale";

type VerifySuccess = {
  ok: true;
  trustIndex: number;
  hallucinationRisk: number;
  humanReviewRequired: boolean;
  riskFlags: string[];
  summary: string;
  recommendedNextStep: string;
};

type VerifyError = { ok: false; error: string };

type FlowPhase = "form" | "processing" | "checkout" | "report";

const PRICES: Record<CheckoutPlanId, string> = {
  starter: "$300",
  trust_pilot: "$1,500",
};

/** Order reports always use warm Korean messaging from verification.ts */
const ORDER_VERIFY_LOCALE = "ko" as const;

const FIELD_CLASS =
  "mt-2 w-full rounded-xl border border-white/[0.18] bg-background/90 px-3.5 py-2.5 text-sm text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/20";

const TEXTAREA_CLASS = `${FIELD_CLASS} resize-y py-3 leading-relaxed`;

function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-400/90" aria-hidden>
      *
    </span>
  );
}

function createOrderId(): string {
  const suffix = Date.now().toString(36).slice(-5).toUpperCase();
  return `XGOMA-${suffix}`;
}

function trustBarTone(trustIndex: number): string {
  if (trustIndex >= 70) return "bg-emerald-500";
  if (trustIndex >= 45) return "bg-amber-500";
  return "bg-orange-500";
}

async function postVerify(
  content: string,
  acceptLanguage: string,
): Promise<{ res: Response; data: VerifySuccess | VerifyError }> {
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": acceptLanguage,
    },
    body: JSON.stringify({ content, locale: ORDER_VERIFY_LOCALE }),
  });
  const data = (await res.json()) as VerifySuccess | VerifyError;
  return { res, data };
}

async function postCheckout(input: {
  planId: CheckoutPlanId;
  email: string;
  orderId: string;
}): Promise<{ res: Response; data: MockCheckoutSuccess | VerifyError }> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as MockCheckoutSuccess | VerifyError;
  return { res, data };
}

function LoadingOverlay({ message, sub }: { message: string; sub: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/[0.1] bg-surface-elevated px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto flex size-14 items-center justify-center">
          <span className="size-10 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
        </div>
        <p className="mt-6 text-sm font-medium leading-relaxed text-white/92">{message}</p>
        <p className="mt-2 text-[11px] text-muted">{sub}</p>
      </div>
    </div>
  );
}

function MockCheckoutPanel({
  planId,
  email,
  t,
  onConfirm,
  confirming,
}: {
  planId: CheckoutPlanId;
  email: string;
  t: OrderCopy;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const plan = CHECKOUT_PLANS[planId];
  const offer = t.offers[planId];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-surface-elevated shadow-2xl">
        <div className="border-b border-white/[0.06] bg-background/60 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <p id="checkout-title" className="text-sm font-medium text-white/92">
              {t.checkoutTitle}
            </p>
            <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300">
              {t.checkoutStripe}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-white/[0.08] bg-background/50 px-4 py-3.5">
            <p className="text-sm font-medium text-white/92">{offer.title}</p>
            <p className="mt-0.5 text-[11px] text-muted">{offer.subtitle}</p>
            <p className="mt-3 text-2xl tabular-nums text-accent">
              ${plan.priceUsd.toLocaleString("en-US")}
              <span className="ml-1 text-sm text-muted">USD</span>
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-background/40 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              {t.billingContact}
            </p>
            <p className="mt-1 text-sm text-white/85">{email}</p>
          </div>

          <p className="text-[11px] leading-relaxed text-muted">{t.checkoutMock}</p>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {confirming
              ? t.authorizing
              : `${t.pay} $${plan.priceUsd.toLocaleString("en-US")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarterFoundingCard({
  selected,
  t,
  onSelect,
}: {
  selected: boolean;
  t: OrderCopy;
  onSelect: () => void;
}) {
  const offer = t.offers.starter;
  const founding = t.foundingStarter;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border px-6 py-6 text-left transition-all duration-300 ${
        selected
          ? "border-accent/50 bg-accent/[0.08] ring-1 ring-accent/30 shadow-[0_0_48px_rgba(255,65,77,0.1)]"
          : "border-white/[0.08] bg-surface hover:border-white/[0.16] hover:bg-surface-elevated/80"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,65,77,0.14),transparent_70%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-accent/35 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-accent">
            {founding.badge}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
            {t.deliveryBadge}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-medium text-white/95">{offer.title}</p>
            <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted">{offer.subtitle}</p>
          </div>
          <span className="shrink-0 rounded-md border border-white/[0.12] bg-background/60 px-2 py-1 font-mono text-[10px] tracking-wider text-white/80">
            {t.certificateSeal}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-4xl tabular-nums tracking-tight text-accent">{PRICES.starter}</p>
          <span className="text-sm text-muted">/ {founding.priceNote}</span>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-white/78">{founding.noSub}</p>
        <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-white/88">
          {founding.delivery}
        </p>

        <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          {founding.whatsIncluded}
        </p>
        <ul className="mt-3 space-y-2">
          {offer.includes.map((item) => (
            <li key={item} className="flex gap-2.5 text-[12px] leading-relaxed text-white/78">
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] text-accent"
                aria-hidden
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
          {t.trustStrip.map((item) => (
            <span
              key={item}
              className="rounded-md border border-white/[0.08] bg-background/50 px-2 py-1 text-[10px] text-white/70"
            >
              {item}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-accent transition-opacity group-hover:opacity-90">
          {founding.cta} →
        </p>
        <p className="mt-2 text-[10px] italic leading-relaxed text-muted">* {founding.urgency}</p>
      </div>
    </button>
  );
}

function TrustPilotCard({
  selected,
  t,
  onSelect,
}: {
  selected: boolean;
  t: OrderCopy;
  onSelect: () => void;
}) {
  const offer = t.offers.trust_pilot;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
        selected
          ? "border-accent/40 bg-accent/[0.06] ring-1 ring-accent/25"
          : "border-white/[0.08] bg-surface hover:border-white/[0.14] hover:bg-surface-elevated/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/92">{offer.title}</p>
          <p className="mt-0.5 text-[11px] text-muted">{offer.subtitle}</p>
        </div>
        <span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
          {t.enterpriseBadge}
        </span>
      </div>
      <p className="mt-3 text-2xl tabular-nums text-accent">{PRICES.trust_pilot}</p>
      <ul className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-3">
        {offer.includes.map((item) => (
          <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-white/70">
            <span className="text-muted" aria-hidden>
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function OrderPage() {
  const { locale, order: t } = useLocale();
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<CheckoutPlanId>("starter");
  const [phase, setPhase] = useState<FlowPhase>("form");
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifySuccess | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<MockCheckoutSuccess | null>(null);
  const [orderId, setOrderId] = useState("");
  const [checkoutConfirming, setCheckoutConfirming] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedContent = content.trim();
    const trimmedEmail = email.trim();

    if (!trimmedContent) {
      setError(t.errContent);
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t.errEmail);
      return;
    }

    const id = createOrderId();
    setOrderId(id);
    setPhase("processing");
    setVerifyResult(null);
    setCheckoutResult(null);

    try {
      const { res, data } = await postVerify(
        trimmedContent,
        acceptLanguageHeader(locale),
      );
      if (!res.ok || !data.ok) {
        setError("error" in data ? data.error : t.errVerifyFailed);
        setPhase("form");
        return;
      }
      setVerifyResult(data);
      setPhase("checkout");
    } catch {
      setError(t.errVerify);
      setPhase("form");
    }
  }

  async function handleConfirmCheckout() {
    if (!orderId) return;
    setCheckoutConfirming(true);
    setError(null);

    try {
      const { res, data } = await postCheckout({
        planId,
        email: email.trim(),
        orderId,
      });
      if (!res.ok || !data.ok) {
        setError("error" in data ? data.error : t.errCheckoutFailed);
        setCheckoutConfirming(false);
        return;
      }
      setCheckoutResult(data);
      setPhase("report");
    } catch {
      setError(t.errCheckout);
    } finally {
      setCheckoutConfirming(false);
    }
  }

  function handleNewOrder() {
    setContent("");
    setEmail("");
    setPlanId("starter");
    setPhase("form");
    setError(null);
    setVerifyResult(null);
    setCheckoutResult(null);
    setOrderId("");
  }

  function handleSelectStarter() {
    setPlanId("starter");
  }

  function handleSelectTrustPilot() {
    setPlanId("trust_pilot");
  }

  return (
    <div className="relative min-h-full flex-1 bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,65,77,0.07),transparent_70%)]"
        aria-hidden
      />
      <SiteHeader />

      {phase === "processing" ? (
        <LoadingOverlay message={t.loadingMessage} sub={t.loadingSub} />
      ) : null}

      {phase === "checkout" && verifyResult ? (
        <MockCheckoutPanel
          planId={planId}
          email={email.trim()}
          t={t}
          onConfirm={handleConfirmCheckout}
          confirming={checkoutConfirming}
        />
      ) : null}

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="animate-fade-in-up mb-10 border-b border-white/[0.06] pb-8">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            {t.brand} · {t.intakeEyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-white/95 sm:text-3xl lg:text-[2rem]">
            {t.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t.subtitle}
          </p>
        </header>

        {phase === "report" && verifyResult && checkoutResult ? (
          <section className="space-y-6" aria-live="polite">
            <div className="rounded-2xl border border-emerald-500/20 bg-surface-elevated px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-300">{t.paymentConfirmed}</p>
                  <p className="mt-1 text-xs text-muted">
                    {PRICES[planId]} · {t.offers[planId].title} · {t.checkoutStripe}
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-muted">
                  <p>{checkoutResult.checkoutSessionId}</p>
                  <p className="mt-0.5">{orderId}</p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-white/[0.08] bg-surface-elevated p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-white/92">{t.reportTitle}</h2>
                  <p className="mt-1 text-[11px] text-muted">
                    {t.reportMeta.replace("{email}", email.trim())}
                  </p>
                </div>
                <span className="rounded-md border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] text-accent">
                  {t.paid} · {PRICES[planId]}
                  {planId === "starter" ? ` · ${t.certificateSeal}` : ""}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-white/[0.06] bg-background/60 px-4 py-4">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    {t.trustIndex}
                  </p>
                  <p className="text-2xl font-normal tabular-nums tracking-tight text-white/95">
                    {verifyResult.trustIndex}
                    <span className="ml-1 text-sm text-muted">/ 100</span>
                  </p>
                </div>
                <div
                  className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]"
                  role="progressbar"
                  aria-valuenow={verifyResult.trustIndex}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t.trustIndex}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${trustBarTone(verifyResult.trustIndex)}`}
                    style={{ width: `${verifyResult.trustIndex}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-background/60 px-4 py-3.5">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    {t.hallucinationRisk}
                  </p>
                  <p className="text-lg tabular-nums text-white/95">
                    {verifyResult.hallucinationRisk}
                    <span className="ml-1 text-sm text-muted">/ 100</span>
                  </p>
                </div>
                <div
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                  role="progressbar"
                  aria-valuenow={verifyResult.hallucinationRisk}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t.hallucinationRisk}
                >
                  <div
                    className="h-full rounded-full bg-orange-500/90 transition-[width] duration-500 ease-out"
                    style={{ width: `${verifyResult.hallucinationRisk}%` }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {t.riskFlags}
                </p>
                {verifyResult.riskFlags.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {formatRiskFlagsForAppLocale(verifyResult.riskFlags, locale).map(
                      ({ code, label }) => (
                        <li
                          key={code}
                          className="rounded-md border border-white/[0.08] bg-background/60 px-2 py-1 text-[11px] text-white/85"
                          title={code}
                        >
                          <span>{label}</span>
                          <span className="ml-1.5 font-mono text-[10px] text-muted">({code})</span>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">{t.noFlags}</p>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm leading-relaxed">
                <div className="rounded-xl border border-white/[0.06] bg-background/40 px-4 py-3.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    {t.summary}
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/90">
                    {verifyResult.summary}
                  </p>
                </div>
                <div className="rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    {t.nextStep}
                  </p>
                  <p className="mt-2 leading-relaxed text-white/90">
                    {verifyResult.recommendedNextStep}
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3.5 py-3 text-xs leading-relaxed text-amber-200/90">
                {t.disclaimer}
              </p>
            </section>

            <button
              type="button"
              onClick={handleNewOrder}
              className="rounded-lg border border-white/[0.1] bg-background px-4 py-2.5 text-sm text-white/85 transition-colors hover:border-white/[0.18]"
            >
              {t.submitAnother}
            </button>
          </section>
        ) : phase !== "report" ? (
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:items-start">
            <fieldset className="animate-fade-in-up stagger-1 space-y-4">
              <legend className="text-sm font-medium text-white/90">{t.selectProduct}</legend>
              <div className="grid gap-4" role="radiogroup" aria-label={t.selectProduct}>
                <StarterFoundingCard
                  selected={planId === "starter"}
                  t={t}
                  onSelect={handleSelectStarter}
                />
                <TrustPilotCard
                  selected={planId === "trust_pilot"}
                  t={t}
                  onSelect={handleSelectTrustPilot}
                />
              </div>
            </fieldset>

            <form
              onSubmit={handleSubmit}
              className="animate-fade-in-up stagger-2 space-y-6 lg:sticky lg:top-6"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-surface-elevated p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:p-6">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
                  {t.brand} · {t.intakeEyebrow}
                </p>
                <h2 className="mt-2 text-lg font-medium text-white/95">{t.contentLabel}</h2>
                <p className="mt-1 text-[11px] text-muted">{t.contentHint}</p>

                <label className="mt-4 block">
                  <span className="sr-only">
                    {t.contentLabel}
                    <RequiredMark />
                  </span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    required
                    placeholder={t.contentPlaceholder}
                    className={TEXTAREA_CLASS}
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-medium text-white/85">
                    {t.emailLabel}
                    <RequiredMark />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder={t.emailPlaceholder}
                    className={FIELD_CLASS}
                  />
                </label>

                {error ? (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                <p className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3.5 py-3 text-xs leading-relaxed text-amber-200/90">
                  {t.disclaimer}
                </p>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5">
                  <button
                    type="submit"
                    disabled={phase === "processing" || phase === "checkout"}
                    className="w-full rounded-lg bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground shadow-[0_4px_24px_rgba(255,65,77,0.22)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {planId === "starter" ? `${t.foundingStarter.cta} →` : t.submit} ·{" "}
                    {PRICES[planId]}
                  </button>
                  <p className="text-[11px] text-muted">{t.flowHint}</p>
                  {planId === "starter" ? (
                    <p className="text-[10px] italic text-muted">* {t.foundingStarter.urgency}</p>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        ) : null}

        <aside className="mt-10 rounded-xl border border-white/[0.06] bg-surface/50 px-4 py-4 text-xs leading-relaxed text-muted">
          <p>
            {t.asideHai} {t.asideXgoma}
          </p>
          <p className="mt-2">
            {t.freeScan}{" "}
            <a href="/verify" className="text-white/80 underline-offset-2 hover:underline">
              {t.returnVerify}
            </a>
          </p>
        </aside>

        <p className="mt-8 text-center text-xs text-muted">
          <a href="/" className="underline-offset-2 hover:text-white/80 hover:underline">
            {t.backLanding}
          </a>
        </p>
      </main>
    </div>
  );
}
