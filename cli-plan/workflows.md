# CLI Workflows

Mock-only workflows for development, demos, and future CI.

## 1. Local developer loop

```bash
# Terminal 1
npm run dev

# Terminal 2
export KARAM_API_KEY=karam_test_demo
export HAI_VERIFY_API_URL=http://localhost:3000

hai-verify scan --file samples/compliance.txt
```

## 2. Pre-release check (human reviewer)

```bash
hai-verify verify --file draft.md --json > scan.json
hai-verify audit --file draft.md --out audit.txt
# Send audit.txt to reviewer — Human Verified workflow
```

## 3. CI gate (GitHub Actions — planned)

```yaml
# .github/workflows/verify-ai-output.yml (future, mock)
- name: HAI Verify scan
  run: |
    npx hai-verify scan --file generated/policy.md --fail-on review
  env:
    KARAM_API_KEY: ${{ secrets.KARAM_API_KEY }}
    HAI_VERIFY_API_URL: https://verify.example
```

No secrets in repo. Use GitHub encrypted secrets when live.

## 4. Grok + HAI pipeline

```bash
# Windows (Git Bash)
grok "Summarize vendor retention clause with citations [1]" \
  | hai-verify scan --stdin --fail-on blocked

# PowerShell offline (no Grok required for test)
Get-Content draft.txt | node cli/hai-verify.mjs scan --stdin --offline
```

## 5. Sales demo script

```bash
# High-risk sample → blocked exit code
hai-verify scan --file samples/high-risk.txt
echo "Exit code: $?"

# Compliance sample → review
hai-verify scan --file samples/compliance.txt
```

Sample files (future): `samples/compliance.txt`, `samples/high-risk.txt` — mirror dashboard demo buttons.

## 6. Intake from CLI (mock sales)

```bash
hai-verify intake \
  --tier trust_pilot \
  --name "Demo User" \
  --email "demo@example.com" \
  --use-case "Pilot verification for legal AI memos before Q3 launch"
```

Returns `intakeId` for manual follow-up. No Stripe charge.

## Workflow diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ AI output   │────▶│ hai-verify   │────▶│ Audit report    │
│ (file/stdin)│     │ verify/scan  │     │ (text/json)     │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                           ▼
                    Human reviewer
                    (Human Verified)
                           │
                           ▼
                    External release
```
