# CLI Commands (Detailed)

All commands support `--help`. Mock phase only.

---

## `hai-verify verify`

Score AI output.

```bash
hai-verify verify --file ./output.txt
hai-verify verify --stdin
hai-verify verify --text "Paste content here"
```

### Options

| Flag | Description |
|------|-------------|
| `--file`, `-f` | Read text from file |
| `--stdin` | Read from pipe |
| `--text`, `-t` | Inline string |
| `--json` | Print full API JSON |
| `--offline` | Skip HTTP; use local engine |

### Example output (default)

```
Scan ID: HV-A1B2C3
Risk: Moderate (42/100)
Trust: 71/100
Human review: Required
Status: review
```

---

## `hai-verify audit`

Generate audit report text.

```bash
hai-verify audit --file ./output.txt --format text
hai-verify audit --file ./output.txt --format json --out report.json
```

### Options

| Flag | Description |
|------|-------------|
| `--format` | `text` (default) or `json` |
| `--out`, `-o` | Write to file instead of stdout |
| `--scan-id` | Attach existing scan ID |

---

## `hai-verify intake`

Submit mock sales intake (no payment).

```bash
hai-verify intake \
  --tier starter \
  --name "Jane Doe" \
  --email "jane@example.com" \
  --company "Acme" \
  --use-case "Verify contract AI drafts"
```

### Tiers

| Value | Product |
|-------|---------|
| `starter` | $300 Starter Audit |
| `trust_pilot` | $1,500 Trust Audit Pilot |
| `compliance_pilot` | $5,000/mo Compliance Pilot |

---

## `hai-verify health`

```bash
hai-verify health
```

Output:

```
HAI Verify API: ok (mock)
Policy: HAI-VERIFY-01
URL: http://localhost:3000
```

---

## `hai-verify scan`

Combined verify + audit; primary CI command.

```bash
hai-verify scan --file output.txt --fail-on review
```

### `--fail-on`

| Value | Exit code when |
|-------|----------------|
| `review` | status is `review` or `blocked` |
| `blocked` | status is `blocked` only |
| `never` | always 0 (report only) |

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `KARAM_API_KEY` | Bearer token (mock: `karam_test_demo`) |
| `HAI_VERIFY_API_URL` | API base URL |
| `HAI_VERIFY_TIER` | Default `--tier` value |

Never commit `.env` files. Example in `.env.example` only (future).
