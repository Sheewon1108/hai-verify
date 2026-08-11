# HAI-IC — Security Spec Skeleton

**Product:** HAI-IC  
**Owner:** KARAM SHIN  
**Status:** Skeleton — fill controls as deploy expands. No secrets in this file.

## 1. Threat model

| ID | Threat | Asset | Likelihood | Impact | Mitigation (status) |
|----|--------|-------|------------|--------|---------------------|
| T1 | Intent spoof / prompt flood | Analyze API | Med | Med | Input max length 8k; rate limit TBD |
| T2 | Score inflation / sincerity break | Trust / IP | Low | High | `HAI_IC_HOURLY_BOOST = 0`; code review gate |
| T3 | Secret leak (Stripe, CF, API keys) | Vault / env | Med | Critical | Vault/DPAPI only; never commit; never chat paste |
| T4 | Webhook forgery | Billing / key issue | Med | High | Stripe signature verify (`STRIPE_WEBHOOK_SECRET`) |
| T5 | Unauthorized analyze at scale | Cost / abuse | Med | Med | API key middleware TBD; Payment Link for pilot |
| T6 | Bypass gate → LLM acts without IC | Safety / brand | Med | High | Host must call modules before execute; approval gate |
| T7 | Audit log tamper | Trust Ledger | Low | High | Append-only export + backup restore-point |

**Out of scope (this skeleton):** full pen-test, SOC2, legal opinion.

## 2. Secrets handling

| Secret | Where it lives | How set | Never |
|--------|----------------|---------|-------|
| `STRIPE_SECRET_KEY` | vault / runtime env | vault set / host secret store | git, chat, client JS |
| `STRIPE_WEBHOOK_SECRET` | vault / runtime env | same | same |
| `API_KEY_SIGNING_SECRET` | vault / runtime env | same | same |
| Cloudflare / deploy tokens | vault only | owner machine | GitHub unless KARAM explicitly says go |
| Stripe Payment Link URL | public by design | landing CTA | treat as public, not a secret |

**Order (mandatory):** deploy code → health green → then inject secrets (see `AUTOMATION-PIPELINE.md`).  
Do not start with secrets in repo files.

## 3. Approval gates

| Gate | Who | When | Fail behavior |
|------|-----|------|---------------|
| Sincere Mode (IC ≥ 75) | HAI-IC module | Before LLM / agent answer path | Return clarifying questions |
| Human final decision | Human operator | Before money, legal, medical, family, security, high-risk action | Block execution |
| Owner deploy | KARAM | Before production secret inject | Stop; restore-point |
| Paid pilot fulfill | KARAM / webhook | After `checkout.session.completed` | No key in logs; email delivery only |

**Invariant:** AI may propose; HAI-IC may gate; **human retains final decision and responsibility.**

## 4. Audit trail

| Event | Minimum fields | Store |
|-------|----------------|-------|
| Analyze | timestamp, confidence, sincereMode, isDD, input hash (not full PII dump) | Trust Ledger / backup |
| Gate OFF | question id, OFF reason class | `OFF-CASES.md` export |
| Payment | Stripe session id, plan, email, keyDelivered flag | webhook logs (no raw key) |
| Deploy / health | version, ok, timestamp | health endpoint + ops log |

**Backup:** `npm run backup:restore-point` before risky changes.

## 5. Open control gaps (track, do not invent “done”)

- [ ] Public analyze rate limit
- [ ] API key middleware on `/api/hai-ic/analyze`
- [ ] Email delivery for issued keys (`keyDelivered` still pending in webhook)
- [ ] Formal uptime monitor (see `METRICS-PLAN.md` M4)
