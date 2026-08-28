import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  referrer: "no-referrer",
};

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return children;
}
