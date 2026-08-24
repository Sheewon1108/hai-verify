#!/usr/bin/env node
// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved.

const { runOwnerApprovalNudge } = require("./lib/owner-approval-nudge.cjs");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const result = await runOwnerApprovalNudge({ dryRun });

  if (result.skipped === "nothing_pending") {
    console.log("owner-approval-nudge: nothing pending");
    return;
  }

  const files = (result.pending || []).map((file) => `${file.file} (${file.items.length})`);
  console.log(`owner-approval-nudge: ${files.join(", ") || "no files"}`);
  if (result.to) console.log(`owner-approval-nudge: to=${result.to}`);
  if (result.subject) console.log(`owner-approval-nudge: subject=${result.subject}`);

  if (dryRun) {
    console.log("owner-approval-nudge: dry-run (email not sent)");
    if (result.text) console.log(result.text);
    return;
  }

  if (result.sent) {
    console.log("owner-approval-nudge: email sent");
    return;
  }

  if (result.skipped === "missing_resend_key") {
    console.log("owner-approval-nudge: skipped (RESEND_API_KEY not set)");
    process.exitCode = 0;
    return;
  }

  console.error(`owner-approval-nudge: failed (${result.error || "unknown"})`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("owner-approval-nudge: crashed");
  console.error(err instanceof Error ? err.message : "unknown error");
  process.exitCode = 1;
});
