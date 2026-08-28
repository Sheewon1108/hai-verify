// Copyright 2026 KARAM. All Rights Reserved.
// WR route segment — PWA metadata scoped here so the public site never
// advertises the private rooms in its own <head>.

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "WR",
  manifest: "/wr-app.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WR",
  },
  icons: {
    apple: "/wr-icon-apple-180.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function WrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
