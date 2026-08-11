# HAI-IC — Automation Pipeline Outline

**Product:** HAI-IC  
**Order is mandatory:** deploy → health → secrets (never secrets-after-broken-health on a new surface without vault-first).

---

## Canonical order

```
0) backup:restore-point     (before risky change)
1) secrets in vault         (Stripe / HMAC / CF token — not in git)
2) inject secrets → runtime (Workers secrets / .env.local — gitignored)
3) deploy                   (build + upload Worker)
4) health                   (GET /api/hai-ic/health → ok)
5) smoke analyze            (POST /api/hai-ic/analyze fixed input)
6) metrics (optional)       (npm run hai-ic:metrics → RESULTS.json)
7) payment rail check       (Payment Link CTA resolves; webhook only if secret set)
```

**Rule:** Do not advertise a public URL until step 4 passes. Do not claim cash until Stripe settlement is logged privately by KARAM.

---

## Stage detail

### 0 — Restore point

```bash
npm run backup:restore-point
```

### 1–2 — Secrets (vault first)

| Name | Required for |
|------|----------------|
| `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Deploy |
| `STRIPE_SECRET_KEY` | Checkout session API (if used) |
| `STRIPE_WEBHOOK_SECRET` | Key issue on pay |
| HMAC / API key secret | Authenticated analyze (when enabled) |

Payment Link CTA on `/hai-ic` is a public Stripe URL (no server secret). Webhook still needs vault secret before key auto-issue.

### 3 — Deploy

```bash
npm run deploy:cf
# or CI: .github/workflows/deploy-cloudflare.yml on main
```

### 4 — Health

```bash
curl -sS "$BASE/api/hai-ic/health"
# expect: {"ok":true,"product":"hai-ic","status":"healthy",...}
```

### 5 — Smoke analyze

```bash
curl -sS -X POST "$BASE/api/hai-ic/analyze" \
  -H "Content-Type: application/json" \
  -d '{"input":"Ship 200 units to Seoul by July 15, budget $50k"}'
# expect: confidence number, sincereMode boolean
```

### 6 — Metrics

```bash
HAI_IC_METRICS_URL=$BASE npm run hai-ic:metrics
```

### 7 — Paid rail

- Landing CTA → Stripe Payment Link  
- Webhook → `checkout.session.completed` → API key (email delivery TODO)  
- Cash claim → only after KARAM confirms settlement ID offline  

---

## Local loop (owner)

```bash
npm run local:doctor
npm run access:test-loopback
npm run dev:hai-ic          # 127.0.0.1:3001
```

---

## Failure policy

| Failure | Action |
|---------|--------|
| Health not ok after deploy | Rollback / stop tunnel; do not send buyers |
| Webhook secret missing | Payment Link may still collect; key auto-issue disabled (503) |
| Secret exposure suspected | War-room escalation in `SECURITY.md` §5 |
