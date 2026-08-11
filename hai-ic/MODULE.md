# HAI-IC — Module Map (engineer plug-and-play)

**Product:** HAI-IC only  
**Rule:** Integrate against public interfaces. Do not reach into UI, outreach, or vault scripts.

---

## Layout

```
hai-ic/
  interfaces/public.ts   ← PUBLIC CONTRACT (types + threshold)
  src/
    index.ts             ← PUBLIC BARREL (engine + constants)
    engine.ts            ← Intent Confidence scorer
    constants.ts         ← sincerity locks (boost=0, threshold=75)
  sdk/hai-ic-client.ts   ← HTTP client (gate helper)
  openapi.json           ← wire contract
  IP-PACK.md             ← economic IP one-pager
  METRICS-PLAN.md        ← numbers-only measurement
  SECURITY.md            ← threat model skeleton
  AUTOMATION-PIPELINE.md ← deploy → health → secrets order
  metrics/RESULTS.json   ← measured fields (null until run)

app/api/hai-ic/*         ← HTTP adapter (Next / Workers)
app/lib/hai-ic-*.ts      ← thin re-exports (compat)
app/components/hai-ic-*  ← UI only — not required for OEM embed
```

---

## Public surfaces

| Surface | Path | Consumer |
|---------|------|----------|
| Types | `@/hai-ic/interfaces/public` | Any integrator |
| Engine | `@/hai-ic/src` → `analyzeIntent`, `gateIntent` | In-process embed |
| HTTP | `POST /api/hai-ic/analyze`, `GET /api/hai-ic/health` | Remote gate |
| SDK | `@/hai-ic/sdk/hai-ic-client` | Typed HTTP client |
| OpenAPI | `hai-ic/openapi.json` | Contract review |

---

## Boundaries (do not cross)

| Layer | May call | Must not call |
|-------|----------|---------------|
| `interfaces/` | — | engine, app, scripts |
| `src/engine` | `interfaces`, `constants` | Stripe, vault, UI, Discord, CF deploy |
| `sdk/` | `interfaces` + HTTP | engine internals |
| `app/api/hai-ic` | engine via `@/hai-ic/src` or `@/app/lib` | outreach, hiring packs |
| UI / outreach | HTTP or engine | mutate threshold / boost |

**Philosophy boundary:** `gateIntent` always returns `humanFinalDecisionRequired: true`. HAI-IC scores and gates; humans decide and own outcomes.

---

## Swap-in (OEM)

1. Implement `HaiIcEngine { analyze(input): HaiIcAnalyzeResult }`
2. Keep `HAI_IC_CONFIDENCE_THRESHOLD = 75` unless written KARAM approval
3. Keep `HAI_IC_HOURLY_BOOST = 0`
4. Route agent tools only when `gate.allowed === true` **and** human approval recorded
