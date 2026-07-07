# Hai-Ic Outreach — Sincerity Rules (mandatory)

**Owner:** KARAM SHIN  
**Rule:** Buyer-facing text must match Hai-Ic product behavior. No opposite messaging.

## NEVER in outreach / buyer-deliverables

| Block | Why |
|-------|-----|
| `localhost` / `127.0.0.1` | Buyer cannot open — looks careless |
| `70%` reduction claims | No verified data |
| `리스크 제로` / `zero risk` | Overclaim |
| `Production Ready` | Not honest for MVP |
| `85%` threshold | Product uses **75%** |
| `boost` / score inflation | Opposite of 진정성 |
| `significantly reduce` without proof | Unverified marketing |

## MUST be true

- Threshold: **75%** sincere mode
- Demo: **30-min live call** only (until public deploy)
- Attachments: real Trust Ledger data; scores not manually raised
- Tone: **모를 때 답 안 함** — not "trust us blindly"

## Gate

`node scripts/validate-outreach-sincerity.cjs` must pass before any send pack or Gmail draft opens.

Deprecated (blocked): `open-growth-loops-gmail-draft.ps1`, `PITCH-EMAIL.txt`