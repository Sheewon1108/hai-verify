# Hai-Ic — IP Pack
**Owner:** KARAM SHIN · XGOMA, Inc.  
**Patents Filed:** USPTO #19/546,296 · #19/544,919 · #63/985,005  
**Date:** 2026-08-11

---

## One-Line Thesis

Before AI answers, a human-aligned gate measures intent confidence and enforces human final responsibility — blocking hallucination at the source, not the output.

---

## Problem → Mechanism → Proof

### Problem
Every LLM answers immediately, regardless of how unclear the question is. Vague inputs produce confident-sounding hallucinations. There is no checkpoint between "user types something" and "AI commits to an answer." Enterprises that deploy AI face liability, compliance failure, and trust erosion — not from bad models, but from unclear intent reaching those models unchecked.

### Mechanism
Hai-Ic (Human-AI Intent Confidence) sits as a **pre-inference gate**:

1. Every input is scored 0–100 (Intent Confidence, IC).
2. IC ≥ 75% → **Sincere Mode ON** — full, committed answer authorized.
3. IC < 75% → **Sincere Mode OFF** — 2–3 clarifying questions returned; no hallucinated answer issued.
4. Due diligence questions receive an additional evidence-penalty, forcing documented proof before a "confident" response is allowed.
5. Every decision — ON or OFF — is logged to the **Trust Ledger** with timestamp and score. Human owner reviews and takes final action.

The human does not just see the AI's answer. The human sees the confidence score, approves the path, and retains decision authority. That is the IP: the **architecture of responsibility**, not just a scoring function.

### Proof (live system, real data — not simulated)

| Evidence | Value |
|----------|-------|
| System status | Live, `1.0.0-mvp`, port 3001 |
| Questions analyzed to date | 200 (real test corpus, scores not manually inflated) |
| Sincere Mode ON rate | 82 / 200 (41%) |
| Sincere Mode OFF rate | 118 / 200 (59%) |
| Average IC across all inputs | 75.8% |
| DD questions analyzed | 126 |
| DD OFF (evidence blocked) | 115 / 126 (91%) |
| Boost mechanism | Calibrated hourly; boost = 0% at production (no inflation) |
| Outreach sent | 3 enterprise targets, 2026-07-07 |
| Revenue model | $8,500–$25,000/yr license; POC entry path live |
| Payment infrastructure | Stripe Checkout + webhook → API key issuance (code complete; live key pending) |

---

## Why Hard to Copy

**Not just code.** Anyone can build an IC scoring function in a weekend. What cannot be copied fast:

1. **Philosophical commitment enforced in architecture** — the threshold (75%), the DD penalty, and the human-final-decision requirement are not config values that can be removed without breaking the product's purpose. Removing them produces a different product.
2. **Trust Ledger as audit primitive** — every scored decision is logged, timestamped, and exportable. This creates a compliance artifact that competitors starting fresh cannot retroactively generate.
3. **Process IP filed under patent** — three USPTO applications covering the intent-confidence gate method and human-AI responsibility assignment flow.
4. **Calibrated test corpus** — 200 real questions, scored live, with no manual score inflation. A buyer cannot reproduce this with synthetic data and claim the same trust signal.
5. **Solo build velocity** — one founder built API + demo + payment flow + audit log + SDK + outreach pack. This demonstrates operating leverage that a team-built competitor cannot match on unit economics at the POC stage.

---

## Status Summary

| Track | Status |
|-------|--------|
| Core IP (analyze engine) | Shipped |
| API (`POST /api/hai-ic/analyze`) | Operational |
| Trust Ledger (audit log) | Operational |
| SDK + OpenAPI contract | Shipped (`hai-ic/sdk/`, `hai-ic/openapi.json`) |
| Stripe payment flow | Code complete; live Stripe key pending |
| Public deploy URL | Blocked on Cloudflare credentials (not on IP) |
| Outreach (3 buyers) | Sent; follow-up window: 2026-07-14 |
| Patents | Filed (3 USPTO applications) |

---

*Built solo by KARAM SHIN. All claims map to live system data or explicit "not measured yet" labels.*
