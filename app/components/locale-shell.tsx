"use client";

import { LocaleProvider } from "./locale-provider";
import { PrivacyConsentGate } from "./privacy-consent-gate";

export function LocaleShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <PrivacyConsentGate />
      {children}
    </LocaleProvider>
  );
}
