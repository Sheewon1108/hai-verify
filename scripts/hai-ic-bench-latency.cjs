#!/usr/bin/env node
/**
 * HAI-IC latency / throughput bench — numbers only for METRICS-PLAN.md
 *
 * Usage:
 *   node scripts/hai-ic-bench-latency.cjs
 *   BASE_URL=http://127.0.0.1:3001 N=200 node scripts/hai-ic-bench-latency.cjs
 */

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const N = Math.max(1, Number.parseInt(process.env.N || "200", 10) || 200);
const INPUT =
  process.env.BENCH_INPUT ||
  "Restart logistics partnership with Woosung Group via Transla by Q3, budget $50k";

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function oneCall() {
  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: INPUT }),
  });
  const ms = performance.now() - t0;
  let ok = res.ok;
  try {
    const body = await res.json();
    ok = ok && body && body.ok === true && typeof body.confidence === "number";
  } catch {
    ok = false;
  }
  return { ok, ms };
}

async function main() {
  const health = await fetch(`${BASE_URL}/api/hai-ic/health`);
  if (!health.ok) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: "health_failed",
          status: health.status,
          base_url: BASE_URL,
          hint: "Start with: npm run dev:hai-ic",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  // warmup
  await oneCall();

  const latencies = [];
  let successes = 0;
  const wallStart = performance.now();
  for (let i = 0; i < N; i++) {
    const { ok, ms } = await oneCall();
    if (ok) {
      successes += 1;
      latencies.push(ms);
    }
  }
  const wallSec = (performance.now() - wallStart) / 1000;
  latencies.sort((a, b) => a - b);

  const out = {
    ok: successes > 0,
    product: "hai-ic",
    base_url: BASE_URL,
    n_requested: N,
    n_success: successes,
    wall_seconds: Number(wallSec.toFixed(3)),
    processing_speed_rps: wallSec > 0 ? Number((successes / wallSec).toFixed(3)) : null,
    latency_p50_ms: percentile(latencies, 50) != null ? Number(percentile(latencies, 50).toFixed(2)) : null,
    latency_p95_ms: percentile(latencies, 95) != null ? Number(percentile(latencies, 95).toFixed(2)) : null,
    fill_into: "hai-ic/METRICS-PLAN.md",
  };

  console.log(JSON.stringify(out, null, 2));
  if (!out.ok) process.exit(2);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
});
