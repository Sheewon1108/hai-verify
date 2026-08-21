import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const START_TEXT =
  "Hai System Active. 24/7 AI monitoring enabled. Paste the AI content you need verified. We don't do free manual reviews. All logs are tracked. Order -> hai-ic.com/order";

const sent = [];
let updateId = 1;
const pendingUpdates = [
  {
    update_id: updateId++,
    message: { message_id: 1, chat: { id: 42 }, text: "/start" },
  },
  {
    update_id: updateId++,
    message: {
      message_id: 2,
      chat: { id: 42 },
      text: "/start@Hai_ic_verify_bot",
    },
  },
  {
    update_id: updateId++,
    message: {
      message_id: 3,
      chat: { id: 42 },
      text: "this looks like AI copy",
    },
  },
];

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const url = new URL(req.url, "http://127.0.0.1");
    const method = url.pathname.split("/").pop();
    if (method === "getUpdates") {
      const updates = pendingUpdates.splice(0, pendingUpdates.length);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, result: updates }));
      return;
    }
    if (method === "sendMessage") {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      sent.push(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          result: { message_id: sent.length, chat: { id: body.chat_id } },
        }),
      );
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, description: "unknown method" }));
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const bot = spawn(process.execPath, [path.join(__dirname, "index.js")], {
  env: {
    ...process.env,
    BOT_TOKEN: "test-token-not-real",
    TELEGRAM_API_BASE: `http://127.0.0.1:${port}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

const deadline = Date.now() + 8000;
while (sent.length < 3 && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

bot.kill("SIGTERM");
server.close();

const expected = [
  START_TEXT,
  START_TEXT,
  "Verification queued: this looks like AI copy",
];

if (sent.length !== 3) {
  console.error(`expected 3 replies, got ${sent.length}`);
  process.exit(1);
}

for (let i = 0; i < expected.length; i += 1) {
  if (sent[i].text !== expected[i]) {
    console.error(`reply ${i} mismatch`);
    console.error("got:", sent[i].text);
    console.error("expected:", expected[i]);
    process.exit(1);
  }
}

console.log("telegram-bot local replies ok");
