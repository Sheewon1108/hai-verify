# XGOMA Platform — Democratization (Public Reference)

**Official criteria for partners and the public.**  
Mirror of Google Keep master note · **Copyright 2026 KARAM. All Rights Reserved.**

> **"빅테크의 눈치 싸움 속에서, 대중의 눈높이로 AI의 환각과 거짓을 정직하게 심판한다."**

---

## 1. Public-centric values

- **Neutral third-party framing:** Transparent **Trust Index** the public can understand—not opaque big-tech-only scores.  
- **Participation loop (roadmap):** Real-world test data eventually feeds engine improvement (documented; not live ML in MVP).

---

## 2. Three public filters (implementation in `app/lib/verification.ts`)

| Filter | Flag | Penalty | What it catches |
|--------|------|---------|-----------------|
| Subjective hype | `subjective_claim` | **−5** | 미래 가치, 성장할 것이다, 최고, 혁신적, etc. |
| Unverified “fake news” pattern | `unverified_claim` | **−10** | Proper noun + number without citation (e.g. SpaceX + 1200) |
| Overconfident / gaslighting | `overconfident_language` | **−15** | 반드시, 무조건, 100%, 확실히 without sources |

**Trust Index:** starts at **100**, subtract penalties, floor **0**.  
**Hallucination concern score:** `100 − Trust Index` (plain inverse for readers).

---

## 3. IP policy

- Copyright header on core files: `Copyright 2026 KARAM. All Rights Reserved.`  
- **No source handoff** to customers or partners.  
- Deliver only: **API JSON**, **web dashboard**, **PDF / Copy Report**.

---

## 4. Contributors

Names are preserved in [../CONTRIBUTORS.md](../CONTRIBUTORS.md) and `ENGINE_CONTRIBUTORS` in code.

---

## 5. Access (MVP)

- **No geo/org blocking** on API or landing for development and public demos.  
- Grok, ChatGPT, Google Gemini, Cursor — all welcome to test and link to `/verify`.

---

*Share this file with external partners when explaining scoring philosophy.*
