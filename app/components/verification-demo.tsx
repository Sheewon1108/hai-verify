"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { analyzeOutput, buildAuditReport } from "../lib/verification";

type VerificationDemoProps = {
  onScanIdChange?: (scanId: string | null) => void;
};

export function VerificationDemo({ onScanIdChange }: VerificationDemoProps) {
  const { scanId, regenerate } = useScanId();
  const [lastEvaluated, setLastEvaluated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiOutput, setAiOutput] = useState(
    "Draft a verification memo for a vendor contract clause on data retention and incident reporting. Include citations [1] and note jurisdictional limits.",
  );

  const analysis = useMemo(() => analyzeOutput(aiOutput), [aiOutput]);
  const tone = levelTone(analysis.level);

  const signalSummary =
    analysis.failCount > 0
      ? `${analysis.failCount} failed signal${analysis.failCount > 1 ? "s" : ""} detected.`
      : analysis.reviewCount > 0
        ? `${analysis.reviewCount} signal${analysis.reviewCount > 1 ? "s" : ""} need review.`
        : "All verification signals within policy thresholds.";

  const stampEvaluation = useCallback(() => {
    setLastEvaluated(
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
    );
  }, []);

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
      await navigator.clipboard.writeText(buildAuditReport(analysis, scanId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="demo" className="scroll-mt-20 border-t border-white/[0.06] bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Interactive demo"
          title="Live verification console"
          description="Paste AI output below to see hallucination risk, trust scoring, and human review routing — the same flow your reviewers use in production."
        />

        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-surface-elevated/50 p-4 sm:p-6">
          <DemoChrome isLive={Boolean(aiOutput.trim())} scanId={scanId} />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${tone.chip}`}>
                {analysis.level}
              </span>
              {lastEvaluated ? (
                <span className="text-xs text-muted">
                  Evaluated <span className="font-mono text-white/70">{lastEvaluated}</span>
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleRescan}
              disabled={!aiOutput.trim()}
              className="rounded-lg border border-white/[0.08] bg-background px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-surface disabled:opacity-40"
            >
              New scan
            </button>
          </div>

          <div className="mt-5">
            <StatusBanner
              status={analysis.overallStatus}
              level={analysis.level}
              signalSummary={signalSummary}
              trustIndex={analysis.trustIndex}
            />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-[11px] font-medium tracking-wider text-muted uppercase">
              Key metrics
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <MetricTile
                label="Hallucination risk"
                value={analysis.hallucinationRisk}
                unit="/ 100"
                hint={`${analysis.level} band`}
                progress={analysis.hallucinationRisk}
                invertProgress
                barClassName={tone.bar}
              />
              <MetricTile
                label="Trust index"
                value={analysis.trustIndex}
                unit="/ 100"
                hint="Composite score"
                progress={analysis.trustIndex}
              />
              <MetricTile
                label="Source coverage"
                value={analysis.metrics.sourceCoverage}
                unit="%"
                hint="Citations"
                progress={analysis.metrics.sourceCoverage}
              />
              <MetricTile
                label="Policy alignment"
                value={analysis.metrics.policyAlignment}
                unit="%"
                hint="Policy fit"
                progress={analysis.metrics.policyAlignment}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-7">
              <Card
                title="AI output"
                description="Paste model response to run verification checks."
                action={
                  <span className="font-mono text-[11px] text-muted">
                    {analysis.wordCount} words
                  </span>
                }
              >
                <textarea
                  value={aiOutput}
                  onChange={(e) => handleOutputChange(e.target.value)}
                  placeholder="Paste AI output here…"
                  className="min-h-[200px] w-full resize-y rounded-xl border border-white/[0.08] bg-background px-3.5 py-3 text-sm leading-relaxed text-white/90 placeholder:text-muted/60 focus:border-accent/35 focus:ring-2 focus:ring-accent/15 sm:min-h-[220px]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    {
                      label: "Compliance",
                      text: "Summarize GDPR retention requirements for customer support chat logs across EU member states with exact timeframes.",
                    },
                    {
                      label: "High risk",
                      text: "This medication is 100% safe for everyone and will definitely cure migraines. Take 900mg daily. No side effects.",
                    },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => handleOutputChange(sample.text)}
                      className="rounded-lg border border-white/[0.08] bg-background px-2.5 py-1.5 text-xs text-white/75 transition-colors hover:border-white/[0.12] hover:bg-surface"
                    >
                      {sample.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleOutputChange("")}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:text-white/80"
                  >
                    Clear
                  </button>
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-5">
              <Card title="Risk assessment" description="Composite hallucination score.">
                <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                  {[
                    { label: "Risk", value: analysis.hallucinationRisk, className: tone.text },
                    { label: "Trust", value: analysis.trustIndex, className: "text-accent" },
                    {
                      label: "Facts",
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
                    <dt className="text-muted">Queue</dt>
                    <dd className="mt-0.5 font-mono text-sm text-white/90">{analysis.queuePriority}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-background/60 px-3 py-2.5">
                    <dt className="text-muted">SLA</dt>
                    <dd className="mt-0.5 font-mono text-sm text-white/90">{analysis.reviewSla}</dd>
                  </div>
                </dl>
              </Card>

              <Card
                title="Human review"
                description="Routing per HAI-VERIFY-01."
                action={
                  <span
                    className={
                      analysis.humanReviewRequired
                        ? "text-xs font-medium text-red-400"
                        : "text-xs font-medium text-emerald-400"
                    }
                  >
                    {analysis.humanReviewRequired ? "Required" : "Optional"}
                  </span>
                }
              >
                <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-background/50 px-3 py-3">
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${
                      analysis.humanReviewRequired ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-white/90">
                      {analysis.humanReviewRequired
                        ? "Escalate to human verifier before release."
                        : "Standard review path for internal drafts."}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      Sources, regulated claims, and audit trail confirmed by verifier.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-7">
              <Card
                title="Verification summary"
                description="Audit-ready narrative."
                action={
                  <button
                    type="button"
                    onClick={handleCopyAudit}
                    disabled={!aiOutput.trim()}
                    className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-white/80 disabled:opacity-40"
                  >
                    {copied ? "Copied" : "Copy audit"}
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
                  {["Human", "Heart", "AI", "Law"].map((pillar) => (
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
              <Card title="Verification signals" description="Checks behind the risk index.">
                <ul className="divide-y divide-white/[0.06]">
                  {analysis.signals.map((s) => (
                    <li
                      key={s.label}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <SignalIcon state={s.state} />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/90">{s.label}</p>
                          <p className="truncate text-xs text-muted">{s.detail}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ring-1 ${signalChip(s.state)}`}
                      >
                        {s.state}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted">
                  Claim confidence · {analysis.metrics.claimConfidence}%
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
