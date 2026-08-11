# HAI-IC — External Engineer Plug Guide

**Goal:** Drop HAI-IC into a host stack without reading the whole monorepo.

## What you get

| Path | Role |
|------|------|
| `hai-ic/modules/` | **Source of truth** — pure analyzer + public interfaces |
| `hai-ic/openapi.json` | HTTP contract |
| `hai-ic/sdk/hai-ic-client.ts` | Remote client (`health` / `analyze` / `gate`) |
| `app/api/hai-ic/*` | Next.js HTTP adapters (optional if you host your own) |
| `app/lib/hai-ic-*.ts` | Thin re-exports (legacy import path) |

## Integration contract

1. Call `analyzeIntent(input)` **before** LLM / agent execution.
2. If `sincereMode !== true` or `confidence < 75` → do not execute; return `questions`.
3. Human retains final decision + responsibility for high-risk actions.
4. Do not change `HAI_IC_HOURLY_BOOST` away from `0`.
5. Product name in buyer-facing copy: **HAI-IC** only.

## Files to touch (minimal)

| Change | File |
|--------|------|
| Scoring logic | `hai-ic/modules/analyze.ts` |
| Threshold | `hai-ic/modules/constants.ts` |
| HTTP limits / CORS | `app/api/hai-ic/analyze/route.ts` |
| Remote SDK | `hai-ic/sdk/hai-ic-client.ts` |

Do not put secrets in `hai-ic/modules/*`.

## Verify locally

```bash
npm run dev:hai-ic
curl -s http://127.0.0.1:3001/api/hai-ic/health
curl -s -X POST http://127.0.0.1:3001/api/hai-ic/analyze \
  -H "Content-Type: application/json" \
  -d '{"input":"Ship 200 units to Seoul by July 15, budget $50k"}'
```

## Docs map

| Doc | Use |
|-----|-----|
| `IP-PACK.md` | Philosophy + evidence (sales / partner) |
| `METRICS-PLAN.md` | Numbers only |
| `SECURITY-SPEC.md` | Threat model / secrets / approvals / audit |
| `AUTOMATION-PIPELINE.md` | deploy → health → secrets |
| `modules/README.md` | Import surface |
