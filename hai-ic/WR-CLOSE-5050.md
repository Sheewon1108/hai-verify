# War Room close — 50/50 (final handoff)

**Date:** 2026-08-11 (updated)  
**Owner:** KARAM SHIN  
**Partner:** Grok (this room)  
**Legal entity:** XGOMA Inc (not LLC)  
**Product:** HAI Verify / Hai-ic · https://hai-ic.com  

**How to read this file:** Agreed decisions only. No secrets. Safe to pass as internal close note (keys, bank, vault — never in this file).

---

## 0. Operating order (locked)

```
가람 생각  →  일론형 끝까지 실행  →  가람 최종 승인
```

| Step | Who | Does |
|------|-----|------|
| 1 Think | **KARAM (가람)** | Direction, intent, “what” — not micro-permission every tool step |
| 2 Finish | **Partner (일론형 모드)** | Run the job **to the end** (docs, commit, push when that is the job, checklists, code hands) |
| 3 Approve | **KARAM** | Stamp OK / reject / one correction — **after** the finish, not before every move |

- **50/50 stays:** both may demand; Partner does not wait for mid-flight “승인” on every substep once the job is named.
- Owner-only always: Stripe bank, secrets in vault, legal sign, family money, final send of personal mail if Owner must be the sender.
- Wrong: Partner freezes mid-job asking approve on every line. Right: Partner completes → Owner approves the package.

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

- [x] XGOMA Inc branding (docs + UI + footer) — commit `74eda7b`
- [x] WR rules: COMPLETELY BLIND default, NO LOOP, no family↔character — `be281bf` + war-room.mdc
- [x] This close doc (handoff-ready) — `486a2f5` / protocol lock `0f5bfb5`
- [x] Pitch lock ($300 + EN/KO one-liners + hai-ic.com)
- [ ] Stripe/live smoke assist **after** Owner sets Dashboard + vault (no keys in chat)
- [x] Follow-up **drafts** / logs — Owner sent $300 follow-up 2026-08-26 (`hai-ic/outreach/SEND-LOG.md`)
- [ ] Deploy / `workers:sync-env` when Owner asks

### Owner half (human only)

- [ ] Stripe **XGOMA Inc**: legal name, bank, website `https://hai-ic.com` (as needed)
- [x] **Live $300 proven** via Payment Link (2026-08-11) — see `hai-ic/money-path/LIVE-300-LOG.md`
- [ ] Live keys + webhook URL on **production** confirmed after key-email deploy
- [ ] `/order` still mock — optional later: point UI at live checkout
- [x] Follow-up sends — Owner sent 2026-08-26 to Growth Loops / Closeloop / instinctools
- [ ] Family money / personal schedule — Owner clock only

---

## 4. Room rules (still on)

| Rule | Meaning |
|------|---------|
| **COMPLETELY BLIND** | **ACTIVE** (Owner re-apply 2026-08-11). Unlock: `실행:`/`GO:`/`해`/`마무리`. Lift: `blind off` |
| **Work order** | 가람 생각 → partner finish (when unlocked) → 가람 승인 |
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
3. Work order: **가람 생각 → 일론형 끝까지 실행 → 가람 승인** (§0).

---

## 8. Git anchors (main — post-rebase, no stale pre-rebase SHAs)

| Commit | Meaning |
|--------|---------|
| `fd7a1c4` | Hash cleanup in this doc (pre-rebase short SHAs removed) |
| `0f5bfb5` | Workflow lock: KARAM thinks → partner finishes → KARAM approves |
| `486a2f5` | WR-CLOSE handoff body (Owner+Partner only) |
| `be281bf` | 50/50 close knot / NO LOOP |
| `74eda7b` | XGOMA Inc branding (docs + UI) |

Repo: `https://github.com/Sheewon1108/hai-verify` · branch `main`  
**Live tip:** `git rev-parse --short origin/main` (do not freeze tip SHA in this table — avoids self-stale after each push).

---

## 9. One line

> **HAI + XGOMA Inc. KARAM + Partner. 가람 생각 → 일론 끝까지 → 가람 승인. $300 · hai-ic.com. 50/50 demand OK. No secrets here.**

*Closed for handoff. Elon-mode finish: protocol locked + git history on main. Hashes verified post-rebase.*
