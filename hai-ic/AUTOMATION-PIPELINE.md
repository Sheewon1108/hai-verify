# HAI-IC — Automation Pipeline Outline

**Order is fixed:** deploy → health → secrets  
Never expose or inject secrets before health is green.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  1. DEPLOY  │ ──▶ │  2. HEALTH  │ ──▶ │  3. SECRETS │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 1. Deploy

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Branch build: `npm run build` | Exit 0 |
| 1.2 | Lint (optional CI): `npm run lint` | Exit 0 / policy |
| 1.3 | Start local product surface: `npm run dev:hai-ic` | Process up on `127.0.0.1:3001` |
| 1.4 | (Owner only) Public deploy — **only if KARAM explicitly says go** | Worker/host responds |

**Do not** open Cloudflare / Discord / GitHub Secrets tracks unless KARAM asks.

## 2. Health

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | `GET /api/hai-ic/health` | HTTP 200, `ok: true`, product + version present |
| 2.2 | `npm run local:doctor` (owner PC) | Loopback checks pass |
| 2.3 | `npm run access:test-loopback` | Access policy ok |
| 2.4 | Smoke analyze: `POST /api/hai-ic/analyze` with fixture | `confidence` 0–100, `sincereMode` boolean |
| 2.5 | Metrics sample (optional): `node scripts/hai-ic-measure-metrics.cjs` | Writes `hai-ic/metrics/RESULTS.json` |

**Gate:** If any of 2.1–2.4 fails → stop. Do not proceed to secrets.

## 3. Secrets (after health only)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | `npm run vault:status` | Vault reachable; no values echoed |
| 3.2 | Inject runtime env from vault (local) or `wrangler secret put` (workers) | Process restarts with env; secrets not in git |
| 3.3 | Stripe / API key middleware (when enabling paid API) | Checkout/webhook only with live keys from vault |
| 3.4 | Re-run health (2.1) | Still green with secrets loaded |

**Escalation if exposed:** stop deploy/tunnel → `npm run backup:restore-point` → rotate → report what leaked.

## Continuous (owner)

| Job | Command / path |
|-----|----------------|
| Keep local gate up | `npm run hai-ic:automation` / keepalive scripts |
| Productization snapshot | `npm run hai-ic:productization` |
| Trust pack regen | `node scripts/generate-buyer-trust-pack.cjs` |
| Outreach sincerity | `node scripts/validate-outreach-sincerity.cjs` |

## Engineer handoff checklist

1. Read `MODULE-BOUNDARIES.md` + `interfaces/public.ts`
2. Run deploy → health locally
3. Do **not** request secrets until health green
4. Integrate via SDK or `hai-ic/core` only
5. Never claim metrics or cash not in `METRICS-PLAN.md` / `IP-PACK.md`
