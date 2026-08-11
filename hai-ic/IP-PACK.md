# HAI-IC — IP Pack (1 page)

**Owner:** KARAM SHIN · **Product:** HAI-IC only · **Parent:** HAI Verify  
**Patents (related):** USPTO #19/546,296 · #19/544,919 · #63/985,005

## One-line thesis

**Before AI acts, humans measure Intent Confidence (0–100); Sincere Mode opens only at 75%+; the human keeps the final decision and the responsibility.**

## Problem → mechanism → proof

| Stage | Statement |
|-------|-----------|
| **Problem** | LLMs and multi-agent stacks answer uncertain asks as if certain → hallucination, DD exaggeration, trust collapse. |
| **Mechanism** | HAI-IC sits as a **pre-execution gate**: score Intent Confidence 0–100 → ≥75% Sincere Mode ON (full answer path) / &lt;75% OFF (clarifying questions / evidence first). Human approval remains outside the model. |
| **Proof** | Live analyzer + Trust Ledger from real question runs + paid collection path on Stripe Payment Link (no score inflation). |

**Non-negotiable process (not a model trick):**

1. Score honestly — `HAI_IC_HOURLY_BOOST = 0` (no artificial lift).
2. Gate at **75** — `HAI_IC_CONFIDENCE_THRESHOLD`.
3. OFF path returns questions, not a fake confident answer.
4. Human retains final decision + responsibility always.

## Why hard to copy

| Layer | Why copy fails |
|-------|----------------|
| **Philosophy** | Responsibility stays with the human — product refuses to sell “AI decides.” Competitors optimize answer quality; HAI-IC optimizes **when not to answer**. |
| **Process** | Trust Ledger, OFF-case export, sincerity rules, and buyer packs encode a repeatable audit culture — not just an API wrapper. |
| **Code alone insufficient** | Threshold + patterns are implementable; the scarce asset is the **gated commercial system + founder-owned IP stance + payment-ready live surface**, run solo end-to-end. |

## Evidence (no exaggeration)

| Claim | Status | Source |
|-------|--------|--------|
| Live analyze API | **Yes** | `POST /api/hai-ic/analyze`, `GET /api/hai-ic/health` |
| Live product UI | **Yes** | `/hai-ic` (owner local `:3001`; public curl target documents workers host) |
| Trust Ledger (question runs) | **Yes** | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` — 200 questions · OFF 118 · ON 82 · avg IC 75.8% · DD OFF 115/126 |
| Paid collection path live | **Yes** | Stripe Payment Link wired to “Start Paid Pilot” CTA (`app/components/hai-ic-landing.tsx`) |
| Checkout → key webhook path | **Wired** | `POST /api/stripe/webhook` on `checkout.session.completed` |
| Cash collected (USD) | **Measure in Stripe Dashboard — do not invent** | Empty until Dashboard / bank shows settled charge |

**Commercial ask (list price, not claimed revenue):** Pilot POC → Team $8.5k/yr · Enterprise $25k/yr (`hai-ic/PRICING.md`).

**Contact:** jay.transtar.inc@gmail.com — KARAM SHIN

---

*HAI-IC only. Human final decision + responsibility always retained.*
