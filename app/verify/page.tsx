"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/site-header";
import { useLocale } from "../components/locale-provider";
import type { VerifyCopy } from "../lib/site-copy";
import {
  acceptLanguageHeader,
  formatRiskFlagsForAppLocale,
  toVerifyApiLocale,
  type AppLocale,
} from "../lib/ui-locale";
import { csrfRequestHeaders } from "../lib/browser-security";

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

const VERIFY_FIELD_CLASS =
  "mt-2 w-full resize-y rounded-xl border border-white/[0.18] bg-background/90 px-3.5 py-3 text-sm leading-relaxed text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-white/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/20";

function trustBarTone(trustIndex: number): string {
  if (trustIndex >= 70) return "bg-emerald-500";
  if (trustIndex >= 45) return "bg-amber-500";
  return "bg-orange-500";
}

async function postVerify(
  text: string,
  locale: AppLocale,
): Promise<{ res: Response; data: VerifySuccess | VerifyError }> {
  const apiLocale = toVerifyApiLocale(locale);
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": acceptLanguageHeader(locale),
      ...csrfRequestHeaders(),
    },
    body: JSON.stringify({ content: text, locale: apiLocale }),
  });
  const data = (await res.json()) as VerifySuccess | VerifyError;
  return { res, data };
}

function formatReportForCopy(
  result: VerifySuccess,
  locale: AppLocale,
  v: VerifyCopy,
): string {
  const displayFlags = formatRiskFlagsForAppLocale(result.riskFlags, locale);
  const flagLines =
    displayFlags.length > 0
      ? displayFlags.map(({ code, label }) => `  - ${label} (${code})`).join("\n")
      : `  - (${v.noFlags})`;

  const yesNo = (value: boolean) => {
    if (locale === "ko") return value ? "예" : "아니오";
    if (locale === "ja") return value ? "はい" : "いいえ";
    if (locale === "es") return value ? "Sí" : "No";
    if (locale === "fr") return value ? "Oui" : "Non";
    return value ? "Yes" : "No";
  };

  return [
    "HAI VERIFY — VERIFICATION REPORT",
    "────────────────────────────────",
    "",
    v.trustIndex,
    `  ${v.trustIndex}:          ${result.trustIndex} / 100`,
    `  ${v.hallucinationRisk}:   ${result.hallucinationRisk} / 100`,
    `  Human Review Required: ${yesNo(result.humanReviewRequired)}`,
    "",
    v.riskFlags,
    flagLines,
    "",
    v.summary,
    `  ${result.summary}`,
    "",
    v.nextStep,
    `  ${result.recommendedNextStep}`,
    "",
    v.disclaimer,
  ].join("\n");
}

function formatResultForAi(
  input: string,
  result: VerifySuccess,
  locale: AppLocale,
  v: VerifyCopy,
): string {
  const inputPreview = input.length > 400 ? `${input.slice(0, 400)}…` : input;
  const displayFlags = formatRiskFlagsForAppLocale(result.riskFlags, locale);
  const flags =
    displayFlags.length > 0
      ? displayFlags.map(({ code, label }) => `- ${label} (${code})`).join("\n")
      : `- (${v.noFlags})`;

  return [
    "=== HAI VERIFY RESULT ===",
    "",
    "【INPUT】",
    inputPreview,
    "",
    "【SCORES】",
    `trustIndex: ${result.trustIndex}`,
    `hallucinationRisk: ${result.hallucinationRisk}`,
    `humanReviewRequired: ${result.humanReviewRequired}`,
    "",
    "【riskFlags】",
    flags,
    "",
    `【${v.summary}】`,
    result.summary,
    "",
    `【${v.nextStep}】`,
    result.recommendedNextStep,
    "",
    "【Disclaimer】",
    v.disclaimer,
    "",
    "【JSON】",
    JSON.stringify(
      {
        ok: true,
        trustIndex: result.trustIndex,
        hallucinationRisk: result.hallucinationRisk,
        humanReviewRequired: result.humanReviewRequired,
        riskFlags: result.riskFlags,
        summary: result.summary,
        recommendedNextStep: result.recommendedNextStep,
      },
      null,
      2,
    ),
  ].join("\n");
}

