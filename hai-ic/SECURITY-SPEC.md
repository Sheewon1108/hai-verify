# HAI-IC — Security Spec Skeleton

**Product:** HAI-IC  
**Status:** Skeleton — fill controls as deploy/secrets land  
**Owner:** KARAM SHIN

---

## 1. Threat model

| ID | Asset | Threat | Impact | Mitigations (current / planned) |
|----|-------|--------|--------|----------------------------------|
| T1 | Intent payloads | Prompt injection / abuse of analyze | Wrong gate decision, reputation | Input length cap (`HAI_IC_MAX_INPUT_LENGTH`); no tool execution in analyzer |
| T2 | API keys / Stripe secrets | Leak via git, chat, logs | Account takeover, false charges | Vault/DPAPI only; never commit; webhook never logs raw keys |
| T3 | Payment webhook | Forged `checkout.session.completed` | Free API key issuance | Stripe signature verify (`STRIPE_WEBHOOK_SECRET`) |
| T4 | Sincere Mode bypass | Client ignores OFF / fakes confidence | Harmful auto-action | Server is source of truth; integrator must use `toGateDecision`; human approval required |
| T5 | Score inflation | Manual boost of IC | Buyer trust collapse | `HAI_IC_HOURLY_BOOST = 0` fixed; Trust Ledger regenerate from tests |
| T6 | Audit gap | No record of OFF/ON | Cannot defend DD | Trust Ledger + planned request audit log |
| T7 | Public demo abuse | Flood analyze endpoint | Cost / downtime | Rate limit (planned); health probes separate |

**Out of scope for analyzer:** executing bank/legal/medical actions. HAI-IC never holds final responsibility.

---

## 2. Secrets handling

| Secret | Where set | Where forbidden |
|--------|-----------|-----------------|
| `STRIPE_SECRET_KEY` | Vault → Workers/env sync | Repo, chat, client JS |
| `STRIPE_WEBHOOK_SECRET` | Vault → Workers | Repo, chat |
| `STRIPE_PRICE_*` | Vault / Dashboard | Hardcoded except public Payment Link URL |
| `OPENAI_API_KEY` | Vault (if LLM path used) | Repo, chat |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets / local vault | Repo |
| API keys issued to buyers | Generated server-side; email delivery | Webhook response body, logs |

**Order:** see `AUTOMATION-PIPELINE.md` — secrets **after** deploy health, never before public health is green.

Commands (local): `npm run vault:status` · `npm run backup:restore-point` before risky rotates.

---

## 3. Approval gates

```
Input → HAI-IC analyze → IC score
         │
         ├─ IC < 75  → Sincere Mode OFF → questions / evidence → HUMAN decides
         └─ IC ≥ 75  → Sincere Mode ON  → draft allowed → HUMAN still approves → action
```

| Gate | Enforced by | Bypass allowed? |
|------|-------------|-----------------|
| Intent Confidence ≥ 75 for sincere content | `isSincereMode` / server analyze | No |
| Human final decision | Integrator process + product rule | No |
| Paid pilot fulfillment | KARAM / ops after Stripe settle | No auto-ship secrets |
| Deploy to production | CI + Cloudflare token present | Manual `workflow_dispatch` ok |

---

## 4. Audit trail

| Event | Minimum fields | Storage (target) |
|-------|----------------|------------------|
| Analyze | timestamp, confidence, sincereMode, isDD, input hash | Trust Ledger / future audit log |
| Gate decision | allowed, confidence, humanFinalResponsibility | Integrator log (required) |
| Payment | Stripe session id, plan, email, settled amount | Stripe Dashboard (source of truth) |
| Key issue | email, plan, session id (**not** raw key) | Server log only |
| Secret rotate | who, when, which key name | Local backup restore-point note |

**Integrity rule:** scores not manually raised. Regenerated ledgers only from test runners.

---

## 5. Incident order

1. Stop deploy / tunnel  
2. `npm run backup:restore-point`  
3. Rotate exposed secrets via vault  
4. Report what was exposed — no blame spiral  

---

## 6. Open control checklist

- [ ] Rate limit on `/api/hai-ic/analyze`  
- [ ] Persistent audit log (not only Trust Ledger samples)  
- [ ] Webhook email delivery of API keys  
- [ ] Uptime probes ≥ 7 days (see `METRICS-PLAN.md` M4)  
