// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import watchList from "@/hai-ic/outreach/reply-watch.json";
import { summarizeReplyWithGrok } from "@/app/lib/grok-reply-alert";
import {
  canDeliverToRecipient,
  resendAccountOwnerEmail,
  resolveResendFromEmail,
} from "@/app/lib/resend-config";

export type ReplyContact = {
  id: string;
  company: string;
  email: string;
};

export type ReplyWatch = {
  notifyHint: string;
  contacts: ReplyContact[];
};

const watch = watchList as ReplyWatch;

export function extractEmail(from: string): string {
  const angle = from.match(/<([^>]+)>/);
  return (angle?.[1] ?? from).trim().toLowerCase();
}

export function matchWatchedReply(from: string): ReplyContact | null {
  const email = extractEmail(from);
  return watch.contacts.find((contact) => contact.email.toLowerCase() === email) ?? null;
}

export function fallbackKoreanAlert(contact: ReplyContact, subject: string): string {
  const sub = subject.trim() || "(제목 없음)";
  return [
    `회신 옴: ${contact.company}`,
    `보낸 사람: ${contact.email}`,
    `제목: ${sub}`,
    "다음: Gmail 열고 DEMO-30-READY 보고 30분 잡을지 정하면 됨",
  ].join("\n");
}

export function resolveNotifyRecipient(): string {
  const preferred =
    process.env["OUTREACH_REPLY_NOTIFY_EMAIL"]?.trim() ||
    watch.notifyHint ||
    "jay.transtar.inc@gmail.com";
  const from = resolveResendFromEmail();
  if (canDeliverToRecipient(preferred, from).ok) return preferred;
  return resendAccountOwnerEmail();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ReplyNotifyResult =
  | { ok: false; error: string }
  | {
      ok: true;
      matched: false;
    }
  | {
      ok: true;
      matched: true;
      sent: boolean;
      company: string;
      from: string;
      grok: boolean;
      alert: string;
      to?: string;
      error?: string;
    };

export async function notifyOutreachReply(input: {
  from: string;
  subject?: string;
  body?: string;
  dryRun?: boolean;
}): Promise<ReplyNotifyResult> {
  const contact = matchWatchedReply(input.from);
  if (!contact) {
    return { ok: true, matched: false };
  }

  const subject = input.subject?.trim() ?? "";
  const grok = await summarizeReplyWithGrok({
    company: contact.company,
    from: contact.email,
    subject,
    body: input.body ?? "",
  });
  const alert = grok.ok ? grok.text : fallbackKoreanAlert(contact, subject);

  if (input.dryRun) {
    return {
      ok: true,
      matched: true,
      sent: false,
      company: contact.company,
      from: contact.email,
      grok: grok.ok,
      alert,
    };
  }

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    return {
      ok: true,
      matched: true,
      sent: false,
      company: contact.company,
      from: contact.email,
      grok: grok.ok,
      alert,
      error: "RESEND_API_KEY unset — Grok text ready, email not sent",
    };
  }

  const to = resolveNotifyRecipient();
  const from = resolveResendFromEmail();
  const preflight = canDeliverToRecipient(to, from);
  if (!preflight.ok) {
    return {
      ok: true,
      matched: true,
      sent: false,
      company: contact.company,
      from: contact.email,
      grok: grok.ok,
      alert,
      error: preflight.reason,
    };
  }

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;white-space:pre-wrap">${escapeHtml(alert)}</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[HAI] 회신 옴 — ${contact.company}`,
      html,
      text: alert,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: true,
      matched: true,
      sent: false,
      company: contact.company,
      from: contact.email,
      grok: grok.ok,
      alert,
      to,
      error: `Resend ${res.status}: ${errText.slice(0, 160)}`,
    };
  }

  return {
    ok: true,
    matched: true,
    sent: true,
    company: contact.company,
    from: contact.email,
    grok: grok.ok,
    alert,
    to,
  };
}
