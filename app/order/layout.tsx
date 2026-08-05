// Copyright 2026 KARAM. All Rights Reserved.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start $300 Evaluation | HAI-IC",
  description: "Direct payment path for the HAI-IC $300 Evaluation Pilot.",
  openGraph: {
    title: "Start $300 Evaluation | HAI-IC",
    description: "Pay for the HAI-IC $300 Evaluation Pilot, then submit the evaluation request.",
  },
};

const CRAWLER_SUMMARY = `
HAI-IC $300 Evaluation Pilot
Customer interest → payment → intake submission → delivery.
Primary action: Start $300 Evaluation.
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
          <h1>HAI-IC $300 Evaluation</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{CRAWLER_SUMMARY}</pre>
        </div>
      </noscript>
      <div className="sr-only">
        <h1>HAI-IC $300 Evaluation</h1>
        <p>{CRAWLER_SUMMARY}</p>
      </div>
      {children}
    </>
  );
}
