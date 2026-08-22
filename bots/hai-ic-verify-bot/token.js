// Resolves BOT_TOKEN: environment variable first, then the local vault file
// written by `npm run setup` (~/.hai-ic/bot-token, owner-only permissions).
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const TOKEN_FILE = path.join(os.homedir(), ".hai-ic", "bot-token");

function getToken() {
  if (process.env.BOT_TOKEN) return process.env.BOT_TOKEN.trim();
  try {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  } catch {
    return null;
  }
}

module.exports = { getToken, TOKEN_FILE };
