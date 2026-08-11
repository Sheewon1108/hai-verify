# HAI-IC — Module Boundaries (engineer plug-and-play)

**Product:** HAI-IC only  
**Public entry:** `hai-ic/src/index.ts` · OpenAPI: `hai-ic/openapi.json` · SDK: `hai-ic/sdk/hai-ic-client.ts`

---

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  EDGE (HTTP / UI) — thin adapters                        │
│  app/api/hai-ic/* · app/components/hai-ic-* · app/hai-ic │
├─────────────────────────────────────────────────────────┤
│  PUBLIC MODULE — engineer contract                       │
│  hai-ic/src/{index,types,constants,analyze}.ts           │
├─────────────────────────────────────────────────────────┤
│  COMMERCIAL RAIL (separate)                              │
│  Stripe Payment Link · app/api/stripe/* · vault secrets  │
├─────────────────────────────────────────────────────────┤
│  OPS / DOCS                                              │
│  IP-PACK · METRICS-PLAN · SECURITY-SPEC · AUTOMATION     │
└─────────────────────────────────────────────────────────┘
```

---

## Public interfaces (allowed imports)

| Symbol | Path | Purpose |
|--------|------|---------|
| `analyzeIntent` | `hai-ic/src` | Score IC 0–100 + Sincere Mode |
| `gateIntent` | `hai-ic/src` | Pre-LLM allow/deny (+ humanFinalResponsibility) |
| `HAI_IC_CONFIDENCE_THRESHOLD` | `hai-ic/src` | 75 |
| `HAI_IC_HOURLY_BOOST` | `hai-ic/src` | Must stay 0 |
| Types | `hai-ic/src` | `HaiIcResult`, `HaiIcGateDecision`, … |
| HTTP | `POST /api/hai-ic/analyze` | Wire protocol |
| HTTP | `GET /api/hai-ic/health` | Liveness |
| Client | `HaiIcClient` in `hai-ic/sdk` | Drop-in fetch wrapper |

**Compat shims** (same symbols, re-export only): `app/lib/hai-ic-analyze.ts`, `app/lib/hai-ic-system-prompt.ts`, `app/lib/hai-ic-boost-value.ts`, `app/lib/hai-ic-dd-penalty-value.ts`.

---

## Private (do not import from integrators)

| Area | Why |
|------|-----|
| `app/api/stripe/*` | Payment secrets + webhook |
| `scripts/lib/secrets-vault.ps1` | Vault / DPAPI |
| `hai-ic/outreach/*` | Sales copy; sincerity rules |
| `.env*` / vault values | Secrets |
| Score-tuning knobs that raise boost above 0 | Doctrine violation |

---

## Plug-and-play (minimal)

```ts
import { analyzeIntent, gateIntent, HAI_IC_CONFIDENCE_THRESHOLD } from "@/hai-ic/src";

const scored = analyzeIntent(userText);
// scored.confidence 0–100
// scored.sincereMode === (confidence >= 75)

const gate = gateIntent(userText);
if (gate.allowed) {
  // May call downstream LLM — human still approves execution
} else {
  // Return gate.questions — no fake sincere answer
}
void HAI_IC_CONFIDENCE_THRESHOLD;
```

HTTP equivalent: see `hai-ic/API.md` and `hai-ic/openapi.json`.

---

## Non-negotiable doctrine (engineers may not change without KARAM)

1. Product name: **HAI-IC** only  
2. Intent Confidence **0–100**  
3. Sincere Mode **only at ≥75%**  
4. **Human final decision + responsibility** always retained  
5. **No score inflation** (`HAI_IC_HOURLY_BOOST = 0`)
