const { getToken } = require("./token");

const BOT_TOKEN = getToken();
if (!BOT_TOKEN) {
  console.error("BOT_TOKEN not found. Run `npm run setup` once, or set the BOT_TOKEN environment variable.");
  process.exit(1);
}

// Never log this URL or the token itself.
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const START_MESSAGE =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

async function sendMessage(chatId, text) {
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error(`sendMessage failed: ${res.status} ${await res.text()}`);
  }
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  const kind = text === "/start" || text.startsWith("/start ") ? "start" : "queued";
  if (kind === "start") {
    await sendMessage(chatId, START_MESSAGE);
  } else {
    // TODO: hai-ic verification logic
    await sendMessage(chatId, `Verification queued: ${text}`);
  }
  console.log(`update ${update.update_id}: replied (${kind})`);
}

async function poll() {
  let offset = 0;
  console.log("Hai_ic_verify_bot polling started.");
  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`, {
        signal: AbortSignal.timeout(40_000),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("getUpdates error:", data.description);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (err) {
      console.error("Polling error:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

poll();
