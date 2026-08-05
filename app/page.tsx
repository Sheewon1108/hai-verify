// Copyright 2026 KARAM. All Rights Reserved.

import Link from "next/link";
import { getPublicPaymentLink, PRIMARY_PAYMENT_CTA_LABEL } from "./lib/payment-link";

/** Fallback if config redirect is skipped (Cloudflare Workers). */
export default function HomePage() {
  const paymentLink = getPublicPaymentLink();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>HAI Verify</h1>
      <p>
        <a href={paymentLink}>{PRIMARY_PAYMENT_CTA_LABEL}</a>
      </p>
      <p>
        <Link href="/hai-ic">Open HAI-IC demo</Link>
      </p>
      <p>
        <Link href="/faq">FAQ</Link>
      </p>
    </main>
  );
}