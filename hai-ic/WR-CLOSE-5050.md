# War Room close — 50/50 (final handoff)

**Date:** 2026-08-11 (updated)  
**Owner:** KARAM SHIN  
**Partner:** Grok (this room)  
**Legal entity:** XGOMA Inc (not LLC)  
**Product:** HAI Verify / Hai-ic · https://hai-ic.com  

**How to read this file:** Agreed decisions only. No secrets. Safe to pass as internal close note (keys, bank, vault — never in this file).

---

## 1. What we are

| | |
|--|--|
| **HAI / Hai-ic** | Pre-execution verification: intent confidence 0–100, ambiguity & execution risk, safer rewrite; **human decides** |
| **One line (KO)** | AI 답을 그대로 consume 하지 않고, 실행 전에 검증한다 |
| **One line (EN)** | HAI-IC verifies AI commands and workflows before they run. Scores intent confidence, flags risk, safer rewrite. Humans decide. |
| **Entry offer** | Evaluation Pilot **$300** · https://hai-ic.com · https://hai-ic.com/order |
| **Market timing** | Agents pay and delete files — pre-execution verification is required |
| **Sincerity** | This track is real work, not a prop |

---

## 2. Who does the work (no third person in the seat)

| Role | Who | Does |
|------|-----|------|
| **Owner** | KARAM | Decisions, law, family money, Stripe Dashboard (bank / business), final “send / pay / approve”, hire later |
| **Partner (hands)** | Grok in this room | Code, docs, checklists, drafts, deploy/sync **when Owner unlocks**, structure so money path can complete |
| **Not the 실무 pair** | Temporary contacts (e.g. short-term help) | **Not** the default money-path hands. If they work well later → employee concept. Not written into day-to-day 50/50 |

**실무 pair = Owner + Partner only.**  
Do not insert extra names into that seat without a new Owner knot.

---

## 3. 50 / 50

### Partner half (finish / maintain when unlocked)

- [x] XGOMA Inc branding (docs + UI + footer) — commit `dd576ce`
- [x] WR rules: COMPLETELY BLIND default, NO LOOP, no family↔character
- [x] This close doc (handoff-ready)
- [x] Pitch lock ($300 + EN/KO one-liners + hai-ic.com)
- [ ] Stripe/live smoke assist **after** Owner sets Dashboard + vault (no keys in chat)
- [ ] Follow-up **drafts** / logs when Owner asks (`실행:`)
- [ ] Deploy / `workers:sync-env` when Owner asks

### Owner half (human only)

- [ ] Stripe **XGOMA Inc**: legal name, bank, website `https://hai-ic.com`
- [ ] Live keys + webhook + Price IDs → **vault only** (never chat) → sync when ready
- [ ] One real checkout path check (`/order`, $300)
- [ ] Follow-up sends (people/list Owner chooses) — Partner drafts, Owner sends or approves send
- [ ] Family money / personal schedule — Owner clock only

---

## 4. Room rules (still on)

| Rule | Meaning |
|------|---------|
| **COMPLETELY BLIND** | Default: explain only. Execute only with unlock |
| **Unlock** | `실행:` / `GO:` / clear `해` · `마무리` · `진행` — one scope, then back to blind |
| **Lift blind** | `blind off` (Owner or EM only) |
| **NO LOOP** | No re-fight: tool vs person seat, Meta/Micro operators, family = character, heal-scripts as control |
| **No secrets in chat** | Keys, tokens, vault values forbidden here |
| **Stakeholders (HAI-IC term)** | EM + Owner; Partner is not stakeholder roster |

Detail: `.cursor/rules/war-room.mdc`

---

## 5. Stripe / money path (facts only)

| | |
|--|--|
| Entity | **XGOMA Inc only** (LLC is not our main) |
| Public site | https://hai-ic.com |
| Webhook targets (configure in Dashboard) | `https://hai-ic.com/api/stripe/webhook` and/or Workers URL on project |
| Event | `checkout.session.completed` |
| Local help scripts (no secrets in chat) | `scripts/switch-stripe-live.ps1` → `npm run workers:sync-env` |
| Order | https://hai-ic.com/order |

Partner cannot complete bank linking for Owner. Partner prepares checklists, code, and runs unlocked steps after vault is set.

---

## 6. Forbidden (closed)

- Treating family need as Owner character score  
- “Get rich → heal → stand beside” as a condition of work  
- Claiming Meta/Micro run this room  
- LLC as the billing principal  
- Dumping secrets into chat or into this file  
- Putting temporary people in the **Owner + Partner** 실무 seat by default  

---

## 7. After handoff — how to use this file

1. Pass this file as **agreed close + work split**.  
2. Do **not** pass vault, `.env`, Stripe secret files, or personal CB/family detail.  
3. Next action is either:
   - **Owner:** Dashboard / vault / send, or  
   - **Partner:** one unlocked task (`실행: …`)

---

## 8. One line

> **HAI + XGOMA Inc are the value. Work pair is KARAM + Partner. $300 pilot path on hai-ic.com. Blind default. No loop. No secrets here.**

*Closed for handoff. Partner finished organize pass.*
