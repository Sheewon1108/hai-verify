import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  GMAIL_READONLY_GRANT_MISSING,
  GMAIL_READONLY_SCOPE,
  accessTokenLooksSet,
  buildWatchQuery,
  gmailGrantConfigured,
  gmailGrantFromEnv,
  gmailReadonlyScope,
  headerValue,
  unseenMessages,
} from "./lib/gmail-readonly-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const watch = JSON.parse(readFileSync(path.join(ROOT, "hai-ic", "outreach", "reply-watch.json"), "utf8"));

test("scope is gmail.readonly only", () => {
  assert.equal(gmailReadonlyScope(), GMAIL_READONLY_SCOPE);
  assert.match(gmailReadonlyScope(), /gmail\.readonly$/);
  assert.doesNotMatch(gmailReadonlyScope(), /gmail\.modify|gmail\.send|gmail\.compose|mail\.google\.com/);
});

test("watch query is the three buyers, after follow-up day, never Sent", () => {
  const query = buildWatchQuery(watch.contacts, watch.afterYmd);
  assert.match(query, /from:gunendu@growthloopstechnology\.com/);
  assert.match(query, /from:sales@closeloop\.com/);
  assert.match(query, /from:contact@instinctools\.com/);
  assert.match(query, /after:2026\/08\/26/);
  assert.match(query, /-in:sent/);
  assert.doesNotMatch(query, /gmail\.send|users\.messages\.send/);
});

test("headerValue reads From and Subject", () => {
  const headers = [
    { name: "From", value: "Closeloop Sales <sales@closeloop.com>" },
    { name: "Subject", value: "Re: HAI-IC" },
  ];
  assert.equal(headerValue(headers, "from"), "Closeloop Sales <sales@closeloop.com>");
  assert.equal(headerValue(headers, "SUBJECT"), "Re: HAI-IC");
  assert.equal(headerValue([], "From"), "");
});

test("unseenMessages skips already-seen ids", () => {
  const messages = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(
    unseenMessages(["a"], messages).map((m) => m.id),
    ["b", "c"],
  );
  assert.deepEqual(
    unseenMessages(new Set(["a", "c"]), messages).map((m) => m.id),
    ["b"],
  );
});

test("grant missing is a system error, not an empty inbox", () => {
  assert.equal(gmailGrantConfigured(gmailGrantFromEnv({})), false);
  assert.equal(
    gmailGrantConfigured({ clientId: "id", clientSecret: "secret", refreshToken: "" }),
    false,
  );
  assert.equal(
    gmailGrantConfigured({ clientId: "id", clientSecret: "secret", refreshToken: "token" }),
    true,
  );
  assert.equal(accessTokenLooksSet("short"), false);
  assert.equal(accessTokenLooksSet("x".repeat(24)), true);

  const cleanEnv = { ...process.env };
  delete cleanEnv.GMAIL_OAUTH_CLIENT_ID;
  delete cleanEnv.GMAIL_OAUTH_CLIENT_SECRET;
  delete cleanEnv.GMAIL_REFRESH_TOKEN;
  delete cleanEnv.GMAIL_CLIENT_ID;
  delete cleanEnv.GMAIL_CLIENT_SECRET;

  const ran = spawnSync(process.execPath, [path.join(ROOT, "scripts", "poll-gmail-outreach-replies.mjs"), "--dry-run"], {
    encoding: "utf8",
    env: cleanEnv,
  });
  assert.equal(ran.status, 2);
  assert.match(ran.stderr, new RegExp(GMAIL_READONLY_GRANT_MISSING));
  assert.doesNotMatch(ran.stdout + ran.stderr, /"scanned": 0/);
  assert.doesNotMatch(ran.stdout + ran.stderr, /empty inbox|회신 없음/);
});
