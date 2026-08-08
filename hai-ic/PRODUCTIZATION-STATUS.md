# Hai-Ic Productization — Status

**Generated:** 2026-07-29  
**Updated:** 2026-08-08  
**Owner:** KARAM SHIN  
**Legal entity:** XGOMA Inc

## Parallel tracks

| Track | Phase | Next |
|-------|-------|------|
| **Hai-Ic** (XGOMA Inc) | P2 Package | API key + public deploy |
| **Transla** | Definition | Woosung LTL proposal |
| **Link** | Spec | `transla/HAI-IC-LINK.md` |

## Live

| Check | Value |
|-------|-------|
| Server :3001 | healthy (1.0.0-mvp) |
| Trust Ledger | 210 q / OFF 124 / ON 86 / avg 75.8% |
| Outreach | outreach sent 2026-07-07 |
| Follow-up | ~2026-07-14 |

## P2 checklist

- [x] openapi.json
- [x] sdk/hai-ic-client.ts
- [x] PRICING.md
- [x] PRODUCTIZATION.md
- [ ] Public deploy (Cloudflare credentials)
- [ ] API key middleware
- [ ] Stripe → Team tier

## Commands

```powershell
node scripts/hai-ic-productization-status.cjs
node scripts/generate-buyer-trust-pack.cjs
npm run dev:hai-ic
```
