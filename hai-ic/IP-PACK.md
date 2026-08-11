# HAI-IC — IP Pack (1 page)

**Owner:** KARAM SHIN · **Product:** HAI-IC only · **Parent:** HAI Verify / XGOMA, Inc.

## One-line thesis

**Before AI takes action, humans measure Intent Confidence (0–100); Sincere Mode opens only at 75%+; the human keeps the final decision and the responsibility.**

## Problem → mechanism → proof

| Stage | Content |
|-------|---------|
| **Problem** | LLMs and multi-agent stacks answer under uncertainty — hallucination, DD inflation, trust collapse. |
| **Mechanism** | HAI-IC sits **pre-LLM / pre-execution**. Score Intent Confidence 0–100. **≥75% → Sincere Mode ON** (full answer path). **<75% → OFF** (clarify / evidence first). Human approval remains mandatory before high-stakes action. |
| **Proof** | Live analyzer + Trust Ledger from real question runs (scores not manually raised). See Evidence. |

## Why hard to copy (process + philosophy — not only model/code)

1. **Doctrine lock** — Human final decision + responsibility is non-negotiable; gate cannot be “optimized away” into auto-execute.
2. **Anti-inflation process** — `HAI_IC_HOURLY_BOOST = 0`; sincerity validation before buyer outreach; OFF cases logged as value (risk blocked).
3. **Operating ritual** — Trust Ledger + backup trail + 30-min live walkthrough on buyer stack (not a screenshot demo).
4. **Scarcity** — Philosophy-level original IP turned into a running paid-system path by a solo founder; the moat is the **gated responsibility loop**, not a proprietary foundation model.

## Evidence (no exaggeration)

| Claim | Status | Source |
|-------|--------|--------|
| Live system | **Yes** — MVP API + UI on owner loopback (`:3001`), health + analyze endpoints | `GET /api/hai-ic/health`, `POST /api/hai-ic/analyze`, `npm run dev:hai-ic` |
| Trust Ledger | **Yes** — 200 questions analyzed; ON 82 (41%) / OFF 118 (59%); DD OFF 115/126; avg IC 75.8% | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Real cash collected | **Not recorded** — `$________` (empty until first cleared payment is logged) | Payment rails exist (manual invoice docs + Stripe checkout code); live keys / first deposit not evidenced in repo |
| Public production URL | **Not claimed** | Deploy blocked on credentials per productization status |

**Commercial ask (unchanged):** 2-week POC → Team $8.5k/yr · Enterprise $25k/yr (`hai-ic/PRICING.md`).

---

*HAI-IC · Human final responsibility · Intent Confidence gate · Created by KARAM SHIN*
