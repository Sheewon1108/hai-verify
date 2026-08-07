# Hai-Ic Pricing

**Owner:** KARAM SHIN  
**Effective:** 2026-07-07

## Tiers

| Tier | Price | Includes |
|------|--------|----------|
| **Evaluation Pilot** | $300 | 2–4 week integration, Trust Ledger export, onboarding |
| **OEM** | $8.5k+/yr | Embed Hai-ic into your product; API gate, health checks, sincere-mode gate at 75% |
| **Enterprise** | $25k/yr | Volume routing, SLA, custom threshold, approval workflows, audit log export |

## Path

**$300 Evaluation Pilot → OEM $8.5k+/yr → Enterprise $25k/yr**

## POC (entry)

- **Duration:** 2–4 weeks
- **Scope:** One stack (e.g. multi-agent pipeline, logistics ops bot)
- **Success metric:** % of uncertain intents blocked (OFF) vs baseline hallucination rate
- **Convert:** Evaluation Pilot → OEM or Enterprise annual

## What's metered

| Unit | Definition |
|------|------------|
| **Analyze call** | POST `/api/hai-ic/analyze` — one input scored |
| **OFF event** | IC < 75% — clarifying / evidence path (value = risk blocked) |

## Not included (honest)

- Public cloud hosting (buyer self-host or we deploy on contract)
- LLM inference costs (Hai-Ic is pre-gate only)
- Legal/compliance sign-off (buyer counsel)

## Contact

jay.transtar.inc@gmail.com — KARAM SHIN
