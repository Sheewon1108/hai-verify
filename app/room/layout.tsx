// Copyright 2026 KARAM. All Rights Reserved.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private room",
  description: "Private pair room. Not a public product page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  referrer: "no-referrer",
};

export default function PrivateRoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
