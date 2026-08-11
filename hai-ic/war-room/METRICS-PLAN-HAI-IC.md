# HAI-IC Metrics Plan (Objective Only)

## Scope
Measure only these four metrics:
1. Processing speed
2. API latency (p50 / p95)
3. Cost reduction vs baseline infrastructure
4. Uptime target >= 99.9%

No subjective claims.

## Current status table
| Metric | Current value | Status | Source |
|---|---:|---|---|
| Processing speed | TBD | Not measured yet | Run Step 1 |
| Latency p50 | TBD | Not measured yet | Run Step 2 |
| Latency p95 | TBD | Not measured yet | Run Step 2 |
| Cost reduction vs baseline | TBD | Not measured yet | Run Step 3 |
| Uptime (30d) | TBD | Not measured yet | Run Step 4 |
| Uptime target | 99.9% | Defined | This plan |

## Exact measurement checklist

### Step 1 - Processing speed (local function runtime)
- Goal: ms/request for `analyzeIntent()`.
- Method:
  1. Prepare 1,000 representative requests in `hai-ic/test-questions`.
  2. Execute benchmark loop with warm-up (200) + measured runs (1,000).
  3. Record:
     - mean ms/request
     - p50 ms
     - p95 ms
     - requests/sec
- Output file: `hai-ic/war-room/metrics/processing-speed-YYYY-MM-DD.csv`

### Step 2 - API latency p50/p95 (`POST /api/hai-ic/analyze`)
- Goal: end-to-end request latency through HTTP API.
- Method:
  1. Run local server on `127.0.0.1:3001`.
  2. Send 1,000 POST requests with fixed payload mix (short/medium/DD prompts).
  3. Record p50/p95 latency in milliseconds.
  4. Repeat 3 times and keep median of each percentile.
- Output file: `hai-ic/war-room/metrics/api-latency-YYYY-MM-DD.csv`
- Required columns: `run_id,requests,total_seconds,p50_ms,p95_ms,error_rate`

### Step 3 - Cost reduction vs baseline infrastructure
- Goal: percent savings against defined baseline stack.
- Baseline definition (must be fixed before math):
  - Baseline monthly infra cost (USD): `B`
  - HAI-IC monthly infra cost (USD): `H`
- Formula:
  - Cost reduction % = `((B - H) / B) * 100`
- Method:
  1. Capture last 30-day infra bill for baseline (`B`).
  2. Capture last 30-day infra bill for HAI-IC path (`H`).
  3. Compute reduction using formula.
- Output file: `hai-ic/war-room/metrics/cost-reduction-YYYY-MM-DD.csv`

### Step 4 - Uptime tracking (target >= 99.9%)
- Goal: monthly availability percentage.
- Formula:
  - Uptime % = `((total_minutes - downtime_minutes) / total_minutes) * 100`
- For 30 days: total minutes = `43,200`
- Target max downtime at 99.9%: `43.2 minutes/month`
- Method:
  1. Enable health probe every 1 minute on `/api/hai-ic/health`.
  2. Log all non-200 responses + timeout durations.
  3. Sum downtime minutes over 30-day window.
- Output file: `hai-ic/war-room/metrics/uptime-YYYY-MM.csv`

## Reporting format (single source)
Publish monthly summary to:
- `hai-ic/war-room/metrics/METRICS-SUMMARY.md`

Required summary table:
| Month | Processing speed (ms req avg) | p50 (ms) | p95 (ms) | Cost reduction % | Uptime % |
|---|---:|---:|---:|---:|---:|
| YYYY-MM | TBD | TBD | TBD | TBD | TBD |
