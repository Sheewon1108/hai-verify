import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  START_MESSAGE,
  handleUpdate,
  isStartCommand,
  replyTextFor,
  telegramFetch,
} from "./index.js";

const indexPath = fileURLToPath(new URL("./index.js", import.meta.url));

test("/start exact and /start@bot use the Hai System Active copy", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start@Hai_ic_verify_bot"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(replyTextFor("/start"), START_MESSAGE);
  assert.equal(
    START_MESSAGE,
    "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order",
  );
});

test("non-start text is queued with the user message", () => {
  assert.equal(isStartCommand("/startup"), false);
  assert.equal(isStartCommand("hello"), false);
  assert.equal(
    replyTextFor("check this AI draft"),
    "Verification queued: check this AI draft",
  );
});

test("handleUpdate sends /start copy or queued reply", async () => {
  const sent = [];
  await handleUpdate(
    { message: { chat: { id: 42 }, text: "/start" } },
    async (payload) => sent.push(payload),
  );
  await handleUpdate(
    { message: { chat: { id: 42 }, text: "need verify" } },
    async (payload) => sent.push(payload),
  );
  await handleUpdate({ message: { chat: { id: 42 } } }, async (payload) =>
    sent.push(payload),
  );

  assert.deepEqual(sent, [
    { chat_id: 42, text: START_MESSAGE },
    { chat_id: 42, text: "Verification queued: need verify" },
  ]);
});

test("telegramFetch posts JSON to the Bot API without telegraf", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    };
  };

  try {
    await telegramFetch("TEST_TOKEN", "sendMessage", {
      chat_id: 7,
      text: START_MESSAGE,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://api.telegram.org/botTEST_TOKEN/sendMessage",
  );
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers["Content-Type"], "application/json");
  assert.equal(
    calls[0].options.body,
    JSON.stringify({ chat_id: 7, text: START_MESSAGE }),
  );
});

test("missing BOT_TOKEN exits without reading a .env file", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [indexPath], {
      env: { ...process.env, BOT_TOKEN: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stderr }));
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /BOT_TOKEN is required/);
  assert.match(result.stderr, /Do not use a \.env file/);
});
