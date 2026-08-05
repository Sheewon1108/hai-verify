// Copyright 2026 KARAM. All Rights Reserved.

import Link from "next/link";
import { PaymentCta } from "./components/payment-cta";

/** Fallback if config redirect is skipped (Cloudflare Workers). */
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>HAI Verify</h1>
      <p>
        <PaymentCta />
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