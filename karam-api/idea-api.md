# KARAM Idea API (Planned · Mock Only)

Capture and score **verification-related product ideas** from teams, partners, or intake forms. This is **not** a social posting API — no X, Discord, or Gmail integration.

## Purpose

- Collect structured ideas (“verify AI outputs in our HR chatbot”)
- Run lightweight mock scoring (feasibility, regulated-domain fit)
- Queue for human review by KARAM / HAI Verify team
- Optional link to `/api/intake` when idea matures into paid pilot

## Endpoint (planned)

```
POST /api/idea
Content-Type: application/json
Authorization: Bearer karam_test_demo   # optional in mock public form
```

### Request body

```json
{
  "title": "Verify AI contract summaries before client send",
  "description": "Legal team uses Copilot; need Human Verified gate.",
  "domain": "legal",
  "urgency": "q2",
  "contactEmail": "team@example.com",
  "estimatedVolume": "500 outputs/week"
}
```

| Field | Type | Required |
|-------|------|----------|
| `title` | string | yes, max 120 |
| `description` | string | yes, min 40 |
| `domain` | `legal` \| `health` \| `finance` \| `general` | yes |
| `urgency` | `immediate` \| `q2` \| `exploring` | no |
| `contactEmail` | string | no |
| `estimatedVolume` | string | no |

## Response `201`

```json
{
  "ok": true,
  "mode": "mock",
  "ideaId": "IDEA-4M8N2P",
  "scores": {
    "verificationFit": 88,
    "regulatedDomain": true,
    "suggestedTier": "trust_pilot"
  },
  "suggestedNextStep": "Submit Trust Audit Pilot intake",
  "intakeUrl": "/api/intake",
  "timestamp": "2026-05-27T12:00:00.000Z"
}
```

## Mock scoring rules (local, no LLM)

| Signal | Effect on `verificationFit` |
|--------|------------------------------|
| `domain` = legal/health/finance | +15, `regulatedDomain: true` |
| Description mentions “AI”, “verify”, “compliance” | +10 |
| `estimatedVolume` present | +5 |
| Base score | 50 |

`suggestedTier`:

- `verificationFit` ≥ 80 + regulated → `trust_pilot` or `compliance_pilot`
- `verificationFit` 60–79 → `starter`
- else → manual review only

## CLI (planned)

```bash
karam idea submit --title "..." --domain legal --description-file idea.md
karam idea list                    # mock local cache
karam idea show IDEA-4M8N2P
```

Alias under `hai-verify idea` namespace.

## Storage (mock)

```
/mock-data/ideas.json   # gitignored when implemented
```

## Out of scope

- OpenAI idea generation
- Posting to X or Discord
- Email notifications
- Automatic Stripe upgrade from idea → paid tier

## Relation to HAI Verify

Ideas that score high on `verificationFit` should surface a CTA:

> “Ready to verify? Start $1,500 Trust Audit Pilot” → `POST /api/intake` with `tier: trust_pilot`
