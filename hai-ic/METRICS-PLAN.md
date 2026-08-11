# HAI-IC — Metrics Plan (numbers only)

**Product:** HAI-IC  
**Rule:** Fill measured values only. If unmeasured → leave blank + follow steps. No subjective claims.

## Targets / measured fields

| Metric | Unit | Target | Measured | As-of | Method ID |
|--------|------|--------|----------|-------|-----------|
| Processing speed | req/s | — | 252.471 | 2026-08-11T07:43:54Z | M1 |
| Latency p50 | ms | — | 4.685 | 2026-08-11T07:43:53Z | M2 |
| Latency p95 | ms | — | 7.210 | 2026-08-11T07:43:53Z | M2 |
| Cost reduction vs baseline | % | — | | | M3 |
| Uptime | % | ≥ 99.9 | | | M4 |

**Env for Measured speed/latency:** local loopback `127.0.0.1:3001` (not production SLA).  
**Artifacts:** `hai-ic/metrics/latency-c1-n200.json`, `hai-ic/metrics/throughput-c10-n200.json`

## Measurement log (append rows after each run)

| Run ID | Date (UTC) | Env | N samples | p50_ms | p95_ms | req_s | cost_red_% | uptime_% | Notes |
|--------|------------|-----|-----------|--------|--------|-------|------------|----------|-------|
| local-c1-n200 | 2026-08-11T07:43:53Z | 127.0.0.1:3001 | 200 | 4.685 | 7.210 | 185.111 | | | M2 latency (concurrency=1) |
| local-c10-n200 | 2026-08-11T07:43:54Z | 127.0.0.1:3001 | 200 | 39.202 | 42.733 | 252.471 | | | M1 throughput (concurrency=10); p50/p95 not used for Latency row |
| | | | | | | | | | |

## Measurement steps

### M1 — Processing speed (req/s)

1. Start HAI-IC: `npm run dev:hai-ic` (loopback `127.0.0.1:3001`).
2. Confirm health: `GET http://127.0.0.1:3001/api/hai-ic/health` → `ok: true`.
3. Run: `node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200 --concurrency 10`.
4. Record `throughput_rps` into **Processing speed** and log row.

### M2 — Latency p50 / p95 (ms)

1. Same setup as M1.
2. Script emits `latency_p50_ms` and `latency_p95_ms` from wall-clock of `POST /api/hai-ic/analyze` (single-flight samples, default `--concurrency 1` for pure latency).
3. Recommended latency pass: `node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200 --concurrency 1`.
4. Fill **Latency p50** / **Latency p95**. Do not round into marketing copy until two consecutive runs agree within 10%.

### M3 — Cost reduction vs baseline (%)

**Definition (fixed):**  
`cost_reduction_% = (baseline_cost - hai_ic_cost) / baseline_cost * 100`

| Symbol | Definition | How to measure |
|--------|------------|----------------|
| `baseline_cost` | USD of LLM tokens for N intents answered without gate | Sum provider invoice / usage for N calls that answer every intent |
| `hai_ic_cost` | USD of HAI-IC compute + LLM tokens for intents with Sincere Mode ON only | HAI-IC host cost for N analyzes + LLM cost only where `sincereMode === true` |
| `N` | Same intent set | Prefer Trust Ledger question files under `hai-ic/test-questions/` |

Steps:

1. Fix N and the exact prompt set (file path + hash).
2. Run baseline: every intent → LLM answer; record token USD.
3. Run HAI-IC gate: analyze all N; LLM only if `sincereMode`; record token USD + host cost.
4. Compute formula; fill **Cost reduction vs baseline**. Leave blank if either USD figure is missing.

### M4 — Uptime (≥ 99.9%)

**Definition (fixed):**  
`uptime_% = successful_health_checks / total_health_checks * 100` over window W.

Steps:

1. Window W default: 30 consecutive days (or ≥ 10_000 checks).
2. Probe: `GET /api/hai-ic/health` every 60s from monitor host.
3. Success = HTTP 200 and JSON `ok === true`.
4. Fill **Uptime**. Target gate: ≥ 99.9. If window incomplete → leave Measured blank; note checks completed in log.

## Script output contract

`scripts/hai-ic-measure-metrics.cjs` writes JSON to `hai-ic/metrics/last-run.json`:

```json
{
  "product": "HAI-IC",
  "baseUrl": "",
  "n": 0,
  "concurrency": 0,
  "throughput_rps": null,
  "latency_p50_ms": null,
  "latency_p95_ms": null,
  "cost_reduction_pct": null,
  "uptime_pct": null,
  "measuredAt": ""
}
```

`cost_reduction_pct` and `uptime_pct` stay `null` until M3/M4 inputs are supplied (flags `--baseline-usd` / `--hai-ic-usd` / `--uptime-success` / `--uptime-total`).

## Honesty lock

- Do not paste estimated latency, “~70% risk cut,” or uptime claims into buyer packs until Measured is filled from this plan.
- Trust Ledger OFF rates are **gate behavior samples**, not latency/cost/uptime metrics.
