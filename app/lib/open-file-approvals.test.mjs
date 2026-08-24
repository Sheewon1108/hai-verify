import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildUnapprovedFileReminderEmail,
  listUnapprovedImportant,
  resolveReminderRecipient,
} from "./open-file-approval-core.mjs";

const sample = {
  recipientEmail: "owner@example.com",
  openFiles: [
    {
      id: "important-open",
      path: "hai-ic/WR-CLOSE-5050.md",
      title: "Owner close",
      important: true,
      approved: false,
    },
    {
      id: "not-important",
      path: "docs/hai-verify-principles.md",
      title: "Principles",
      important: false,
      approved: false,
    },
    {
      id: "already-approved",
      path: "README.md",
      title: "Readme",
      important: true,
      approved: true,
    },
  ],
};

describe("listUnapprovedImportant", () => {
  it("returns only important files that are not approved", () => {
    const pending = listUnapprovedImportant(sample.openFiles);
    assert.deepEqual(
      pending.map((file) => file.id),
      ["important-open"],
    );
  });

  it("returns empty when the important file is approved", () => {
    const pending = listUnapprovedImportant([
      {
        id: "done",
        path: "hai-ic/WR-CLOSE-5050.md",
        title: "Owner close",
        important: true,
        approved: true,
      },
      {
        id: "other",
        path: "docs/hai-verify-principles.md",
        title: "Principles",
        important: false,
        approved: false,
      },
    ]);
    assert.equal(pending.length, 0);
  });
});

describe("resolveReminderRecipient", () => {
  it("uses catalog email when env is empty", () => {
    assert.equal(resolveReminderRecipient(sample, ""), "owner@example.com");
  });

  it("prefers the env recipient when set", () => {
    assert.equal(
      resolveReminderRecipient(sample, "  alert@example.com  "),
      "alert@example.com",
    );
  });
});

describe("buildUnapprovedFileReminderEmail", () => {
  it("names the pending file in subject and body", () => {
    const pending = listUnapprovedImportant(sample.openFiles);
    const email = buildUnapprovedFileReminderEmail(pending, "https://hai-ic.com");
    assert.match(email.subject, /Owner close/);
    assert.match(email.text, /hai-ic\/WR-CLOSE-5050\.md/);
    assert.match(email.html, /Owner close/);
    assert.match(email.html, /https:\/\/hai-ic.com\/approvals/);
  });
});
