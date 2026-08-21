"use strict";

const START_REPLY =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

function isStartCommand(text) {
  const command = String(text).trim().split(/\s+/, 1)[0];
  return command === "/start" || command.startsWith("/start@");
}

function buildReply(text) {
  if (isStartCommand(text)) return START_REPLY;
  return `Verification queued: ${text}`;
}

function requireBotToken() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN is required. Set process.env.BOT_TOKEN (do not put it in a .env file).");
    process.exit(1);
  }
  return token;
}

function telegramApiBase(token) {
  return `https://api.telegram.org/bot${token}`;
}

async function telegramCall(token, method, body) {
  const res = await fetch(`${telegramApiBase(token)}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `${method} failed`);
  }
  return data;
}

async function handleUpdate(token, update) {
  const message = update && update.message;
  if (!message || typeof message.text !== "string") return null;
  const text = buildReply(message.text);
  await telegramCall(token, "sendMessage", {
    chat_id: message.chat.id,
    text,
  });
  return text;
}

async function getUpdates(token, offset) {
  const url = new URL(`${telegramApiBase(token)}/getUpdates`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("timeout", "30");
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "getUpdates failed");
  }
  return data.result;
}

async function pollLoop(token) {
  console.log("Hai_ic_verify_bot is polling Telegram.");
  let offset = 0;
  for (;;) {
    try {
      const updates = await getUpdates(token, offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(token, update);
      }
    } catch (err) {
      console.error("poll error:", err && err.message ? err.message : err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

function main() {
  const token = requireBotToken();
  return pollLoop(token);
}

if (require.main === module) {
  main();
}

module.exports = {
  START_REPLY,
  isStartCommand,
  buildReply,
  requireBotToken,
  telegramApiBase,
  telegramCall,
  handleUpdate,
  getUpdates,
  main,
};
