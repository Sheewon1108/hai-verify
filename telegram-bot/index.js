import { fileURLToPath } from "node:url";
import path from "node:path";

export const START_MESSAGE =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

const POLL_TIMEOUT_SEC = 30;
const RETRY_MS = 3000;

export function telegramApiUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export function isStartCommand(text) {
  const first = String(text ?? "")
    .trim()
    .split(/\s+/, 1)[0];
  return first === "/start" || first.startsWith("/start@");
}

export function buildReply(text) {
  if (isStartCommand(text)) return START_MESSAGE;
  return `Verification queued: ${text ?? ""}`;
}

export function requireBotToken(env = process.env) {
  const token = env.BOT_TOKEN;
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("BOT_TOKEN is required (set process.env.BOT_TOKEN; do not put it in a .env file)");
  }
  return token;
}

export async function sendMessage(token, chatId, text, fetchImpl = fetch) {
  const res = await fetchImpl(telegramApiUrl(token, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`sendMessage failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function getUpdates(token, offset, fetchImpl = fetch) {
  const url = new URL(telegramApiUrl(token, "getUpdates"));
  url.searchParams.set("timeout", String(POLL_TIMEOUT_SEC));
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));
  if (offset) url.searchParams.set("offset", String(offset));

  const res = await fetchImpl(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`getUpdates failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  if (!data.ok || !Array.isArray(data.result)) {
    throw new Error(`getUpdates rejected: ${JSON.stringify(data)}`);
  }
  return data.result;
}

export async function handleUpdate(token, update, fetchImpl = fetch) {
  const message = update?.message;
  if (!message?.chat?.id) return;

  const text = message.text ?? message.caption ?? "";
  await sendMessage(token, message.chat.id, buildReply(text), fetchImpl);
}

export async function pollOnce(token, offset, fetchImpl = fetch) {
  const updates = await getUpdates(token, offset, fetchImpl);
  let nextOffset = offset;

  for (const update of updates) {
    nextOffset = update.update_id + 1;
    try {
      await handleUpdate(token, update, fetchImpl);
    } catch (err) {
      console.error("Failed to handle update", update.update_id, err);
    }
  }

  return nextOffset;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runBot(env = process.env, fetchImpl = fetch) {
  const token = requireBotToken(env);
  let offset = 0;

  console.log("Hai_ic_verify_bot polling (token loaded from process.env.BOT_TOKEN)");

  while (true) {
    try {
      offset = await pollOnce(token, offset, fetchImpl);
    } catch (err) {
      console.error("getUpdates error, retrying", err);
      await sleep(RETRY_MS);
    }
  }
}

const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  runBot().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
