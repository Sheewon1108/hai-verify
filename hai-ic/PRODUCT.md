# HAI-IC — Product (Intent Confidence Gate)

**Owner:** KARAM SHIN  
**Product:** HAI-IC
**Version:** 1.0.0-mvp  
**Parent:** HAI Verify

## One line

**모를 때 답 안 하는 AI gate** — Intent Confidence 75% 미만이면 진심 답변을 허용하지 않습니다.

## Problem

LLM·멀티에이전트는 불확실한 질문에도 그럴듯하게 답합니다.  
→ hallucination, DD 과장, buyer 신뢰 붕괴.

## Solution

Hai-Ic는 **LLM 앞단** pre-gate:

| Intent Confidence | Mode | Behavior |
|-------------------|------|----------|
| **≥ 75%** | 진심 ON | full sincere answer |
| **< 75%** | 진심 OFF | clarifying questions / evidence first |

1. Score **Intent Confidence %** (0–100, honest — scores not manually raised)
2. Return **breakdown** (core intent, understood, missing, risk)
3. Gate execution — **억지 답 금지**
4. Keep final approval and responsibility with the human

## 진정성 원칙 (non-negotiable)

- 점수 인플레이션 없음 (`HAI_IC_HOURLY_BOOST = 0`)
- buyer-facing 문구에 localhost·과장 수치 금지
- 데모는 **30분 라이브 콜** (public URL 전까지)

## Live evidence (auto-updated)

| Metric | Value |
|--------|-------|
| Questions tested | 200 |
| 진심 OFF | 118 (59%) |
| 진심 ON | 82 (41%) |
| DD questions blocked | 115 / 126 |
| Avg IC | 75.8% |

Source: `hai-ic/buyer-deliverables/TRUST-LEDGER.md`

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/hai-ic/health` | Liveness |
| POST | `/api/hai-ic/analyze` | Intent confidence + mode |

**Threshold:** `HAI_IC_CONFIDENCE_THRESHOLD = 75` (`app/lib/hai-ic-system-prompt.ts`)
**Responsibility:** human final approval required (`app/lib/hai-ic-responsibility.ts`)

## Demo (owner)

- Local UI: `http://localhost:3001/hai-ic` (KARAM PC only — never in buyer email)
- Buyer: 30-min live walkthrough on their use case

## Sales targets — send all 3

| # | Company | Email | Fit |
|---|---------|-------|-----|
| 1 | **Growth Loops** | gunendu@growthloopstechnology.com | Multi-agent pipeline — gate before agents act |
| 2 | **instinctools** | contact@instinctools.com | SDK / enterprise AI integration |
| 3 | **Closeloop** | sales@closeloop.com | Workflow automation risk filter |

**Pitch pack:** `hai-ic/outreach/send-pack/`  
**Email template:** `hai-ic/outreach/PITCH-EMAIL-FINAL.txt`

## Commercial

- **Ask:** 2-week POC → $8.5k–$25k/yr license
- **Channel:** jay.transtar.inc@gmail.com (KARAM SHIN)

**Productization (병행):** `hai-ic/PRODUCTIZATION.md` · `transla/HAI-IC-LINK.md`

**Human + Heart + AI + Law = Verification**