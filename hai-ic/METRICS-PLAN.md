# HAI-IC — Metrics Plan (numbers only)

**Product:** HAI-IC  
**Rule:** No subjective claims. Empty = not measured. Fill only from measurement steps below.

---

## Targets & fields

| Metric | Target | Measured value | As-of | Source |
|--------|--------|----------------|-------|--------|
| Processing speed (analyze calls / sec, single instance) | ___ | ___ | ___ | `scripts/hai-ic-bench-latency.cjs` |
| Latency p50 (ms) | ___ | ___ | ___ | same |
| Latency p95 (ms) | ___ | ___ | ___ | same |
| Cost reduction vs baseline (%) | ___ | ___ | ___ | formula below |
| Uptime | **≥ 99.9%** | ___ | ___ | health probe log |

**Fixed product constants (not SLAs):**

| Constant | Value |
|----------|-------|
| Intent Confidence range | 0–100 |
| Sincere Mode gate | ≥ 75 |
| Score inflation boost | 0 |

**Trust Ledger (product proof, not infra SLA):**

| Metric | Value | Source |
|--------|-------|--------|
| Questions analyzed | 200 | `buyer-deliverables/TRUST-LEDGER.md` |
| OFF rate | 59% (118/200) | same |
| DD blocked | 115/126 | same |
| Avg IC | 75.8% | same |

---

## Measurement steps (exact)

### A) Processing speed + latency p50 / p95

```bash
# 1. Start local HAI-IC
npm run dev:hai-ic

# 2. Warmup
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/hai-ic/health

# 3. Bench (N=200 default)
node scripts/hai-ic-bench-latency.cjs

# 4. Copy printed fields into the table above:
#    processing_speed_rps, latency_p50_ms, latency_p95_ms
```

**Definitions**

- **Processing speed** = successful `POST /api/hai-ic/analyze` responses ÷ wall seconds.
- **Latency** = client-observed round-trip ms for that POST (local loopback unless BASE_URL set).
- **p50 / p95** = sorted latencies at 50th / 95th percentile (nearest-rank).

### B) Cost reduction vs baseline (%)

```
baseline_cost = (blocked_or_rerun_actions × avg_cost_per_bad_action)
               + (llm_tokens_wasted × token_unit_cost)

hai_ic_cost   = (analyze_calls × analyze_unit_cost)
               + (sincere_passes × downstream_llm_cost)

cost_reduction_% = 100 × (baseline_cost − hai_ic_cost) / baseline_cost
```

**Inputs (fill before claiming %):**

| Input | Value | Notes |
|-------|-------|-------|
| Measurement window | ___ | e.g. 14-day POC |
| blocked_or_rerun_actions | ___ | OFF events that prevented a bad send/act |
| avg_cost_per_bad_action (USD) | ___ | buyer-provided |
| llm_tokens_wasted (baseline) | ___ | optional |
| token_unit_cost (USD) | ___ | optional |
| analyze_unit_cost (USD) | ___ | HAI-IC call cost; 0 if self-hosted scoring |
| sincere_passes | ___ | ON count in window |
| downstream_llm_cost (USD) | ___ | only when Sincere Mode ON |

If any required input is missing → leave **Cost reduction %** blank.

### C) Uptime (≥ 99.9%)

```bash
# Probe every 60s for ≥ 30 days (or POC window), log HTTP status of:
#   GET {BASE_URL}/api/hai-ic/health
# Expect: JSON ok:true and HTTP 200

# uptime_% = 100 × (probes_ok / probes_total)
# Target: >= 99.9
```

| Field | Value |
|-------|-------|
| BASE_URL | ___ |
| Window start / end | ___ |
| probes_total | ___ |
| probes_ok | ___ |
| uptime_% | ___ |

---

## Cash evidence (separate from infra metrics)

| Field | Value | How to fill |
|-------|-------|-------------|
| Gross cash collected (USD) | ___ | Stripe Dashboard → Payments (succeeded) |
| Net payouts (USD) | ___ | Stripe → Payouts / bank |
| Paying customers (count) | ___ | distinct paid emails/sessions |

Do not copy marketing ranges ($8.5k–$25k) into “collected” until a charge succeeds.
