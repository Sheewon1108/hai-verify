# HAI-IC API

**Product name:** HAI-IC only  
**Module map:** `hai-ic/MODULE.md` · **Public types:** `hai-ic/src/public/`

## POST `/api/hai-ic/analyze`

**Request**

```json
{
  "input": "Transla 물류로 Woosung Group과 다시 거래하고 싶어. 어떻게 접근하는 게 좋을까?"
}
```

**Response**

```json
{
  "ok": true,
  "product": "hai-ic",
  "version": "1.0.0-mvp",
  "confidence": 70,
  "sincereMode": false,
  "mode": "진심 모드 OFF",
  "breakdown": {
    "core": "...",
    "understood": "...",
    "missing": "...",
    "risk": "..."
  },
  "questions": ["...", "...", "..."],
  "response": "...",
  "analyzedAt": "2026-07-05T00:00:00.000Z"
}
```

## GET `/api/hai-ic/health`

Returns product id, version, status.

## Local

- UI: `http://localhost:3000`
- Dev server: PM2 `hai-verify`