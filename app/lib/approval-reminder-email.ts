// Copyright 2026 KARAM. All Rights Reserved.

import {
  canDeliverToRecipient,
  resolveResendFromEmail,
  resendAccountOwnerEmail,
} from "@/app/lib/resend-config";

export function resolveReminderToEmail(): string {
  return process.env["APPROVAL_REMINDER_EMAIL"]?.trim() || resendAccountOwnerEmail();
}

export async function sendApprovalReminderEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY not set — reminder not emailed" };
  }

  const from = resolveResendFromEmail();
  const preflight = canDeliverToRecipient(input.to, from);
  if (!preflight.ok) {
    return { ok: false, error: preflight.reason };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${errText.slice(0, 200)}` };
  }

  return { ok: true };
}
