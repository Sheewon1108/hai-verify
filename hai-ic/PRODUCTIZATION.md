# HAI-IC Productization

**Owner:** KARAM SHIN  
**Version target:** 1.0.0 → 1.1.0-product

## Product definition

| | |
|---|---|
| **What** | Pre-LLM Intent Confidence Gate |
| **Threshold** | 75% — below = no sincere answer |
| **Responsibility** | Human final decision retained every time |
| **Proof** | Trust Ledger (live test log, scores not manually raised) |
| **Price** | POC 2wk → $8.5k–$25k/yr |

## Phase map

| Phase | Goal | Status |
|-------|------|--------|
| **P0 MVP** | API + demo + automation | Done |
| **P1 Sales** | 3 buyer emails sent | Done (2026-07-07) |
| **P2 Package** | SDK + OpenAPI + IP/metrics/security/sales pack | Done |
| **P3 Deploy** | Public demo URL (Cloudflare) | Blocked — credentials |
| **P4 Monetize** | Paid pilot + verified receipt evidence | Next |
| **P5 Vertical** | Use-case examples only | Parked |

## Deliverables (P2)

| File | Purpose |
|------|---------|
| `hai-ic/openapi.json` | Buyer / integrator API contract |
| `hai-ic/sdk/hai-ic-client.ts` | Drop-in client |
| `hai-ic/PRICING.md` | Tier + POC terms |
| `hai-ic/IP-PACK.md` | One-page IP thesis + proof |
| `hai-ic/METRICS-PLAN.md` | Objective measurement checklist |
| `hai-ic/ENGINEER-ONBOARDING.md` | Module map + security spec skeleton |
| `hai-ic/POSITIONING-ONE-PAGER.md` | External HAI-IC sales copy |
| `hai-ic/NEXT-3-ACTIONS.md` | KARAM-only execution list |
| `hai-ic/PRODUCTIZATION-STATUS.md` | Auto-generated snapshot |
| `scripts/measure-hai-ic-metrics.cjs` | Latency / throughput measurement |

## Use-case examples only

- Broker load requests → IC gate before accept
- Driver/status messages → no fake ETA when IC < 75%
- Nexen/Woosung DD questions → evidence-first (OFF mode)

## Commands

```powershell
node scripts/hai-ic-productization-status.cjs
node scripts/generate-buyer-trust-pack.cjs
npm run dev:hai-ic
```

## Non-negotiable (진정성)

- No score inflation (`HAI_IC_HOURLY_BOOST = 0`)
- No localhost in buyer-facing assets
- No revenue-collected claim without verified receipt evidence
- Human final approval stays required even when Sincere Mode is ON
- `validate-outreach-sincerity.cjs` before any new send