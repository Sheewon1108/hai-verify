# HAI Verify — API Plan (Mock Phase)

**Status:** Planning only · **Phase:** Mock · **Do not connect:** OpenAI, Stripe, Discord, Gmail, X

This folder defines the HTTP API surface for HAI Verify / KARAM API before any production wiring. Implementation must reuse existing logic in `app/lib/verification.ts` (`analyzeOutput`, `buildAuditReport`, `createScanId`).

## Principles

- **Mock-only:** Responses use local verification engine; no external LLM or payment calls.
- **No secrets in repo:** API keys documented as env placeholders only (`KARAM_API_KEY`, never committed).
- **Non-breaking:** New routes live under `app/api/*`; existing dashboard and `GET /api/verify` stub remain until migration is intentional.
- **Human Verified:** Every successful verification response includes `scanId` and policy reference `HAI-VERIFY-01`.

## Base URL (planned)

| Environment | Base |
|-------------|------|
| Local | `http://localhost:3000` |
| Staging | `https://staging.verify.example` (placeholder) |
| Production | `https://verify.example` (placeholder) |

## Authentication (planned, mock)

```
Authorization: Bearer karam_test_xxxxxxxx
X-HAI-Client: hai-verify-cli/0.1.0   # optional, for CLI
```

Mock phase: accept `karam_test_demo` when `KARAM_MOCK_AUTH=true` (env, not committed).

## Endpoints

| Method | Path | Doc |
|--------|------|-----|
| `POST` | `/api/verify` | [verify.md](./verify.md) |
| `POST` | `/api/audit-report` | [audit-report.md](./audit-report.md) |
| `POST` | `/api/intake` | [intake.md](./intake.md) |
| `GET` | `/api/health` | Planned — `{ "status": "ok", "mode": "mock" }` |

## Shared response envelope

```json
{
  "ok": true,
  "mode": "mock",
  "scanId": "HV-A1B2C3",
  "policy": "HAI-VERIFY-01",
  "timestamp": "2026-05-27T12:00:00.000Z",
  "data": { }
}
```

Error envelope:

```json
{
  "ok": false,
  "mode": "mock",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Human-readable message"
  }
}
```

## Error codes (planned)

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `INVALID_INPUT` | 400 | Empty text, malformed JSON |
| `PAYLOAD_TOO_LARGE` | 413 | Text over limit (e.g. 32k chars) |
| `RATE_LIMITED` | 429 | Mock counter exceeded (in-memory) |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

## Rate limits (mock, in-memory)

| Tier | Requests/min | Notes |
|------|--------------|-------|
| `starter` | 10 | Maps to $300 Starter Audit |
| `pilot` | 60 | Maps to $1,500 Trust Audit Pilot |
| `compliance` | 300 | Maps to $5,000/mo compliance pilot |

No billing integration in mock phase — tier passed via header `X-HAI-Tier: starter|pilot|compliance` for testing only.

## Implementation order

1. `POST /api/verify` — core scoring (reuse `analyzeOutput`)
2. `POST /api/audit-report` — text report (reuse `buildAuditReport`)
3. `POST /api/intake` — sales / onboarding queue (mock store)
4. Auth middleware (mock bearer)
5. `GET /api/health`

## Related plans

- CLI: [`../cli-plan/README.md`](../cli-plan/README.md)
- KARAM Idea API: [`../karam-api/README.md`](../karam-api/README.md)
- Revenue flows: [`../revenue-system/README.md`](../revenue-system/README.md)
