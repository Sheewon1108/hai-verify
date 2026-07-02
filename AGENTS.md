<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## XGOMA / HAI Verify — Project Context
<!-- Full context is in KARAM-CONTEXT.md — share that file with new agents -->

**Founder:** KARAM SHIN
**Patents:** USPTO #19/546,296 · #19/544,919 · #63/985,005
**Company:** XGOMA, Inc. (Stripe account active)
**Contact:** jay.transtar.inc@gmail.com

---

### Core Philosophy

```
AI (1번 — entry point)
    ↓
HAI Verify (검증)
    ↓
Human 승인
    ↓
XGOMA 실행
```

- Cursor (this AI) = 1번. 모든 작업의 시작점.
- 빨간 거 나오면 → 즉시 보고 → 허락 받고 수정. 절대 넘어가지 말 것.
- 키(Stripe, Cloudflare 등)는 절대 코드/wrangler.toml에 넣지 말 것.

---

### What Has Been Built (PR #5 — branch: cursor/hai-ruleset-middleware-xgoma-7039)

| File | Description |
|------|-------------|
| `proxy.ts` | HAI ruleset headers injected on every request (Next.js 16 migration from middleware.ts) |
| `app/lib/hai-ruleset.ts` | HAI constants: headers, flow steps, thresholds |
| `app/api/xgoma/search/route.ts` | XGOMA orchestrator — verifies search results via HAI engine |
| `app/lib/api-keys.ts` | HMAC self-verifying API key system (no DB needed) |
| `app/api/stripe/checkout/route.ts` | Real Stripe Checkout Session (subscription) |
| `app/api/stripe/webhook/route.ts` | Stripe webhook → auto-issue HAI API key |
| `app/xgoma/page.tsx` | XGOMA.ai premium landing page (Framer Motion) |
| `public/xgoma-landing/index.html` | Static Stripe merchant review page |
| `scripts/security-watch.ps1` | Hourly Windows security check + HTML report |
| `.github/workflows/security-check.yml` | GitHub Actions hourly security scan |
| `.github/workflows/deploy-cloudflare.yml` | CI deploy (skips if no secrets) |
| `vercel.json` | Security headers (CSP, HSTS, X-Frame-Options) |

---

### Live API Endpoints

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/health` | GET | ✅ live |
| `/api/verify` | POST | ✅ live — Trust Index engine |
| `/api/xgoma/search` | POST | ✅ live — HAI-verified search |
| `/api/stripe/checkout` | POST | ⏳ needs STRIPE_SECRET_KEY |
| `/api/stripe/webhook` | POST | ⏳ needs STRIPE_WEBHOOK_SECRET |
| `/api/checkout` | POST | ✅ mock (test only) |

---

### What Is Still Blocked (Do These Next)

1. **Vercel 배포** — `vercel.com` → GitHub repo 연결 → Deploy
2. **Stripe 계정 활성화** — XGOMA, Inc. 계정에 은행 계좌 + 웹사이트 URL 제출
3. **GitHub Secrets** — `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`
4. **`.env.local`** — 아직 비어있음. `.env.example` 참고해서 채울 것

---

### Key Rules for Any Agent Working Here

- `wrangler.toml` / `wrangler.jsonc`에 실제 키 절대 금지
- `.env.local`은 gitignore됨 — 절대 commit 금지
- 빌드 후 반드시 `npm run build` 통과 확인
- Next.js 16: `middleware.ts` → `proxy.ts` (이미 마이그레이션 완료)
- Stripe API version: `2026-06-24.dahlia`
- 보안 이슈 발견 시 → 즉시 KARAM에게 보고, 허락 후 수정
