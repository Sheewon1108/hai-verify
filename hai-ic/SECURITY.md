# HAI-IC — Security Spec Skeleton

**Product:** HAI-IC  
**Status:** Skeleton — fill controls as deploy/secrets land. No secrets in this file.

---

## 1. Threat model (STRIDE sketch)

| Asset | Threat | Example | Mitigation (target) |
|-------|--------|---------|---------------------|
| Intent scores / Trust Ledger | Tampering | Manual score inflation | `HAI_IC_HOURLY_BOOST = 0`; code review; no buyer-facing edit UI |
| API analyze | Spoofing / abuse | Unauth flood | API key (HMAC) + rate limit; health separate |
| Stripe webhook | Spoofing | Fake `checkout.session.completed` | Verify `stripe-signature`; webhook secret from vault |
| Secrets | Information disclosure | Key in git/chat | Vault / DPAPI / `wrangler secret`; never commit |
| Human approval | Elevation of privilege | Auto-execute on Sincere Mode | Gate ≠ execute; human final decision required |
| Audit trail | Repudiation | Denied OFF block | Append-only Trust Ledger / analyze logs |

**Out of scope for HAI-IC core:** LLM model weights, buyer LLM keys, Discord bots, third-party tunnels unless KARAM explicitly opens that track.

---

## 2. Secrets handling

| Secret | Store | Inject | Never |
|--------|-------|--------|-------|
| `STRIPE_SECRET_KEY` | Vault / Workers secret | Runtime env only | Repo, chat, PR |
| `STRIPE_WEBHOOK_SECRET` | Vault / Workers secret | Webhook route only | Logs |
| `API_KEY_HMAC_SECRET` | Vault | Key issue/verify | Client bundles |
| Cloudflare / Gmail tokens | Vault + GH Secrets (if CI) | Deploy job only | Local commits |

**Order:** secrets exist in vault **before** public deploy that needs them. See `AUTOMATION-PIPELINE.md`.

Commands (owner machine): `npm run vault:status` · `npm run backup:restore-point` before risky changes.

---

## 3. Approval gates

| Gate | Condition | Actor |
|------|-----------|-------|
| Sincere Mode | IC ≥ 75 | HAI-IC engine |
| Tool / money / legal / medical / family action | Always | **Human** (non-delegable) |
| Threshold change from 75 | Written KARAM approval | KARAM |
| Public URL / tunnel | Explicit KARAM go | KARAM |
| Deploy with new secrets | Restore-point + vault set | Operator |

---

## 4. Audit trail

| Event | Record | Retention (target) |
|-------|--------|--------------------|
| Analyze call | confidence, mode, timestamp, input hash (prefer hash over raw PII) | POC+ |
| OFF / ON decision | Trust Ledger export | Buyer deliverable |
| Payment → key issue | Stripe session id + plan (no raw key in logs) | Accounting |
| Deploy | CI / wrangler deploy log | Ops |

---

## 5. Incident escalation (war room)

1. Stop deploy / tunnel  
2. `npm run backup:restore-point`  
3. Rotate exposed keys (vault set)  
4. Report what was exposed — no blame spiral  