export default function VerifyPage() {
  const { locale, t } = useLocale();
  const v = t.verify;
  const [content, setContent] = useState("");
  const [result, setResult] = useState<VerifySuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const prevLocale = useRef<AppLocale | null>(null);

  useEffect(() => {
    if (prevLocale.current === null) {
      prevLocale.current = locale;
      return;
    }
    if (prevLocale.current === locale) return;
    prevLocale.current = locale;

    const trimmed = content.trim();
    if (!trimmed || !result) return;

    let cancelled = false;
    postVerify(trimmed, locale).then(({ res, data }) => {
      if (cancelled) return;
      if (res.ok && data.ok) {
        setResult(data);
        setCopiedReport(false);
        setCopiedShare(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale, content, result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setError(v.errEmpty);
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await postVerify(trimmed, locale);
      if (!res.ok || !data.ok) {
        setError("error" in data ? data.error : v.errFailed);
        return;
      }
      setResult(data);
      setCopiedReport(false);
      setCopiedShare(false);
    } catch {
      setError(v.errApi);
    } finally {
      setLoading(false);
    }
  }

  const shareText = result ? formatResultForAi(content.trim(), result, locale, v) : "";

  async function handleCopyReport() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatReportForCopy(result, locale, v));
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      setCopiedReport(false);
    }
  }

  async function handleCopyShare() {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      setCopiedShare(false);
    }
  }

  return (
    <div className="relative min-h-full flex-1 bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-[11px] font-medium tracking-wider text-muted uppercase">{v.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-white/95 sm:text-3xl">
            {v.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{v.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted">{v.fieldLabel}</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={v.placeholder}
              rows={8}
              className={VERIFY_FIELD_CLASS}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {loading ? v.submitting : v.submit}
          </button>
        </form>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {result ? (
          <section
            className="mt-8 rounded-2xl border border-white/[0.08] bg-surface-elevated p-5 sm:p-6"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-white/92">{v.resultTitle}</h2>
              <button
                type="button"
                onClick={handleCopyReport}
                className="shrink-0 rounded-lg border border-white/[0.1] bg-background px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:border-accent/30 hover:text-white"
              >
                {copiedReport ? v.copied : v.copyReport}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-background/60 px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {v.trustIndex}
                </p>
                <p className="text-2xl font-normal tabular-nums tracking-tight text-white/95">
                  {result.trustIndex}
                  <span className="ml-1 text-sm text-muted">/ 100</span>
                </p>
              </div>
              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuenow={result.trustIndex}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={v.trustIndex}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${trustBarTone(result.trustIndex)}`}
                  style={{ width: `${result.trustIndex}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted">{v.trustHint}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-background/60 px-4 py-3.5">
              <div className="flex items-end justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {v.hallucinationRisk}
                </p>
                <p className="text-lg tabular-nums text-white/95">
                  {result.hallucinationRisk}
                  <span className="ml-1 text-sm text-muted">/ 100</span>
                </p>
              </div>
              <div
                className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-valuenow={result.hallucinationRisk}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={v.hallucinationRisk}
              >
                <div
                  className="h-full rounded-full bg-orange-500/90 transition-[width] duration-500 ease-out"
                  style={{ width: `${result.hallucinationRisk}%` }}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">{v.scanNote}</p>

            <p className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3.5 py-3 text-xs leading-relaxed text-amber-200/90">
              {v.disclaimer}
            </p>

            <div className="mt-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {v.riskFlags}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{v.riskFlagsHint}</p>
              </div>
              {result.riskFlags.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {formatRiskFlagsForAppLocale(result.riskFlags, locale).map(({ code, label }) => (
                    <li
                      key={code}
                      className="rounded-md border border-white/[0.08] bg-background/60 px-2 py-1 text-[11px] text-white/85"
                      title={code}
                    >
                      <span>{label}</span>
                      <span className="ml-1.5 font-mono text-[10px] text-muted">({code})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">{v.noFlags}</p>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {v.summary}
                </p>
                <p className="mt-1 text-white/85">{result.summary}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  {v.nextStep}
                </p>
                <p className="mt-1 text-white/85">{result.recommendedNextStep}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.08] bg-background/50 px-4 py-3.5">
              <p className="text-xs leading-relaxed text-muted">{v.orderPrompt}</p>
              <a
                href="/order"
                className="mt-2 inline-flex text-sm font-medium text-accent underline-offset-2 hover:underline"
              >
                {v.orderLink}
              </a>
            </div>

            <section className="mt-6 border-t border-white/[0.08] pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white/92">{v.shareTitle}</h3>
                  <p className="mt-1 text-xs text-muted">{v.shareHint}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="shrink-0 rounded-lg border border-white/[0.1] bg-background px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:border-accent/30 hover:text-white"
                >
                  {copiedShare ? v.copied : v.copyShare}
                </button>
              </div>

              <textarea
                readOnly
                value={shareText}
                rows={14}
                className="mt-3 w-full resize-y rounded-xl border border-white/[0.08] bg-background/80 px-3.5 py-3 font-mono text-[11px] leading-relaxed text-white/85 focus:outline-none focus:ring-2 focus:ring-accent/15"
                onFocus={(e) => e.target.select()}
                aria-label={v.shareTitle}
              />
            </section>
          </section>
        ) : null}

        <p className="mt-8 text-center text-xs text-muted">
          <Link href="/" className="underline-offset-2 hover:text-white/80 hover:underline">
            {v.backLanding}
          </Link>
        </p>
      </main>
    </div>
  );
}
