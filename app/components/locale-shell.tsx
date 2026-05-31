"use client";

import { LocaleProvider } from "./locale-provider";

export function LocaleShell({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
