# HAI-IC Metrics Plan

Objective only. Do not publish a number until the measurement row has a source file, command output, dashboard export, or receipt.

## Current status table

| Metric | Target / formula | Current status | Measurement source |
|---|---:|---|---|
| Processing speed | requests per second = total requests / elapsed seconds | Local measured: 61.17 req/s across 50 requests; production not measured yet | `hai-ic/METRICS-LOCAL-2026-08-11.json` |
| Latency p50 | 50th percentile POST `/api/hai-ic/analyze` latency in ms | Local measured: 6.7 ms; production not measured yet | `hai-ic/METRICS-LOCAL-2026-08-11.json` |
| Latency p95 | 95th percentile POST `/api/hai-ic/analyze` latency in ms | Local measured: 16.29 ms; production not measured yet | `hai-ic/METRICS-LOCAL-2026-08-11.json` |
| Cost reduction vs baseline infrastructure | `((baseline_monthly_usd - hai_ic_monthly_usd) / baseline_monthly_usd) * 100` | Not measured yet | Fill `BASELINE_MONTHLY_USD` and `HAI_IC_MONTHLY_USD`, then run metrics |
| Uptime | >= 99.9% successful health checks | Target set; not measured yet | Scheduled `GET /api/hai-ic/health` checks over selected window |
| Trust Ledger sample size | questions analyzed | 200 | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Sincere Mode ON | count and percent | 82 / 200 = 41% | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Sincere Mode OFF | count and percent | 118 / 200 = 59% | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Due-diligence OFF | blocked DD questions / DD questions | 115 / 126 = 91.27% | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Human approval gate | responses with `humanApprovalRequired = true` / total responses | Local measured: 50 / 50 = 100%; production not measured yet | `hai-ic/METRICS-LOCAL-2026-08-11.json` |
| Real cash collected | verified paid receipts only | Not measured in repo yet | Stripe dashboard export or manual invoice receipt log |

## Exact measurement steps

### 1. Processing speed and latency

1. Start the local HAI-IC server:
   ```bash
   npm run dev:hai-ic
   ```
2. In a second terminal, run:
   ```bash
   npm run hai-ic:metrics
   ```
3. For a deployed endpoint, run:
   ```bash
   HAI_IC_METRICS_BASE_URL="https://YOUR_DEPLOYED_DOMAIN" HAI_IC_METRICS_REQUESTS=100 npm run hai-ic:metrics
   ```
4. Record only these output fields:
   - `processingSpeedRequestsPerSecond`
   - `latencyMs.p50`
   - `latencyMs.p95`
   - `failedCount`

### 2. Cost reduction vs baseline infrastructure

1. Define baseline monthly infrastructure cost in USD.
2. Define HAI-IC monthly infrastructure cost in USD.
3. Run:
   ```bash
   BASELINE_MONTHLY_USD=___ HAI_IC_MONTHLY_USD=___ npm run hai-ic:metrics
   ```
4. Publish only `costReduction.reductionPercent`.

### 3. Uptime >= 99.9%

1. Choose the measurement window before publishing: 24 hours, 7 days, or 30 days.
2. Check `GET /api/hai-ic/health` every 60 seconds.
3. Formula:
   ```text
   uptime_percent = successful_checks / total_checks * 100
   ```
4. 99.9% target means failed checks must be <= 0.1% of total checks.
5. Publish the window, total checks, failed checks, and uptime percent.

### 4. Real cash collected

1. Export Stripe payment records or maintain a manual invoice receipt log.
2. Redact customer names, emails, transaction IDs, and private URLs before sharing externally.
3. Publish only:
   ```text
   cash_collected_usd = ___
   receipt_count = ___
   measurement_period = ___
   source = Stripe export or manual receipt log
   ```
