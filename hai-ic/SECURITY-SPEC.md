# HAI-IC — Security Spec Skeleton

**Product:** HAI-IC  
**Owner:** KARAM SHIN  
**Status:** Skeleton — fill controls as deploy surface expands

---

## 1. Threat model

| Asset | Threat | Impact | Mitigation (current / required) |
|-------|--------|--------|----------------------------------|
| Doctrine / IP | Dilution, clone claiming HAI-IC without gate rules | Reputation + IP | MODULE-BOUNDARIES + IP-PACK; patents retained by KARAM |
| Analyze API | Abuse / flooding | Cost, DoS | Input max 8k chars; rate limit ___ (TODO); API key ___ (TODO) |
| Analyze API | Prompt/score gaming | Trust Ledger pollution | No boost (`HOURLY_BOOST=0`); audit trail of inputs/outputs |
| Secrets | Leak via git/chat/logs | Account takeover | Vault/DPAPI only; never commit `.env*` |
| Stripe | Webhook forgery | Free keys / false paid | `STRIPE_WEBHOOK_SECRET` signature verify |
| Stripe | Key in client | Fraud | Secret key server-only; Payment Link / Checkout |
| Human responsibility | Auto-execute on Sincere Mode | Liability | Gate returns score only; caller retains approve/reject |
| Demo surface | Public tunnel without approval | Exposure | Local-first `127.0.0.1:3001`; no tunnel unless KARAM says go |

**Trust boundary:** `hai-ic/src` is pure; secrets and money stay in edge/ops layers.

---

## 2. Secrets handling

| Secret | Store | Inject | Never |
|--------|-------|--------|-------|
| `STRIPE_SECRET_KEY` | Vault / DPAPI / host env | Runtime env only | Commit, chat, client bundle |
| `STRIPE_WEBHOOK_SECRET` | same | webhook route | Log raw body+secret |
| `STRIPE_PRICE_*` | same | checkout route | Hardcode live price secrets in UI (Payment Link URL is public by design) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | env | client OK | Treat as non-secret still rotate on leak |
| API signing keys (`API_KEY_HMAC_SECRET` etc.) | vault | `app/lib/api-keys.ts` | Echo in webhook response |
| Cloudflare / deploy tokens | vault / CI secrets | deploy script only | Repo files |

**Commands (local):** `npm run vault:status` · `npm run vault:list`  
**On exposure:** stop deploy → `npm run backup:restore-point` → rotate via vault → report what leaked.

---

## 3. Approval gates

| Action | Gate | Approver |
|--------|------|----------|
| Change `HAI_IC_CONFIDENCE_THRESHOLD` or boost ≠ 0 | Written KARAM approval | KARAM |
| Public deploy / tunnel | Explicit “go” | KARAM |
| New paid SKU / Payment Link | KARAM | KARAM |
| Outreach send | `validate-outreach-sincerity` + SEND-READY | KARAM |
| Engineer merges touching `hai-ic/src` doctrine constants | PR review by KARAM | KARAM |
| Sincere Mode → real-world execute | **Human final decision** | Buyer / operator human |

Machine path stops at score + mode. Execution is always a human gate.

---

## 4. Audit trail

| Event | What to record | Where (target) |
|-------|----------------|----------------|
| Analyze call | timestamp, confidence, sincereMode, isDD, input hash (not raw PII by default) | Trust Ledger / ops log |
| OFF / ON decision | mode + threshold used | Trust Ledger |
| Payment succeeded | Stripe session id, plan, email (no full PAN) | Stripe Dashboard + webhook log (no API key body) |
| Secret rotate | which key, when, by whom | offline restore-point note |
| Deploy | commit SHA, health result | CI / deploy log |

**Buyer-facing artifact:** `hai-ic/buyer-deliverables/TRUST-LEDGER.md` (scores not manually raised).

**PII rule:** Prefer input hash + length; store raw input only under NDA / POC agreement.

---

## 5. Checklist before external engineer access

- [ ] NDA / ownership rules acknowledged (`revenue-system/ownership-rules.md`)
- [ ] Vault access scoped; no secrets in ticket comments
- [ ] Read `MODULE-BOUNDARIES.md` + this file
- [ ] Trial task limited to health/doctor — no doctrine edits
