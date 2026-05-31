# KARAM API — Product Plan (Mock Phase)

**KARAM API** is the external brand for HAI Verify programmatic access. Internal engine remains `app/lib/verification.ts`. **No live third-party connections in mock phase.**

## Product layers

```
┌─────────────────────────────────────────────────────────┐
│  KARAM API (public brand)                               │
│  verify · audit-report · intake · idea (planned)        │
├─────────────────────────────────────────────────────────┤
│  HAI Verify engine (Human + Heart + AI + Law)           │
│  analyzeOutput · buildAuditReport · HAI-VERIFY-01       │
├─────────────────────────────────────────────────────────┤
│  HAI Verify dashboard + CLI                             │
└─────────────────────────────────────────────────────────┘
```

## API families

| Family | Status | Doc |
|--------|--------|-----|
| **Verification** | Planned | [`../api-plan/README.md`](../api-plan/README.md) |
| **Intake / Revenue** | Planned | [`../api-plan/intake.md`](../api-plan/intake.md) |
| **Idea** | Planned (mock) | [idea-api.md](./idea-api.md) |
| **Identity** | Future | API keys, tiers — mock bearer only now |

## Versioning

- Header: `X-KARAM-Version: 2026-05-27` (date-based, mock)
- URL prefix (future option): `/v1/verify`
- Phase 1: unversioned `/api/*` on Next.js App Router

Details: [versioning.md](./versioning.md)

## API keys (planned naming, never commit real keys)

| Prefix | Environment | Example (fake) |
|--------|-------------|----------------|
| `karam_test_` | Mock / dev | `karam_test_demo` |
| `karam_live_` | Production | `karam_live_xxxxxxxx` |

Env placeholder: `KARAM_API_KEY`

## Tiers ↔ revenue

| Tier ID | Product | API rate (mock) |
|---------|---------|-----------------|
| `starter` | $300 Starter Audit | 10 req/min |
| `pilot` | $1,500 Trust Audit Pilot | 60 req/min |
| `compliance` | $5,000/mo Compliance Pilot | 300 req/min |

See [`../revenue-system/README.md`](../revenue-system/README.md)

## KARAM Idea API

Separate namespace for structured “idea intake” — product concepts, verification use cases, and internal innovation queue. **Not connected to X/Twitter or any social API.**

See [idea-api.md](./idea-api.md)

## Security (mock phase checklist)

- [ ] No secrets in git
- [ ] `.env.example` with placeholders only (future)
- [ ] Honeypot on public intake
- [ ] Max payload sizes on all POST routes
- [ ] `mode: "mock"` in every response until production flag

## Implementation roadmap

| Week | Deliverable |
|------|-------------|
| 1 | `POST /api/verify` + mock auth |
| 2 | `POST /api/audit-report` + CLI `scan` |
| 3 | `POST /api/intake` + revenue landing hooks |
| 4 | KARAM Idea API mock + docs site section |

## Related

- CLI: [`../cli-plan/README.md`](../cli-plan/README.md)
- Created by **KARAM** — footer attribution on HAI Verify dashboard
