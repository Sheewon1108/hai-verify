# KARAM API — Versioning & Compatibility

## Strategy

Date-based API version in header for mock phase; path-based `/v1` when breaking changes ship.

## Client headers (planned)

```
Authorization: Bearer karam_test_demo
X-KARAM-Version: 2026-05-27
X-HAI-Client: hai-verify-cli/0.1.0
X-HAI-Tier: starter
Content-Type: application/json
```

## Response fields (all endpoints)

Every response includes:

```json
{
  "ok": true,
  "mode": "mock",
  "policy": "HAI-VERIFY-01"
}
```

When production launches, `mode` becomes `"live"` — clients should not depend on mock-only fields.

## Breaking change policy (planned)

| Change type | Action |
|-------------|--------|
| New optional JSON field | Non-breaking |
| New endpoint | Non-breaking |
| Rename/remove field | New `X-KARAM-Version` or `/v2` |
| Auth scheme change | 90-day deprecation notice |

## Changelog (mock)

| Version | Date | Notes |
|---------|------|-------|
| `2026-05-27` | Planning | verify, audit-report, intake, idea spec |
| TBD | Implementation | First mock routes in Next.js |

## Dashboard compatibility

`verification-demo.tsx` client-side analysis must match API `data` shape documented in [`../api-plan/verify.md`](../api-plan/verify.md) field-for-field.
