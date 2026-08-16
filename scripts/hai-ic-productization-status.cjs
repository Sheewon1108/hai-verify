const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HAI_IC = path.join(ROOT, "hai-ic");
const OUT = path.join(HAI_IC, "PRODUCTIZATION-STATUS.md");
const OWNER = "KARAM SHIN";
const LEGAL_ENTITY = "XGOMA Inc";

function readTrustLedger() {
  const p = path.join(HAI_IC, "buyer-deliverables", "TRUST-LEDGER.md");
  if (!fs.existsSync(p)) return null;
  const t = fs.readFileSync(p, "utf8");
  const q = t.match(/Questions analyzed \| \*\*(\d+)\*\*/);
  const off = t.match(/진심 모드 OFF.*\*\*(\d+)\*\*/);
  const on = t.match(/진심 모드 ON.*\*\*(\d+)\*\*/);
  const avg = t.match(/Avg Intent Confidence \| \*\*([\d.]+)%\*\*/);
  return {
    questions: q ? q[1] : "?",
    off: off ? off[1] : "?",
    on: on ? on[1] : "?",
    avg: avg ? avg[1] : "?",
  };
}

function readOutreach() {
  const log = path.join(HAI_IC, "outreach", "SEND-LOG.md");
  if (!fs.existsSync(log)) return "unknown";
  const t = fs.readFileSync(log, "utf8");
  return t.includes("KARAM sent") || t.includes("SENT") ? "outreach sent 2026-07-07" : "pre-send";
}

async function health() {
  try {
    const res = await fetch("http://localhost:3001/api/hai-ic/health", {
      signal: AbortSignal.timeout(5000),
    });
    const j = await res.json();
    return j.ok ? `healthy (${j.version})` : "unhealthy";
  } catch {
    return "offline (start: npm run dev:hai-ic)";
  }
}

async function main() {
  const ledger = readTrustLedger();
  const server = await health();
  const outreach = readOutreach();
  const today = new Date().toISOString().slice(0, 10);

  const md = `# Hai-Ic Productization — Status

**Generated:** ${today}
**Owner:** ${OWNER}
**Legal entity:** ${LEGAL_ENTITY}

## Parallel tracks

| Track | Phase | Next |
|-------|-------|------|
| **Hai-Ic** (${LEGAL_ENTITY}) | P2 Package | API key + public deploy |
| **Transla** | Definition | Woosung LTL proposal |
| **Link** | Spec | \`transla/HAI-IC-LINK.md\` |

## Live

| Check | Value |
|-------|-------|
| Server :3001 | ${server} |
| Trust Ledger | ${ledger ? `${ledger.questions} q / OFF ${ledger.off} / ON ${ledger.on} / avg ${ledger.avg}%` : "n/a"} |
| Outreach | ${outreach} |
| Follow-up | ~2026-07-14 |

## P2 checklist

- [x] openapi.json
- [x] sdk/hai-ic-client.ts
- [x] PRICING.md
- [x] PRODUCTIZATION.md
- [ ] Public deploy (Cloudflare credentials)
- [ ] API key middleware
- [ ] Stripe → Team tier

## Commands

\`\`\`powershell
node scripts/hai-ic-productization-status.cjs
node scripts/generate-buyer-trust-pack.cjs
npm run dev:hai-ic
\`\`\`
`;

  fs.writeFileSync(OUT, md, "utf8");
  console.log(`[productization] → ${OUT}`);
  console.log(`  server: ${server}`);
  if (ledger) console.log(`  ledger: ${ledger.questions} questions`);
}

main();