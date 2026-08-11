# HAI-IC — Module Map (engineer plug-and-play)

**Product:** HAI-IC only  
**Owner:** KARAM SHIN

## Boundaries

```
hai-ic/src/public/     ← PUBLIC CONTRACT (import this)
hai-ic/src/core/       ← analyzer implementation (do not fork casually)
hai-ic/src/gate/       ← Sincere Mode + human-responsibility policy
hai-ic/sdk/            ← HTTP client for remote gate
app/api/hai-ic/        ← HTTP adapter only (thin)
app/lib/hai-ic-*.ts    ← compatibility re-exports (legacy paths)
```

| Layer | May depend on | Must not depend on |
|-------|---------------|--------------------|
| `public/` | nothing internal | Next.js, Stripe, UI |
| `core/` | `public/`, `gate/` | `app/`, Stripe, Discord |
| `gate/` | `public/` | LLM providers, UI |
| `sdk/` | `public/`, `gate/` | `app/lib` internals |
| `app/api/hai-ic` | `public` / re-exports | business outreach |

## Public imports

```ts
import {
  analyzeIntent,
  toGateDecision,
  HAI_IC_CONFIDENCE_THRESHOLD,
  HAI_IC_INTEGRATOR_RULES,
} from "@/hai-ic/src/public";
```

```ts
import { HaiIcClient } from "@/hai-ic/sdk/hai-ic-client";
```

## Integration sequence (external engineer)

1. Read `HAI_IC_INTEGRATOR_RULES`  
2. Call `analyze` or `HaiIcClient.gate`  
3. If `allowed === false` → surface `questions`; do not invent sincere answer  
4. If `allowed === true` → present result to **human**; human approves before side effects  
5. Log decision (audit trail) — see `SECURITY-SPEC.md`

## Specs

| Doc | Purpose |
|-----|---------|
| `IP-PACK.md` | Philosophy + evidence (1 page) |
| `METRICS-PLAN.md` | Numbers only |
| `SECURITY-SPEC.md` | Threat model, secrets, approval gates, audit |
| `AUTOMATION-PIPELINE.md` | Deploy → health → secrets order |
| `openapi.json` | HTTP contract |
| `PRICING.md` | Commercial tiers |
