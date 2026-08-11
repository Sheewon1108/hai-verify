# HAI-IC IP Pack (One Page)

## One-line thesis
Before AI takes action, humans must measure intent and take final responsibility.

## Problem -> mechanism -> proof
- Problem: LLM systems can execute on unclear intent, creating confident but wrong actions.
- Mechanism: HAI-IC assigns `Intent Confidence` (0-100) to each request before action.
  - `>= 75`: Sincere Mode allowed.
  - `< 75`: action blocked; system asks clarifying questions first.
  - Human keeps final decision and responsibility in all cases.
- Proof:
  - Live analyzer and API are running in this codebase (`/hai-ic`, `POST /api/hai-ic/analyze`).
  - Historical Trust Ledger test logs exist.
  - Real cash collected status: **not measured yet in repository evidence**.

## Why this is hard to copy
- Process moat: the gate is a behavioral discipline (no forced answer under low confidence), not only a model call.
- Philosophy moat: "human final responsibility" is enforced as a product rule, not optional UX text.
- Operating moat: trust artifacts (ledger, OFF/ON behavior, DD handling) tie technical output to buyer due diligence process.

## Evidence table (no exaggeration)
| Claim | Status | Evidence location |
|---|---|---|
| Intent Confidence score exists (0-100) | Measured/implemented | `app/lib/hai-ic-analyze.ts` |
| Sincere Mode threshold is 75% | Measured/implemented | `app/lib/hai-ic-system-prompt.ts` |
| Human final decision retained | Implemented policy, not numerically measured | `hai-ic/PRODUCT.md` |
| Live system exists | Measured/implemented | `app/api/hai-ic/analyze/route.ts`, `app/components/hai-ic-demo.tsx` |
| Real payments collected | Not measured yet | Add pilot invoice/payment log in `hai-ic/war-room/metrics/` |
