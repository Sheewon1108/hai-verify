// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import watchList from "@/hai-ic/pending-approvals.json";
import {
  canDeliverToRecipient,
  resendAccountOwnerEmail,
  resolveResendFromEmail,
} from "@/app/lib/resend-config";

export type WatchedApprovalFile = {
  id: string;
  path: string;
  title: string;
  important: boolean;
  open: boolean;
  approved: boolean;
  note?: string;
};

export type PendingApprovalsWatch = {
  recipientHint: string;
  files: WatchedApprovalFile[];
};

const watch = watchList as PendingApprovalsWatch;

/** Keep in sync with scripts/lib/pending-approval-core.mjs */
export function listUnapprovedImportantOpen(
  files: readonly WatchedApprovalFile[] = watch.files,
): WatchedApprovalFile[] {
  return files.filter(
    (file) => file.open === true && file.important === true && file.approved !== true,
  );
}

export function shouldSendHourlyReminder(
  files: readonly WatchedApprovalFile[] = watch.files,
): boolean {
  return listUnapprovedImportantOpen(files).length > 0;
}

export function getPendingApprovalsWatch(): PendingApprovalsWatch {
  return watch;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReminderEmail(
  pending: readonly WatchedApprovalFile[],
  sentAt: string = new Date().toISOString(),
): { subject: string; html: string; text: string } {
  const count = pending.length;
  const subject = `[HAI] 미승인 중요 파일 ${count}건 — 가람 승인 대기`;
  const rows = pending
    .map(
      (file) =>
        `<li><strong>${escapeHtml(file.title)}</strong> (<code>${escapeHtml(file.path)}</code>)<br/>${escapeHtml(file.note ?? "")}</li>`,
    )
    .join("");
  const textLines = pending
    .map((file) => `- ${file.title} (${file.path})${file.note ? ` — ${file.note}` : ""}`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>열려 있는 파일 중 <strong>중요한데 아직 승인하지 않은</strong> 항목이 있습니다.</p>
  <p>승인할 때까지 1시간마다 이 메일이 갑니다. 멈추려면 해당 파일의 <code>approved</code>를 true로 바꾸세요.</p>
  <ul>${rows}</ul>
  <p style="font-size:12px;color:#666">HAI Verify pending-approval reminder · ${escapeHtml(sentAt)}</p>
</body>
</html>`;

  const text = `열려 있는 파일 중 중요한데 아직 승인하지 않은 항목이 있습니다.

${textLines}

승인할 때까지 1시간마다 이 메일이 갑니다.
멈추려면 hai-ic/pending-approvals.json 에서 해당 파일의 approved 를 true 로 바꾸세요.

HAI Verify pending-approval reminder · ${sentAt}
`;

  return { subject, html, text };
}

/** Prefer Owner inbox when Resend can deliver; otherwise sandbox account owner. */
export function resolveReminderRecipient(): string {
  const preferred =
    process.env["PENDING_APPROVAL_REMINDER_EMAIL"]?.trim() ||
    watch.recipientHint ||
    "jay.transtar.inc@gmail.com";
  const from = resolveResendFromEmail();
  if (canDeliverToRecipient(preferred, from).ok) return preferred;
  return resendAccountOwnerEmail();
}

export type ReminderSendResult =
  | { ok: true; sent: false; reason: "none_pending" }
  | { ok: true; sent: false; reason: "dry_run"; to: string; pending: WatchedApprovalFile[] }
  | { ok: true; sent: true; reason: "sent"; to: string; pending: WatchedApprovalFile[] }
  | { ok: false; sent: false; error: string; pending: WatchedApprovalFile[] };

export async function sendPendingApprovalReminder(options?: {
  dryRun?: boolean;
}): Promise<ReminderSendResult> {
  const pending = listUnapprovedImportantOpen();
  if (pending.length === 0) {
    return { ok: true, sent: false, reason: "none_pending" };
  }

  const to = resolveReminderRecipient();
  if (options?.dryRun) {
    return { ok: true, sent: false, reason: "dry_run", to, pending };
  }

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    return {
      ok: false,
      sent: false,
      error: "RESEND_API_KEY not set — pending-approval reminder not emailed",
      pending,
    };
  }

  const from = resolveResendFromEmail();
  const preflight = canDeliverToRecipient(to, from);
  if (!preflight.ok) {
    return { ok: false, sent: false, error: preflight.reason, pending };
  }

  const { subject, html, text } = buildReminderEmail(pending);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      sent: false,
      error: `Resend ${res.status}: ${errText.slice(0, 200)}`,
      pending,
    };
  }

  return { ok: true, sent: true, reason: "sent", to, pending };
}
