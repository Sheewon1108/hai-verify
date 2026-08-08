import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { OriginPrinciplesSection } from "../components/origin-principles";

export const metadata = {
  title: "HAI Verify — Origin & Principles",
  description:
    "Human-led AI verification by XGOMA Inc (KARAM SHIN). Detect risk, explain uncertainty, require human verification before action.",
};

export default function PrinciplesPage() {
  return (
    <div className="relative min-h-full flex-1 bg-background">
      <SiteHeader />
      <OriginPrinciplesSection />
      <p className="pb-12 text-center text-xs text-muted">
        <Link href="/" className="underline-offset-2 hover:text-white/80 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
