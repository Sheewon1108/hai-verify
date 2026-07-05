# Hai-ic — Product One-Pager (xAI / Enterprise)

**Owner:** KARAM SHIN  
**Product:** Hai-ic (Intent Confidence Analyzer)  
**Version:** 1.0.0-mvp  
**Parent:** HAI Verify

## One line

Before AI acts, Hai-ic scores how well the user's intent is understood (0–100) and gates execution at 85%.

## Problem

Agents and assistants often execute on ambiguous natural-language requests. That creates wrong actions, wasted API calls, and trust loss.

## Solution

Hai-ic sits **before** the main model/tool loop:

1. Score **Intent Confidence %** (honest, not inflated)
2. Return **Breakdown** (core intent, understood, missing, risk) — Korean + English ready
3. **≥85%** → sincere mode (detailed practical response)
4. **<85%** → 2–3 clarifying questions instead of blind execution

## For xAI / Grok

- Pre-response confidence badge for user trust
- Reduces bad tool calls in agent stacks
- Pairs with HAI Verify for regulated / high-stakes flows
- REST API — drop-in, no heavy SDK required

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/hai-ic/health` | Liveness |
| GET | `/api/hai-ic/analyze` | API discovery |
| POST | `/api/hai-ic/analyze` | Analyze intent |

## Commercial

Licensing, OEM, enterprise integration — proposals via HAI Verify partnership channel.

**Human + Heart + AI + Law = Verification**