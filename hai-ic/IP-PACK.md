# HAI-IC — IP Pack (1 page)

**Owner:** KARAM SHIN · XGOMA, Inc.  
**Product name:** HAI-IC only  
**Patents (founder):** USPTO #19/546,296 · #19/544,919 · #63/985,005

---

## One-line thesis

**Before AI takes action, humans measure Intent Confidence (0–100); Sincere Mode opens only at 75%+; the human keeps final decision and responsibility.**

---

## Problem → mechanism → proof

| Stage | Content |
|-------|---------|
| **Problem** | LLMs answer under uncertainty. Hallucination, DD exaggeration, and silent responsibility transfer destroy buyer trust. |
| **Mechanism** | HAI-IC is a **pre-action Intent Confidence gate**: score 0–100 → gate at 75 → Sincere Mode ON only if passed → clarifying / evidence path if OFF → human retains final yes/no. |
| **Proof** | Live analyzer + health API on Cloudflare Workers; Trust Ledger from real question runs (not hand-inflated scores); paid pilot intake via live Stripe Payment Link on `/hai-ic`. |

**Non-negotiable process**

1. Measure intent **before** action  
2. `IC < 75` → no sincere answer (questions / evidence first)  
3. `IC ≥ 75` → Sincere Mode allowed  
4. Human final decision + responsibility **always** retained  

---

## Why hard to copy (process + philosophy, not only model/code)

| Moat layer | Why code alone fails |
|------------|----------------------|
| **Philosophy** | Responsibility stays human. Competitors optimize “better answers”; HAI-IC refuses to answer when intent is unclear. |
| **Process** | Fixed 75% gate, no score inflation (`HAI_IC_HOURLY_BOOST = 0`), DD evidence-first path, Trust Ledger audit trail. |
| **Operating proof** | Solo-built live system + paid checkout path + logged OFF/ON decisions — not a slide deck. |
| **IP posture** | Founder-originated verification workflow + patent filings; brand locked to **HAI-IC**. |

Copying a prompt or threshold is easy. Copying a **discipline that withholds action until intent is measured, then still requires a human** is not.

---

## Evidence (no exaggeration)

| Claim | Status | Source |
|-------|--------|--------|
| Live system | **Yes** | `GET/POST https://hai-verify.workers.dev/api/hai-ic/health` · `…/analyze` |
| Live paid intake | **Yes** | Stripe Payment Link CTA on `/hai-ic` (`Start Paid Pilot`) |
| Trust Ledger (test log) | **Yes** | `hai-ic/buyer-deliverables/TRUST-LEDGER.md` — 200 questions, OFF 118 / ON 82, avg IC 75.8%, scores not manually raised |
| Cash collected (USD) | **Fill from Stripe** | Not asserted in-repo. Record: Stripe Dashboard → Payment Link / Payments → settled amount → date → `hai-ic/METRICS-PLAN.md` field `cash_collected_usd` |

**Do not claim:** partner endorsement, unmeasured latency/cost wins, or revenue not visible in Stripe.

---

## Commercial scarcity (economic value)

Solo founder · philosophy-level original IP · **live** gate · **paid** path open · human responsibility retained.  
**Ask:** paid pilot → Team $8,500/yr · Enterprise $25,000/yr (`hai-ic/PRICING.md`).

**Contact:** KARAM SHIN · jay.transtar.inc@gmail.com
