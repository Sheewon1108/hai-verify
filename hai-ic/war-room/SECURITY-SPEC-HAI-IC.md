# HAI-IC Security Specification (Skeleton)

## 1) System definition
- Product: HAI-IC intent-confidence gate before AI action.
- Security principle: protect intent data, prevent unauthorized action, preserve human responsibility chain.

## 2) Threat model

### Assets
- Input prompts and business intent text
- Confidence scores and rationale
- Buyer-facing trust artifacts
- Secrets (deployment and API credentials)

### Actors
- Authorized operator (Karam)
- External engineer (limited contributor)
- API client (pilot user)
- Adversary (credential theft, prompt injection, replay, abuse)

### Threats
1. Unauthorized API usage
2. Prompt/data leakage
3. Secret exposure in logs or commits
4. Policy bypass (forcing Sincere Mode under threshold)
5. Missing audit trail for decisions

## 3) Security controls

### Secrets handling
- Secrets stored in vault/env manager only.
- Never commit secrets.
- Never print secrets in logs, scripts, PR text, or docs.
- Rotate credentials immediately on exposure.

### Approval gates
- Gate A: confidence threshold check (`>= 75`) before Sincere Mode.
- Gate B: human final approval before external action.
- Gate C: deployment approval checklist before production release.

### Data handling
- Minimize stored prompt data when possible.
- Redact personal/company-sensitive content in shared artifacts.
- Separate internal logs from buyer-facing documents.

## 4) Audit trail requirements
- Every analyzed request should capture:
  - timestamp
  - input hash or redacted summary
  - confidence score
  - mode ON/OFF
  - clarifying questions (if OFF)
  - final human decision flag
  - decision owner id
- Storage target:
  - `hai-ic/war-room/metrics/` for pilot phase logs

## 5) Verification checklist
1. Threshold cannot be bypassed in API path.
2. OFF mode always asks clarifying questions.
3. Human final decision recorded for every external action.
4. Secret scan passes before commit/push.
5. Health probe and failure alerts are active.

## 6) Incident response (minimum)
1. Stop external actions.
2. Preserve logs and timeline.
3. Rotate potentially exposed credentials.
4. Patch root cause.
5. Re-verify gates and audit capture before resuming.
