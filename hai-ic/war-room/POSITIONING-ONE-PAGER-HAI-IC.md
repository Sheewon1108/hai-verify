# HAI-IC External Positioning (One Page)

## What it is
HAI-IC is an intent-confidence gate placed before AI action.
It scores intent clarity from 0-100 and enforces a hard rule:
- Sincere Mode only at `>= 75`
- below 75, clarify first
- human keeps final decision and responsibility

## Who it is for
- Teams deploying AI where wrong action has real cost:
  - operations
  - customer communication
  - procurement/sales workflows
  - due diligence response workflows
- Buyers who need traceable human responsibility, not autonomous black-box behavior.

## Why now
Most AI systems optimize response speed.
HAI-IC optimizes decision integrity first, then speed.
That reduces confident-but-wrong execution risk.

## Pilot path (short)
1. Select one high-risk workflow.
2. Route requests through `POST /api/hai-ic/analyze`.
3. Run two-week pilot with objective metrics:
   - p50/p95 latency
   - processing speed
   - uptime
   - cost comparison vs baseline
4. Keep human final approval in every external action.

## Next step (Yes/No)
- **Yes**: start a two-week paid pilot on one workflow and one decision owner.
- **No**: do not deploy to production.

## Tone commitment
Family-first operations.
Human responsibility stays with people.
No hype claims. Only measured evidence.
