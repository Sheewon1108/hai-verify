const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function trackedFiles() {
  const output = cp.execSync("git ls-files", { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function run() {
  const files = trackedFiles();
  const checks = [
    {
      name: "Live secret key exposed",
      re: /\b(?:sk_live_|rk_live_|pk_live_)[A-Za-z0-9]{16,}\b/g,
    },
    { name: "Stripe price ID literal exposed", re: /\bprice_[a-zA-Z0-9]{8,}\b/g },
  ];

  const scopedChecks = [
    {
      name: "Order page still calls mock checkout API",
      file: "app/order/page.tsx",
      re: /\/api\/checkout\b/g,
    },
  ];

  const violations = [];
  for (const relativeFile of files) {
    const abs = path.join(process.cwd(), relativeFile);
    let content = "";
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    for (const check of checks) {
      const found = content.match(check.re);
      if (found && found.length > 0) {
        violations.push(`${check.name} -> ${relativeFile}`);
      }
    }
  }

  for (const check of scopedChecks) {
    const abs = path.join(process.cwd(), check.file);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    const found = content.match(check.re);
    if (found && found.length > 0) {
      violations.push(`${check.name} -> ${check.file}`);
    }
  }

  if (violations.length > 0) {
    console.error("Security check failed:");
    for (const item of violations) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("Security check passed.");
}

run();
