# Live $300 path — partner ops log

**Owner:** KARAM SHIN · **Partner hands:** this room  
**Entity:** XGOMA Inc · Statement descriptor seen: `XGOMA, INC.`

---

## Confirmed live payment (2026-08-11)

| Field | Value |
|-------|--------|
| Status | **Succeeded** |
| Amount | **$300.00 USD** |
| Product | HAI Verify Starter |
| Mode | **Live** (`cs_live_…`) |
| Channel | **Stripe Payment Link** (`plink_…`) |
| Customer email | jay.transtar.inc@gmail.com |
| When | Aug 11, 2026 ~4:50 AM (local stamp from Dashboard) |
| Funds available | ~Aug 13 (per Stripe) |
| Fee / net | Pending at capture time |
| Risk | Normal · CVC/ZIP passed |

IDs (ops ref only — not secrets):  
Payment `pi_3U3EC22eXXOjhg9L1dzLEmDK` · Charge `ch_3U3EC22eXXOjhg9L1cQ46T3v`

---

## Partner actions taken

| Action | Status |
|--------|--------|
| Record live $300 success | **This file** |
| Wire webhook → Resend API key email (`deliverApiKeyByEmail`) | **Deployed** |
| Note: prior webhook generated key but **did not email** (TODO) | Fixed |
| `/order` → try **live** `/api/stripe/checkout` first (payment mode), mock fallback | **Code** |
| Checkout mode | **payment** (one-time), not subscription |
| Follow-up body | `hai-ic/outreach/FOLLOWUP-300-READY.txt` — **Owner sent 2026-08-26** |
| Receipt email from Stripe | Owner can send from Dashboard if needed |

---

## Partner recheck (API, no Dashboard click)

| Item | Status |
|------|--------|
| Webhook endpoint | **enabled** → `https://hai-ic.com/api/stripe/webhook` |
| Event | **checkout.session.completed** present |
| Custom HAI API key header | **not used** |
| Balance | available **$0** · pending **$300** (normal after today success) |
| Payouts | working · recent **paid** $300 / $300 / $600 |
| Bank | connected (prior report …q1zN) |

## What Owner still owns

- **3** Follow-up emails — **sent 2026-08-26** (Growth Loops, Closeloop, instinctools; Owner Gmail, separate sends)  
- **4** Optional `/order` live smoke (Owner)  
- Stripe receipt send if wanted  
- Watch pending $300 → available → bank (schedule automatic)  

---

## Operating rule (50/50)

- **Live money path ops after Garam direction → Partner finishes** (log, wire delivery, deploy when asked).  
- **Owner** keeps bank, legal, vault keys, final customer relationship.

*Partner log. No API secrets stored here.*
