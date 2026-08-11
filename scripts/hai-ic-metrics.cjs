#!/usr/bin/env node
/**
 * HAI-IC metrics harness — processing speed + latency p50/p95 + OFF-based cost reduction proxy.
 * Writes hai-ic/metrics/RESULTS.json (numbers only; nulls if health fails).
 *
 * Env:
 *   HAI_IC_METRICS_URL  default http://127.0.0.1:3001
 *   HAI_IC_METRICS_N    default 100
 */

const fs = require("fs");
const path = require("path");

const BASE = (process.env.HAI_IC_METRICS_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const N = Math.max(1, parseInt(process.env.HAI_IC_METRICS_N || "100", 10) || 100);
const OUT = path.join(__dirname, "..", "hai-ic", "metrics", "RESULTS.json");

const SAMPLE_INPUTS = [
  "Ship 200 units to Seoul by July 15, budget $50k",
  "How should we reconnect with our old logistics partner?",
  "What is your latency and false positive rate before/after?",
  "Restart export deal with Woosung Group via Transla, Q3, 40 tons",
  "Any ideas for improving our chatbot answers?",
];

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

function emptyResults(notes) {
  return {
    measuredAt: null,
    endpoint: BASE,
    sampleSize: null,
    processingSpeedAnalyzesPerSec: null,
    latencyMs: { p50: null, p95: null, min: null, max: null },
    costReductionPctVsBaseline: null,
    uptimePct: null,
    uptimeWindowHours: null,
    notes,
  };
}

async function main() {
  let healthOk = false;
  try {
    const h = await fetch(`${BASE}/api/hai-ic/health`);
    const body = await h.json();
    healthOk = h.ok && body && body.ok === true;
  } catch (err) {
    const results = emptyResults(
      `Health check failed: ${err instanceof Error ? err.message : String(err)}. Start server or set HAI_IC_METRICS_URL.`,
    );
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + "\n");
    console.error("[hai-ic:metrics] health failed — wrote empty RESULTS.json");
    process.exitCode = 1;
    return;
  }

  if (!healthOk) {
    const results = emptyResults("Health endpoint did not return ok:true.");
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + "\n");
    console.error("[hai-ic:metrics] unhealthy — wrote empty RESULTS.json");
    process.exitCode = 1;
    return;
  }

  const latencies = [];
  let offCount = 0;
  const t0 = performance.now();

  for (let i = 0; i < N; i++) {
    const input = SAMPLE_INPUTS[i % SAMPLE_INPUTS.length];
    const start = performance.now();
    const res = await fetch(`${BASE}/api/hai-ic/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const json = await res.json();
    const ms = performance.now() - start;
    latencies.push(ms);
    if (json && json.sincereMode === false) offCount += 1;
  }

  const elapsedSec = (performance.now() - t0) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);
  const round1 = (n) => Math.round(n * 10) / 10;

  const results = {
    measuredAt: new Date().toISOString(),
    endpoint: BASE,
    sampleSize: N,
    processingSpeedAnalyzesPerSec: round1(N / elapsedSec),
    latencyMs: {
      p50: round1(percentile(sorted, 0.5)),
      p95: round1(percentile(sorted, 0.95)),
      min: round1(sorted[0]),
      max: round1(sorted[sorted.length - 1]),
    },
    costReductionPctVsBaseline: round1((offCount / N) * 100),
    uptimePct: null,
    uptimeWindowHours: null,
    notes:
      "costReductionPctVsBaseline = OFF/total*100 (LLM skipped on OFF). uptimePct requires ≥24h health probe log — see METRICS-PLAN.md.",
  };

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results, null, 2));
  console.log(`[hai-ic:metrics] wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
