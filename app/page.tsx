"use client";

import { useState } from "react";
import { Hero, TrustIndicators, WorkflowSection, CTASection, SiteFooter } from "./components/landing";
import { OriginPrinciplesSection } from "./components/origin-principles";
import { SiteHeader } from "./components/site-header";
import { VerificationDemo } from "./components/verification-demo";

export default function Page() {
  const [scanId, setScanId] = useState<string | null>(null);

  return (
    <div className="relative min-h-full flex-1 bg-background">
      <SiteHeader />
      <Hero />
      <OriginPrinciplesSection />
      <TrustIndicators />
      <WorkflowSection />
      <VerificationDemo onScanIdChange={setScanId} />
      <CTASection />
      <SiteFooter scanId={scanId} />
    </div>
  );
}
