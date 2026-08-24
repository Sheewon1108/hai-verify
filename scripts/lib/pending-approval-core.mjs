/**
 * Shared filter + email body for hourly pending-approval reminders.
 * Keep listUnapprovedImportantOpen in sync with app/lib/pending-approval-reminders.ts
 */

/**
 * @typedef {object} WatchedApprovalFile
 * @property {string} id
 * @property {string} path
 * @property {string} title
 * @property {boolean} important
 * @property {boolean} open
 * @property {boolean} approved
 * @property {string} [note]
 */

/**
 * Among currently open files, keep only important items KARAM has not approved.
 * @param {readonly WatchedApprovalFile[]} files
 * @returns {WatchedApprovalFile[]}
 */
export function listUnapprovedImportantOpen(files) {
  return files.filter((file) => file.open === true && file.important === true && file.approved !== true);
}

/**
 * @param {readonly WatchedApprovalFile[]} files
 */
export function shouldSendHourlyReminder(files) {
  return listUnapprovedImportantOpen(files).length > 0;
}

/**
 * @param {string} value
 */
export function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {readonly WatchedApprovalFile[]} pending
 * @param {string} sentAt
 */
export function buildReminderEmail(pending, sentAt) {
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
