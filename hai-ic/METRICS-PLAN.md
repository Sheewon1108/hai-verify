# Hai-Ic — Metrics Plan
**Owner:** KARAM SHIN  
**Date:** 2026-08-11  
**Rule:** Numbers only. No subjective claims. "Not measured yet" = explicit label + exact measurement steps.

---

## Current Status Table

| Metric | Current Value | Source | Status |
|--------|--------------|--------|--------|
| Questions analyzed (total) | 200 | `TRUST-LEDGER.md`, `test-questions/` corpus | Measured |
| Sincere Mode ON rate | 41% (82/200) | Trust Ledger | Measured |
| Sincere Mode OFF rate | 59% (118/200) | Trust Ledger | Measured |
| Average Intent Confidence | 75.8% | Trust Ledger | Measured |
| DD questions analyzed | 126 | Trust Ledger | Measured |
| DD OFF rate (evidence blocked) | 91.3% (115/126) | Trust Ledger | Measured |
| Hourly boost at production | 0% | `boost-state.json` → `boostPercent: 0` | Measured |
| API processing speed (p50) | Not measured yet | See §2 | Pending |
| API processing speed (p95) | Not measured yet | See §2 | Pending |
| End-to-end latency (p50) | Not measured yet | See §2 | Pending |
| End-to-end latency (p95) | Not measured yet | See §2 | Pending |
| Cost per analyze call (infra) | Not measured yet | See §3 | Pending |
| Baseline infra cost (pre-Hai-Ic) | Not measured yet | See §3 | Pending |
| Cost reduction % vs baseline | Not measured yet | See §3 | Pending |
| Uptime (last 30 days) | Not measured yet | See §4 | Pending |
| Uptime target | ≥ 99.9% | — | Target set |

---

## §1 — Existing Measurements (no new work needed)

All values in the table above marked "Measured" are sourced from:
- `hai-ic/buyer-deliverables/TRUST-LEDGER.md` — aggregate Trust Ledger
- `hai-ic/boost-state.json` — boost/penalty calibration log
- `hai-ic/test-questions/` — 25 step files, ~1,580 lines of scored inputs

To refresh: run `node scripts/generate-buyer-trust-pack.cjs` — outputs updated ledger snapshot.

---

## §2 — Latency Measurement Steps

**Goal:** p50 and p95 response time for `POST /api/hai-ic/analyze`

**Steps (exact, run in order):**

```bash
# 1. Start server
npm run dev:hai-ic
# Server listens on 127.0.0.1:3001

# 2. Run 100 timed requests with curl (no external LLM call — pure gate logic)
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{time_total}\n" \
    -X POST http://localhost:3001/api/hai-ic/analyze \
    -H "Content-Type: application/json" \
    -d '{"input":"Can you recommend a logistics partner for Nexen?"}' \
  >> /tmp/hai-ic-latency.txt
done

# 3. Compute p50 and p95
sort -n /tmp/hai-ic-latency.txt | awk '
  BEGIN{c=0} {a[c++]=$1}
  END{
    p50=a[int(c*0.50)]; p95=a[int(c*0.95)];
    printf "p50: %.3fs\np95: %.3fs\n", p50, p95
  }'
```

**Placeholder targets (update after measurement):**
- p50: < 50 ms (pure in-process scoring, no LLM call)
- p95: < 150 ms

**Record results in:** `hai-ic/reports/latency-YYYY-MM-DD.md`

---

## §3 — Cost Measurement Steps

**Goal:** Cost per analyze call; reduction vs passing all inputs to LLM

**Steps:**

1. **Infra cost per call (Hai-Ic gate only)**
   - Cloudflare Workers pricing: $0.000015 per invocation (first 10M req/mo free on paid plan)
   - Record: `(monthly_infra_cost) / (total_analyze_calls_that_month)`
   - Placeholder: ~$0.000015/call (Workers) or ~$0.000001/call (self-hosted Node, compute only)

2. **Baseline cost (passing all inputs directly to LLM)**
   - Measure: take 200 test inputs, count tokens, price at current LLM rate (e.g., GPT-4o: $2.50/1M input tokens)
   - Formula: `(avg_tokens_per_input × price_per_token) × total_calls`
   - Placeholder: **not measured yet** — requires token count from LLM provider

3. **Reduction calculation**
   - OFF-rate = 59% (measured). These calls never reach the LLM.
   - Cost reduction lower bound = 59% of LLM inference cost saved (OFF calls blocked)
   - Formula: `OFF_rate × baseline_LLM_cost_per_call × volume`
   - Placeholder: **not measured yet** — fill in after step 2

**Record results in:** `hai-ic/reports/cost-baseline-YYYY-MM-DD.md`

---

## §4 — Uptime Measurement Steps

**Goal:** ≥ 99.9% uptime (≤ 8.7 hours downtime/year)

**Steps:**

1. **Immediate (local monitoring)**
   ```bash
   # Add to cron or PM2 (ecosystem.config.cjs already exists)
   # PM2 restart policy: max_restarts: 10, restart_delay: 4000
   pm2 start ecosystem.config.cjs --only hai-ic
   pm2 monit
   ```

2. **Uptime logging (add to health check)**
   - `GET /api/hai-ic/health` already returns `{"status":"ok","version":"1.0.0-mvp"}`
   - Schedule: `curl http://localhost:3001/api/hai-ic/health` every 60s via cron
   - Log: append `$(date -u +%Y-%m-%dT%H:%M:%SZ) OK` or `FAIL` to `/tmp/hai-ic-uptime.log`

3. **Calculation**
   ```bash
   total=$(wc -l < /tmp/hai-ic-uptime.log)
   ok=$(grep -c OK /tmp/hai-ic-uptime.log)
   awk "BEGIN{printf \"Uptime: %.3f%%\n\", ($ok/$total)*100}"
   ```

4. **External monitoring (when public URL deployed)**
   - Use UptimeRobot free tier (1-minute checks) or Better Uptime
   - Record 30-day window before any buyer demo

**Placeholder until measured:** uptime = not measured; target = ≥ 99.9%

---

## §5 — Reporting Cadence

| Frequency | Action |
|-----------|--------|
| Each outreach batch | Run `generate-buyer-trust-pack.cjs` → update Trust Ledger |
| Weekly | Run latency benchmark (§2); append to reports/ |
| Monthly | Update cost table (§3); append to reports/ |
| Pre-demo | Pull all measured values into BUYER-ONE-PAGER.md table |

---

*All measurements above use live system data. "Not measured yet" entries have exact steps to fill placeholders — no estimates, no claims.*
