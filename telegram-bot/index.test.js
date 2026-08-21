import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import {
  START_MESSAGE,
  buildReply,
  handleUpdate,
  isStartCommand,
  pollOnce,
  requireBotToken,
  sendMessage,
  telegramApiUrl,
} from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("isStartCommand accepts /start and /start@bot", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start@Hai_ic_verify_bot"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("  /start  "), true);
  assert.equal(isStartCommand("/help"), false);
  assert.equal(isStartCommand("please /start now"), false);
});

test("buildReply sends the Hai System Active copy for /start", () => {
  assert.equal(buildReply("/start"), START_MESSAGE);
  assert.equal(
    START_MESSAGE,
    "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order",
  );
});

test("buildReply queues non-start text exactly as sent", () => {
  assert.equal(
    buildReply("Check this AI draft"),
    "Verification queued: Check this AI draft",
  );
  assert.equal(buildReply(""), "Verification queued: ");
});

test("requireBotToken reads process.env.BOT_TOKEN and rejects empty values", () => {
  assert.equal(requireBotToken({ BOT_TOKEN: "123:abc" }), "123:abc");
  assert.throws(() => requireBotToken({}), /BOT_TOKEN is required/);
  assert.throws(() => requireBotToken({ BOT_TOKEN: "   " }), /BOT_TOKEN is required/);
});

test("telegramApiUrl never embeds a telegraf client path", () => {
  assert.equal(
    telegramApiUrl("123:abc", "sendMessage"),
    "https://api.telegram.org/bot123:abc/sendMessage",
  );
});

test("sendMessage posts JSON via fetch only", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    };
  };

  await sendMessage("123:abc", 42, START_MESSAGE, fetchImpl);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.telegram.org/bot123:abc/sendMessage");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    chat_id: 42,
    text: START_MESSAGE,
  });
});

test("handleUpdate replies /start vs queued text", async () => {
  const sent = [];
  const fetchImpl = async (url, options) => {
    sent.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true }) };
  };

  await handleUpdate(
    "123:abc",
    { message: { chat: { id: 7 }, text: "/start" } },
    fetchImpl,
  );
  await handleUpdate(
    "123:abc",
    { message: { chat: { id: 7 }, text: "model output" } },
    fetchImpl,
  );

  assert.equal(sent[0].text, START_MESSAGE);
  assert.equal(sent[1].text, "Verification queued: model output");
});

test("pollOnce advances offset and answers each update", async () => {
  const sent = [];
  const fetchImpl = async (url, options) => {
    if (String(url).includes("getUpdates")) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          result: [
            { update_id: 10, message: { chat: { id: 1 }, text: "/start" } },
            { update_id: 11, message: { chat: { id: 1 }, text: "hello" } },
          ],
        }),
      };
    }
    sent.push(JSON.parse(options.body).text);
    return { ok: true, json: async () => ({ ok: true }) };
  };

  const nextOffset = await pollOnce("123:abc", 0, fetchImpl);
  assert.equal(nextOffset, 12);
  assert.deepEqual(sent, [START_MESSAGE, "Verification queued: hello"]);
});

test("starting without BOT_TOKEN exits and does not load a .env file", async () => {
  const child = spawn(process.execPath, [path.join(__dirname, "index.js")], {
    cwd: __dirname,
    env: { PATH: process.env.PATH },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stderr = [];
  child.stderr.on("data", (chunk) => stderr.push(chunk));

  const code = await new Promise((resolve) => child.on("close", resolve));
  const errText = Buffer.concat(stderr).toString();

  assert.equal(code, 1);
  assert.match(errText, /BOT_TOKEN is required/);
  assert.doesNotMatch(errText, /\.env/);
});
