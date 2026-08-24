#!/usr/bin/env node
/**
 * Hourly (or on-demand) email if an open important file is still unapproved.
 * Does not print secret values.
 *
 * Exit: 0 sent or nothing to send · 2 would send but cannot · 1 unexpected
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReminderEmail,
  listUnapprovedImportantOpen,
} from "./lib/pending-approval-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WATCH_PATH = path.join(ROOT, "hai-ic", "pending-approvals.json");
const ONBOARDING_FROM = "onboarding@resend.dev";
const DEFAULT_ACCOUNT_EMAIL = "karam@xgoma.com";

function env(name) {
  return process.env[name]?.trim() || undefined;
}

function resendDomainVerified() {
  return env("RESEND_DOMAIN_VERIFIED")?.toLowerCase() === "true";
}

function resolveFrom() {
  if (!resendDomainVerified()) return `HAI Verify <${ONBOARDING_FROM}>`;
  const from = env("RESEND_FROM_EMAIL");
  if (from && !/yourdomain\.com/i.test(from)) return from;
  return `HAI Verify <${ONBOARDING_FROM}>`;
}

function accountOwner() {
  return env("RESEND_ACCOUNT_EMAIL") || DEFAULT_ACCOUNT_EMAIL;
}

function canDeliver(to, from) {
  const addr = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
  if (resendDomainVerified() && addr && addr !== ONBOARDING_FROM && !addr.endsWith("@resend.dev")) {
    return { ok: true };
  }
  if (to.trim().toLowerCase() === accountOwner().toLowerCase()) return { ok: true };
  return {
    ok: false,
    reason: `Resend sandbox only sends to ${accountOwner()}.`,
  };
}

function resolveTo(recipientHint) {
  const preferred = env("PENDING_APPROVAL_REMINDER_EMAIL") || recipientHint || "jay.transtar.inc@gmail.com";
  if (canDeliver(preferred, resolveFrom()).ok) return preferred;
  return accountOwner();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const raw = await readFile(WATCH_PATH, "utf8");
  const watch = JSON.parse(raw);
  const pending = listUnapprovedImportantOpen(watch.files ?? []);

  if (pending.length === 0) {
    console.log("pending-approval-reminder: nothing to send (no important open unapproved files)");
    process.exit(0);
  }

  const to = resolveTo(watch.recipientHint);
  const email = buildReminderEmail(pending, new Date().toISOString());

  if (dryRun) {
    console.log(`pending-approval-reminder: dry-run to=${to} count=${pending.length}`);
    for (const file of pending) console.log(`  - ${file.path}`);
    process.exit(0);
  }

  const key = env("RESEND_API_KEY");
  if (!key) {
    console.warn("pending-approval-reminder: RESEND_API_KEY unset — email not sent");
    for (const file of pending) console.warn(`  pending: ${file.path}`);
    process.exit(2);
  }

  const from = resolveFrom();
  const preflight = canDeliver(to, from);
  if (!preflight.ok) {
    console.warn(`pending-approval-reminder: ${preflight.reason}`);
    process.exit(2);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`pending-approval-reminder: Resend ${res.status}: ${errText.slice(0, 200)}`);
    process.exit(1);
  }

  console.log(`pending-approval-reminder: sent to=${to} count=${pending.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("pending-approval-reminder: unexpected", err instanceof Error ? err.message : err);
  process.exit(1);
});
