"use client";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/12 ring-1 ring-accent/20">
            <span className="text-[10px] font-semibold tracking-tight text-accent">HAI</span>
          </span>
          <span className="text-sm font-medium text-white/92">HAI Verify</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Main">
          <a href="#workflow" className="transition-colors hover:text-white/90">
            Workflow
          </a>
          <a href="#demo" className="transition-colors hover:text-white/90">
            Demo
          </a>
          <a href="#contact" className="transition-colors hover:text-white/90">
            Contact
          </a>
        </nav>

        <a
          href="#demo"
          className="rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-[#0b0c0e] transition-opacity hover:opacity-90"
        >
          Try demo
        </a>
      </div>
    </header>
  );
}
