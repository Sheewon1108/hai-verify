/** Shared filter + email copy for Node scripts and the Next reminder route. */

const DEFAULT_SITE_ORIGIN = "https://hai-ic.com";
const DEFAULT_REPO_BLOB = "https://github.com/Sheewon1108/hai-verify/blob/main";

export function listUnapprovedImportant(openFiles) {
  return openFiles.filter((file) => file.important && !file.approved);
}

export function resolveReminderRecipient(catalog, envEmail) {
  const fromEnv = typeof envEmail === "string" ? envEmail.trim() : "";
  if (fromEnv) return fromEnv;
  return String(catalog.recipientEmail ?? "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fileBlobUrl(filePath) {
  return `${DEFAULT_REPO_BLOB}/${String(filePath).split("/").map(encodeURIComponent).join("/")}`;
}

export function buildUnapprovedFileReminderEmail(pending, siteOrigin = DEFAULT_SITE_ORIGIN) {
  const count = pending.length;
  const subject =
    count === 1
      ? `[HAI] 미승인 중요 파일 — ${pending[0].title}`
      : `[HAI] 미승인 중요 파일 ${count}건 — 아직 승인이 필요합니다`;

  const lines = pending.map(
    (file) => `- ${file.title} (${file.path}) ${fileBlobUrl(file.path)}`,
  );
  const text = [
    "열려 있는 파일 중 중요한 항목이 아직 승인되지 않았습니다.",
    "",
    ...lines,
    "",
    `상태: ${siteOrigin}/approvals`,
    "알림을 멈추려면 hai-ic/open-file-approvals.json 에서 해당 파일의 approved 를 true 로 바꾸세요.",
  ].join("\n");

  const items = pending
    .map((file) => {
      const href = escapeHtml(fileBlobUrl(file.path));
      return `<li><strong>${escapeHtml(file.title)}</strong> — <a href="${href}">${escapeHtml(file.path)}</a></li>`;
    })
    .join("");

  const approvalsUrl = escapeHtml(`${siteOrigin}/approvals`);
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>열려 있는 파일 중 <strong>중요한 항목</strong>이 아직 승인되지 않았습니다.</p>
  <ul>${items}</ul>
  <p><a href="${approvalsUrl}">승인 상태 보기</a></p>
  <p style="font-size:12px;color:#666">알림을 멈추려면 <code>hai-ic/open-file-approvals.json</code> 에서 해당 파일의 <code>approved</code> 를 <code>true</code> 로 바꾸세요.</p>
</body>
</html>`;

  return { subject, text, html };
}
