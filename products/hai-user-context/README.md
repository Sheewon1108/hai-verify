# hai-user-context

> **어떤 언어를 사용하던, 어디에 있던 — AI와 도구는 위치를 언어로 추측하거나 유추하지 않아야 한다.**  
> **Whatever language you use, wherever you are — AI and tools must not infer location from language.**

HAI User Context는 **언어·전화번호·로케일과 실제 거주지/시간대를 분리**하는 보안·정확성 레이어입니다.  
캘리포니아에 살면서 한국어·영어·동부 번호(212)를 쓰는 것은 모두 정상이며, 도구가 이를 잘못 추론하지 않도록 합니다.

---

## 제품 구조 (Pricing)

| 티어 | 이름 | 가격 | 한 줄 요약 |
|------|------|------|------------|
| **Free** | Language Policy | **무료** | 언어 ≠ 위치 원칙, 문서, 기본 API 정책 필드 |
| **Paid** | Timezone Bundle | **유료** | 시간대 assert, 글로벌 multi-country, 스케줄 가드, 모니터링 |

### 왜 이렇게 나누나

- **언어 정책** — 메시지·문서·상수 수준. 확산·광고·신뢰 구축에 좋음 → **무료 배포**
- **시간대 번들** — OS 연동, Windows Task Scheduler, vault, edge case, 지속 유지보수 → **개발·완성 비용이 큼** → **유료**

> 언어 정책은 무료로 영원히. 시간대 정확성은 번들 유료 — **시간을 맞추는 것이 언어보다 어렵기 때문.**

---

## Free — Language Policy (무료)

### 포함

- 언어·`Accept-Language`·대화로 **거주지/시간대 추론 금지** 원칙
- `USER_DISPLAY_LOCALE` — UI/메시지 표시용만 (위치 아님)
- 정책 상수 (`user-context-policy.ts`)
- `/api/health` → `userContext.policy`, `rules`
- 오픈 문서·예제

### 적용 대상 신호 (추론 금지)

| 신호 | 용도 |
|------|------|
| `USER_DISPLAY_LOCALE` | 표시·메시징만 |
| `locale` (API body) | 표시·메시징만 |
| `Accept-Language` | 표시·메시징만 |
| 대화 언어 (한국어, 영어 등) | **위치 추론 금지** |

---

## Paid — Timezone Bundle (유료)

### 포함

| 기능 | 설명 |
|------|------|
| `USER_TIMEZONE` assert | Windows 타임존 ↔ config 동기화 검증 |
| 글로벌 multi-timezone 모델 | 전 세계 복수 시간대 국가에서 **존 추론 금지** |
| 전화 지역번호 decoupling | 212(동부) 번호 ≠ 거주지 ≠ `USER_TIMEZONE` |
| 예약 작업 timezone guard | Task Scheduler 등록 전 assert |
| `security-watch` 연동 | user-context 주기 점검 |
| US 4-zone 테스트 | Pacific / Mountain / Central / Eastern assert |
| DPAPI vault hooks | 시크릿과 분리된 context 로딩 |

### Config (유료 번들 핵심)

```env
# 거주지 (메타데이터)
USER_COUNTRY=US
USER_REGION=California, US

# 도구·스케줄의 유일한 시간 기준
USER_TIMEZONE=Pacific Standard Time

# 연락처 (동부 번호여도 시간대와 무관)
USER_CONTACT_PHONE=+1-212-555-0147

# UI 언어 (위치 아님)
USER_DISPLAY_LOCALE=en-US
```

Canonical source: `~/secrets/hai-verify.env`

---

## 글로벌 시간대 정책

### Multi-timezone (존 추론 **금지**)

미국, 캐나다, 러시아, 멕시코, 호주, 브라질, 인도네시아, 칠레, 뉴질랜드 등.

→ **어느 시간대인지** 언어·전화·로케일로 추측하지 않음. `USER_TIMEZONE`만 사용.

### Single-timezone (존 선택 해당 없음)

한국(KST), 일본(JST), 중국, 인도, 싱가포르, 대만, 태국, 베트남, 필리핀 등.

→ 국내적으로 시간대가 하나지만, **한국어를 쓴다고 한국에 사는 것은 아님.**

### Unknown country

안전 기본값: **multi** (추론 금지)

---

## npm scripts (현재 hai-verify 내)

```bash
npm run user-context:assert              # timezone assert
npm run user-context:scenarios           # 정책 시나리오 dry-run
npm run user-context:test-us-timezones     # US 4존 assert (자동 복원)
npm run pm2:register-log-cleanup           # 예약 작업 + timezone guard
npm run hai-ic:keepalive                   # keepalive 등록 + timezone guard
```

---

## 파일 맵 (MVP 시드)

```
app/lib/
  user-context-policy.ts      # 정책 문구·규칙
  user-context-product.ts     # free/paid 티어 정의
  timezone-model-policy.ts    # 글로벌 multi/single 국가
  phone-area-policy.ts        # 전화 지역번호 정책

scripts/lib/
  user-context.ps1            # assert (PowerShell)
  load-user-context.cjs       # assert (Node)
  scheduled-task-guard.ps1      # 예약 작업 가드
  timezone-model-policy.ps1
  phone-area-policy.ps1

scripts/
  test-user-context-scenarios.ps1
  test-us-timezones-assert.ps1
```

---

## 로드맵

1. **지금** — hai-verify 내부 MVP (완료 중)
2. **다음** — `hai-user-context` npm 패키지 분리 (free core)
3. **이후** — `hai-user-context-pro` timezone 번들 (유료)
4. **연동** — HAI Verify API, Cloudflare Workers, Discord bot

---

## HAI Verify 연동

공개 `GET /api/health` 는 서비스 상태만 반환한다 (정책·환경·엔드포인트 목록 없음).

```json
{
  "ok": true,
  "service": "HAI Verify",
  "status": "healthy"
}
```

언어/타임존 정책 원문은 `app/lib/user-context-policy.ts` 와 이 README를 본다.

---

## 라이선스·문의

- Product codename: **hai-user-context**
- Parent project: **HAI Verify / XGOMA**
- Policy owner: user-declared config (`~/secrets/hai-verify.env`) — **never guess from language**

---

*Last updated: 2026-07-07*