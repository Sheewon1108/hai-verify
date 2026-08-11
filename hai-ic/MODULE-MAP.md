# Hai-Ic — Module Map + Security Spec
**Owner:** KARAM SHIN  
**Date:** 2026-08-11  
**Purpose:** External engineer plug-and-play. Clear boundaries. No ambiguity about what to touch vs. what not to touch.

---

## 1. Module Map

```
hai-verify/
│
├── CORE GATE (read/understand before changing anything)
│   ├── app/lib/hai-ic-analyze.ts          ← analyzeIntent() — scoring engine, IC 0–100
│   ├── app/lib/hai-ic-system-prompt.ts    ← HAI_IC_CONFIDENCE_THRESHOLD (75), HAI_IC_DD_FLOOR
│   ├── app/lib/hai-ic-boost-value.ts      ← HAI_IC_HOURLY_BOOST (0 in production)
│   └── app/lib/hai-ic-dd-penalty-value.ts ← HAI_IC_DD_MAX_PENALTY_LIVE (DD evidence enforcement)
│
├── API LAYER (public interface)
│   ├── app/api/hai-ic/analyze/route.ts    ← POST /api/hai-ic/analyze — entry point for callers
│   ├── app/api/hai-ic/health/route.ts     ← GET /api/hai-ic/health — liveness check
│   ├── app/api/verify/route.ts            ← POST /api/verify — HAI Verify (separate product)
│   └── app/api/health/route.ts            ← GET /api/health — top-level liveness
│
├── PAYMENT LAYER (do not modify without Stripe credentials in place)
│   ├── app/api/stripe/checkout/route.ts   ← POST /api/stripe/checkout — session creation
│   ├── app/api/stripe/webhook/route.ts    ← POST /api/stripe/webhook — payment → API key
│   └── app/lib/api-keys.ts                ← HMAC API key generation (no DB required)
│
├── AUTH / ACCESS (touch only with security review)
│   ├── app/lib/access-control.ts          ← Route-level access policy
│   ├── app/lib/cors.ts                    ← CORS rules
│   └── middleware.ts                      ← HAI ruleset header injection (all requests)
│
├── AUTOMATION / OPS
│   ├── scripts/hai-ic-automation-daemon.cjs   ← Hourly question runner + boost calibration
│   ├── scripts/generate-buyer-trust-pack.cjs  ← Trust Ledger export
│   ├── scripts/ensure-hai-ic-running.ps1      ← Process keepalive
│   └── ecosystem.config.cjs                   ← PM2 process config
│
├── DATA / AUDIT
│   ├── hai-ic/test-questions/                 ← Scored test corpus (200+ inputs, immutable)
│   ├── hai-ic/buyer-deliverables/TRUST-LEDGER.md ← Live audit export
│   └── hai-ic/boost-state.json               ← Calibration state (read-only for engineers)
│
├── SDK / CONTRACT (buyer-facing, version-controlled)
│   ├── hai-ic/openapi.json                   ← API contract (OpenAPI 3.x)
│   └── hai-ic/sdk/hai-ic-client.ts           ← Drop-in TypeScript client
│
└── FRONT-END DEMO
    └── app/hai-ic/page.tsx                   ← Live demo UI (dev only, port 3001)
```

---

## 2. Module Boundaries + Public Interfaces

### What external engineers MAY modify
| Module | Safe Changes |
|--------|-------------|
| `app/api/hai-ic/analyze/route.ts` | Add rate limiting, auth middleware, logging |
| `app/api/hai-ic/health/route.ts` | Add metrics export (Prometheus format, etc.) |
| `app/lib/cors.ts` | Add allowed origins for buyer's domain |
| `ecosystem.config.cjs` | Adjust PM2 instances, memory limits |
| `hai-ic/sdk/hai-ic-client.ts` | Add language bindings (Python, Go wrappers) |

### What requires KARAM approval before modifying
| Module | Reason |
|--------|--------|
| `app/lib/hai-ic-analyze.ts` | Core IP — scoring logic, patent-filed |
| `app/lib/hai-ic-system-prompt.ts` | Threshold values define the product contract |
| `app/lib/hai-ic-boost-value.ts` | Boost = 0 is a product promise; changing it = fraud risk |
| `app/api/stripe/webhook/route.ts` | Revenue path — any change requires live key test |
| `hai-ic/test-questions/` | Audit corpus — immutable once scored |

