# Hai_ic_verify_bot

의존성 0개, Node 내장 `fetch`만 쓰는 텔레그램 검증 접수 봇.

## 토큰 넣는 곳

- **내 PC (권장)**: `npm run setup` 한 번 → 입력창에 토큰 붙여넣기 (화면 비표시) → `~/.hai-ic/bot-token`에 본인 계정 전용 권한(600)으로 저장됨
- 클라우드 에이전트: Cursor 대시보드 → Cloud Agents → Secrets → 이름 `BOT_TOKEN`
- 임시 1회용: 터미널에서 `BOT_TOKEN=토큰 npm start` (Windows: `$env:BOT_TOKEN="토큰"; npm start`)

토큰은 채팅·저장소 파일·git 어디에도 넣지 않는다. 이 코드도 토큰을 절대 로그에 찍지 않는다.

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run setup` | 토큰 1회 입력 (숨김 입력창, 로컬 저장) |
| `npm run check` | 토큰이 살아있는지 확인 (`READY: ... @봇이름` 이 나오면 성공) |
| `npm start` | 봇 가동 (long polling) |

## 동작

- `/start` → Hai System Active 안내 문구 + hai-ic.com/order 링크
- 그 외 메시지 → `Verification queued: [원문]` (hai-ic 검증 로직은 추후 연결, `index.js`의 TODO 지점)
