# HAI-IC modules — engineer plug-and-play

**Product name:** HAI-IC only  
**Import:** `@/hai-ic/modules` (or relative `hai-ic/modules`)

## Public surface

| Export | Kind | Purpose |
|--------|------|---------|
| `analyzeIntent` | function | Score Intent Confidence + Sincere Mode gate |
| `haiIcAnalyzer` | `IHaiIcAnalyzer` | Drop-in analyzer port |
| `HAI_IC_CONFIDENCE_THRESHOLD` | const | 75 — Sincere Mode floor |
| `HAI_IC_HOURLY_BOOST` | const | Must stay `0` (sincerity) |
| interfaces / types | types | HTTP and SDK contracts |

## Boundaries (do not cross)

```
[Buyer / Agent]
      │
      ▼
[HTTP adapter]  app/api/hai-ic/*     ← auth, CORS, length limits
      │
      ▼
[Core]          hai-ic/modules/*     ← pure logic (this folder)
      │
      ▼
[Human]         final decision + responsibility (outside code)
```

- **In:** natural-language `input` string.
- **Out:** `HaiIcResult` (`confidence`, `sincereMode`, `questions`, `response`).
- **Never in modules:** Stripe keys, vault, Cloudflare tokens, email, DB.
- **Never bypass:** paid / agent paths must call `analyzeIntent` (or `IHaiIcAnalyzer`) before LLM execution.

## Minimal host example

```ts
import { analyzeIntent, HAI_IC_CONFIDENCE_THRESHOLD } from "@/hai-ic/modules";

const result = analyzeIntent(userText);
if (!result.sincereMode || result.confidence < HAI_IC_CONFIDENCE_THRESHOLD) {
  // ask clarifying questions — do not execute
  return result.questions;
}
// human still approves before high-risk action
```

## SDK

Remote client: `hai-ic/sdk/hai-ic-client.ts` (`IHaiIcClient` shape).
