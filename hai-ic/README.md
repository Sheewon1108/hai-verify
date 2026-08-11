# HAI-IC

Intent Confidence gate for AI workflows.

Core rule: before AI takes action, measure intent. Sincere Mode requires Intent Confidence >= 75%. A human always makes the final decision and keeps responsibility.

## Ship-today pack

| File | Use |
|---|---|
| `IP-PACK.md` | One-page IP thesis, proof, and defensibility |
| `METRICS-PLAN.md` | Objective measurement checklist and current status |
| `METRICS-LOCAL-2026-08-11.json` | Local API metrics evidence |
| `ENGINEER-ONBOARDING.md` | Module map, public interfaces, security spec skeleton, automation outline |
| `POSITIONING-ONE-PAGER.md` | External sales copy with Yes/No next step |
| `NEXT-3-ACTIONS.md` | KARAM-only execution list |
| `API.md` | API examples |
| `openapi.json` | Public API contract |
| `sdk/hai-ic-client.ts` | Drop-in TypeScript client |
| `buyer-deliverables/TRUST-LEDGER.md` | Current measured Trust Ledger |

## Fast commands

```bash
npm run dev:hai-ic
npm run hai-ic:metrics
npm run hai-ic:productization
```

## Non-negotiables

1. Do not paste secrets, tokens, private URLs, or customer receipts into docs.
2. Do not claim revenue collected unless verified receipts exist.
3. Do not publish latency, uptime, or cost reduction numbers until measured.
4. Do not lower the 75% Sincere Mode threshold for demo optics.
5. Do not remove human final approval.
