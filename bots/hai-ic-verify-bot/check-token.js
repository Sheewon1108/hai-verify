// Verifies BOT_TOKEN works, without ever printing the token itself.
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("NOT READY: BOT_TOKEN environment variable is missing.");
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
