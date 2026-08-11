#!/usr/bin/env node
/**
 * HAI-IC metrics measurement — fills numbers for METRICS-PLAN.md
 * Usage:
 *   node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200 --concurrency 1
 * Optional cost / uptime inputs (otherwise null):
 *   --baseline-usd 12.5 --hai-ic-usd 4.2
 *   --uptime-success 9990 --uptime-total 10000
 */

const fs = require("fs");
const path = require("path");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v === undefined ? fallback : v;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

const baseUrl = String(arg("base", "http://127.0.0.1:3001")).replace(/\/$/, "");
const n = Math.max(1, parseInt(arg("n", "50"), 10) || 50);
const concurrency = Math.max(1, parseInt(arg("concurrency", "1"), 10) || 1);
const sampleInput =
  arg("input", "Ship 200 units to Seoul by July 15, budget $50k") ||
  "Ship 200 units to Seoul by July 15, budget $50k";

const baselineUsd = arg("baseline-usd", null);
const haiIcUsd = arg("hai-ic-usd", null);
const uptimeSuccess = arg("uptime-success", null);
const uptimeTotal = arg("uptime-total", null);

async function oneAnalyze() {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: sampleInput }),
  });
  const ms = performance.now() - t0;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`analyze HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = await res.json();
  if (!body.ok) throw new Error(`analyze not ok: ${body.error || "unknown"}`);
  return ms;
}

async function runPool() {
  const latencies = [];
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (next < n) {
      const i = next++;
      void i;
      const ms = await oneAnalyze();
      latencies.push(ms);
    }
  });
  const wall0 = performance.now();
  await Promise.all(workers);
  const wallMs = performance.now() - wall0;
  return { latencies, wallMs };
}

function costReduction(baseline, hai) {
  if (baseline == null || hai == null) return null;
  const b = Number(baseline);
  const h = Number(hai);
  if (!Number.isFinite(b) || !Number.isFinite(h) || b <= 0) return null;
  return ((b - h) / b) * 100;
}

function uptimePct(success, total) {
  if (success == null || total == null) return null;
  const s = Number(success);
  const t = Number(total);
  if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) return null;
  return (s / t) * 100;
}

async function main() {
  const healthRes = await fetch(`${baseUrl}/api/hai-ic/health`);
  if (!healthRes.ok) throw new Error(`health HTTP ${healthRes.status}`);
  const health = await healthRes.json();
  if (!health.ok) throw new Error("health not ok");

  const { latencies, wallMs } = await runPool();
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const throughput = wallMs > 0 ? (latencies.length / wallMs) * 1000 : null;

  const out = {
    product: "HAI-IC",
    baseUrl,
    n: latencies.length,
    concurrency,
    throughput_rps: throughput == null ? null : Number(throughput.toFixed(3)),
    latency_p50_ms: p50 == null ? null : Number(p50.toFixed(3)),
    latency_p95_ms: p95 == null ? null : Number(p95.toFixed(3)),
    cost_reduction_pct: (() => {
      const v = costReduction(baselineUsd, haiIcUsd);
      return v == null ? null : Number(v.toFixed(3));
    })(),
    uptime_pct: (() => {
      const v = uptimePct(uptimeSuccess, uptimeTotal);
      return v == null ? null : Number(v.toFixed(4));
    })(),
    measuredAt: new Date().toISOString(),
    health: { product: health.product, version: health.version, status: health.status },
  };

  const dir = path.join(__dirname, "..", "hai-ic", "metrics");
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, "last-run.json");
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(out, null, 2));
  console.log(`[hai-ic-measure] wrote ${outPath}`);
  console.log("[hai-ic-measure] copy throughput_rps / latency_* into METRICS-PLAN.md Measured column");
}

main().catch((err) => {
  console.error("[hai-ic-measure] FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
