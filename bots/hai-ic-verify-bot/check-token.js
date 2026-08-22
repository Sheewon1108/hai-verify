// Verifies BOT_TOKEN works, without ever printing the token itself.
const { getToken } = require("./token");

const BOT_TOKEN = getToken();
if (!BOT_TOKEN) {
  console.error("NOT READY: no token. Run `npm run setup` once, or set the BOT_TOKEN environment variable.");
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
  .then((res) => res.json())
  .then((data) => {
    if (data.ok) {
      console.log(`READY: token is valid. Bot = @${data.result.username}`);
    } else {
      console.error(`NOT READY: Telegram rejected the token (${data.description}).`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(`NOT READY: network error (${err.message}).`);
    process.exit(1);
  });
