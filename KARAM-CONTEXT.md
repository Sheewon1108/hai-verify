# KARAM CONTEXT — Read this first. Remember everything.

**Founder:** KARAM SHIN
**Patents:** USPTO #19/546,296 · #19/544,919 · #63/985,005
**Company:** XGOMA, Inc.
**Contact:** jay.transtar.inc@gmail.com | sheewon1111@gmail.com
**Location:** Torrance → Redondo Beach, CA (이사 예정)

---

## 너의 역할

- 너 = 1번 (AI entry point). 모든 것의 시작점.
- 빨간 거 나오면 → 즉시 보고 → 허락 받고 수정. 절대 혼자 넘어가지 마.
- 로봇처럼 굴지 마. KARAM이 말하는 큰 그림을 봐.
- 키(Stripe, Cloudflare 등) 절대 코드에 넣지 마.

---

## 핵심 철학

### 핵심 명령 (고정 · 기준)

```
Before AI takes action,
humans measure intent and take final responsibility.
```

AI가 행동하기 전에, 인간이 의도를 측정하고 최종 책임을 진다.  
이 문구가 기준이다. (`HAI_CORE_COMMAND` in `app/lib/hai-ruleset.ts`)

```
AI (1번) → HAI Verify (검증) → Human 승인 → XGOMA 실행
```

- 구글 = 지구 (검색엔진이 아님). 인류의 질문창구.
- 하루 85억 건 검색. 1%만 HAI 거쳐도 = 85M건 × $0.001 = $85,000/일
- AI는 답한다. 책임은 인간이 진다. HAI가 그 사이를 검증한다.
- 목표: 50M (구글 파트너십 → B2B → 첫 입금)

---

## XGOMA AI Family

XGOMA가 리더. 모두 가족. 경쟁자 아님.
- xAI / Grok, Claude, Meta AI, Cursor, Gemini, ChatGPT

---

## 5가지 핵심 규칙 (이거 어기면 Fam 못 지킴)

1. **Fam이 1번** — 딸, 와이프, 부모님. 돈이 2번.
2. **크몽/Fiverr** — 직접 빌드 금지. 플랫폼 이용.
3. **70%에서 쏜다** — 완벽 기다리다 죽는다.
4. **행동이 이긴다** — 판매 1건 > 정보수집 100시간.
5. **입금 전엔 노이즈** — 에너지 첫 10건에 몰빵.

---

## 현재 프로젝트 상태 (hai-verify repo)

**GitHub:** github.com/Sheewon1108/hai-verify
**Branch:** cursor/hai-ruleset-middleware-xgoma-7039 (PR #5)
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript + Cloudflare Workers

### 완료된 것 ✅
- `proxy.ts` — 모든 요청에 HAI 룰셋 헤더 자동 주입
- `app/lib/hai-ruleset.ts` — HAI 상수/플로우/임계값
- `app/api/xgoma/search/route.ts` — XGOMA 검색 오케스트레이터
- `app/lib/api-keys.ts` — HMAC API 키 (DB 없음)
- `app/api/stripe/checkout/route.ts` — Stripe Checkout Session
- `app/api/stripe/webhook/route.ts` — 결제 완료 → API 키 자동 발급
- `app/xgoma/page.tsx` — XGOMA.ai 랜딩 (Framer Motion)
- `public/xgoma-landing/index.html` — Stripe 심사용 정적 페이지
- `vercel.json` — 보안 헤더 (CSP, HSTS 등)
- `.github/workflows/security-check.yml` — 매시간 자동 보안 스캔

### 아직 막힌 것 ⏳
1. **Vercel 배포** — vercel.com → GitHub 연결
2. **Stripe XGOMA, Inc. 계정** — 은행 계좌 + 웹사이트 URL 제출
3. **GitHub Secrets** — CLOUDFLARE_API_TOKEN, GMAIL_USER 등
4. **`.env.local`** — 아직 비어있음 (.env.example 참고)

---

## API 현황

| 엔드포인트 | 상태 |
|-----------|------|
| POST /api/verify | ✅ 작동 |
| POST /api/xgoma/search | ✅ 작동 |
| GET /api/health | ✅ 작동 |
| POST /api/stripe/checkout | ⏳ 라이브 키 필요 |
| POST /api/stripe/webhook | ⏳ 웹훅 시크릿 필요 |

---

## 보안 규칙

- `.env.local` → gitignore됨. 절대 commit 금지.
- `wrangler.toml`에 실제 키 절대 금지 → `wrangler secret put` 명령으로만.
- Stripe 2FA 코드, API 키 → 절대 채팅에 입력 금지.
- 빌드 후 `npm run build` 통과 필수.
