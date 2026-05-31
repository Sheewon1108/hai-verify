# HAI Verify — Manual Delivery Flow (Money-Ready)

**No Stripe · No external APIs · Uses working `/verify` MVP today**

---

## Flow (one page)

```
Customer pays manually
        ↓
Customer sends AI output / log (email or intake form)
        ↓
Karam runs POST /api/verify OR http://localhost:3000/verify
        ↓
Karam reviews result (human judgment + notes)
        ↓
Copy Report (per output)
        ↓
Deliver 1-page report (email PDF or Google Doc)
        ↓
Offer upgrade → $1,500 Pilot or $5,000/month
```

---

## Step-by-step (Starter $300)

### 1. Payment confirmed

- [ ] Intake logged (spreadsheet)  
- [ ] `Paid = Y` and date recorded  
- [ ] Send confirmation: “Starting review, delivery within 24–48h.”  

### 2. Receive content

- Paste into intake doc  
- Max: **3 outputs** or **~3,000 words** for $300  

### 3. Run verification

**Option A — Browser**

1. Open `/verify`  
2. Paste each output → **Verify**  
3. Click **Copy Report**  

**Option B — API (PowerShell)**

```powershell
$body = @{ content = "PASTE CUSTOMER TEXT HERE" } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "http://localhost:3000/api/verify" -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

### 4. Human review (you — 10–20 min)

Ask yourself:

- Would a normal reader treat this as **fact** or **opinion**?  
- Are flags fair? Add one sentence if the tool missed context.  
- What should they **do next** (cite, soften, lawyer, kill publish)?  

### 5. Build 1-page report

**Template:**

```
HAI VERIFY — STARTER AUDIT REPORT
Client: [Name] · [Company]
Date: [YYYY-MM-DD]
Reference: INTAKE-XXXX

EXECUTIVE SUMMARY (3 sentences)

OUTPUT 1
Trust Index: __ / 100
Hallucination concern: __ / 100
Risk flags: ...
[Paste Copy Report block]

Human notes: ...

RECOMMENDED NEXT STEPS
1. ...
2. ...

DISCLAIMER
Rule-based preliminary analysis. Human review required for legal,
medical, financial, or high-risk decisions.

— Karam · Human Verified · HAI Verify
```

### 6. Deliver

- Email PDF or shared doc  
- Subject: `HAI Verify Starter Audit — [Company] — [Date]`  

### 7. Upsell (same email, P.S.)

> **P.S.** If you verify AI output regularly, the **$1,500 Trust Audit Pilot** covers 15 outputs + audit PDF, or **$5,000/month** for a monthly queue. Reply “pilot” if you want scope.

---

## Trust Pilot $1,500 (differences)

- Repeat steps 3–5 for **up to 15 outputs**  
- Add **batch table** (output name, trust, top flag)  
- Add **workflow section**: who pastes, who approves, when to re-scan  
- **30-min readout call**  

---

## Monthly $5,000 (differences)

- Track all runs in **audit log spreadsheet**  
- Weekly: update review queue  
- Month-end: **5–10 page PDF** + trends  
- Invoice on day 1 of month  

---

## Tools you need (minimum)

| Tool | Purpose |
|------|---------|
| `/verify` or `/api/verify` | Scoring |
| Copy Report | Client-deliverable text |
| Google Sheet | CRM: intake, paid, delivered |
| PDF export | Email attachment |
| Invoice template | Word/Google Docs |

---

## Time budget (protect margin)

| Tier | Your time | Revenue | Effective $/hr (approx.) |
|------|-----------|---------|---------------------------|
| $300 | 45–90 min | $300 | $200–400 |
| $1,500 | 4–8 hrs | $1,500 | $187–375 |
| $5k/mo | 6–12 hrs/mo | $5,000 | $416–833 |

---

## Quality checklist before send

- [ ] Trust Index matches Copy Report  
- [ ] Disclaimer included  
- [ ] Human notes are specific (not generic)  
- [ ] No promise of legal compliance  
- [ ] Upsell line included  

---

## When Stripe goes live (later)

Replace “send Zelle” with payment link—**keep delivery steps identical**.
