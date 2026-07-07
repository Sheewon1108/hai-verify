# Transla ↔ Hai-Ic (병행 제품화)

**Owner:** KARAM SHIN  
**Tracks:** Transla (LTL Tire) + Hai-Ic (AI integrity gate) — same owner, different buyers, shared 진정성

## Why link

| Transla risk | Hai-Ic response |
|--------------|-----------------|
| Broker fraud / vague loads | IC < 75% → no accept, ask clarifying |
| Fake ETA / status to shipper | OFF mode → evidence before update |
| Nexen/Woosung DD on lanes | DD patterns → blocked until data attached |
| Driver dispatch ambiguity | Questions first, not blind route commit |

## Use cases (productization vertical)

### 1. Load board gate
```
Broker offer → Hai-Ic analyze → OFF? → reject / clarify rate, pickup, BOL
```

### 2. Ops bot (central control)
```
"Trailer 7 delayed" → IC check → missing: location source, ETA basis → no auto-reply to customer
```

### 3. Tire OEM pitch support
```
Woosung proposal draft → Hai-Ic → ensure no unverified claims in outbound text
```

## API example (Transla context)

```json
POST /api/hai-ic/analyze
{ "input": "Accept broker load LA to Oakland 40 tires, rate TBD, shipper unknown" }
→ confidence low, sincereMode false, questions on rate + shipper + BOL
```

## Shared stack vision

Tesla Trailer + Satellite + Log + Phone + X  
**+ Hai-Ic** on every human/AI decision that affects shipper or OEM trust

## Status

- Hai-Ic buyer outreach: SENT (3 cos), follow-up ~2026-07-14
- Transla: Woosung proposal prep
- Integration spec: this doc → order for full spec when ready