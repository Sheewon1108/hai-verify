// Copyright 2026 KARAM. All Rights Reserved.

/** Hourly interval between reminder emails for unapproved important files. */
export const APPROVAL_REMINDER_INTERVAL_MS = 60 * 60 * 1000;

export type WatchedOpenFile = {
  id: string;
  path: string;
  title: string;
  /** Owner-marked important. Only this flag gates the hourly email. */
  important: boolean;
  approvedAt: string | null;
};

export type ApprovalWatchState = {
  files: WatchedOpenFile[];
  lastReminderSentAt: string | null;
};

export function pendingImportantFiles(files: readonly WatchedOpenFile[]): WatchedOpenFile[] {
  return files.filter((file) => file.important && !file.approvedAt);
}

export function shouldSendReminder(input: {
  pending: readonly WatchedOpenFile[];
  lastSentAt: string | null;
  now: Date;
  intervalMs?: number;
}): { send: boolean; reason: "none_pending" | "never_sent" | "interval_elapsed" | "too_soon" } {
  if (input.pending.length === 0) {
    return { send: false, reason: "none_pending" };
  }

  const intervalMs = input.intervalMs ?? APPROVAL_REMINDER_INTERVAL_MS;
  if (!input.lastSentAt) {
    return { send: true, reason: "never_sent" };
  }

  const last = Date.parse(input.lastSentAt);
  if (Number.isNaN(last)) {
    return { send: true, reason: "never_sent" };
  }

  const elapsed = input.now.getTime() - last;
  if (elapsed >= intervalMs) {
    return { send: true, reason: "interval_elapsed" };
  }

  return { send: false, reason: "too_soon" };
}

export function applyApproval(
  state: ApprovalWatchState,
  fileId: string,
  approvedAt: string | null,
): ApprovalWatchState {
  let matched = false;
  const files = state.files.map((file) => {
    if (file.id !== fileId) return file;
    matched = true;
    return { ...file, approvedAt };
  });

  if (!matched) {
    throw new Error(`Unknown watched file: ${fileId}`);
  }

  return { ...state, files };
}

export function markReminderSent(state: ApprovalWatchState, sentAt: string): ApprovalWatchState {
  return { ...state, lastReminderSentAt: sentAt };
}

export function buildReminderEmail(input: {
  pending: readonly WatchedOpenFile[];
  approveUrl: string;
}): { subject: string; text: string; html: string } {
  const count = input.pending.length;
  const subject = `[HAI] 미승인 중요 파일 ${count}건`;
  const lines = input.pending.map((file) => `- ${file.title} (${file.path})`);
  const text = [
    "아직 승인하지 않은 중요 파일이 있습니다.",
    "",
    ...lines,
    "",
    `승인 페이지: ${input.approveUrl}`,
    "",
    "이 메일은 해당 파일을 승인할 때까지 1시간마다 발송됩니다.",
  ].join("\n");

  const items = input.pending
    .map(
      (file) =>
        `<li><strong>${escapeHtml(file.title)}</strong> — <code>${escapeHtml(file.path)}</code></li>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>아직 승인하지 않은 중요 파일이 있습니다.</p>
  <ul>${items}</ul>
  <p><a href="${escapeHtml(input.approveUrl)}">승인 페이지 열기</a></p>
  <p style="font-size:12px;color:#666">이 메일은 해당 파일을 승인할 때까지 1시간마다 발송됩니다. 파일 내용은 포함하지 않습니다.</p>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
