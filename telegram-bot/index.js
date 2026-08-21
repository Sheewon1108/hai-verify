const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required from process.env.BOT_TOKEN");
  process.exit(1);
}

const API_ROOT = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(
  /\/$/,
  "",
);
const API = `${API_ROOT}/bot${BOT_TOKEN}`;

const START_TEXT =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

function isStartCommand(text) {
  if (!text) return false;
  const command = String(text).split(/\s+/, 1)[0];
  return command === "/start" || command.startsWith("/start@");
}

function replyForText(text) {
  if (isStartCommand(text)) return START_TEXT;
  return `Verification queued: ${text ?? ""}`;
}

async function telegramCall(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const description = data.description || res.statusText || String(res.status);
    throw new Error(`${method} failed: ${description}`);
  }
  return data.result;
}

async function sendMessage(chatId, text) {
  const payload = text.length > 4096 ? text.slice(0, 4096) : text;
  return telegramCall("sendMessage", { chat_id: chatId, text: payload });
}

async function handleMessage(message) {
  if (!message?.chat?.id) return;
  const text = message.text ?? message.caption ?? "";
  await sendMessage(message.chat.id, replyForText(text));
}

async function poll() {
  let offset = 0;
  console.log("Hai_ic_verify_bot polling");
  while (true) {
    try {
      const updates = await telegramCall("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) {
          await handleMessage(update.message);
        }
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

poll();
