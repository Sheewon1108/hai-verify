# $5,000/month Compliance Pilot — Sales Flow (Mock)

**SKU:** `compliance_pilot` · **Type:** Monthly pilot (30-day minimum, then month-to-month) · **Target:** Compliance, legal, health, finance teams with production AI workflows

## Positioning

> “Continuous Human Verified gate for AI output — policy-aligned, audit-ready, enterprise SLA.”

Primary path toward $40k/mo portfolio (8 × $5k or mix with higher Enterprise).

## Ideal customer

- AI output reaches clients, regulators, or patients
- Needs ongoing verification + human review queue
- Budget owner: CCO, General Counsel, Head of AI Governance

## Landing CTA copy (planned)

**Button:** Request Compliance Pilot — $5,000/mo  
**Subtext:** Dedicated review queue · API + CLI · HAI-VERIFY-01 · 4h SLA

## Flow (mock — no Stripe)

```
1. Enterprise CTA → intake (tier: compliance_pilot)
2. POST /api/intake + optional sampleText → mock verify preview in response
3. Discovery call (60 min, manual)
4. Security questionnaire placeholder (no real SSO yet)
5. Mock MSA + order form → manual signature
6. Month 1 provisioning:
   - Production-tier API key label (mock: karam_live_compliance_*)
   - X-HAI-Tier: compliance
   - Named human verifier (KARAM / partner — manual roster)
   - Weekly compliance report template
7. Ongoing (each month):
   - Usage report from mock API logs
   - Human review queue metrics
   - Renewal invoice manual
8. Expansion: custom Enterprise ($10k–15k/mo) — out of mock scope
```

## Deliverables checklist (monthly)

- [ ] Unlimited verifications within fair use (e.g. 10,000/mo documented cap)
- [ ] All `/api/audit-report` exports retained 12 months (mock storage plan)
- [ ] Weekly compliance digest (manual)
- [ ] Quarterly policy review against HAI-VERIFY-01
- [ ] Human Verified badge usage guidelines
- [ ] Incident path for `blocked` status outputs (runbook doc)

## API entitlements (mock)

| Limit | Value |
|-------|-------|
| Rate | 300 req/min |
| Monthly volume | 10,000 verifications (soft cap) |
| Human review SLA | 4h business hours |
| Dedicated queue | P1 priority |
| Audit retention | 12 months (planned storage) |

## Human review workflow (compliance)

```
AI output → POST /api/verify
    │
    ├─ cleared ──► auto-log, optional release
    ├─ review ───► human verifier queue (manual tool / dashboard flag)
    └─ blocked ──► stop ship + escalation runbook
```

No Discord/Gmail automation — manual queue in mock phase.

## Mock CRM record

```json
{
  "intakeId": "INT-9Z3M5P",
  "tier": "compliance_pilot",
  "amountUsdMonthly": 5000,
  "status": "active",
  "contractStart": "2026-06-01",
  "verificationsThisMonth": 842,
  "verificationsCap": 10000,
  "assignedVerifier": "KARAM"
}
```

## Revenue math (planning)

| Customers | MRR |
|-----------|-----|
| 1 | $5,000 |
| 4 | $20,000 |
| 8 | $40,000 |

Requires sales motion — not automatic from API deployment alone.

## Compliance artifacts (document-only, mock)

- HAI-VERIFY-01 policy reference (existing dashboard)
- Sample audit log format from `buildAuditReport`
- Data handling: no PII in mock logs; production DPA future phase

## Out of scope (mock phase)

- SOC 2 Type II
- Real Stripe subscriptions
- OpenAI enterprise connector
- X / social monitoring

## Upgrade path

Trust Pilot ($1,500) → Compliance Pilot ($5k/mo) → Enterprise custom
