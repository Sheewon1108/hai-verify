import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyApproval,
  APPROVAL_REMINDER_INTERVAL_MS,
  buildReminderEmail,
  markReminderSent,
  pendingImportantFiles,
  shouldSendReminder,
  type ApprovalWatchState,
  type WatchedOpenFile,
} from "./approval-reminder.ts";

const importantPending: WatchedOpenFile = {
  id: "hai-verify-principles",
  path: "docs/hai-verify-principles.md",
  title: "HAI Verify principles",
  important: true,
  approvedAt: null,
};

const notImportant: WatchedOpenFile = {
  id: "hai-verify-one-pager-ko",
  path: "docs/hai-verify-one-page-summary-ko.md",
  title: "HAI Verify 한 장 요약",
  important: false,
  approvedAt: null,
};

describe("pendingImportantFiles", () => {
  it("keeps only important files that KARAM has not approved", () => {
    const pending = pendingImportantFiles([
      importantPending,
      notImportant,
      { ...importantPending, id: "done", approvedAt: "2026-08-24T00:00:00.000Z" },
    ]);
    assert.deepEqual(
      pending.map((file) => file.id),
      ["hai-verify-principles"],
    );
  });
});

describe("shouldSendReminder", () => {
  const now = new Date("2026-08-24T03:00:00.000Z");

  it("does not send when the important file is already approved", () => {
    const result = shouldSendReminder({ pending: [], lastSentAt: null, now });
    assert.deepEqual(result, { send: false, reason: "none_pending" });
  });

  it("sends immediately when an important file is still open and unapproved", () => {
    const result = shouldSendReminder({
      pending: [importantPending],
      lastSentAt: null,
      now,
    });
    assert.deepEqual(result, { send: true, reason: "never_sent" });
  });

  it("waits a full hour before the next email", () => {
    const tooSoon = shouldSendReminder({
      pending: [importantPending],
      lastSentAt: "2026-08-24T02:10:00.000Z",
      now,
    });
    assert.deepEqual(tooSoon, { send: false, reason: "too_soon" });

    const due = shouldSendReminder({
      pending: [importantPending],
      lastSentAt: "2026-08-24T02:00:00.000Z",
      now,
    });
    assert.deepEqual(due, { send: true, reason: "interval_elapsed" });
    assert.equal(APPROVAL_REMINDER_INTERVAL_MS, 60 * 60 * 1000);
  });
});

describe("applyApproval", () => {
  it("records approval and clears the pending important queue", () => {
    const state: ApprovalWatchState = {
      files: [importantPending, notImportant],
      lastReminderSentAt: null,
    };
    const next = applyApproval(state, "hai-verify-principles", "2026-08-24T03:05:00.000Z");
    assert.equal(pendingImportantFiles(next.files).length, 0);
    assert.equal(next.files[0]?.approvedAt, "2026-08-24T03:05:00.000Z");
  });
});

describe("buildReminderEmail", () => {
  it("names the pending file without including file contents", () => {
    const email = buildReminderEmail({
      pending: [importantPending],
      approveUrl: "http://127.0.0.1:3000/approvals",
    });
    assert.match(email.subject, /미승인 중요 파일 1건/);
    assert.match(email.text, /docs\/hai-verify-principles\.md/);
    assert.match(email.text, /http:\/\/127\.0\.0\.1:3000\/approvals/);
    assert.equal(email.text.includes("Human-Heart"), false);
  });
});

describe("markReminderSent", () => {
  it("stores the last send time", () => {
    const next = markReminderSent(
      { files: [importantPending], lastReminderSentAt: null },
      "2026-08-24T03:00:00.000Z",
    );
    assert.equal(next.lastReminderSentAt, "2026-08-24T03:00:00.000Z");
  });
});