### Public API Contract (do not break without version bump)
```
POST /api/hai-ic/analyze
  Body:  { "input": string }
  Returns: HaiIcResult {
    confidence: number (0–100)
    sincereMode: boolean
    mode: "Sincere Mode ON" | "Sincere Mode OFF"
    breakdown: { core, understood, missing, risk }
    questions: string[]
    response: string
    analyzedAt: ISO8601
    isDueDiligence?: boolean
  }

GET /api/hai-ic/health
  Returns: { "status": "ok", "version": "1.0.0-mvp" }
```

---

## 3. Security Specification

### 3.1 Threat Model

| Threat | Asset | Control |
|--------|-------|---------|
| Secret exfiltration via commit | API keys, Stripe keys, Cloudflare tokens | `.env.local` in `.gitignore`; GitHub Actions secret scan (`.github/workflows/security-check.yml`) |
| Score manipulation (trust fraud) | IC scoring engine | `HAI_IC_HOURLY_BOOST` enforced = 0 in production; no manual override path exposed in API |
| Replay / spoofed webhooks | Stripe payment → API key issuance | Stripe webhook signature verification (`stripe.webhooks.constructEvent`) |
| Unauthorized API access | `/api/hai-ic/analyze` | API key middleware (`app/lib/api-keys.ts`, HMAC) — **add to route before public deploy** |
| Audit log tampering | Trust Ledger | Logs written append-only; do not expose delete endpoint |
| Denial of service | `/api/hai-ic/analyze` | Rate limiting: **not yet implemented** — add before public deploy (see §3.3) |
| Exposed localhost demo URL | Buyer-facing assets | Rule: no `localhost` in any email, one-pager, or external doc |

### 3.2 Secrets Handling (current + required state)

| Secret | Storage | Status |
|--------|---------|--------|
| `STRIPE_SECRET_KEY` | `.env.local` (local) / env var (production) | Required; not committed |
| `STRIPE_WEBHOOK_SECRET` | `.env.local` / env var | Required; not committed |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets → CI only | Pending |
| HAI-Ic HMAC key | `.env.local` → `app/lib/api-keys.ts` | Required before public deploy |
| Grok / xAI credentials | `.env.local` only | Never in chat, never in commit |

**Rule:** `wrangler secret put <KEY>` for Cloudflare Workers. Never use `wrangler.jsonc` for secret values.

### 3.3 Approval Gates (before any public deploy)

- [ ] `POST /api/hai-ic/analyze` — API key auth middleware active
- [ ] Rate limiter active (suggest: 60 req/min per IP using `next-rate-limit` or Cloudflare rate rule)
- [ ] Stripe webhook signature check passing on live key
- [ ] `npm run build` passes with zero errors
- [ ] `.env.local` confirmed absent from git history (`git log --all -- .env.local`)
- [ ] Security scan passing (`npm run lint` + `.github/workflows/security-check.yml`)

### 3.4 Audit Trail

| Event | Logged where | Format |
|-------|-------------|--------|
| Every IC score | `hai-ic/test-questions/step-NNN-YYYY-MM-DD.json` | JSON, immutable |
| Trust Ledger snapshot | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` | Markdown, generated |
| Boost calibration | `hai-ic/boost-state.json` | JSON, append |
| Payment completion | Stripe Dashboard + webhook handler logs | Stripe + server log |
| Deploy events | GitHub Actions run log | CI artifact |

---

## 4. Automation Pipeline Outline

```
[Developer pushes code]
        ↓
[GitHub Actions: security-check.yml]
  - Secret scan (no keys in diff)
  - ESLint
  - npm run build (must pass)
        ↓
[Manual gate: KARAM reviews build]
        ↓
[Deploy: npm run deploy:cf]
  → opennextjs-cloudflare build
  → opennextjs-cloudflare deploy
  → Cloudflare Workers (wrangler.jsonc, secrets via `wrangler secret put`)
        ↓
[Post-deploy verification]
  → GET /api/hai-ic/health → expect {"status":"ok"}
  → POST /api/hai-ic/analyze with test input → expect IC score returned
  → Stripe webhook: send test event → expect 200 + key issued
        ↓
[Uptime monitoring]
  → Cron: GET /api/hai-ic/health every 60s
  → Alert if 3 consecutive failures
```

**Secrets order (deploy sequence):**
1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in production env
2. Set `CLOUDFLARE_API_TOKEN` in GitHub Secrets
3. Set HAI-Ic HMAC key in production env
4. Run deploy
5. Run post-deploy verification checks

---

*This document is the source of truth for module ownership and security gates. Update it before changing any module listed above.*
