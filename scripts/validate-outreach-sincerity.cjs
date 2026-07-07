const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTREACH = path.join(ROOT, "hai-ic", "outreach");
const BUYER = path.join(ROOT, "hai-ic", "buyer-deliverables");

/** Only files that can reach a buyer inbox or attachment. */
function collectSendableFiles() {
  const files = new Set();

  const pitch = path.join(OUTREACH, "PITCH-EMAIL-FINAL.txt");
  if (fs.existsSync(pitch)) files.add(pitch);

  function walkSendPack(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walkSendPack(full);
      else if (/\.(txt|md)$/i.test(name)) files.add(full);
    }
  }

  walkSendPack(path.join(OUTREACH, "send-pack"));

  if (fs.existsSync(OUTREACH)) {
    for (const name of fs.readdirSync(OUTREACH)) {
      const dir = path.join(OUTREACH, name);
      if (!fs.statSync(dir).isDirectory() || name === "send-pack") continue;
      const email = path.join(dir, "EMAIL-TO-SEND.txt");
      if (fs.existsSync(email)) files.add(email);
      walkSendPack(path.join(dir, "send-pack"));
    }
  }

  if (fs.existsSync(BUYER)) {
    for (const name of fs.readdirSync(BUYER)) {
      if (name.endsWith(".md")) files.add(path.join(BUYER, name));
    }
  }

  return [...files];
}

const rules = [
  { pattern: /localhost|127\.0\.0\.1/i, reason: "localhost link — buyer cannot open" },
  { pattern: /Live Demo:\s*http/i, reason: "demo URL in email — use 30-min live call" },
  { pattern: /70\s*%|70%/, reason: "unverified 70% claim" },
  { pattern: /zero risk|risk-free|리스크 제로/i, reason: "overclaim" },
  { pattern: /Production Ready/i, reason: "not honest for MVP" },
  { pattern: /85%|>=85|≥85/, reason: "wrong threshold (product uses 75%)" },
  { pattern: /significantly reduce/i, reason: "unverified marketing claim" },
  { pattern: /artificial boost|score inflation|\+1% boost|no score inflation/i, reason: "score inflation wording" },
  { pattern: /no inflated scores/i, reason: "use: scores not manually raised" },
  { pattern: /vaporware/i, reason: "defensive marketing" },
];

const errors = [];
for (const file of collectSendableFiles()) {
  const rel = path.relative(ROOT, file);
  const base = path.basename(file);
  if (base === "PITCH-EMAIL.txt") {
    errors.push({ file: rel, reason: "deprecated draft — delete; use PITCH-EMAIL-FINAL.txt" });
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      errors.push({ file: rel, reason: rule.reason });
    }
  }
}

if (errors.length > 0) {
  console.error("\nBLOCKED — sincerity check failed:\n");
  for (const e of errors) {
    console.error(`  [${e.reason}] ${e.file}`);
  }
  console.error("\nFix files above, then: node scripts/generate-buyer-trust-pack.cjs");
  console.error("                  powershell -File scripts/prepare-pitch-send-pack.ps1\n");
  process.exit(1);
}

const count = collectSendableFiles().length;
console.log("OK — outreach passes sincerity validation");
console.log(`Checked ${count} buyer-facing files`);