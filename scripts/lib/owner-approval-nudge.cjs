// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved.

const fs = require("fs");
const path = require("path");

const DEFAULT_ACCOUNT_EMAIL = "karam@xgoma.com";
const ONBOARDING_FROM = "onboarding@resend.dev";
const PLACEHOLDER_FROM_RE = /yourdomain\.com/i;

const SKIP_ITEM_RE =
  /(family money|personal schedule|owner clock only|가족|개인 일정)/i;

/**
 * @typedef {{ path: string, label?: string, approved?: boolean }} WatchFile
 * @typedef {{ version?: number, paused?: boolean, toEmail?: string, files: WatchFile[] }} WatchConfig
 * @typedef {{ file: string, label: string, items: string[] }} PendingFile
 * @typedef {{ ok: boolean, skipped?: string, pending?: PendingFile[], to?: string, subject?: string, text?: string, html?: string, error?: string, sent?: boolean }} NudgeResult
 */

function repoRoot(fromDir = __dirname) {
  return path.resolve(fromDir, "..", "..");
}

function envTrim(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** @param {string} filePath */
function readWatchConfig(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!raw || !Array.isArray(raw.files)) {
    throw new Error("owner-approval-watch.json must have a files array");
  }
  return /** @type {WatchConfig} */ (raw);
}

/** @param {string} text */
function extractUncheckedItems(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+\[\s\]\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter((item) => item && !SKIP_ITEM_RE.test(item));
}

/**
 * @param {WatchConfig} config
 * @param {string} root
 */
function collectPending(config, root) {
  if (config.paused) return [];

  /** @type {PendingFile[]} */
  const pending = [];
  for (const file of config.files) {
    if (!file || file.approved === true) continue;
    if (typeof file.path !== "string" || !file.path.trim()) continue;
    const rel = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (rel.includes("..")) continue;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      pending.push({
        file: rel,
        label: file.label || rel,
        items: [`missing file: ${rel}`],
      });
      continue;
    }
    const items = extractUncheckedItems(fs.readFileSync(abs, "utf8"));
    if (items.length === 0) continue;
    pending.push({
      file: rel,
      label: file.label || rel,
      items,
    });
  }
  return pending;
}

function resolveFromEmail() {
  const verified = envTrim("RESEND_DOMAIN_VERIFIED")?.toLowerCase() === "true";
  const sandboxFrom = `HAI Verify <${ONBOARDING_FROM}>`;
  if (!verified) return sandboxFrom;
  const env = envTrim("RESEND_FROM_EMAIL");
  if (env && !PLACEHOLDER_FROM_RE.test(env)) return env;
  return sandboxFrom;
}

function accountOwnerEmail() {
  return envTrim("RESEND_ACCOUNT_EMAIL") || DEFAULT_ACCOUNT_EMAIL;
}

/** @param {string} from */
function isVerifiedDomainFrom(from) {
  if (envTrim("RESEND_DOMAIN_VERIFIED")?.toLowerCase() !== "true") return false;
  const m = from.match(/<([^>]+)>/);
  const addr = (m?.[1] ?? from).trim().toLowerCase();
  return Boolean(addr) && addr !== ONBOARDING_FROM && !addr.endsWith("@resend.dev");
}

/**
 * @param {string} requested
 * @param {string} from
 */
function resolveRecipient(requested, from) {
  const want = (requested || "").trim().toLowerCase();
  if (isVerifiedDomainFrom(from)) {
    return want || accountOwnerEmail().toLowerCase();
  }
  const owner = accountOwnerEmail().toLowerCase();
  if (want && want === owner) return want;
  return owner;
}

/** @param {PendingFile[]} pending */
function buildEmail(pending) {
  const fileCount = pending.length;
  const itemCount = pending.reduce((n, file) => n + file.items.length, 0);
  const subject = `[HAI] 미승인 중요 항목 ${itemCount}개 (${fileCount}개 파일)`;
  const lines = [
    "열려 있는 중요 파일 중 아직 승인하지 않은 항목이 있습니다.",
    "승인하면 해당 파일의 owner-approval-watch.json approved 값을 true 로 바꾸거나, 체크박스를 모두 닫으면 알림이 멈춥니다.",
    "",
  ];
  for (const file of pending) {
    lines.push(`${file.label}`);
    lines.push(`파일: ${file.file}`);
    for (const item of file.items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }
  const text = lines.join("\n").trim() + "\n";
  const htmlParts = [
    `<p>열려 있는 중요 파일 중 아직 승인하지 않은 항목이 있습니다.</p>`,
    `<p>승인하면 <code>hai-ic/owner-approval-watch.json</code> 에서 해당 파일의 <code>approved</code> 를 <code>true</code> 로 바꾸거나, 체크박스를 모두 닫으면 알림이 멈춥니다.</p>`,
  ];
  for (const file of pending) {
    htmlParts.push(`<h3>${escapeHtml(file.label)}</h3>`);
    htmlParts.push(`<p><code>${escapeHtml(file.file)}</code></p><ul>`);
    for (const item of file.items) {
      htmlParts.push(`<li>${escapeHtml(item)}</li>`);
    }
    htmlParts.push("</ul>");
  }
  return { subject, text, html: htmlParts.join("\n") };
}

/** @param {string} value */
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ root?: string, watchPath?: string, fetchImpl?: typeof fetch, dryRun?: boolean }} [opts]
 * @returns {Promise<NudgeResult>}
 */
async function runOwnerApprovalNudge(opts = {}) {
  const root = opts.root || repoRoot();
  const watchPath = opts.watchPath || path.join(root, "hai-ic", "owner-approval-watch.json");
  const config = readWatchConfig(watchPath);
  const pending = collectPending(config, root);
  if (pending.length === 0) {
    return { ok: true, skipped: "nothing_pending" };
  }

  const from = resolveFromEmail();
  const to = resolveRecipient(config.toEmail || "", from);
  const email = buildEmail(pending);
  const result = {
    ok: true,
    pending,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    sent: false,
  };

  if (opts.dryRun) {
    return { ...result, skipped: "dry_run" };
  }

  const resendKey = envTrim("RESEND_API_KEY");
  if (!resendKey) {
    return { ...result, ok: false, skipped: "missing_resend_key", error: "RESEND_API_KEY not set" };
  }

  const fetchImpl = opts.fetchImpl || fetch;
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      ...result,
      ok: false,
      error: `Resend ${res.status}: ${errText.slice(0, 200)}`,
    };
  }

  return { ...result, sent: true };
}

module.exports = {
  DEFAULT_ACCOUNT_EMAIL,
  SKIP_ITEM_RE,
  repoRoot,
  readWatchConfig,
  extractUncheckedItems,
  collectPending,
  resolveFromEmail,
  resolveRecipient,
  buildEmail,
  runOwnerApprovalNudge,
};
