dhs# Hire 1 Tech Maintainer — Interview Pack (KARAM interviews, AI does not veto)

**Role:** Part-time maintainer only. No new products. No Cloudflare/Discord unless KARAM says go.

---

## Job post (copy → Upwork or LinkedIn)

**Title:** Part-time Next.js Maintainer + Windows Local Ops (10–15 hrs/week)

**Description:**

We have a working Next.js 16 app (HAI Verify / Hai-Ic) on Windows 11.

You will NOT build new features or new products. You will:

- Keep `pm2` + localhost dev server healthy (`127.0.0.1:3001`)
- Run and pass `npm run local:doctor` and `npm run access:test-loopback`
- Fix bugs when checks fail
- Follow security rules: no secrets in git/chat, no tunnel without approval

**Stack:** Next.js, TypeScript, PowerShell, PM2, DPAPI vault (training provided after NDA)

**Not in scope:** Cloudflare deploy, Discord bot, new SaaS ideas, sales outreach

**Trial (paid, 2–3 hours):** See trial task below. Apply with: (1) timezone (2) hourly rate (3) one sentence why you read instructions.

**Budget:** $[YOUR_RATE]/hr or fixed $[300–500] for trial week

---

## Where to post (pick ONE channel first)

1. **Upwork** — search post, filter: Next.js + TypeScript, US or Philippines, Job success 90%+
2. **지인 1명** — forward job post text only (no repo secrets)
3. **Toptal** — if budget allows, ask for "maintenance not greenfield"

Do not post on 3 sites at once. One channel → 3–5 applicants → interview top 2.

---

## Trial task (paid before full access)

Send after short screen call:

```
Clone repo (public): github.com/Sheewon1108/hai-verify
Branch: main
On Windows OR WSL:

1. npm ci
2. npm run build
3. npm run local:doctor (may warn on vault — OK for trial)
4. Send screenshot: pm2 status + curl http://127.0.0.1:3001/api/health

Do NOT ask for API keys or ~/secrets/ on trial.
Deadline: 48 hours.
```

Pay trial even if they fail — but only hire if pass.

---

## Interview (30 min) — KARAM asks, score 1–5 each

| # | Question | 5 = good |
|---|----------|----------|
| 1 | This job says no new products. What would you do if asked to add a feature? | Says no / asks written approval |
| 2 | Where do API keys live in this project? | env/vault, never git, never Slack |
| 3 | What is `local:doctor` for? | health check without external tokens |
| 4 | Customer wants public URL today. Your move? | asks KARAM, mentions deploy approval |
| 5 | You found a security bug. Steps? | report first, no public disclosure |

**Hire if:** average ≥ 4, no score 1 on Q1 or Q2  
**AI does not approve/reject people** — only this scorecard.

---

## Red flags (stop)

- Wants to "rewrite architecture" in week 1
- Asks for production secrets before NDA + trial pass
- Pushes Cloudflare/Discord/Vercel without being asked
- Sends localhost in "buyer" emails

## Green flags

- Reads trial instructions exactly
- Asks one clarifying question only
- Comfortable with PowerShell on Windows

---

## After hire (week 1 only)

- NDA signed
- Read-only repo access first
- Vault access: never full — or rotated keys for contractor-specific
- Weekly: `local:doctor` screenshot to KARAM

---

*KARAM decides hire. This pack is prep only.*