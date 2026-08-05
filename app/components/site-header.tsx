"use client";

import Link from "next/link";
import { LangPicker } from "./lang-picker";
import { useLocale } from "./locale-provider";

export function SiteHeader() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/12 ring-1 ring-accent/20">
            <span className="text-[10px] font-semibold tracking-tight text-accent">HAI</span>
          </span>
          <span className="text-sm font-medium text-white/92">HAI Verify</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Main">
          <Link href="/#origin" className="transition-colors hover:text-white/90">
            {t.common.nav.origin}
          </Link>
          <Link href="/#workflow" className="transition-colors hover:text-white/90">
            {t.common.nav.workflow}
          </Link>
          <Link href="/verify" className="transition-colors hover:text-white/90">
            {t.common.nav.verify}
          </Link>
          <Link href="/order" className="transition-colors hover:text-white/90">
            {t.common.nav.order}
          </Link>
          <Link href="/faq" className="transition-colors hover:text-white/90">
            FAQ
          </Link>
          <Link href="/#demo" className="transition-colors hover:text-white/90">
            {t.common.nav.demo}
          </Link>
          <Link href="/#contact" className="transition-colors hover:text-white/90">
            {t.common.nav.contact}
          </Link>
        </nav>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <LangPicker />
            <a
              href={process.env.NEXT_PUBLIC_HAI_PAYMENT_LINK || '/hai-ic#pricing'}
              data-cta="header-evaluation-300"
              className="rounded-lg bg-[#FF0033] px-3.5 py-2 text-xs font-medium text-white transition-all hover:scale-105 hover:brightness-110"
            >
              Start $300 Evaluation
            </a>
          </div>
          <p className="text-[10px] tracking-wide text-white/35">{t.common.createdBy}</p>
        </div>
      </div>
    </header>
  );
}
