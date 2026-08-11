#!/usr/bin/env node
/**
 * HAI-IC metrics measurement — fills latency + processing speed only.
 * Cost reduction and uptime stay empty until separate runs (see METRICS-PLAN.md).
 *
 * Usage:
 *   node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "hai-ic", "metrics");
const OUT_FILE = path.join(OUT_DIR, "RESULTS.json");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return fallback;
  return process.argv[i + 1];
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

async function main() {
  const base = String(arg("--base", "http://127.0.0.1:3001")).replace(/\/$/, "");
  const n = Math.max(1, parseInt(arg("--n", "50"), 10) || 50);
  const fixture =
    "Restart logistics partnership with Woosung Group via Transla by Q3, budget $50k";

  const healthRes = await fetch(`${base}/api/hai-ic/health`, {
    signal: AbortSignal.timeout(5000),
  }).catch((e) => ({ ok: false, error: e }));

  if (!healthRes.ok) {
    console.error("HEALTH FAIL — start: npm run dev:hai-ic");
    console.error("Do not invent latency numbers. Stopped before measure.");
    process.exit(1);
  }

  const durations = [];
  const wallStart = Date.now();

  for (let i = 0; i < n; i++) {
    const t0 = Date.now();
    const res = await fetch(`${base}/api/hai-ic/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: fixture }),
    });
    if (!res.ok) {
      console.error(`Analyze failed at i=${i} status=${res.status}`);
      process.exit(1);
    }
    await res.json();
    durations.push(Date.now() - t0);
  }

  const wallSec = (Date.now() - wallStart) / 1000;
  const sorted = [...durations].sort((a, b) => a - b);

  const results = {
    product: "HAI-IC",
    measuredAt: new Date().toISOString(),
    baseUrl: base,
    sampleSize: n,
    processing_speed_calls_per_s: Number((n / wallSec).toFixed(4)),
    latency_p50_ms: percentile(sorted, 0.5),
    latency_p95_ms: percentile(sorted, 0.95),
    cost_reduction_vs_baseline_pct: null,
    uptime_pct: null,
    uptime_target_pct: 99.9,
    notes: {
      cost: "Run METRICS-PLAN.md section B; leave null until both costs are real.",
      uptime: "Run METRICS-PLAN.md section C; leave null until probe log exists.",
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2) + "\n", "utf8");

  console.log("HAI-IC metrics (measured fields only)");
  console.log(`processing_speed_calls_per_s: ${results.processing_speed_calls_per_s}`);
  console.log(`latency_p50_ms: ${results.latency_p50_ms}`);
  console.log(`latency_p95_ms: ${results.latency_p95_ms}`);
  console.log(`cost_reduction_vs_baseline_pct: ${results.cost_reduction_vs_baseline_pct}`);
  console.log(`uptime_pct: ${results.uptime_pct} (target ${results.uptime_target_pct})`);
  console.log(`wrote: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
