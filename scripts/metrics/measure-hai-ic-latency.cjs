#!/usr/bin/env node
/**
 * HAI-IC metrics — M1 processing speed + M2 latency p50/p95
 * Usage:
 *   node scripts/metrics/measure-hai-ic-latency.cjs
 *   BASE_URL=https://hai-verify.workers.dev N=100 node scripts/metrics/measure-hai-ic-latency.cjs
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = (process.env.BASE_URL || "https://hai-verify.workers.dev").replace(/\/$/, "");
const N = Math.max(10, Number(process.env.N || 100));
const WARMUP = Math.max(0, Number(process.env.WARMUP || 10));
const BODY = JSON.stringify({
  input: "Ship 200 units to Seoul by July 15, budget $50k",
});

async function oneRequest() {
  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: BODY,
  });
  const t1 = performance.now();
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  await res.json();
  return t1 - t0;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length) - 1));
  // p50 → index floor(0.50 * n) - 1 can be -1 for tiny n; use nearest-rank
  const rank = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

async function main() {
  console.log(`HAI-IC latency measure → ${BASE_URL}  warmup=${WARMUP} N=${N}`);

  for (let i = 0; i < WARMUP; i++) {
    await oneRequest();
  }

  const samples = [];
  const wall0 = performance.now();
  for (let i = 0; i < N; i++) {
    samples.push(await oneRequest());
  }
  const wall1 = performance.now();

  const sorted = [...samples].sort((a, b) => a - b);
  const wallSec = (wall1 - wall0) / 1000;
  const processingSpeed = N / wallSec;
  const p50 = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);

  const out = {
    product: "hai-ic",
    productDisplay: "HAI-IC",
    baseUrl: BASE_URL,
    n: N,
    warmup: WARMUP,
    measuredAt: new Date().toISOString(),
    processing_speed_per_sec: Number(processingSpeed.toFixed(3)),
    latency_p50_ms: Number(p50.toFixed(2)),
    latency_p95_ms: Number(p95.toFixed(2)),
    latency_min_ms: Number(sorted[0].toFixed(2)),
    latency_max_ms: Number(sorted[sorted.length - 1].toFixed(2)),
  };

  const dir = path.join(__dirname, "../../hai-ic/metrics");
  fs.mkdirSync(dir, { recursive: true });
  const latest = path.join(dir, "latest.json");
  fs.writeFileSync(latest, JSON.stringify(out, null, 2) + "\n");

  console.log(JSON.stringify(out, null, 2));
  console.log(`Wrote ${latest}`);
  console.log("Copy p50/p95/processing_speed into hai-ic/METRICS-PLAN.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
