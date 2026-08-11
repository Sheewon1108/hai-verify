# HAI-IC — Automation Pipeline Outline

**Product:** HAI-IC  
**Order is fixed:** Deploy → Health → Secrets

Do not put secrets into a red deploy. Do not claim uptime before health is green.

---

## Pipeline order

```
1. DEPLOY
   ├─ npm ci
   ├─ npm run build
   ├─ npm run deploy   (or GitHub Actions → Cloudflare Workers)
   └─ confirm Workers URL responds

2. HEALTH
   ├─ GET /api/hai-ic/health  → ok + status healthy
   ├─ POST /api/hai-ic/analyze (smoke sample)
   └─ record latency sample → scripts/metrics (optional)

3. SECRETS
   ├─ vault / wrangler secret put (Stripe, webhook, prices)
   ├─ sync Workers env (npm run workers:sync-env)
   └─ verify webhook signature path without echoing secrets
```

---

## Stage detail

### 1) Deploy

| Step | Command / action | Pass criteria |
|------|------------------|---------------|
| Install | `npm ci` | exit 0 |
| Build | `npm run build` | exit 0 |
| Static asset | `public/hai-ic-demo.mp4` present | CI check |
| Deploy | `npm run deploy` or Actions `deploy-cloudflare.yml` | Worker published |
| Local alt | `npm run dev:hai-ic` → `127.0.0.1:3001` | for owner-only |

**CI:** `.github/workflows/deploy-cloudflare.yml` — deploys on `main` when `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` set; otherwise skips deploy (does not fail secret-less).

### 2) Health

| Probe | Expect |
|-------|--------|
| `GET https://hai-verify.workers.dev/api/hai-ic/health` | `ok: true`, `product: "hai-ic"`, `status: "healthy"` |
| `POST …/api/hai-ic/analyze` + fixed JSON body | `ok: true`, `confidence` 0–100, `sincereMode` boolean |
| Metrics (optional) | `node scripts/metrics/measure-hai-ic-latency.cjs` → fills p50/p95 |

If health fails → **stop**. Do not load production Stripe secrets onto a broken Worker.

### 3) Secrets (only after health green)

| Order | Secret | Notes |
|-------|--------|-------|
| 3.1 | `STRIPE_SECRET_KEY` | Restricted key preferred |
| 3.2 | `STRIPE_WEBHOOK_SECRET` | Endpoint must already exist |
| 3.3 | `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | Dashboard price IDs |
| 3.4 | Publishable key if needed | Public ok; still not in git history spam |

Public Payment Link URL on `/hai-ic` is **not** a secret (by design).

**Local:** vault scripts · `npm run backup:restore-point` before rotate.

---

## Continuous loops (already in repo)

| Loop | Role |
|------|------|
| `hai-ic` automation daemon | Trust Ledger / question runs |
| `security-check.yml` | Hourly security scan |
| `validate-outreach-sincerity.cjs` | Before buyer sends |
| Uptime probes | `METRICS-PLAN.md` M4 — add when ready |

---

## Definition of done (paid live system)

1. Deploy green  
2. Health green  
3. Secrets loaded  
4. Stripe Payment Link settles ≥ 1 payment → fill `cash_collected_usd` in `METRICS-PLAN.md`  
5. Human fulfillment of pilot still required (no auto-responsibility transfer)  
