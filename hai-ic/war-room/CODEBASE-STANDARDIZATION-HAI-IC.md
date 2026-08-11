# HAI-IC Codebase Standardization (Plug-and-Play)

## Goal
External engineer can contribute without changing core philosophy or safety gates.

## Core invariants (must never break)
1. Intent Confidence is always scored `0-100`.
2. Sincere Mode is allowed only at `>= 75`.
3. Human final decision and responsibility are always retained.

## Module boundaries

### 1) Core scoring engine
- Path: `app/lib/hai-ic-analyze.ts`
- Responsibility:
  - score intent confidence
  - decide Sincere Mode ON/OFF
  - produce breakdown + clarifying questions + response frame
- Inputs:
  - natural-language text (`string`)
- Output (public contract):
  - `HaiIcResult`

### 2) Policy constants
- Path: `app/lib/hai-ic-system-prompt.ts`
- Responsibility:
  - declare threshold and analyzer policy text
- Public constants:
  - `HAI_IC_CONFIDENCE_THRESHOLD`
  - `HAI_IC_SYSTEM_PROMPT`

### 3) API adapter
- Path: `app/api/hai-ic/analyze/route.ts`
- Responsibility:
  - HTTP input validation
  - CORS-safe response
  - invoke core scoring engine
- Public API:
  - `POST /api/hai-ic/analyze`
  - `GET /api/hai-ic/analyze` (endpoint info)

### 4) UI demo adapter
- Path: `app/components/hai-ic-demo.tsx`
- Responsibility:
  - local interactive demo for ON/OFF behavior
  - display confidence, breakdown, and questions

### 5) Product and trust artifacts
- Paths:
  - `hai-ic/PRODUCT.md`
  - `hai-ic/buyer-deliverables/TRUST-LEDGER.md`
  - `hai-ic/war-room/*.md`
- Responsibility:
  - business and proof documentation

## Public interfaces (stable contract)
- TypeScript:
  - `analyzeIntent(input: string): HaiIcResult`
  - `HaiIcResult`, `HaiIcBreakdown`
- HTTP:
  - `POST /api/hai-ic/analyze` request body:
    - `{ "input": "..." }`
  - response:
    - `{ ok: true, confidence, sincereMode, mode, breakdown, questions, response, analyzedAt }`

## External engineer onboarding contract
1. Read this file + `hai-ic/PRODUCT.md` first.
2. Do not modify threshold semantics without owner approval.
3. Any behavior change must include:
   - before/after sample outputs
   - updated trust artifact notes
   - updated metrics entry in `hai-ic/war-room/metrics/`

## Automation pipeline outline (deploy, health, secrets order, verify)
1. Pre-check:
   - `npm install`
   - `npm run lint`
2. Local run:
   - `npm run dev:hai-ic`
3. Health:
   - `GET /api/hai-ic/health`
   - `GET /api/hai-ic/analyze`
4. Secrets order (never print values):
   - environment vault present
   - deployment credentials present
   - API keys (if enabled) present
5. Verify:
   - run DD prompt and non-DD prompt through API
   - confirm threshold ON/OFF behavior
6. Publish:
   - update `hai-ic/war-room/METRICS-PLAN-HAI-IC.md` status row
