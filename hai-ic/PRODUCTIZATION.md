# HAI-IC Productization (병행 트랙)

**Owner:** KARAM SHIN  
**Parallel with:** `transla/` (Woosung LTL)  
**Version target:** 1.0.0 → 1.1.0-product

**Economic scarcity pack:** `IP-PACK.md` · `METRICS-PLAN.md` · `MODULE-BOUNDARIES.md` · `SECURITY-SPEC.md` · `AUTOMATION-PIPELINE.md`

## Product definition

| | |
|---|---|
| **What** | Pre-LLM Intent Confidence Gate (**HAI-IC** only) |
| **Threshold** | 75% — below = no sincere answer |
| **Proof** | Trust Ledger (live test log, scores not manually raised) |
| **Cash collected** | Empty until first cleared payment logged (do not invent) |
| **Price** | POC 2wk → $8.5k–$25k/yr |

## Phase map

| Phase | Goal | Status |
|-------|------|--------|
| **P0 MVP** | API + demo + automation | Done |
| **P1 Sales** | 3 buyer emails sent | Done (2026-07-07) |
| **P2 Package** | SDK + OpenAPI + pricing doc | In progress |
| **P3 Deploy** | Public demo URL (Cloudflare) | Blocked — credentials |
| **P4 Monetize** | API key + Stripe license | Next |
| **P5 Vertical** | Transla logistics monitoring | Linked |

## Deliverables (P2)

| File | Purpose |
|------|---------|
| `hai-ic/openapi.json` | Buyer / integrator API contract |
| `hai-ic/sdk/hai-ic-client.ts` | Drop-in client |
| `hai-ic/PRICING.md` | Tier + POC terms |
| `hai-ic/PRODUCTIZATION-STATUS.md` | Auto-generated snapshot |
| `transla/HAI-IC-LINK.md` | Logistics vertical use cases |

## Integration points (Transla)

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
- `validate-outreach-sincerity.cjs` before any new send