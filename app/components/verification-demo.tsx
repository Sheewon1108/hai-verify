"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "./locale-provider";
import { SectionHeading } from "./landing";
import {
  Card,
  DemoChrome,
  levelTone,
  MetricTile,
  SignalIcon,
  signalChip,
  StatusBanner,
} from "./dashboard-ui";
import { useScanId } from "../hooks/use-scan-id";
import { localeToDateFormat } from "../lib/demo-copy";
import { toVerifyApiLocale } from "../lib/ui-locale";
import {
  analyzeOutputForDemo as analyzeOutput,
  buildAuditReport,
  formatScanHeadline,
} from "../lib/verification";

type VerificationDemoProps = {
  onScanIdChange?: (scanId: string | null) => void;
};

export function VerificationDemo(props: VerificationDemoProps) {
  const { locale } = useLocale();
  return <VerificationDemoInner key={locale} {...props} />;
}

function VerificationDemoInner({ onScanIdChange }: VerificationDemoProps) {
  const { locale, t } = useLocale();
  const d = t.demo;
  const apiLocale = toVerifyApiLocale(locale);

  const { scanId, regenerate } = useScanId();
  const [lastEvaluated, setLastEvaluated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiOutput, setAiOutput] = useState(d.defaultSample);

  const analysis = useMemo(() => analyzeOutput(aiOutput, apiLocale), [aiOutput, apiLocale]);
  const tone = levelTone(analysis.level);
  const levelLabel = d.levels[analysis.level];

  const signalSummary = !aiOutput.trim() ? d.statusIdleDesc : formatScanHeadline(analysis);

  const statusCopy = {
    idleLabel: d.statusIdleLabel,
    idleDesc: d.statusIdleDesc,
    clearedLabel: d.statusClearedLabel,
    reviewLabel: d.statusReviewLabel,
    blockedLabel: d.statusBlockedLabel,
    trustBadge: d.trustBadge,
    riskBadge: d.riskBadge,
  };

  const stampEvaluation = useCallback(() => {
    setLastEvaluated(
      new Intl.DateTimeFormat(localeToDateFormat(locale), {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
    );
  }, [locale]);

  useEffect(() => {
    onScanIdChange?.(scanId);
  }, [scanId, onScanIdChange]);

  useEffect(() => {
    if (!aiOutput.trim()) return;
    const timer = window.setTimeout(stampEvaluation, 300);
    return () => window.clearTimeout(timer);
  }, [aiOutput, stampEvaluation]);

  const handleOutputChange = (value: string) => {
    setAiOutput(value);
    if (!value.trim()) setLastEvaluated(null);
  };

  const handleRescan = () => {
    const id = regenerate();
    onScanIdChange?.(id);
    stampEvaluation();
  };

  const handleCopyAudit = async () => {
    try {
      await navigator.clipboard.writeText(buildAuditReport(analysis, scanId ?? undefined));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="demo" className="scroll-mt-20 border-t border-white/[0.06] bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={d.eyebrow} title={d.title} description={d.description} />

        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-surface-elevated/50 p-4 sm:p-6">
          <DemoChrome
            isLive={Boolean(aiOutput.trim())}
            scanId={scanId}
            enterpriseWorkspace={d.enterpriseWorkspace}
            policy={d.policy}
            liveEvaluation={d.liveEvaluation}
          />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${tone.chip}`}>
                {levelLabel}
              </span>
              {lastEvaluated ? (
                <span className="text-xs text-muted">
                  {d.evaluated}{" "}
                  <span className="font-mono text-white/70">{lastEvaluated}</span>
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleRescan}
              disabled={!aiOutput.trim()}
              className="rounded-lg border border-white/[0.08] bg-background px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-surface disabled:opacity-40"
            >
              {d.newScan}
            </button>
          </div>

          <div className="mt-5">
            <StatusBanner
              status={analysis.overallStatus}
              levelLabel={levelLabel}
              signalSummary={signalSummary}
              trustIndex={analysis.trustIndex}
              copy={statusCopy}
            />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-[11px] font-medium tracking-wider text-muted uppercase">
              {d.keyMetrics}
            </p>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <MetricTile
                label={d.hallucinationRisk}
                value={analysis.hallucinationRisk}
                unit="/ 100"
                hint={d.levelBand.replace("{level}", levelLabel)}
                progress={analysis.hallucinationRisk}
                invertProgress
                barClassName={tone.bar}
              />
              <MetricTile
                label={d.trustIndex}
                value={analysis.trustIndex}
                unit="/ 100"
                hint={d.compositeScore}
                progress={analysis.trustIndex}
              />
              <MetricTile
                label={d.sourceCoverage}
                value={analysis.metrics.sourceCoverage}
                unit="%"
                hint={d.citations}
                progress={analysis.metrics.sourceCoverage}
              />
              <MetricTile
                label={d.policyAlignment}
                value={analysis.metrics.policyAlignment}
                unit="%"
                hint={d.policyFit}
                progress={analysis.metrics.policyAlignment}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-7">
              <Card
                title={d.aiOutput}
                description={d.aiOutputDesc}
                action={
                  <span className="font-mono text-[11px] text-muted">
                    {analysis.wordCount} {d.words}
                  </span>
                }
              >
                <textarea
                  value={aiOutput}
                  onChange={(e) => handleOutputChange(e.target.value)}
                  placeholder={d.placeholder}
                  className="min-h-[200px] w-full resize-y rounded-xl border border-white/[0.08] bg-background px-3.5 py-3 text-sm leading-relaxed text-white/90 placeholder:text-muted/60 focus:border-accent/35 focus:ring-2 focus:ring-accent/15 sm:min-h-[220px]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOutputChange(d.complianceSample)}
                    className="rounded-lg border border-white/[0.08] bg-background px-2.5 py-1.5 text-xs text-white/75 transition-colors hover:border-white/[0.12] hover:bg-surface"
                  >
                    {d.sampleCompliance}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOutputChange(d.highRiskSample)}
                    className="rounded-lg border border-white/[0.08] bg-background px-2.5 py-1.5 text-xs text-white/75 transition-colors hover:border-white/[0.12] hover:bg-surface"
                  >
                    {d.sampleHighRisk}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOutputChange("")}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-white/80"
                  >
                    {d.clear}
                  </button>
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-5">
              <Card title={d.riskAssessment} description={d.riskAssessmentDesc}>
                <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                  {[
                    { label: d.statRisk, value: analysis.hallucinationRisk, className: tone.text },
                    { label: d.statTrust, value: analysis.trustIndex, className: "text-accent" },
                    {
                      label: d.statFacts,
                      value: `${analysis.metrics.factualConsistency}%`,
                      className: "text-white/90",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.06] bg-background/60 px-2 py-3"
                    >
                      <p className={`text-xl font-normal tabular-nums sm:text-2xl ${stat.className}`}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${tone.bar}`}
                    style={{ width: `${analysis.hallucinationRisk}%` }}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/[0.06] bg-background/60 px-3 py-2.5">
                    <dt className="text-muted">{d.queue}</dt>
                    <dd className="mt-0.5 font-mono text-sm text-white/90">{analysis.queuePriority}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-background/60 px-3 py-2.5">
                    <dt className="text-muted">{d.sla}</dt>
                    <dd className="mt-0.5 font-mono text-sm text-white/90">{analysis.reviewSla}</dd>
                  </div>
                </dl>
              </Card>

              <Card title={d.autoMode} description={d.autoModeDesc}>
                <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-background/50 px-3 py-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm text-white/90">{d.autoModeBody}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {d.queue} {analysis.queuePriority} · {d.sla} {analysis.reviewSla}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-7">
              <Card
                title={d.summaryTitle}
                description={d.summaryDesc}
                action={
                  <button
                    type="button"
                    onClick={handleCopyAudit}
                    disabled={!aiOutput.trim()}
                    className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-white/80 disabled:opacity-40"
                  >
                    {copied ? d.copied : d.copyAudit}
                  </button>
                }
              >
                <ul className="space-y-3">
                  {analysis.summary.map((line, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/85">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-accent/90" />
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  {d.pillars.map((pillar) => (
                    <span
                      key={pillar}
                      className="rounded-md border border-white/[0.07] bg-background/50 px-2 py-1 text-[11px] text-muted"
                    >
                      {pillar}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card title={d.signalsTitle} description={d.signalsDesc}>
                <ul className="divide-y divide-white/[0.06]">
                  {analysis.signals.map((s) => (
                    <li
                      key={s.label}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <SignalIcon state={s.state} />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/90">
                            {d.signalLabels[s.label] ?? s.label}
                          </p>
                          <p className="truncate text-xs text-muted">{s.detail}</p>
                        </div>
                      </div>
                      <span
                        className={
                          s.state === "review"
                            ? "shrink-0 rounded-lg bg-[#FF4D00] px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-[#FF6B1F]"
                            : `shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ring-1 ${signalChip(s.state)}`
                        }
                      >
                        {d.signalStates[s.state]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted">
                  {d.claimConfidence} · {analysis.metrics.claimConfidence}%
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
