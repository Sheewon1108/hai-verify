# 회신 읽기 (읽기 전용)

이 방은 Gmail을 **보내지 않는다**.  
가람이 팔로업을 보낸 뒤, 이 방은 **회신이 왔는지 읽기만** 한다.  
읽기가 안 되면 빈 메일함이 아니다. **시스템 오류**다.

감시 주소 (2026-08-26 팔로업과 같음):

- Growth Loops — gunendu@growthloopstechnology.com
- Closeloop — sales@closeloop.com
- instinctools — contact@instinctools.com

그다음: 회신 옴 → Grok 짧은 한국어 알림 → `DEMO-30-READY.md` 보고 30분.

## 가람이 한 번만 (읽기 허용)

비밀번호 / 토큰 값을 채팅에 넣지 말 것.

1. Google Cloud에서 OAuth 클라이언트 (웹, redirect `http://127.0.0.1:8765/oauth2callback`)
2. vault 이름만 넣기: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`
3. 가람 PC에서:

```
실행: npm run outreach:gmail-readonly-login
```

4. 브라우저가 열리면 **읽기만** 허용 (`gmail.readonly`). 보내기 권한 없음.
5. 끝나면 `.local/gmail-readonly.json`에 refresh가 생긴다. vault 이름 `GMAIL_REFRESH_TOKEN`에만 넣고, 값은 채팅에 붙이지 말 것.

허용이 없으면 Google이 메일함을 안 연다. 그건 보내기 거절이 아니라 **읽기 허용이 없는 상태**다.

## 회신 확인

```
실행: npm run outreach:gmail-readonly-poll
```

- 허용 없음 → `gmail_readonly_grant_missing` (exit 2). 빈 수신함으로 말하지 말 것.
- 회신 있음 → 기존 알림: Grok 한국어 + 가능하면 `[HAI] 회신 옴 — 회사명`
- 본문은 snippet만. 보내기 / 삭제 / 수정 API 없음.

수동 한 줄(필터 전달이 있을 때):

```
실행: node ./scripts/notify-outreach-reply.mjs --from "sales@closeloop.com" --subject "Re: HAI-IC" --body "붙여넣은 본문"
```

## 자동 경로

- 30분마다: `.github/workflows/gmail-readonly-outreach-poll.yml`
- 허용 시크릿이 없으면 notice로 끝나고 실패로 위장하지 않음
- `GET|POST /api/outreach/gmail-readonly-poll` — Auth 필요. POST는 허용 없으면 503.

키 이름만: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `XAI_API_KEY`, `RESEND_API_KEY`.
