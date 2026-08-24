#!/usr/bin/env node
/**
 * Hourly / manual sender for important open files that KARAM has not approved.
 *
 *   node scripts/send-unapproved-file-reminder.mjs
 *   node scripts/send-unapproved-file-reminder.mjs --dry-run
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildUnapprovedFileReminderEmail,
  listUnapprovedImportant,
  resolveReminderRecipient,
} from "../app/lib/open-file-approval-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = join(ROOT, "hai-ic/open-file-approvals.json");
const REMINDER_URL =
  process.env.HAI_REMINDER_API_URL?.trim() ||
  "https://hai-ic.com/api/reminders/unapproved-files";
const ONBOARDING_FROM = "onboarding@resend.dev";
const PLACEHOLDER_FROM_RE = /yourdomain\.com/i;

function loadCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
}

function runtimeEnv(name) {
  return process.env[name]?.trim() || undefined;
}

function resolveResendFromEmail() {
  const sandboxFrom = `HAI Verify <${ONBOARDING_FROM}>`;
  if (runtimeEnv("RESEND_DOMAIN_VERIFIED")?.toLowerCase() !== "true") return sandboxFrom;
  const env = runtimeEnv("RESEND_FROM_EMAIL");
  if (env && !PLACEHOLDER_FROM_RE.test(env)) return env;
  return sandboxFrom;
}

function resendAccountOwnerEmail() {
  return runtimeEnv("RESEND_ACCOUNT_EMAIL") || "karam@xgoma.com";
}

function isVerifiedDomainFrom(from) {
  if (runtimeEnv("RESEND_DOMAIN_VERIFIED")?.toLowerCase() !== "true") return false;
  const m = from.match(/<([^>]+)>/);
  const addr = (m?.[1] ?? from).trim().toLowerCase();
  return Boolean(addr) && addr !== ONBOARDING_FROM && !addr.endsWith("@resend.dev");
}

function canDeliverToRecipient(to, from) {
  const recipient = to.trim().toLowerCase();
  if (isVerifiedDomainFrom(from)) return { ok: true };
  if (recipient === resendAccountOwnerEmail().toLowerCase()) return { ok: true };
  return {
    ok: false,
    reason: `Resend sandbox only sends to ${resendAccountOwnerEmail()}.`,
  };
}

function pickDeliverableRecipient(preferred) {
  const from = resolveResendFromEmail();
  if (canDeliverToRecipient(preferred, from).ok) return { to: preferred };
  const fallback = resendAccountOwnerEmail();
  if (fallback.toLowerCase() !== preferred.toLowerCase() && canDeliverToRecipient(fallback, from).ok) {
    return { to: fallback };
  }
  return { error: canDeliverToRecipient(preferred, from).reason };
}

async function triggerRemote() {
  const token =
    process.env.HAI_INTERNAL_API_KEY?.trim() || process.env.CRON_SECRET?.trim();
  if (!token) return false;

  const res = await fetch(REMINDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const body = await res.text();
  console.log(`remote ${res.status}: ${body.slice(0, 400)}`);
  return res.ok;
}

async function sendViaResend(to, pending) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) return { sent: false, error: "RESEND_API_KEY not set — reminder not emailed" };

  const origin = process.env.HAI_PUBLIC_ORIGIN?.trim() || "https://hai-ic.com";
  const { subject, text, html } = buildUnapprovedFileReminderEmail(pending, origin);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resolveResendFromEmail(),
      to: [to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { sent: false, error: `Resend ${res.status}: ${errText.slice(0, 200)}` };
  }
  return { sent: true };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const catalog = loadCatalog();
  const pending = listUnapprovedImportant(catalog.openFiles ?? []);

  if (pending.length === 0) {
    console.log("no unapproved important files — reminder not sent");
    return;
  }

  console.log(`pending ${pending.length}: ${pending.map((file) => file.path).join(", ")}`);

  if (dryRun) {
    const recipient = resolveReminderRecipient(catalog, process.env.HAI_REMINDER_EMAIL);
    console.log(`dry-run — would email ${recipient}`);
    return;
  }

  const preferred = resolveReminderRecipient(catalog, process.env.HAI_REMINDER_EMAIL);
  const recipient = pickDeliverableRecipient(preferred);
  if (recipient.error) {
    console.error(recipient.error);
    process.exit(1);
  }

  const result = await sendViaResend(recipient.to, pending);
  if (result.sent) {
    console.log(`sent reminder (${pending.length} file(s))`);
    return;
  }

  if (result.error?.includes("RESEND_API_KEY not set")) {
    const remoteOk = await triggerRemote();
    if (remoteOk) return;
    console.error(result.error);
    console.error("skip — set RESEND_API_KEY in the runner or HAI_INTERNAL_API_KEY to call production");
    process.exit(0);
  }

  console.error(result.error ?? "reminder failed");
  process.exit(1);
}

await main();
