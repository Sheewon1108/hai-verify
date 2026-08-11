# Hai-Ic — Intent Confidence Gate
**One-page brief for enterprise evaluators**

---

## What It Is

Hai-Ic is a pre-inference gate that measures how clearly a user stated their intent before any AI system answers.

Every input receives an **Intent Confidence score (0–100)**. Below 75%, the system does not guess — it asks 2–3 clarifying questions and waits. Above 75%, it proceeds in **Sincere Mode**: a committed, evidence-grounded response.

The human always sees the score. The human always takes final action. The AI never bypasses this gate.

---

## The Problem It Solves

| Symptom | Root Cause | Hai-Ic Response |
|---------|-----------|-----------------|
| LLM gives confident wrong answers | No check on input clarity before inference | IC gate blocks response until intent is clear |
| Due diligence meetings expose fabricated data | AI answers evidence questions without evidence | DD penalty: evidence required before Sincere Mode |
| AI outputs used without accountability | No human checkpoint in the loop | Trust Ledger logs every decision; human retains authority |
| Hallucination rate cited but not measured | No baseline data from real inputs | 200 real inputs scored live; avg IC 75.8%, no inflation |

---

## Who It Is For

**Primary fit:** Enterprise teams deploying LLM pipelines, multi-agent systems, or AI-assisted operations where a wrong or vague AI answer carries real cost — financial, legal, or reputational.

**Verticals that benefit immediately:**
- LLM / multi-agent infrastructure companies
- Logistics and procurement operations running AI-dispatched workflows
- Any team preparing AI-generated content for investor or partner due diligence

---

## Evidence (live system, real data)

| Metric | Value |
|--------|-------|
| Questions scored to date | 200 (live corpus, no synthetic inflation) |
| Sincere Mode ON rate | 41% |
| Sincere Mode OFF rate | 59% — these inputs never reached an LLM |
| Due diligence questions blocked (evidence required) | 115 / 126 |
| Average Intent Confidence | 75.8% |
| System version | 1.0.0-mvp, operational |
| Latency (p50 / p95) | Not measured yet — benchmark on POC kick-off |
| Cost reduction vs direct LLM pass-through | Not measured yet — 59% OFF-rate provides lower bound |

---

## Pilot Path

**Step 1 — 30-minute call.** Live demo on your use case. No slide deck. Actual system, real inputs from your workflow.

**Step 2 — 2-week POC.** One stack, one workflow. We instrument the gate, score your real inputs, and produce a Trust Ledger export showing OFF rate and blocked risk events.

**Step 3 — Decision.** Convert to annual license or walk away. No lock-in at POC stage.

| Tier | Annual | Includes |
|------|--------|----------|
| Team | $8,500 | 50k analyze calls/mo, Trust Ledger, email support |
| Enterprise | $25,000 | Unlimited calls, SLA, custom threshold, audit export |

---

## Next Step — Yes or No

**Yes:** Reply to this message. We schedule the 30-minute call within 48 hours.

**No:** Tell us the specific blocker. We either solve it or confirm it is not the right fit. No follow-up pressure.

---

**Contact:** KARAM SHIN — jay.transtar.inc@gmail.com  
**Company:** XGOMA, Inc.  
**Patents filed:** USPTO #19/546,296 · #19/544,919 · #63/985,005

---

*All metrics from live system. No claims without data. Human responsibility retained at every step.*
