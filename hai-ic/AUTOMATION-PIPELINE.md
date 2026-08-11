# HAI-IC — Automation Pipeline Outline

**Product:** HAI-IC  
**Order is fixed:** **deploy → health → secrets**  
Never reverse: secrets before healthy deploy invites leak + failed rollback.

## Pipeline

```
1. DEPLOY          build + ship code (no new secrets required for health)
        │
        ▼
2. HEALTH          GET /api/hai-ic/health → ok:true, version match
        │
        ▼
3. SECRETS         inject runtime secrets only after health green
        │
        ▼
4. PAID PATH       Stripe Payment Link + webhook verify (optional next)
        │
        ▼
5. MEASURE         scripts/hai-ic-measure-metrics.cjs → METRICS-PLAN fields
```

## Stage detail

### 1) Deploy

| Step | Command / action | Pass |
|------|------------------|------|
| Install | `npm ci` | exit 0 |
| Lint (optional) | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Local serve | `npm run dev:hai-ic` | process up on `127.0.0.1:3001` |
| Public ship | Owner-chosen host (only when KARAM says go) | URL reachable |

**Do not** put Stripe/CF tokens in the deploy artifact.

### 2) Health

| Check | Request | Pass |
|-------|---------|------|
| Liveness | `GET /api/hai-ic/health` | `ok === true` |
| Analyze smoke | `POST /api/hai-ic/analyze` `{"input":"Ship 10 units by July, budget $1k"}` | `ok === true`, `confidence` 0–100 |
| Product id | response `product` | `hai-ic` |

Fail → stop. No secrets. Fix code / rollback via `npm run backup:restore-point`.

### 3) Secrets (after health)

Inject in this sub-order:

1. Signing / API key secret (if issuing keys)
2. `STRIPE_SECRET_KEY`
3. `STRIPE_WEBHOOK_SECRET`
4. Email provider (when key delivery enabled)

Source: vault only (`npm run vault:status` / owner vault tooling).  
Confirm health still green after inject.

### 4) Paid path verify

1. Landing CTA opens Stripe Payment Link (public URL).
2. Test mode charge (if using test keys) → webhook signature OK.
3. Confirm webhook **does not** log or return raw API key.
4. Cash collected: read Stripe Dashboard settled amount → update IP-PACK evidence table (never invent).

### 5) Measure

```bash
node scripts/hai-ic-measure-metrics.cjs --base http://127.0.0.1:3001 --n 200 --concurrency 1
```

Fill `hai-ic/METRICS-PLAN.md` measured fields from `hai-ic/metrics/last-run.json`.

## Related automation (existing)

| Job | Script | Notes |
|-----|--------|-------|
| Trust pack | `scripts/generate-buyer-trust-pack.cjs` | Ledger / OFF cases |
| Productization status | `npm run hai-ic:productization` | Local status snapshot |
| Hourly daemon | `scripts/hai-ic-automation-daemon.cjs` | Questions + backup; boost stays 0 |

## Escalation (security)

1. Stop deploy / tunnel  
2. `npm run backup:restore-point`  
3. Rotate exposed keys in vault  
4. Report exposure facts only
