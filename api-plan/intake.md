# POST /api/intake

Capture inbound interest for paid audit tiers. **Mock phase:** in-memory or JSON file store; no CRM, Stripe, or email.

## Purpose

Bridge landing page CTAs and revenue tiers to a structured intake queue:

- $300 Starter Audit
- $1,500 Trust Audit Pilot
- $5,000/month Compliance Pilot

See [`../revenue-system/README.md`](../revenue-system/README.md) for full sales flows.

## Request

```
POST /api/intake
Content-Type: application/json
```

Auth: optional in mock (public form). Production plan: rate-limit by IP + honeypot field.

### Body

```json
{
  "tier": "starter",
  "contact": {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "company": "Acme Corp",
    "role": "Compliance Lead"
  },
  "useCase": "Verify AI-generated contract summaries before client delivery.",
  "sampleText": "Optional excerpt of AI output (max 2000 chars)",
  "referral": "landing-cta",
  "honeypot": ""
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `tier` | `"starter"` \| `"trust_pilot"` \| `"compliance_pilot"` | yes | Maps to revenue tier |
| `contact.name` | string | yes | |
| `contact.email` | string | yes | Valid email format |
| `contact.company` | string | no | |
| `contact.role` | string | no | |
| `useCase` | string | yes | Min 20 chars |
| `sampleText` | string | no | Optional; run mock verify on ingest |
| `referral` | string | no | UTM or page source |
| `honeypot` | string | yes | Must be empty (bot trap) |

## Response `201`

```json
{
  "ok": true,
  "mode": "mock",
  "intakeId": "INT-7X9K2M",
  "tier": "starter",
  "status": "received",
  "nextSteps": [
    "Mock: intake recorded locally.",
    "Human follow-up within 1 business day (planned).",
    "No payment charged in mock phase."
  ],
  "mockVerification": null,
  "timestamp": "2026-05-27T12:00:00.000Z"
}
```

If `sampleText` provided, include optional `mockVerification` with subset of `/api/verify` response (risk band + humanReviewRequired only).

## Intake statuses (planned)

| Status | Meaning |
|--------|---------|
| `received` | Form accepted |
| `qualified` | Manual review passed (mock flag) |
| `scheduled` | Kickoff call booked (mock) |
| `active` | Pilot running |
| `closed` | Won / lost / expired |

## Mock storage

```
/mock-data/intake.json   # gitignored when implemented
```

Never commit real customer PII. Use fake data in docs and tests only.

## Out of scope (mock phase)

- Stripe Checkout session creation
- Gmail auto-reply
- Discord/X notifications
- HubSpot/Salesforce sync
