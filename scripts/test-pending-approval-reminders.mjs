import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildReminderEmail,
  listUnapprovedImportantOpen,
  shouldSendHourlyReminder,
} from "./lib/pending-approval-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const watch = JSON.parse(readFileSync(path.join(ROOT, "hai-ic", "pending-approvals.json"), "utf8"));

const sample = (overrides) => ({
  id: "x",
  path: "docs/x.md",
  title: "X",
  important: true,
  open: true,
  approved: false,
  note: "n",
  ...overrides,
});

test("open important unapproved files trigger a reminder", () => {
  const files = [sample({ id: "a" }), sample({ id: "b", path: "docs/b.md", important: false })];
  const pending = listUnapprovedImportantOpen(files);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, "a");
  assert.equal(shouldSendHourlyReminder(files), true);
});

test("approved important open file does not trigger", () => {
  const files = [sample({ approved: true })];
  assert.deepEqual(listUnapprovedImportantOpen(files), []);
  assert.equal(shouldSendHourlyReminder(files), false);
});

test("closed file is ignored even if important and unapproved", () => {
  const files = [sample({ open: false })];
  assert.deepEqual(listUnapprovedImportantOpen(files), []);
});

test("unimportant open unapproved file is ignored", () => {
  const files = [sample({ important: false })];
  assert.deepEqual(listUnapprovedImportantOpen(files), []);
});

test("Owner-stamped watch list no longer triggers a reminder", () => {
  assert.equal(watch.files.length, 2, "watch list is the two currently open files");
  assert.ok(watch.files.every((file) => file.open === true && file.important === true && file.approved === true));
  assert.deepEqual(
    watch.files.map((file) => file.path),
    ["hai-ic/WR-CLOSE-5050.md", "hai-ic/money-path/LIVE-300-LOG.md"],
  );
  assert.deepEqual(listUnapprovedImportantOpen(watch.files), []);
  assert.equal(shouldSendHourlyReminder(watch.files), false);
});

test("reminder email names pending files and avoids leaking keys", () => {
  const pending = [
    sample({ path: "hai-ic/WR-CLOSE-5050.md", title: "50/50 close package" }),
    sample({ id: "y", path: "hai-ic/money-path/LIVE-300-LOG.md", title: "Live $300 money path" }),
  ];
  const email = buildReminderEmail(pending, "2026-08-24T02:00:00.000Z");
  assert.match(email.subject, /미승인 중요 파일 2건/);
  assert.match(email.html, /WR-CLOSE-5050\.md/);
  assert.match(email.html, /LIVE-300-LOG\.md/);
  assert.match(email.text, /pending-approvals\.json/);
  assert.doesNotMatch(email.html, /sk_live_|RESEND_API_KEY|Bearer /);
  assert.doesNotMatch(email.text, /sk_live_|RESEND_API_KEY|Bearer /);
});

test("empty watch list is quiet", () => {
  assert.equal(shouldSendHourlyReminder([]), false);
});
