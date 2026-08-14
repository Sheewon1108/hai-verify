#!/usr/bin/env node
"use strict";

/**
 * HAI → CURSOR SECURITY (XGOMA) evidence
 * Prints pass/fail + counts only. Never prints secrets, keys, payment data, or URLs.
 * On failure: exit 1 (caller must stop + rollback).
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RULE = path.join(ROOT, ".cursor", "rules", "hai-cursor-security.mdc");
const SELF = path.normalize(__filename);

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".open-next",
  ".git",
  ".wrangler",
  "coverage",
  "dist",
  "scripts/backups",
]);

const SCAN_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".json",
  ".html",
]);

function needle(parts) {
  return parts.join("");
}

const PATTERNS = [
  {
    id: "stripe_live_prefix",
    re: new RegExp(needle(["sk", "_", "live", "_", "|", "rk", "_", "live", "_", "|", "pk", "_", "live", "_"])),
  },
  {
    id: "stripe_whsec",
    re: new RegExp(needle(["whsec", "_", "[A-Za-z0-9]{16,}"])),
  },
  {
    id: "openai_prefix",
    re: new RegExp(needle(["sk", "-", "proj", "-", "|", "sk", "-", "[A-Za-z0-9]{40,}"])),
  },
  {
    id: "pem_block",
    re: /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
  },
];

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name) || SKIP_DIRS.has(rel)) continue;
      walk(full, acc);
      continue;
    }
    if (!ent.isFile()) continue;
    if (path.normalize(full) === SELF) continue;
    const ext = path.extname(ent.name);
    if (SCAN_EXT.has(ext) || ent.name === ".env" || ent.name === ".env.local") {
      acc.push(full);
    }
  }
  return acc;
}

function scanSecrets() {
  const files = walk(ROOT, []);
  const hits = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { id, re } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(text)) {
        hits.push({ id });
      }
    }
  }
  return hits;
}

function envNotTracked() {
  const r = spawnSync("git", ["ls-files", ".env", ".env.local", ".dev.vars"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const tracked = (r.stdout || "").trim();
  return tracked.length === 0;
}

function rulePresent() {
  if (!fs.existsSync(RULE)) return false;
  const text = fs.readFileSync(RULE, "utf8");
  return (
    text.includes("HAI → CURSOR SECURITY (XGOMA)") &&
    text.includes("Sandbox only") &&
    text.includes("No public deploy")
  );
}

function runPrivateE2E() {
  const e2e = path.join(__dirname, "hai-cursor-security-e2e.mts");
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings=ExperimentalWarning", e2e],
    { cwd: ROOT, encoding: "utf8" },
  );
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  const last = out.split("\n").filter(Boolean).pop() || "FAIL private_e2e no_output";
  const pass = r.status === 0 && last.startsWith("PASS private_e2e");
  return { pass, line: last.startsWith("FAIL") || last.startsWith("PASS") ? last : "FAIL private_e2e" };
}

function main() {
  const results = [];
  let failed = false;

  const ruleOk = rulePresent();
  results.push(ruleOk ? "PASS rule_file" : "FAIL rule_file");
  if (!ruleOk) failed = true;

  const envOk = envNotTracked();
  results.push(envOk ? "PASS env_untracked" : "FAIL env_untracked");
  if (!envOk) failed = true;

  const hits = scanSecrets();
  if (hits.length === 0) {
    results.push("PASS secret_scan hits=0");
  } else {
    const byId = {};
    for (const h of hits) byId[h.id] = (byId[h.id] || 0) + 1;
    const summary = Object.entries(byId)
      .map(([id, n]) => `${id}:${n}`)
      .join(",");
    results.push(`FAIL secret_scan hits=${hits.length} ${summary}`);
    failed = true;
  }

  const e2e = runPrivateE2E();
  results.push(e2e.pass ? "PASS private_e2e mock_checkout" : e2e.line);
  if (!e2e.pass) failed = true;

  results.push(failed ? "FAIL cursor_security" : "PASS cursor_security");
  for (const line of results) console.log(line);
  process.exit(failed ? 1 : 0);
}

main();
