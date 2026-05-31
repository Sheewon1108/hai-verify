# POST /api/audit-report

Generate a plain-text audit summary for reviewers. **Mock phase:** uses `buildAuditReport` only.

## Request

```
POST /api/audit-report
Content-Type: application/json
Authorization: Bearer karam_test_demo
```

### Body

```json
{
  "text": "AI output to verify...",
  "scanId": "HV-A1B2C3",
  "format": "text"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text` | string | yes | Same as `/api/verify` |
| `scanId` | string | no | If omitted, server generates new `scanId` |
| `format` | `"text"` \| `"json"` | no | Default `text`; `json` returns structured + text |

## Response `200` (format: text)

```json
{
  "ok": true,
  "mode": "mock",
  "scanId": "HV-A1B2C3",
  "policy": "HAI-VERIFY-01",
  "timestamp": "2026-05-27T12:00:00.000Z",
  "data": {
    "format": "text",
    "report": "HAI Verify — Audit Summary\nScan ID: HV-A1B2C3\n..."
  }
}
```

## Response `200` (format: json)

```json
{
  "ok": true,
  "mode": "mock",
  "scanId": "HV-A1B2C3",
  "policy": "HAI-VERIFY-01",
  "timestamp": "2026-05-27T12:00:00.000Z",
  "data": {
    "format": "json",
    "analysis": { },
    "report": "HAI Verify — Audit Summary\n..."
  }
}
```

`analysis` matches `POST /api/verify` `data` object.

## Implementation notes

1. Call `analyzeOutput(text)`
2. Resolve `scanId` from body or `createScanId()`
3. Call `buildAuditReport(analysis, scanId)`
4. Return wrapped envelope

## CLI usage (planned)

```bash
hai-verify audit --file output.txt --format text
# equivalent to POST /api/audit-report
```

## Out of scope (mock phase)

- PDF generation
- Email delivery (Gmail)
- Slack/Discord notifications
- Signed PDF or legal attestation
