# HAI Verify — CLI Plan (Mock Phase)

**Status:** Planning only · **Binary name (planned):** `hai-verify` · **Alias:** `karam-verify`

CLI wraps HAI Verify HTTP API. Mock phase: all commands hit local Next.js server or inline `verification.ts` when `--offline` is set.

## Principles

- No OpenAI, Stripe, Discord, Gmail, or X integration in mock phase
- API key from env: `KARAM_API_KEY` (never hardcode)
- Default base URL: `HAI_VERIFY_API_URL=http://localhost:3000`
- Compatible with existing Grok CLI pipelines (stdin/stdout)

## Installation (planned)

```bash
# Phase 1: npm script in repo (no global publish yet)
npm run cli -- verify --file output.txt

# Phase 2: global bin (future)
npm install -g @karam/hai-verify-cli
```

Repo-local mock entry (future):

```
/cli/hai-verify.mjs
```

## Command overview

| Command | API | Purpose |
|---------|-----|---------|
| `hai-verify verify` | `POST /api/verify` | Score AI output |
| `hai-verify audit` | `POST /api/audit-report` | Export audit text |
| `hai-verify intake` | `POST /api/intake` | Submit sales intake (mock) |
| `hai-verify health` | `GET /api/health` | Check API + mode |
| `hai-verify scan` | verify + audit | One-shot full report |

Details: [commands.md](./commands.md) · Workflows: [workflows.md](./workflows.md)

## Global flags

```
--api-url <url>     Default: $HAI_VERIFY_API_URL or http://localhost:3000
--api-key <key>     Default: $KARAM_API_KEY
--offline           Run verification.ts locally (no HTTP)
--json              JSON output to stdout
--quiet             Errors only
--tier <name>       Mock tier header: starter | pilot | compliance
```

## Exit codes (planned)

| Code | Meaning |
|------|---------|
| 0 | Pass / cleared |
| 1 | Review required |
| 2 | Blocked / high risk |
| 3 | API or auth error |
| 4 | Invalid input |

Enables CI: fail build when verification status is `blocked`.

## Grok CLI pipeline (planned)

```bash
# Generate (Grok) → verify (HAI) — mock example
grok "Draft GDPR memo with citations" | hai-verify verify --stdin

# Full pipeline with exit code
grok "..." | hai-verify scan --stdin --fail-on review
```

Grok remains generation; HAI Verify remains verification. No shared API keys between products in docs.

## Related

- API: [`../api-plan/README.md`](../api-plan/README.md)
- KARAM Idea API: [`../karam-api/README.md`](../karam-api/README.md)
- Revenue: [`../revenue-system/README.md`](../revenue-system/README.md)
