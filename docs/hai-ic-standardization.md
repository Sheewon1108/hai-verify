# HAI-IC Codebase Standardization

## Module map

### Public surface for external engineers

| Module | Public interface | Purpose |
|---|---|---|
| `app/lib/hai-ic/index.ts` | `analyzeIntent`, `HAI_IC_PRODUCT`, `HAI_IC_VERSION`, `HAI_IC_CONFIDENCE_THRESHOLD`, types | Single import surface for HAI-IC core behavior |
| `app/api/hai-ic/analyze/route.ts` | `POST /api/hai-ic/analyze` | Runtime entrypoint for intent scoring |
| `app/api/hai-ic/health/route.ts` | `GET /api/hai-ic/health` | Health and version check |
| `hai-ic/openapi.json` | OpenAPI contract | Integration contract for external consumers |

### Supporting internal modules

| Module | Responsibility |
|---|---|
| `app/lib/hai-ic-analyze.ts` | Scoring logic, breakdown generation, sincere/clarification behavior |
| `app/lib/hai-ic-system-prompt.ts` | Threshold and prompt policy constants |
| `app/lib/access-control.ts` | Request authorization and local bypass rules |
| `app/lib/api-keys.ts` | HMAC API key generation and validation |
| `app/api/stripe/checkout/route.ts` | Stripe checkout session creation |
| `app/api/stripe/webhook/route.ts` | Payment-complete webhook handling and API key issuance |
| `app/lib/mock-stripe.ts` | Mock checkout flow for demo mode |
| `.github/workflows/security-check.yml` | Automated repo security checks |
| `.github/workflows/deploy-cloudflare.yml` | Build and deploy pipeline |

## Boundary rules

1. **HAI-IC core stays pure**  
   `analyzeIntent` should remain free of payment, transport, and deployment concerns.
2. **Routes adapt, core decides**  
   Route handlers validate input/output and call the HAI-IC public interface. Scoring rules stay out of route files.
3. **Payments stay separate from scoring**  
   Stripe checkout, webhook delivery, and API key issuance remain outside HAI-IC scoring logic.
4. **Security gates wrap all external access**  
   Access control and key validation stay in dedicated modules and middleware-adjacent code.

## Plug-and-play engineer entry sequence

1. Read `hai-ic/openapi.json`.
2. Import from `app/lib/hai-ic/index.ts` only.
3. Test against `GET /api/hai-ic/health`.
4. Integrate with `POST /api/hai-ic/analyze`.
5. Add payment provisioning only after scoring behavior is accepted.

## Security specification skeleton

### 1. Scope

- HAI-IC analysis API
- access control layer
- API key issuance
- payment-triggered provisioning
- deployment and health verification

### 2. Assets to protect

- signing secrets for HAI API keys
- Stripe secret key and webhook secret
- payment session metadata
- intent-analysis requests and outputs
- deploy credentials

### 3. Trust boundaries

- public caller -> route handler
- route handler -> HAI-IC analysis core
- route handler -> Stripe
- deploy pipeline -> runtime environment
- human reviewer -> final action outside the scoring API

### 4. Threat model

| Threat | Current control | Required follow-up |
|---|---|---|
| Secret leakage in repo | `.env.example` guidance + workflow secret scan | Keep secrets only in env/vault, never in code |
| Unauthorized API use | API key validation and protected mode | Add usage logging and rate controls if exposure grows |
| Forged payment webhook | Stripe signature verification | Add alerting on repeated verification failures |
| Over-claiming certainty | 75% Sincere Mode threshold | Preserve human approval requirement in every pilot |
| Unsafe direct execution | HAI-IC only scores and explains | Keep execution outside this module |

### 5. Secrets handling rules

- Store secrets in environment variables only.
- Never print raw secrets or raw issued API keys in logs.
- Never commit `.env.local`.
- Use restricted payment keys where possible.
- Keep deploy secrets separate from runtime secrets.

### 6. Approval gates

- Intent Confidence must be measured on every covered request.
- Sincere Mode is allowed only at `>= 75`.
- Low-confidence requests must return clarifying questions instead of an action-like answer.
- Human final approval is required before any money, operational, legal, family, or security-sensitive step leaves the system.

### 7. Audit trail

#### Required records

- request timestamp
- analyzed input identifier or hash
- intent-confidence score
- sincere-mode state
- human approval decision
- payment event identifier when applicable
- deploy health verification result

#### Current state

- health endpoint exists
- payment session id is encoded in issued API key payload
- webhook logs issuance event without logging the raw key
- full approval-decision audit trail is **not complete yet**

### 8. Open hardening gaps

- formal rate limiting
- external uptime monitor with 30-day retention
- explicit approval-decision log store
- automated payment-delivery email step after webhook

## Automation pipeline outline

### Order of operations

1. Install dependencies with `npm ci`.
2. Load runtime secrets into the deployment environment.
3. Run security checks and build.
4. Deploy to the target runtime.
5. Verify health endpoints.
6. Verify payment route readiness separately from the HAI-IC scoring route.

### Existing pipeline anchors

- `npm run build`
- `npm run measure:hai-ic`
- `.github/workflows/security-check.yml`
- `.github/workflows/deploy-cloudflare.yml`

### Minimum verify sequence after deploy

1. `GET /api/hai-ic/health`
2. `POST /api/hai-ic/analyze` with one known input
3. `GET /api/health`
4. Stripe checkout configuration check
5. Stripe webhook signature check in test mode
