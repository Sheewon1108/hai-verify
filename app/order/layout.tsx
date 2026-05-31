// Copyright 2026 KARAM. All Rights Reserved.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XGOMA Order · Starter Audit $300",
  description:
    "Founding Customer Special: $300 one-time Starter Audit. 48–72 hour delivery. HAI-VERIFY-01 compliance certificate. Up to 50 AI outputs verified. No live debrief calls — Secure Portal only.",
  openGraph: {
    title: "XGOMA · Starter Audit $300",
    description:
      "HAI-VERIFY-01 certified audit. 48–72 hr delivery. Human reviewer within 24 hours. Claim your founding slot.",
  },
};

const CRAWLER_SUMMARY = `
XGOMA Enterprise Order — Starter Audit ($300 one-time)
Founding Customer Special (Limited Time). No subscription. Delivered within 48–72 hours.
Includes: up to 50 HAI-verified AI outputs, hallucination risk scoring, policy alignment (1 core domain),
human reviewer within 24 hours, exportable audit PDF (Korean/English), HAI-VERIFY-01 certificate,
async feedback via Secure Portal (no live debrief calls).
Trust Pilot enterprise plan: $1,500.
API: POST /api/verify with JSON body { "content": "...", "locale": "ko" }
Health: GET /api/health
`.trim();

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <div
          style={{
            maxWidth: 720,
            margin: "2rem auto",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.6,
          }}
        >
          <h1>XGOMA Order</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{CRAWLER_SUMMARY}</pre>
        </div>
      </noscript>
      <div className="sr-only">
        <h1>XGOMA Order — Starter Audit</h1>
        <p>{CRAWLER_SUMMARY}</p>
      </div>
      {children}
    </>
  );
}
