#!/usr/bin/env node
/**
 * Tell KARAM in short Korean when a watched outreach reply arrives.
 * Uses Grok (xAI) when XAI_API_KEY is set. Never prints secret values.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackKoreanAlert, matchWatchedReply } from "./lib/outreach-reply-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WATCH_PATH = path.join(ROOT, "hai-ic", "outreach", "reply-watch.json");

function env(name) {
  return process.env[name]?.trim() || undefined;
}

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function grokAlert(contact, subject, body) {
  const key = env("XAI_API_KEY") || env("GROK_API_KEY");
  if (!key) return { ok: false, text: fallbackKoreanAlert(contact, subject) };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env("XAI_MODEL") || "grok-3",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You write for KARAM SHIN. Korean only. Max 4 short lines. No English dump. No secrets. No hype. Say who replied, what they want, and the one next step (open Gmail / book 30-min demo). If unclear, say 내용 불명확.",
        },
        {
          role: "user",
          content: `회사: ${contact.company}\n보낸 사람: ${contact.email}\n제목: ${subject || "(제목 없음)"}\n본문:\n${(body || "").slice(0, 800) || "(본문 없음)"}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, text: fallbackKoreanAlert(contact, subject) };
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, text: fallbackKoreanAlert(contact, subject) };
  return { ok: true, text };
}

async function sendEmail(to, company, alert) {
  const key = env("RESEND_API_KEY");
  if (!key) return { sent: false, reason: "RESEND_API_KEY unset" };

  const from = "HAI Verify <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[HAI] 회신 옴 — ${company}`,
      text: alert,
    }),
  });
  if (!res.ok) return { sent: false, reason: `Resend ${res.status}` };
  return { sent: true };
}

async function main() {
  const from = arg("from") || "";
  const subject = arg("subject") || "";
  const body = arg("body") || "";
  const dryRun = process.argv.includes("--dry-run");

  if (!from.trim()) {
    console.error("usage: node scripts/notify-outreach-reply.mjs --from email [--subject s] [--body t] [--dry-run]");
    process.exit(1);
  }

  const watch = JSON.parse(await readFile(WATCH_PATH, "utf8"));
  const contact = matchWatchedReply(from, watch.contacts);
  if (!contact) {
    console.log("outreach-reply: not a watched sender — no alert");
    process.exit(0);
  }

  const grok = await grokAlert(contact, subject, body);
  const to = env("OUTREACH_REPLY_NOTIFY_EMAIL") || watch.notifyHint;

  if (dryRun) {
    console.log(`outreach-reply: dry-run company=${contact.company} grok=${grok.ok}`);
    console.log(grok.text);
    process.exit(0);
  }

  const mail = await sendEmail(to, contact.company, grok.text);
  console.log(`outreach-reply: company=${contact.company} grok=${grok.ok} emailed=${mail.sent}`);
  console.log(grok.text);
  if (!mail.sent) {
    console.warn(`outreach-reply: ${mail.reason}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("outreach-reply: unexpected", err instanceof Error ? err.message : err);
  process.exit(1);
});
