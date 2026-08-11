# HAI-IC — Module Boundaries (engineer plug-and-play)

**Product name:** HAI-IC only  
**Doctrine:** Measure intent → gate at 75% → human final decision + responsibility.

## Layout

```
hai-ic/
  interfaces/public.ts   ← PUBLIC contract (types + ports)
  core/                  ← scoring engine + doctrine constants
  sdk/hai-ic-client.ts   ← HTTP client for integrators
  openapi.json           ← wire contract
  IP-PACK.md             ← sellable IP one-pager
  METRICS-PLAN.md        ← numbers only
  SECURITY-SPEC.md       ← threat model skeleton
  AUTOMATION-PIPELINE.md ← deploy → health → secrets order
app/api/hai-ic/          ← thin Next.js adapters (HTTP only)
app/lib/hai-ic-*.ts      ← compatibility re-exports → hai-ic/core
app/components/          ← UI (not required for API integrators)
```

## Dependency rules

| From → To | Allowed? |
|-----------|----------|
| `sdk` → `interfaces` | Yes |
| `core` → `interfaces` | Yes |
| `app/api/hai-ic` → `core` or `app/lib` shims | Yes |
| `core` → `app/*`, Stripe, vault, Discord, Cloudflare | **No** |
| External engineer → `interfaces` + `sdk` + OpenAPI | Yes |
| External engineer → mutate `HAI_IC_HOURLY_BOOST` / threshold for optics | **No** |

## Plug-and-play (API integrator)

```ts
import { HaiIcClient } from "@/hai-ic/sdk/hai-ic-client";

const client = new HaiIcClient({ baseUrl: process.env.HAI_IC_BASE_URL! });
const gate = await client.gate(userText);
// allowed === true only when Sincere Mode ON (≥75)
// Human still decides whether to execute.
```

## Plug-and-play (in-process)

```ts
import { analyzeIntent, HAI_IC_CONFIDENCE_THRESHOLD } from "@/hai-ic/core";

const result = analyzeIntent(userText);
const sincere = result.confidence >= HAI_IC_CONFIDENCE_THRESHOLD;
```

## Ownership

- Clients buy reports/access/license — not source IP (see `revenue-system/ownership-rules.md`).
- Core doctrine and product name **HAI-IC** remain KARAM SHIN / XGOMA unless written transfer.
