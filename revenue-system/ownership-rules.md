# HAI Verify — Ownership & Revenue Rules

**Copyright 2026 KARAM. All Rights Reserved.**
Fully Owned by Founder **Karam** (50%+ controlling stake).
Intellectual Property Protected.

---

## 1. Intellectual Property Ownership

All of the following belong **exclusively to Karam**:

- All algorithms, scoring models, and verification logic
- All product ideas, feature concepts, and system architecture
- The HAI Verify trust-scoring engine and hallucination risk formula
- Signal detection, `trustIndex`, `hallucinationRisk`, and SLA queue logic
- The access control shield (org-block; geo-block deferred to Cloudflare WAF)
- API schemas, field names, response structures, and audit report formats
- Data flow diagrams, roadmaps, and any derivative or white-label works

Unauthorized distribution, reverse engineering, sublicensing, or reproduction
of any part of this system without written consent from Karam is **strictly prohibited**.

Source files carry this notice:

```
// Copyright 2026 KARAM. All Rights Reserved. Fully Owned by Founder Karam.
// Intellectual Property Protected. Unauthorized distribution or reverse engineering is strictly prohibited.
```

---

## 2. What Clients Purchase (Never Source Code)

Clients **never** receive the underlying source code, algorithms, weights, prompts,
or system architecture — at any price tier.

| Product | Price | What the client gets |
|---------|-------|----------------------|
| Starter Audit Report | **$300** | One verification scan + PDF audit report |
| Trust Audit Pilot | **$1,500** | Multi-scan pilot + prioritized human review + SLA |
| Access Token (API) | Custom | Rate-limited API key — output access only |

**Payment methods (mock phase):** Manual invoice · Zelle · Wise · Bank transfer

Purchasing an audit report or access token grants a **non-exclusive, non-transferable**
right to use the **deliverable output** for the buyer's internal purposes only.
No source code, internals, or architecture documentation is conveyed at any tier.

---

## 3. Access Control (MVP — open)

**All API blocking is disabled** for MVP speed (`checkAccess` always allows). Landing page and `/api/verify` are open so teams can test and give feedback without 403 friction.

| Planned gate | Status |
|--------------|--------|
| Org keyword block (`BLOCKED_ORG_KEYWORDS`) | **Deferred** — Cloudflare WAF when needed |
| Geo-block KR / TW | **Deferred** |
| Partner allowlist | **Deferred** — `ALLOWED_PARTNERS` reserved |
| API auth / rate limits | **Deferred** — phase 2 |

Verification runs in **`auto` mode**: flat API results (`trustIndex`, `hallucinationRisk`, `riskFlags`, `summary`) — no human-review queue or output blocks.

---

## 4. Demo & Revenue Operation

The system runs on **pure mock / rule-based logic**. No live external API keys are
required to demo or invoice. The frontend landing page and API are immediately
deployable for:

- Live client demos
- Manual invoice collection (Zelle / Wise)
- Pilot audit delivery ($300 / $1,500 tiers)

External API integrations remain mock until phase 2. Revenue collection is not blocked
by engineering dependencies.

---

*Internal document — founding team only. Do not distribute externally.*
