// Hai_ic_verify_bot — Telegram long-polling bot, plain fetch only (no telegraf).
// BOT_TOKEN comes from process.env.BOT_TOKEN (never from a .env file in this folder).

const START_MESSAGE =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

const API_BASE = "https://api.telegram.org";

function apiUrl(token, method) {
  return `${API_BASE}/bot${token}/${method}`;
}

async function callTelegram(token, method, payload) {
  const res = await fetch(apiUrl(token, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.error_code} ${data.description}`);
  }
  return data.result;
}

function replyTextFor(text) {
  // Matches "/start" and "/start@Hai_ic_verify_bot" (with optional payload).
  if (/^\/start(@\w+)?(\s|$)/.test(text)) {
    return START_MESSAGE;
  }
  // TODO: hai-ic verification logic goes here later.
  return `Verification queued: ${text}`;
}

async function handleUpdate(token, update) {
  const message = update.message;
  if (!message || typeof message.text !== "string") return;
  await callTelegram(token, "sendMessage", {
    chat_id: message.chat.id,
    text: replyTextFor(message.text),
  });
}

async function poll(token) {
  let offset = 0;
  console.log("Hai_ic_verify_bot polling started");
  for (;;) {
    try {
      const updates = await callTelegram(token, "getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(token, update);
        } catch (err) {
          console.error("update handling failed:", err.message);
        }
      }
    } catch (err) {
      console.error("polling error, retrying in 5s:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

function main() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN is not set. Run with BOT_TOKEN=<token> npm start");
    process.exit(1);
  }
  poll(token);
}

if (require.main === module) {
  main();
}

module.exports = { handleUpdate, replyTextFor, START_MESSAGE };
