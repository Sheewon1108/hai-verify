import { pathToFileURL } from "node:url";

export const START_MESSAGE =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

export function isStartCommand(text) {
  const command = String(text ?? "")
    .trim()
    .split(/\s+/, 1)[0];
  return command === "/start" || command.startsWith("/start@");
}

export function replyTextFor(text) {
  if (isStartCommand(text)) return START_MESSAGE;
  return `Verification queued: ${text}`;
}

export async function handleUpdate(update, sendMessage) {
  const message = update?.message;
  if (!message?.chat?.id || typeof message.text !== "string") return;
  await sendMessage({
    chat_id: message.chat.id,
    text: replyTextFor(message.text),
  });
}

function telegramApiBase(token) {
  return `https://api.telegram.org/bot${token}`;
}

export async function telegramFetch(token, method, payload) {
  const res = await fetch(`${telegramApiBase(token)}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `${method} failed`);
  }
  return data;
}

export async function pollOnce(token, offset) {
  const res = await fetch(
    `${telegramApiBase(token)}/getUpdates?offset=${offset}&timeout=30`,
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "getUpdates failed");
  }
  return data.result ?? [];
}

async function run() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error(
      "BOT_TOKEN is required. Set process.env.BOT_TOKEN in the host environment. Do not use a .env file.",
    );
    process.exit(1);
  }

  let offset = 0;
  console.log("Hai_ic_verify_bot polling (Telegram Bot API via fetch)");

  while (true) {
    try {
      const updates = await pollOnce(token, offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update, (payload) =>
          telegramFetch(token, "sendMessage", payload),
        );
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  run();
}
