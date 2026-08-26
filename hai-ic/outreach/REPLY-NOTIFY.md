# 회신 오면 알려주는 방법 (Grok)

가람이 메일 내용을 다 읽을 필요 없음.  
**감시하는 3곳에서 회신이 오면** Grok이 한국어 3~4줄로 풀어서 가람 메일로 알림.

감시 주소 (2026-08-26 팔로업과 같음):

- Growth Loops — gunendu@growthloopstechnology.com
- Closeloop — sales@closeloop.com
- instinctools — contact@instinctools.com

## 가람이 할 일 (한 번)

Gmail에서 위 3주소 **자동 전달**을 켠다.

1. Gmail → 설정 → 필터  
2. From: 위 주소 하나 (필터 3개)  
3. 동작: 전달 또는, 회신 오면 이 방에 `--from` 한 줄 붙여 넣기

비밀번호는 채팅에 넣지 말 것. vault의 `XAI_API_KEY` / `RESEND_API_KEY`만 쓰면 됨.

## 회신 왔을 때 (이 방)

```
실행: node ./scripts/notify-outreach-reply.mjs --from "sales@closeloop.com" --subject "Re: HAI-IC" --body "붙여넣은 본문"
```

Grok이 짧은 한국어로 바꾸고, 가능하면 `jay.transtar.inc@gmail.com`으로 `[HAI] 회신 옴 — 회사명` 메일을 보냄.

키가 없으면 Grok 없이 같은 4줄 안내만 출력함. 메일은 안 감.

## 자동 경로 (배포 후)

`POST /api/outreach/reply-notify`  
Body: `{ "from", "subject", "text" }`  
Auth: 기존 HAI API 키.

Gmail이 이 URL로 직접 못 감. 전달이나 스크립트가 중간이다.
