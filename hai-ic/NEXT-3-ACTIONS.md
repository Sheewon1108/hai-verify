# KARAM Next 3 Execution Actions

Only three. No new product scope.

1. Confirm paid evidence.
   - Check Stripe dashboard or manual invoice log.
   - Record only: `cash_collected_usd`, `receipt_count`, `measurement_period`, `source`.
   - If no verified receipt exists, keep status as `not measured yet`.

2. Run one metrics pass.
   - Start HAI-IC locally or use the deployed endpoint.
   - Run `npm run hai-ic:metrics`.
   - Paste p50, p95, requests/sec, failed count, and cost-reduction fields into `hai-ic/METRICS-PLAN.md`.

3. Send the one-page pilot ask.
   - Use `hai-ic/POSITIONING-ONE-PAGER.md`.
   - Ask for one real workflow and a Yes/No pilot decision.
   - Do not add extra features, extra brands, or unmeasured claims.
