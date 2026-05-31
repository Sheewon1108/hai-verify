# HAI Verify — Revenue System (Money-Ready)

**Sell today:** manual invoice · `/verify` MVP · Copy Report delivery  
**No Stripe, no external APIs, no frontend changes required** in this package.

---

## Product ladder

| Tier | Price | Doc | Turnaround |
|------|-------|-----|------------|
| **Starter Audit** | **$300** one-time | [starter-audit-300.md](./starter-audit-300.md) | 24–48 hours |
| **Trust Audit Pilot** | **$1,500** one-time | [trust-audit-1500.md](./trust-audit-1500.md) | 3–5 business days |
| **Monthly Compliance Pilot** | **$5,000/month** | [monthly-pilot-5000.md](./monthly-pilot-5000.md) | Ongoing monthly |

**Revenue target:** 8 × $5,000/mo = **$40,000/month** ([monthly-pilot-5000.md](./monthly-pilot-5000.md))

---

## Sales ops (start here)

| Step | File |
|------|------|
| 1. Outreach | [outreach-message.md](./outreach-message.md) |
| 2. Intake | [customer-intake.md](./customer-intake.md) |
| 3. Get paid | Zelle · Wise · PayPal · Venmo · Bank |
| 4. Deliver | [manual-delivery-flow.md](./manual-delivery-flow.md) |
| 5. Grow revenue | [money-playbook.md](./money-playbook.md) |

---

## Payment (all tiers)

Manual invoice while Stripe is pending:

- Zelle  
- Wise  
- PayPal  
- Venmo  
- Bank transfer  

**Do not implement Stripe in this phase.**

---

## What the customer gets (technical)

From working MVP (`/verify` + `POST /api/verify`):

- **Trust Index** (starts at 100, transparent deductions)  
- **Hallucination / integrity concern score**  
- **Risk flags:** `unverified_claim` · `subjective_claim` · `overconfident_language`  
- **Summary + recommended next step**  
- **Copy Report** (paid tiers + human notes)  

Engine: `app/lib/verification.ts` — do not change for sales docs.

---

## Legacy filenames (still valid)

| Legacy | Canonical |
|--------|-----------|
| [trust-audit-pilot-1500.md](./trust-audit-pilot-1500.md) | Same tier as [trust-audit-1500.md](./trust-audit-1500.md) |
| [compliance-pilot-5000.md](./compliance-pilot-5000.md) | Same tier as [monthly-pilot-5000.md](./monthly-pilot-5000.md) |

---

## Ownership

Clients buy **reports and access**, not source code. See [ownership-rules.md](./ownership-rules.md).

---

## Brand line

**Human Verified** · HAI Verify · Created by KARAM
