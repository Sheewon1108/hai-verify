// Copyright 2026 KARAM. All Rights Reserved.
// WR private rooms (낙서방 · 복불복) — noindex, key-gated, agent-blind data.

import type { Metadata } from "next";
import { WrRoomApp } from "@/app/components/wr-room";

export const metadata: Metadata = {
  title: "WR",
  robots: { index: false, follow: false },
};

export default function WrPage() {
  return <WrRoomApp />;
}
