#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const STRIPE_KEY_PATTERN = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g;
const repoRoot = process.cwd();

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "buffer",
  });

  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((file) => resolve(repoRoot, file));
}

function displayPath(file) {
  const relativePath = relative(repoRoot, file);
  return relativePath && !relativePath.startsWith("..") ? relativePath : file;
}

function redactKey(value) {
  return `${value.slice(0, 12)}...${value.slice(-4)}`;
}

const files = process.argv.length > 2 ? process.argv.slice(2).map((file) => resolve(file)) : trackedFiles();
const findings = [];

for (const file of files) {
  let contents;

  try {
    contents = readFileSync(file);
  } catch {
    continue;
  }

  if (contents.includes(0)) {
    continue;
  }

  const text = contents.toString("utf8");
  const matches = text.matchAll(STRIPE_KEY_PATTERN);

  for (const match of matches) {
    const beforeMatch = text.slice(0, match.index);
    const line = beforeMatch.split("\n").length;
    findings.push(`${displayPath(file)}:${line} ${redactKey(match[0])}`);
  }
}

if (findings.length > 0) {
  console.error("Stripe API keys must not be committed. Move them to server-side secrets and rotate exposed keys.");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`No Stripe secret or restricted API key literals found in ${files.length} file(s).`);
