// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import {
  canDeliverToRecipient,
  resolveResendFromEmail,
  resendAccountOwnerEmail,
} from "./resend-config";
import { buildUnapprovedFileReminderEmail } from "./open-file-approval-core.mjs";
import {
  getOpenFileApprovalCatalog,
  listUnapprovedImportant,
  resolveReminderRecipient,
  type OpenFileApproval,
} from "./open-file-approvals";

const DEFAULT_SITE_ORIGIN = "https://hai-ic.com";

export interface UnapprovedFileReminderResult {
  ok: boolean;
  sent: boolean;
  skipped: boolean;
  reason?: string;
  error?: string;
  recipient?: string;
  pending: OpenFileApproval[];
}

function siteOrigin(): string {
  return process.env.HAI_PUBLIC_ORIGIN?.trim() || DEFAULT_SITE_ORIGIN;
}

export { buildUnapprovedFileReminderEmail };

function pickDeliverableRecipient(preferred: string): { to: string } | { error: string } {
  const from = resolveResendFromEmail();
  const preferredCheck = canDeliverToRecipient(preferred, from);
  if (preferredCheck.ok) return { to: preferred };

  const fallback = resendAccountOwnerEmail();
  if (fallback.toLowerCase() !== preferred.toLowerCase()) {
    const fallbackCheck = canDeliverToRecipient(fallback, from);
    if (fallbackCheck.ok) return { to: fallback };
  }

  return { error: preferredCheck.reason };
}

export async function runUnapprovedFileReminder(options?: {
  dryRun?: boolean;
}): Promise<UnapprovedFileReminderResult> {
  const catalog = getOpenFileApprovalCatalog();
  const pending = listUnapprovedImportant(catalog);

  if (pending.length === 0) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "no_unapproved_important_files",
      pending,
    };
  }

  const preferred = resolveReminderRecipient(catalog);
  const recipient = pickDeliverableRecipient(preferred);
  if ("error" in recipient) {
    return {
      ok: false,
      sent: false,
      skipped: true,
      error: recipient.error,
      pending,
    };
  }

  if (options?.dryRun) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "dry_run",
      recipient: recipient.to,
      pending,
    };
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return {
      ok: false,
      sent: false,
      skipped: true,
      error: "RESEND_API_KEY not set — reminder not emailed",
      recipient: recipient.to,
      pending,
    };
  }

  const { subject, text, html } = buildUnapprovedFileReminderEmail(pending, siteOrigin());
  const from = resolveResendFromEmail();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient.to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      sent: false,
      skipped: false,
      error: `Resend ${res.status}: ${errText.slice(0, 200)}`,
      recipient: recipient.to,
      pending,
    };
  }

  return {
    ok: true,
    sent: true,
    skipped: false,
    recipient: recipient.to,
    pending,
  };
}
