# HAI-IC — Metrics Plan (numbers only)

**Product:** HAI-IC · **Rule:** Fill measured values only. Unmeasured → empty + exact steps. No subjective claims.

## Scorecard

| Metric | Target / definition | Measured value | Unit | Last measured |
|--------|---------------------|----------------|------|---------------|
| Processing speed | Analyze calls completed per second under load | **135.8696** | calls/s | 2026-08-11 · n=100 · `127.0.0.1:3001` |
| Latency p50 | Wall-clock `POST /api/hai-ic/analyze` client RTT | **6** | ms | 2026-08-11 · n=100 · loopback |
| Latency p95 | Wall-clock `POST /api/hai-ic/analyze` client RTT | **11** | ms | 2026-08-11 · n=100 · loopback |
| Cost reduction vs baseline | `(baseline_llm_cost − gated_llm_cost) / baseline_llm_cost × 100` | ________ | % | ________ |
| Uptime | Successful health checks / total checks | Target **≥ 99.9** · Measured: ________ | % | ________ |

Source artifact: `hai-ic/metrics/RESULTS.json` (loopback only — not a public SLA claim).

## Fixed product constants (not SLOs)

| Constant | Value |
|----------|-------|
| Intent Confidence range | 0–100 |
| Sincere Mode threshold | 75 |
| Hourly score boost | 0 |

## Measurement steps

### A. Processing speed + latency p50 / p95

1. Start local gate: `npm run dev:hai-ic` (loopback `127.0.0.1:3001`).
2. Confirm health: `curl -sS http://127.0.0.1:3001/api/hai-ic/health`.
3. Run: `node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200`.
4. Script writes `hai-ic/metrics/RESULTS.json` and prints table fields above.
5. Copy numeric fields from RESULTS into this scorecard (do not round for marketing).

**Method detail:** sequential or limited-concurrency POSTs with fixed fixture body; record `Date.now()` delta per call; sort durations; p50 = index `floor(0.50*(n-1))`; p95 = index `floor(0.95*(n-1))`; processing speed = `n / (total_wall_seconds)`.

### B. Cost reduction vs baseline

1. Choose baseline: same N prompts through buyer LLM **without** HAI-IC gate.
2. Record `baseline_llm_cost` = sum of provider billed tokens/USD for those N calls.
3. Run same N prompts through HAI-IC first; for each `sincereMode === false`, **do not** call the LLM (or call only clarification template — count as $0 LLM).
4. Record `gated_llm_cost` = sum of LLM USD only when `sincereMode === true`.
5. Compute: `((baseline_llm_cost - gated_llm_cost) / baseline_llm_cost) * 100`.
6. Write into scorecard; store raw inputs in `hai-ic/metrics/cost-run-<date>.json`.

**Empty until both costs are real numbers from one run.**

### C. Uptime (≥ 99.9% target)

1. Probe `GET /api/hai-ic/health` every 60s from the deploy host (or owner PC for local).
2. Success = HTTP 200 and JSON `ok === true`.
3. Window: rolling 30 days (or since first public deploy if shorter — state window explicitly).
4. Uptime % = `(successes / probes) * 100`.
5. Target gate: measured ≥ 99.9 before claiming SLA to buyers.

**Empty until probe log exists.** Local MVP uptime is not a public SLA claim.

## Output artifact

| File | Purpose |
|------|---------|
| `hai-ic/metrics/RESULTS.json` | Machine-filled latency/speed (and empty cost/uptime slots) |
| `hai-ic/metrics/uptime.log` | One line per probe: `ISO8601 status ok|fail` |
| This file | Human scorecard — numbers only after measurement |

## Forbidden

- Invented latency, uptime, or cost % in buyer email
- Inflating Intent Confidence to improve optics
- Claiming public uptime before public deploy + probe log
