# POST /api/verify

Run verification scoring on AI model output. **Mock phase:** local rules engine only (`analyzeOutput`).

## Request

```
POST /api/verify
Content-Type: application/json
Authorization: Bearer karam_test_demo
```

### Body

```json
{
  "text": "Draft a verification memo for a vendor contract clause...",
  "metadata": {
    "source": "dashboard",
    "model": "unknown",
    "locale": "en"
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text` | string | yes | AI output to verify; max 32,000 chars (planned) |
| `metadata` | object | no | Opaque client context; never logged with PII in mock |

## Response `200`

```json
{
  "ok": true,
  "mode": "mock",
  "scanId": "HV-A1B2C3",
  "policy": "HAI-VERIFY-01",
  "timestamp": "2026-05-27T12:00:00.000Z",
  "data": {
    "hallucinationRisk": 42,
    "trustIndex": 71,
    "level": "Moderate",
    "overallStatus": "review",
    "humanReviewRequired": true,
    "reviewSla": "4h",
    "queuePriority": "P2",
    "wordCount": 28,
    "metrics": {
      "sourceCoverage": 82,
      "claimConfidence": 74,
      "factualConsistency": 68,
      "policyAlignment": 85
    },
    "signals": [
      {
        "label": "Source grounding",
        "state": "pass",
        "detail": "Citations present"
      }
    ],
    "summary": [
      "Route to human verifier before external distribution."
    ]
  }
}
```

## Mapping to `verification.ts`

| Response field | Source |
|----------------|--------|
| `data.*` | `analyzeOutput(text)` return value |
| `scanId` | `createScanId()` |
| `level` | `RiskLevel` |
| `overallStatus` | `OverallStatus` |

## curl (mock, after implementation)

```bash
curl -s -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer karam_test_demo" \
  -d '{"text":"Include citations [1] for GDPR retention."}'
```

## Dashboard parity

The live demo in `app/components/verification-demo.tsx` already mirrors this payload client-side. API implementation should return the same shape so the dashboard can optionally call the API later without UI changes.

## Out of scope (mock phase)

- OpenAI or any external model call
- Persistent scan storage
- Webhooks
- Stripe metered billing
