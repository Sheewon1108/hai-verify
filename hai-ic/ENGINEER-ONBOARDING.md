# HAI-IC Engineer Onboarding

Purpose: let an external engineer plug into HAI-IC without changing the core IP or exposing KARAM's private assets.

## Module map

| Boundary | Public surface | Owner file(s) | Do not change without KARAM approval |
|---|---|---|---|
| Intent scoring engine | `analyzeIntent(input)` returns score, mode, breakdown, questions, response, responsibility | `app/lib/hai-ic-analyze.ts` | Scoring philosophy, 0-100 scale, 75% threshold behavior |
| Sincere Mode threshold | `HAI_IC_CONFIDENCE_THRESHOLD = 75` | `app/lib/hai-ic-system-prompt.ts` | Threshold, "do not exaggerate" rule |
| Responsibility gate | `buildHaiIcResponsibilityGate(sincereMode)` | `app/lib/hai-ic-responsibility.ts` | Human final decision owner and approval requirement |
| DD penalty tuning | `HAI_IC_DD_MAX_PENALTY_LIVE` | `app/lib/hai-ic-dd-penalty-value.ts` | No artificial tuning to create fake proof |
| Artificial boost lock | `HAI_IC_HOURLY_BOOST = 0` | `app/lib/hai-ic-boost-value.ts` | No score inflation |
| API route | `GET/POST /api/hai-ic/analyze`, `GET /api/hai-ic/health` | `app/api/hai-ic/**/route.ts` | Request validation, CORS, response contract |
| Drop-in client | `HaiIcClient.health()`, `analyze()`, `gate()` | `hai-ic/sdk/hai-ic-client.ts` | Gate must not return fake answer below 75% |
| Public API spec | OpenAPI 3.0.3 schema | `hai-ic/openapi.json` | Keep in sync with live response |
| Buyer proof | Trust Ledger and buyer pack | `hai-ic/buyer-deliverables/` | No inflated metrics, no unverified revenue |
| Metrics | CLI measurement command | `scripts/measure-hai-ic-metrics.cjs` | Objective output only |

## Public interfaces

### API

- `GET /api/hai-ic/health`
- `GET /api/hai-ic/analyze`
- `POST /api/hai-ic/analyze`

### SDK

```ts
const client = new HaiIcClient({ baseUrl: "http://127.0.0.1:3001" });
const gate = await client.gate("Ship 200 units to Seoul by July 15.");

if (!gate.allowed) {
  // Ask gate.questions before any downstream AI action.
}

// Even when allowed, require human final approval.
```

### Core invariant

```text
AI action is never final.
Intent Confidence >= 75 permits Sincere Mode only.
Human approval remains required every time.
```

## Security specification skeleton

### Threat model

| Threat | Risk | Required control |
|---|---|---|
| Secret exposure | API keys, Stripe secrets, worker tokens, or vault values leak into code, chat, logs, commits, or screenshots | Keep secrets in env/vault only; never paste values into docs or chats |
| Unapproved AI action | Downstream agent treats HAI-IC as final authority | Enforce `responsibility.humanApprovalRequired === true` in client workflow |
| Metric exaggeration | Buyer sees unmeasured latency, uptime, cost, or revenue claims | Publish only measured values with sources; otherwise write "not measured yet" |
| Score manipulation | Sincere Mode threshold or boosts changed to make demo look better | Keep threshold 75 and boost 0 unless KARAM explicitly approves |
| Public endpoint misuse | Open CORS/API endpoint receives unwanted traffic | Use API keys before external pilots; rate limit deployed endpoints |
| Audit loss | Buyer cannot verify why a request was blocked or allowed | Store request hash, timestamp, confidence, mode, questions, and human approver |

### Secrets handling

1. Secret names may be documented; secret values must never be documented.
2. Use environment variables or vault storage for:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `HAI_API_KEY_SECRET`
   - deploy provider tokens
3. Before deploy or external share, run:
   ```bash
   npm run local:doctor
   npm run access:test-loopback
   ```
4. Before risky changes, create a restore point:
   ```bash
   npm run backup:restore-point
   ```

### Approval gates

1. `confidence < 75`: block downstream AI action and ask clarifying questions.
2. `confidence >= 75`: Sincere Mode response may be shown, but the human still approves.
3. High-risk domains, including money, legal, medical, family, security, and public claims, require explicit human sign-off.
4. Paid pilot delivery starts only after verified payment receipt.

### Audit trail

Minimum event fields:

```json
{
  "eventId": "redacted",
  "createdAt": "ISO-8601",
  "inputHash": "sha256-redacted",
  "confidence": 0,
  "sincereMode": false,
  "actionPermission": "blocked_pending_clarification",
  "questions": [],
  "humanApprover": "KARAM",
  "finalDecision": "approved | rejected | needs_more_info"
}
```

## Automation pipeline outline

1. Local verify:
   ```bash
   npm run lint
   npm run hai-ic:metrics
   ```
2. Secrets order:
   1. Confirm local vault/env exists.
   2. Confirm deploy environment variables exist.
   3. Confirm webhook secret exists only in deploy provider and Stripe dashboard.
   4. Confirm no secret values appear in `git diff`.
3. Deploy:
   ```bash
   npm run deploy
   ```
4. Health:
   ```bash
   curl -fsS "$HAI_IC_BASE_URL/api/hai-ic/health"
   ```
5. Verify API:
   ```bash
   HAI_IC_METRICS_BASE_URL="$HAI_IC_BASE_URL" HAI_IC_METRICS_REQUESTS=100 npm run hai-ic:metrics
   ```
6. Record results in `hai-ic/METRICS-PLAN.md` only after the numbers are measured.
