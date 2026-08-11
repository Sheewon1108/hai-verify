# HAI-IC IP Pack

## One-line thesis

Before AI takes action, HAI-IC measures intent and keeps the final decision and responsibility with a human.

## Problem -> mechanism -> proof

| Step | Paste-ready copy | Status |
|---|---|---|
| Problem | AI and agent systems can treat unclear human intent as clear instructions, then produce confident answers or actions without the person accepting responsibility first. | Product thesis |
| Mechanism | HAI-IC scores Intent Confidence from 0 to 100. Sincere Mode is allowed only at 75%+. Below 75%, the system asks for clarification or evidence before action. In all cases, the human retains final approval and responsibility. | Implemented in `app/lib/hai-ic-analyze.ts`, `app/lib/hai-ic-system-prompt.ts`, and `app/lib/hai-ic-responsibility.ts` |
| Proof | Live HAI-IC test ledger records 200 analyzed questions: 82 Sincere Mode ON, 118 Sincere Mode OFF, 126 due-diligence questions, 115 due-diligence questions blocked, average Intent Confidence 75.8%. | Measured in `hai-ic/buyer-deliverables/TRUST-LEDGER.md` |
| Paid-system evidence | HAI-IC has a live paid-pilot CTA path and API/payment rails in the repo. Real cash collected is not measured in this repo yet; add only verified receipt data before claiming dollars collected. | Payment rails exist; cash collected not measured yet |

## Why hard to copy

HAI-IC is not just a scoring function. The defensible part is the operating philosophy and process:

1. Intent is measured before action.
2. Sincere Mode has a fixed 75% gate.
3. Low confidence does not fake certainty; it asks for evidence.
4. Every action path preserves human final approval and responsibility.
5. The Trust Ledger records what the system allowed, blocked, and required before action.

Copying the code does not copy the founder-originated standard, the live audit habit, the buyer explanation, or the responsibility rule that keeps humans accountable.

## Evidence block to paste

HAI-IC is a working Intent Confidence gate. It returns a 0-100 score, Sincere Mode state, risk breakdown, clarifying questions, and a responsibility gate that keeps final approval with a human. Current measured ledger: 200 questions analyzed, 82 ON, 118 OFF, 115/126 due-diligence questions blocked, average Intent Confidence 75.8%. Real cash collected is not measured in this repo yet; do not state revenue collected until a verified receipt is attached.
