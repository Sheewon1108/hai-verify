# HAI-IC — Security Spec Skeleton

**Product:** HAI-IC · **Owner:** KARAM SHIN  
**Status:** Skeleton — fill controls as deploy goes live. No fake compliance claims.

## 1. Threat model (STRIDE sketch)

| Asset | Threat | Impact | Mitigations (current / planned) |
|-------|--------|--------|---------------------------------|
| Intent / prompt text | Spoofing — forged API caller | Buyer data leak / abuse | Planned: API key (HMAC) on `/api/hai-ic/*`; CORS allowlist |
| Intent Confidence score | Tampering — inflate scores | False Sincere Mode | Doctrine: `HAI_IC_HOURLY_BOOST = 0`; code review gate; audit trail |
| Secrets (Stripe, API, vault) | Info disclosure in git/chat | Account takeover | Vault/DPAPI only; never commit `.env.local`; no keys in chat |
| Analyze endpoint | Denial of service | Outage | Input max 8k chars; rate limit (planned); health probe |
| Human approval step | Elevation — skip human | Irresponsible auto-action | Product rule: human final decision always retained; gate ≠ execute |
| Trust Ledger / audit log | Repudiation — deny past OFF/ON | Buyer dispute | Append-only ledger files + backup restore-point |

## 2. Secrets handling

| Rule | Detail |
|------|--------|
| Storage | Vault / DPAPI (`npm run vault:*`) — not repo, not chat |
| Runtime | Env vars injected at process start; Workers via `wrangler secret put` only |
| Order | See `AUTOMATION-PIPELINE.md` — **health before secrets exposure** |
| Rotation | On any suspected exposure: stop deploy → `npm run backup:restore-point` → rotate → report |
| Forbidden | Committing keys, pasting tokens in PR/chat, putting secrets in `hai-ic/core` |

## 3. Approval gates

| Gate | Who | When |
|------|-----|------|
| Sincere Mode (≥75 IC) | HAI-IC engine | Before sincere answer path |
| Human final decision | Buyer / KARAM operator | Before any high-stakes or paid action |
| Outreach sincerity | `validate-outreach-sincerity` | Before buyer email send |
| Deploy / tunnel | KARAM only | Explicit go — no scope creep (CF/Discord/GitHub secrets unless asked) |
| Score / threshold change | KARAM IP owner | Never for optics; written approval if product change |

## 4. Audit trail

| Event | Log location | Required fields |
|-------|--------------|-----------------|
| Analyze call | Trust Ledger / test-questions JSONL | timestamp, confidence, sincereMode, DD flag |
| OFF / ON decision | `buyer-deliverables/TRUST-LEDGER.md` | counts + avg IC |
| Payment cleared | `hai-ic/metrics/payments.log` (create on first cash) | date, amount USD, method, buyer ref — **no card data** |
| Secret rotation | vault status / local ops note | what rotated, when — **no secret values** |
| Deploy | CI / operator log | commit SHA, health result |

## 5. Access control (current baseline)

- Loopback-first: `127.0.0.1:3001`, `npm run local:doctor`, `npm run access:test-loopback`
- Middleware stamps HAI ruleset headers; API access checks in `app/lib/access-control.ts`
- Public buyer claims must not include localhost URLs

## 6. Open items (fill when measured)

- [ ] API key required on analyze (production)
- [ ] Rate limit numbers
- [ ] Public uptime probe + 99.9% evidence
- [ ] Penetration / abuse test notes
- [ ] DPA / data retention days for prompt bodies
