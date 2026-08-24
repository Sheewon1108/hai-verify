const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  extractUncheckedItems,
  sliceSection,
  collectPending,
  resolveRecipient,
  buildEmail,
  runOwnerApprovalNudge,
  DEFAULT_ACCOUNT_EMAIL,
} = require("./owner-approval-nudge.cjs");

test("extractUncheckedItems keeps open boxes and skips family items", () => {
  const items = extractUncheckedItems(`
# Demo
- [x] already approved
- [ ] Stripe live keys on production
- [ ] Family money / personal schedule — Owner clock only
- [ ] Follow-up sends — Owner approves send
`);
  assert.deepEqual(items, [
    "Stripe live keys on production",
    "Follow-up sends — Owner approves send",
  ]);
});

test("sliceSection keeps Owner half and stops at the next heading", () => {
  const section = sliceSection(
    `
### Partner half (finish)
- [ ] Deploy when Owner asks

### Owner half (human only)
- [ ] Live keys + webhook URL on production

---
`,
    "Owner half",
  );
  assert.match(section, /Live keys/);
  assert.doesNotMatch(section, /Deploy when Owner asks/);
});

test("collectPending reads the two watched files and honors approved/paused", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "owner-nudge-"));
  fs.mkdirSync(path.join(root, "hai-ic"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "hai-ic", "WR-CLOSE-5050.md"),
    `### Partner half
- [ ] Deploy when Owner asks

### Owner half (human only)
- [ ] Live keys + webhook URL on production
- [ ] Family money / personal schedule — Owner clock only
`,
  );
  fs.writeFileSync(
    path.join(root, "hai-ic", "PRODUCTIZATION-STATUS.md"),
    "## P2 checklist\n- [ ] Public deploy (Cloudflare credentials)\n",
  );

  const pending = collectPending(
    {
      files: [
        { path: "hai-ic/WR-CLOSE-5050.md", label: "close", sectionMatch: "Owner half" },
        { path: "hai-ic/PRODUCTIZATION-STATUS.md", label: "p2", sectionMatch: "P2 checklist" },
      ],
    },
    root,
  );
  assert.equal(pending.length, 2);
  assert.deepEqual(pending[0].items, ["Live keys + webhook URL on production"]);
  assert.deepEqual(pending[1].items, ["Public deploy (Cloudflare credentials)"]);

  const approved = collectPending(
    {
      files: [
        { path: "hai-ic/WR-CLOSE-5050.md", approved: true },
        { path: "hai-ic/PRODUCTIZATION-STATUS.md", approved: true },
      ],
    },
    root,
  );
  assert.deepEqual(approved, []);

  const paused = collectPending(
    {
      paused: true,
      files: [{ path: "hai-ic/WR-CLOSE-5050.md" }],
    },
    root,
  );
  assert.deepEqual(paused, []);
});

test("resolveRecipient stays on Resend owner in sandbox", () => {
  const prev = process.env.RESEND_DOMAIN_VERIFIED;
  delete process.env.RESEND_DOMAIN_VERIFIED;
  try {
    assert.equal(
      resolveRecipient("jay.transtar.inc@gmail.com", "HAI Verify <onboarding@resend.dev>"),
      DEFAULT_ACCOUNT_EMAIL,
    );
    assert.equal(
      resolveRecipient(DEFAULT_ACCOUNT_EMAIL, "HAI Verify <onboarding@resend.dev>"),
      DEFAULT_ACCOUNT_EMAIL,
    );
  } finally {
    if (prev === undefined) delete process.env.RESEND_DOMAIN_VERIFIED;
    else process.env.RESEND_DOMAIN_VERIFIED = prev;
  }
});

test("buildEmail lists only pending files", () => {
  const email = buildEmail([
    {
      file: "hai-ic/WR-CLOSE-5050.md",
      label: "50/50 close",
      items: ["Live keys + webhook URL on production"],
    },
  ]);
  assert.match(email.subject, /미승인 중요 항목 1개/);
  assert.match(email.text, /hai-ic\/WR-CLOSE-5050.md/);
  assert.doesNotMatch(email.text, /Family money/);
});

test("runOwnerApprovalNudge dry-run does not call Resend", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "owner-nudge-"));
  fs.mkdirSync(path.join(root, "hai-ic"), { recursive: true });
  fs.writeFileSync(path.join(root, "hai-ic", "a.md"), "- [ ] Important open item\n");
  fs.writeFileSync(
    path.join(root, "hai-ic", "owner-approval-watch.json"),
    JSON.stringify({
      toEmail: "jay.transtar.inc@gmail.com",
      files: [{ path: "hai-ic/a.md", label: "open file" }],
    }),
  );

  let called = false;
  const result = await runOwnerApprovalNudge({
    root,
    dryRun: true,
    fetchImpl: async () => {
      called = true;
      return /** @type {Response} */ ({ ok: true, text: async () => "" });
    },
  });

  assert.equal(called, false);
  assert.equal(result.skipped, "dry_run");
  assert.equal(result.pending?.[0].file, "hai-ic/a.md");
});
