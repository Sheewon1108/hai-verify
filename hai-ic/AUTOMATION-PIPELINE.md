# HAI-IC — Automation Pipeline Outline

**Order is fixed:** Deploy → Health → Secrets  
Never invert (do not inject secrets into a failing/unknown deploy first without health baseline).

---

## Pipeline order

```
1. DEPLOY          build + publish runtime
2. HEALTH          prove analyze + health endpoints
3. SECRETS         inject / verify payment + signing secrets
4. PAID RAIL CHECK Stripe Payment Link / webhook (optional after secrets)
5. METRICS         bench latency + uptime probe (METRICS-PLAN)
```

---

## 1) Deploy

| Step | Command / action | Pass criteria |
|------|------------------|---------------|
| Install | `npm ci` | exit 0 |
| Lint (optional) | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Local runtime | `npm run dev:hai-ic` | listens `127.0.0.1:3001` |
| Public deploy | **Only if KARAM says go** — `npm run deploy:cf` or CI | Worker/URL up |

Local-first default. No Cloudflare/tunnel unless approved.

---

## 2) Health

| Probe | Expect |
|-------|--------|
| `GET /api/hai-ic/health` | HTTP 200 · `ok:true` · `product:"hai-ic"` |
| `POST /api/hai-ic/analyze` `{"input":"Restart logistics partnership with Woosung Group via Transla by Q3, budget $50k"}` | HTTP 200 · `confidence` 0–100 · `sincereMode` boolean |
| UI | `http://127.0.0.1:3001/hai-ic` loads analyzer |

```bash
curl -s http://127.0.0.1:3001/api/hai-ic/health
curl -s -X POST http://127.0.0.1:3001/api/hai-ic/analyze \
  -H 'content-type: application/json' \
  -d '{"input":"Restart logistics partnership with Woosung Group via Transla by Q3, budget $50k"}'
```

Fail health → **stop**; do not proceed to secrets injection on that target.

---

## 3) Secrets (after healthy runtime)

| Order | Secret | Action |
|-------|--------|--------|
| 3.1 | Vault present | `npm run vault:status` |
| 3.2 | Stripe secret + webhook | Set via vault / host env — never commit |
| 3.3 | Price IDs (if Checkout) | `STRIPE_PRICE_STARTER` / `PRO` |
| 3.4 | Workers sync (if CF approved) | `npm run workers:sync-env` |
| 3.5 | Verify webhook signature path | POST test event from Stripe CLI/Dashboard |

**Payment Link CTA** on `/hai-ic` can collect cash without server secret; webhook/API key issue still needs secrets.

---

## Existing automation hooks

| Script | Role |
|--------|------|
| `npm run hai-ic:automation` | Local automation start (Windows PS) |
| `npm run hai-ic:productization` | Status snapshot |
| `node scripts/generate-buyer-trust-pack.cjs` | Trust Ledger pack |
| `node scripts/hai-ic-bench-latency.cjs` | Latency / RPS fill for METRICS-PLAN |
| `npm run local:doctor` | Local env doctor |
| `npm run access:test-loopback` | Loopback access test |
| `npm run backup:restore-point` | Pre-risk backup |

---

## Rollback

1. Stop public exposure (deploy/tunnel)  
2. `npm run backup:restore-point`  
3. Rotate exposed secrets in vault  
4. Re-run Health on last known good commit
