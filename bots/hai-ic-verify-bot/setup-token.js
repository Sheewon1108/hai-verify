// One-time friendly token setup: hidden input, saved to an owner-only local file.
// The token is never echoed to the screen, never logged, never written to the repo.
const readline = require("node:readline");
const fs = require("node:fs");
const path = require("node:path");
const { TOKEN_FILE } = require("./token");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
// Suppress echo so the pasted token never appears on screen.
rl._writeToOutput = () => {};

process.stdout.write("BOT_TOKEN 붙여넣고 Enter (화면에 표시되지 않음): ");
rl.question("", (token) => {
  rl.close();
  process.stdout.write("\n");
  token = token.trim();
  if (!/^\d+:[\w-]{30,}$/.test(token)) {
    console.error("토큰 형식이 아닌 것 같습니다. 저장하지 않았습니다. (BotFather가 준 1234567890:AAxx... 형태여야 함)");
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
  fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  console.log(`저장 완료: ${TOKEN_FILE} (본인 계정만 읽기 가능)`);
  console.log("다음 단계: npm run check 로 토큰 확인 → npm start 로 봇 가동");
});
