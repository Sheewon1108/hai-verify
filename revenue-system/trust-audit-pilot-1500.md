# $1,500 Trust Audit Pilot — Sales Flow (Mock)

**SKU:** `trust_pilot` · **Type:** One-time pilot (2 weeks) · **Target:** Legal, compliance, ops teams with recurring AI drafts

## Positioning

> “Two-week Human Verified pilot — score every AI output before it leaves your team.”

Bridge product between Starter and monthly Compliance.

## Ideal customer

- Regulated-adjacent content (legal memos, policy summaries, client comms)
- 5–20 users pasting or piping AI output
- Needs audit trail for leadership or clients

## Landing CTA copy (planned)

**Button:** Book Trust Audit Pilot — $1,500  
**Subtext:** 14-day access · 50 verifications · CLI + dashboard · 4h review SLA

## Flow (mock — no Stripe)

```
1. CTA → intake form (tier: trust_pilot)
2. POST /api/intake
3. Qualification call (manual, 30 min) — mock calendar link placeholder
4. Mock "SOW signed" → payment invoice manual
5. Provision:
   - API key karam_test_* or karam_live_* (mock label only)
   - X-HAI-Tier: pilot
   - Dashboard shared link (existing app, no new auth yet)
6. Kickoff email with:
   - CLI install: npm run cli (future)
   - Sample: hai-verify scan --fail-on review
   - Grok pipeline doc (cli-plan/workflows.md)
7. Pilot week 1–2:
   - Customer runs verifications
   - Weekly mock check-in (human)
8. Close-out deliverable:
   - Executive summary (trust index trends, top signals)
   - Human Verified certification letter (PDF, manual)
9. Upsell: Compliance Pilot $5,000/mo
```

## Deliverables checklist

- [ ] Kickoff deck (Notion/PDF, manual)
- [ ] 50 verification credits (mock counter)
- [ ] 2 × weekly status summaries
- [ ] Final audit rollup + recommendations
- [ ] CLI + API documentation pack

## API entitlements (mock)

| Limit | Value |
|-------|-------|
| Rate | 60 req/min |
| Total verifications | 50 during pilot |
| Human review SLA | 4h |
| Duration | 14 calendar days |

## Pilot success metrics (report to customer)

| Metric | Source |
|--------|--------|
| Avg hallucination risk | `/api/verify` aggregate |
| % requiring human review | `humanReviewRequired` |
| Top failed signals | `signals` where state=fail |
| Trust index trend | `trustIndex` over time |

## Mock CRM record

```json
{
  "intakeId": "INT-8Y2L4N",
  "tier": "trust_pilot",
  "amountUsd": 1500,
  "status": "active",
  "pilotStart": "2026-06-01",
  "pilotEnd": "2026-06-15",
  "verificationsUsed": 12,
  "verificationsCap": 50
}
```

## KARAM Idea API hook

High-scoring ideas (`suggestedTier: trust_pilot`) auto-suggest this SKU in mock response copy.

## Out of scope (pilot)

- Custom model integration (OpenAI etc.)
- Automated billing renewal
- Discord/Slack alerts
