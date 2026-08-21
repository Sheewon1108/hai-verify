# Hai_ic_verify_bot

의존성 0개, Node 내장 `fetch`만 쓰는 텔레그램 검증 접수 봇.

## 토큰 넣는 곳 (딱 한 곳)

- 클라우드 에이전트: Cursor 대시보드 → Cloud Agents → Secrets → 이름 `BOT_TOKEN`
- 내 PC: 터미널에서 `BOT_TOKEN=토큰 npm start` (Windows: `$env:BOT_TOKEN="토큰"; npm start`)

토큰은 채팅·파일·git 어디에도 넣지 않는다. 이 코드도 토큰을 절대 로그에 찍지 않는다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run check` | 토큰이 살아있는지 확인 (`READY: ... @봇이름` 이 나오면 성공) |
| `npm start` | 봇 가동 (long polling) |

## 동작

- `/start` → Hai System Active 안내 문구 + hai-ic.com/order 링크
- 그 외 메시지 → `Verification queued: [원문]` (hai-ic 검증 로직은 추후 연결, `index.js`의 TODO 지점)
