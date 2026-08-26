import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  extractEmail,
  fallbackKoreanAlert,
  matchWatchedReply,
} from "./lib/outreach-reply-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const watch = JSON.parse(readFileSync(path.join(ROOT, "hai-ic", "outreach", "reply-watch.json"), "utf8"));

test("extracts bare and angled emails", () => {
  assert.equal(extractEmail("sales@closeloop.com"), "sales@closeloop.com");
  assert.equal(extractEmail("Closeloop <sales@closeloop.com>"), "sales@closeloop.com");
});

test("matches the three follow-up inboxes only", () => {
  assert.equal(matchWatchedReply("gunendu@growthloopstechnology.com", watch.contacts)?.id, "growth-loops");
  assert.equal(matchWatchedReply("Closeloop Sales <sales@closeloop.com>", watch.contacts)?.id, "closeloop");
  assert.equal(matchWatchedReply("contact@instinctools.com", watch.contacts)?.id, "instinctools");
  assert.equal(matchWatchedReply("random@example.com", watch.contacts), null);
});

test("fallback Korean alert is short and has a next step", () => {
  const text = fallbackKoreanAlert(watch.contacts[0], "Re: HAI-IC");
  assert.match(text, /회신 옴: Growth Loops/);
  assert.match(text, /DEMO-30-READY/);
  assert.doesNotMatch(text, /sk_live_|XAI_API_KEY|Bearer /);
  assert.ok(text.split("\n").length <= 5);
});
