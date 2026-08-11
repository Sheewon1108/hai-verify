# HAI-IC — Metrics Plan (numbers only)

**Product:** HAI-IC  
**Rule:** If not measured → empty field + exact steps. No subjective claims.

---

## Current values

| Metric | Unit | Value | As-of | Method ID |
|--------|------|-------|-------|-----------|
| Processing speed | analyses/sec | | | M1 |
| Latency p50 | ms | | | M2 |
| Latency p95 | ms | | | M2 |
| Cost reduction vs baseline | % | | | M3 |
| Uptime | % | | | M4 |
| Uptime target | % | **99.9** | fixed | SLA |
| Cash collected | USD settled | | | M5 |
| Trust Ledger questions | count | **200** | 2026-07-08 | TL |
| Sincere Mode ON | count (%) | **82 (41%)** | 2026-07-08 | TL |
| Sincere Mode OFF | count (%) | **118 (59%)** | 2026-07-08 | TL |
| Avg Intent Confidence | % | **75.8** | 2026-07-08 | TL |

Empty numeric cells = not yet measured.

---

## Measurement steps

### M1 — Processing speed (analyses/sec)

1. Base URL: `https://hai-verify.workers.dev` (or `http://127.0.0.1:3001` for local).  
2. Warm-up: 10 × `POST /api/hai-ic/analyze` with fixed body `{"input":"Ship 200 units to Seoul by July 15, budget $50k"}`.  
3. Run: 100 sequential requests; record wall-clock seconds `T`.  
4. Compute: `processing_speed = 100 / T`.  
5. Write value into table. Script: `node scripts/metrics/measure-hai-ic-latency.cjs`.

### M2 — Latency p50 / p95 (ms)

1. Same endpoint and body as M1.  
2. For each of N=100 requests, record `t_end - t_start` in ms (client-side).  
3. Sort ascending; `p50 = sorted[49]`, `p95 = sorted[94]` (0-based).  
4. Exclude warm-up. Do not average subjectively.  
5. Script writes `hai-ic/metrics/latest.json`.

### M3 — Cost reduction vs baseline (%)

1. Define baseline: buyer pipeline cost **without** HAI-IC for period P (USD). Sources allowed: LLM token invoice, human review hours × rate, incident cost — pick one and lock it.  
2. Define treatment: same period/workload **with** HAI-IC gate (USD). Include HAI-IC license + remaining LLM/review cost.  
3. Compute: `cost_reduction_pct = (baseline - treatment) / baseline * 100`.  
4. If either side missing → leave empty. Do not invent %.

### M4 — Uptime (%)

1. Probe: `GET /api/hai-ic/health` every 60s for 30 days (or since deploy if shorter).  
2. Success = HTTP 200 and JSON `ok === true` and `status === "healthy"`.  
3. `uptime_pct = success_count / probe_count * 100`.  
4. Target remains **≥ 99.9**; measured value is separate.  
5. Store probe log path in `hai-ic/metrics/uptime-log.csv` (timestamp, http_status, ok).

### M5 — Cash collected (USD)

1. Stripe Dashboard → Payments (or Payment Link `14A8wI6sV3CffST2UT4AU00`).  
2. Filter: status **Succeeded**, currency USD, product = HAI-IC pilot / related.  
3. Sum `amount_captured` (or settled).  
4. Enter `cash_collected_usd` + settlement dates. Never estimate from Checkout sessions that did not settle.

### TL — Trust Ledger (already measured)

Source of truth: `hai-ic/buyer-deliverables/TRUST-LEDGER.md` (auto-generated; scores not manually raised).

---

## Acceptance for buyer DD

| Field | Buyer-ready when |
|-------|------------------|
| p50 / p95 | M2 filled from N≥100 |
| processing speed | M1 filled |
| cost reduction | M3 both sides evidenced |
| uptime | M4 ≥ 7 days of probes |
| cash collected | M5 Stripe settled sum |

Until then: leave blank. Do not paraphrase as “fast” or “cheap.”
