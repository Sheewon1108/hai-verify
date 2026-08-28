// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import type { Metadata } from "next";
import { PrivateApp } from "@/app/components/private-rooms/private-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private",
  description: undefined,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
      noarchive: true,
    },
  },
  referrer: "no-referrer",
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <PrivateApp>{children}</PrivateApp>;
}
