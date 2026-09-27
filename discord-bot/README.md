# HAI Verify — Discord Bot (Step 2+)

Discord Developer Portal 설정(Step 1)이 끝났다면, 여기서 **슬래시 명령 → `/api/verify`** 연동을 켭니다.

## 명령

| Command | 설명 |
|---------|------|
| `/hai-verify text:...` | AI 텍스트 검증 → Trust Index 점수만 답장 |
| `/hai-verify-help` | 사용법 (본인만 보임) |

봇은 결제 링크를 보내지 않습니다. Stripe Checkout 또는 `/order` 결제 흐름과 연결하지 않습니다.

## Setup

```bash
# 1) HAI Verify API (루트)
cd ..
npm run dev:hai-ic

# 2) Discord bot
cd discord-bot
cp .env.example .env
# .env 에 DISCORD_TOKEN, DISCORD_CLIENT_ID, (선택) DISCORD_GUILD_ID

npm install
npm run register   # 슬래시 명령 등록 (최초 1회 + 명령 변경 시)
npm start          # 봇 실행
```

## .env

| Variable | Where |
|----------|--------|
| `DISCORD_TOKEN` | Developer Portal → Bot → Reset Token |
| `DISCORD_CLIENT_ID` | Application → General → Application ID |
| `DISCORD_GUILD_ID` | 테스트 서버 ID (있으면 명령 즉시 반영) |
| `HAI_VERIFY_API_URL` | default `http://localhost:3001` |
| `HAI_VERIFY_WEB_URL` | optional help link base URL, default same as API URL |

## Discord Portal 체크 (Step 1 recap)

1. Bot → **Message Content Intent** 불필요 (슬래시만 사용)
2. OAuth2 → URL Generator → `bot` + `applications.commands`
3. 생성 URL로 **본인 서버에 초대**

## 아키텍처

```
Discord /hai-verify
    → discord-bot/bot.mjs
    → POST {HAI_VERIFY_API_URL}/api/verify
    → score-only reply (Trust Index)
```

- 엔진 코드는 **루트 `app/lib/verification.ts`** — 봇은 API만 호출
- `/verify` 웹 페이지는 도움말 링크로만 사용
- `/order`, Stripe Checkout, payment links are intentionally not used by the bot

## Production

- `HAI_VERIFY_API_URL` → 배포된 HAI Verify URL
- 봇을 Railway/Fly/VM 등에 `npm start`로 상시 실행
- `DISCORD_GUILD_ID` 없이 `register` → 글로벌 명령 (전파 최대 ~1h)
