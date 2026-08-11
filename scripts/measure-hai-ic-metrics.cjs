#!/usr/bin/env node

const { performance } = require("node:perf_hooks");

const DEFAULT_BASE_URL = "http://127.0.0.1:3001";
const DEFAULT_REQUESTS = 50;

const samples = [
  "Ship 200 units to Seoul by July 15 with a $50k budget.",
  "I want to restart business with Woosung Group through Transla Logistics. How should I approach them?",
  "Before a paid pilot, what latency, cost, and uptime metrics should be measured?",
  "Can the AI approve this action for me without human review?",
];

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function numberEnv(name) {
  const raw = process.env[name];
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function postAnalyze(baseUrl, input) {
  const start = performance.now();
  const res = await fetch(`${baseUrl}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok && body.ok === true,
    status: res.status,
    latencyMs: performance.now() - start,
    confidence: body.confidence,
    sincereMode: body.sincereMode,
    humanApprovalRequired: body.responsibility?.humanApprovalRequired,
  };
}

async function main() {
  const baseUrl = process.env.HAI_IC_METRICS_BASE_URL ?? DEFAULT_BASE_URL;
  const requests = Math.max(1, Number(process.env.HAI_IC_METRICS_REQUESTS ?? DEFAULT_REQUESTS));
  const baselineMonthlyUsd = numberEnv("BASELINE_MONTHLY_USD");
  const haiIcMonthlyUsd = numberEnv("HAI_IC_MONTHLY_USD");

  const startedAt = new Date().toISOString();
  const start = performance.now();
  const results = [];

  for (let i = 0; i < requests; i += 1) {
    results.push(await postAnalyze(baseUrl, samples[i % samples.length]));
  }

  const elapsedMs = performance.now() - start;
  const latencies = results.map((r) => r.latencyMs);
  const okCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - okCount;
  const costReductionPct =
    baselineMonthlyUsd !== null && haiIcMonthlyUsd !== null && baselineMonthlyUsd > 0
      ? ((baselineMonthlyUsd - haiIcMonthlyUsd) / baselineMonthlyUsd) * 100
      : null;

  const summary = {
    measuredAt: startedAt,
    baseUrl,
    totalRequests: results.length,
    okCount,
    failedCount,
    processingSpeedRequestsPerSecond: Number((results.length / (elapsedMs / 1000)).toFixed(2)),
    latencyMs: {
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      max: Number(Math.max(...latencies).toFixed(2)),
    },
    responsibilityGate: {
      checkedResponses: results.length,
      humanApprovalRequiredCount: results.filter((r) => r.humanApprovalRequired === true).length,
    },
    costReduction: {
      baselineMonthlyUsd,
      haiIcMonthlyUsd,
      reductionPercent: costReductionPct === null ? null : Number(costReductionPct.toFixed(2)),
    },
    uptime: {
      targetPercent: 99.9,
      measuredPercent: null,
      note: "Run scheduled health checks over the chosen measurement window before filling measuredPercent.",
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
