# Hai-Ic Pricing

**Owner:** KARAM SHIN  
**Legal entity / billing:** XGOMA Inc  
**Effective:** 2026-07-07

## Tiers

| Tier | Annual | Includes |
|------|--------|----------|
| **Pilot** | POC only | 2-week integration, Trust Ledger export, 30-min onboarding |
| **Team** | $8,500/yr | API gate, 50k analyze calls/mo, email support |
| **Enterprise** | $25,000/yr | Unlimited calls, SLA, custom threshold, audit log export |

## POC (entry)

- **Duration:** 2 weeks
- **Scope:** One stack (e.g. multi-agent pipeline, logistics ops bot)
- **Success metric:** % of uncertain intents blocked (OFF) vs baseline hallucination rate
- **Convert:** Pilot → Team or Enterprise annual

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

**XGOMA Inc** · KARAM SHIN · jay.transtar.inc@gmail.com