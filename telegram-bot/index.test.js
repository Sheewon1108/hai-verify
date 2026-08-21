"use strict";

const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  START_REPLY,
  isStartCommand,
  buildReply,
  handleUpdate,
  getUpdates,
} = require("./index.js");

test("/start replies with the Hai System Active copy", () => {
  assert.equal(
    buildReply("/start"),
    "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order",
  );
  assert.equal(buildReply("/start"), START_REPLY);
});

test("/start@Hai_ic_verify_bot and /start with payload still use the start copy", () => {
  assert.equal(isStartCommand("/start@Hai_ic_verify_bot"), true);
  assert.equal(buildReply("/start@Hai_ic_verify_bot"), START_REPLY);
  assert.equal(buildReply("/start payload"), START_REPLY);
});

test("non-start messages are queued with the user text", () => {
  assert.equal(
    buildReply("Check this AI paragraph"),
    "Verification queued: Check this AI paragraph",
  );
  assert.equal(isStartCommand("hello /start"), false);
});

test("missing BOT_TOKEN exits before polling", () => {
  const env = { ...process.env };
  delete env.BOT_TOKEN;
  const result = spawnSync(process.execPath, [path.join(__dirname, "index.js")], {
    env,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /BOT_TOKEN is required/);
});

test("handleUpdate sends start copy via fetch sendMessage", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    };
  };
  try {
    const replied = await handleUpdate("test-token", {
      update_id: 1,
      message: { chat: { id: 42 }, text: "/start" },
    });
    assert.equal(replied, START_REPLY);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /https:\/\/api\.telegram\.org\/bottest-token\/sendMessage$/);
    assert.equal(calls[0].options.method, "POST");
    assert.equal(
      JSON.parse(calls[0].options.body).text,
      START_REPLY,
    );
    assert.equal(JSON.parse(calls[0].options.body).chat_id, 42);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("handleUpdate queues non-start text via fetch sendMessage", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      json: async () => ({ ok: true, result: { message_id: 2 } }),
    };
  };
  try {
    const replied = await handleUpdate("test-token", {
      update_id: 2,
      message: { chat: { id: 7 }, text: "model output here" },
    });
    assert.equal(replied, "Verification queued: model output here");
    assert.equal(JSON.parse(calls[0].options.body).text, "Verification queued: model output here");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getUpdates long-polls Telegram with fetch only", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    assert.match(href, /^https:\/\/api\.telegram\.org\/bottest-token\/getUpdates\?/);
    const parsed = new URL(href);
    assert.equal(parsed.searchParams.get("offset"), "10");
    assert.equal(parsed.searchParams.get("timeout"), "30");
    return {
      json: async () => ({ ok: true, result: [{ update_id: 10 }] }),
    };
  };
  try {
    const updates = await getUpdates("test-token", 10);
    assert.deepEqual(updates, [{ update_id: 10 }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
