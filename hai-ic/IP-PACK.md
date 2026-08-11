# HAI-IC — IP Pack (1 page)

**Owner:** KARAM SHIN · XGOMA, Inc.  
**Product name:** HAI-IC only  
**Patents (related):** USPTO #19/546,296 · #19/544,919 · #63/985,005

---

## One-line thesis

**Before AI acts, humans measure Intent Confidence (0–100); Sincere Mode only at 75%+; human final decision and responsibility always retained.**

---

## Problem → mechanism → proof

| Stage | Content |
|-------|---------|
| **Problem** | LLMs and agents answer under uncertainty — hallucination, DD exaggeration, buyer trust collapse — while no one owns the decision. |
| **Mechanism** | HAI-IC sits as a **pre-execution gate**: score Intent Confidence 0–100 → **Sincere Mode ON only at ≥75%** → below gate: clarifying / evidence first → **human keeps final approve/reject**. |
| **Proof** | Live analyzer (`POST /api/hai-ic/analyze`, UI `/hai-ic`) + Trust Ledger from real test runs (scores not manually raised). |

**Trust Ledger snapshot** (`hai-ic/buyer-deliverables/TRUST-LEDGER.md`, 2026-07-08):

| Metric | Value |
|--------|-------|
| Questions analyzed | 200 |
| Sincere Mode ON (≥75%) | 82 (41%) |
| Sincere Mode OFF (<75%) | 118 (59%) |
| DD questions | 126 |
| DD blocked (OFF) | 115 |
| Avg Intent Confidence | 75.8% |

---

## Why hard to copy (process + philosophy, not only model/code)

1. **Philosophy lock** — Intent Confidence is a responsibility instrument, not a nicer chatbot. Final decision stays with the human; the gate never “decides for” them.
2. **Process lock** — Sincerity rules: no score inflation (`HAI_IC_HOURLY_BOOST = 0`), Trust Ledger as audit artifact, outreach sincerity validators before send.
3. **IP lock** — Fixed product doctrine (0–100, 75% gate, human responsibility) + founder patents/principles; cloneable code without this doctrine is a different product.
4. **Commercial lock** — Solo-operated live paid rail (Stripe Payment Link for HAI-IC pilot) tied to this doctrine, not a generic API wrapper.

---

## Evidence (no exaggeration)

| Claim | Status | Where |
|-------|--------|-------|
| Live system | **Yes** | Local demo `127.0.0.1:3001/hai-ic` · `GET /api/hai-ic/health` · `POST /api/hai-ic/analyze` |
| Trust Ledger | **Yes** | 200 questions · avg IC 75.8% · scores not manually raised |
| Paid rail live | **Yes** | Stripe Payment Link CTA on `/hai-ic` (`buy.stripe.com/...`) · Checkout/webhook code present |
| Cash collected (USD) | **Fill from Stripe Dashboard / bank** — do not invent | Stripe → Payments / Payouts; or memo ledger KARAM maintains offline |

**Rule:** If a dollar amount is not in Stripe or KARAM’s private ledger, leave it blank. Never invent “first payment” stories.

---

## Ask (commercial)

- **Entry:** 2-week POC → **Team $8,500/yr** · **Enterprise $25,000/yr** (`hai-ic/PRICING.md`)
- **Contact:** jay.transtar.inc@gmail.com — KARAM SHIN

*Human + Heart + AI + Law = Verification*
