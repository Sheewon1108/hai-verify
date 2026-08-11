# HAI-IC — Metrics Plan (numbers only)

**Product:** HAI-IC  
**Rule:** Fill numbers from measurement only. Empty = not measured. No subjective claims.

---

## Targets / measured

| Metric | Target | Measured | Unit | Source |
|--------|--------|----------|------|--------|
| Processing speed | — | 125.6 | analyzes/sec | `hai-ic/metrics/RESULTS.json` (N=100, local :3001) |
| Latency p50 | — | 6 | ms | same |
| Latency p95 | — | 14.2 | ms | same |
| Cost reduction vs baseline | — | 20 | % | OFF/total on metrics sample (not Trust Ledger 200) |
| Uptime | ≥ 99.9 | | % | health probe log — **not measured** (needs ≥24h) |

Baseline definition (cost): **1 full LLM completion per uncertain request** vs **HAI-IC gate first** (OFF → no LLM call).

---

## Empty results file

After each run, write numbers into `hai-ic/metrics/RESULTS.json` (schema below). Until run: leave `null`.

```json
{
  "measuredAt": null,
  "endpoint": null,
  "sampleSize": null,
  "processingSpeedAnalyzesPerSec": null,
  "latencyMs": { "p50": null, "p95": null, "min": null, "max": null },
  "costReductionPctVsBaseline": null,
  "uptimePct": null,
  "uptimeWindowHours": null,
  "notes": "Fill only from scripts or Stripe/ops logs."
}
```

---

## Exact measurement steps

### A) Processing speed + latency p50 / p95

1. Set endpoint (default local): `HAI_IC_METRICS_URL=http://127.0.0.1:3001`
2. Ensure server healthy: `GET $HAI_IC_METRICS_URL/api/hai-ic/health` → `ok: true`
3. Run: `npm run hai-ic:metrics` (script: `scripts/hai-ic-metrics.cjs`)
4. Script POSTs N=100 fixed inputs to `/api/hai-ic/analyze`, records wall-clock ms per call
5. Compute: `processingSpeedAnalyzesPerSec = N / sum(seconds)`
6. Compute: sort latencies → p50 = index `floor(0.50*(N-1))`, p95 = index `floor(0.95*(N-1))`
7. Write `hai-ic/metrics/RESULTS.json`

### B) Cost reduction vs baseline

1. Baseline cost unit = `1.0` LLM call per request (always)
2. Run Trust Ledger / metrics batch; count `sincereMode === false` as **OFF**
3. `costReductionPctVsBaseline = (OFF / total) * 100`  
   (assumes OFF skips LLM; ON still incurs 1 LLM call after gate)
4. Record integer or one-decimal % in `costReductionPctVsBaseline`
5. Do not invent LLM $ rates unless invoice-backed

### C) Uptime ≥ 99.9%

1. Probe `GET /api/hai-ic/health` every 60s for window W hours (min 24h for a claim)
2. `uptimePct = (successes / probes) * 100`
3. Target gate: `uptimePct >= 99.9`
4. Until W≥24 and log exists: leave `uptimePct` null

### D) Cash (economic, not latency)

1. Stripe Dashboard → Payments / Balance → settled amount for HAI-IC pilot Payment Link
2. Log settlement ID + USD in private vault / local ops log only — **never commit secrets**
3. IP pack cash field stays empty until KARAM records settlement ID

---

## Command

```bash
npm run hai-ic:metrics
# optional:
HAI_IC_METRICS_URL=https://hai-verify.workers.dev HAI_IC_METRICS_N=100 npm run hai-ic:metrics
```
