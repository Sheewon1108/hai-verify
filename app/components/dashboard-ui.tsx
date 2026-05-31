import type { RiskLevel, OverallStatus, SignalState } from "../lib/verification";

export function levelTone(level: RiskLevel) {
  switch (level) {
    case "Low":
      return { bar: "bg-emerald-500", text: "text-emerald-400", chip: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/20" };
    case "Moderate":
      return { bar: "bg-amber-500", text: "text-amber-400", chip: "bg-amber-500/12 text-amber-300 ring-amber-500/20" };
    case "High":
      return { bar: "bg-orange-500", text: "text-orange-400", chip: "bg-orange-500/12 text-orange-300 ring-orange-500/20" };
    case "Critical":
      return { bar: "bg-red-500", text: "text-red-400", chip: "bg-red-500/12 text-red-300 ring-red-500/20" };
  }
}

export function signalChip(state: SignalState) {
  switch (state) {
    case "pass":
      return "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20";
    case "review":
      return "bg-amber-500/10 text-amber-300 ring-amber-500/20";
    case "fail":
      return "bg-red-500/10 text-red-300 ring-red-500/20";
  }
}

export function SignalIcon({ state }: { state: SignalState }) {
  const base = "size-1.5 shrink-0 rounded-full";
  if (state === "pass") return <span className={`${base} bg-emerald-500`} />;
  if (state === "review") return <span className={`${base} bg-amber-500`} />;
  return <span className={`${base} bg-red-500`} />;
}

export function Card({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.06] bg-surface transition-colors duration-300 hover:border-white/[0.09] ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium tracking-tight text-white/93">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function MetricTile({
  label,
  value,
  unit,
  hint,
  progress,
  invertProgress,
  barClassName = "bg-accent/70",
}: {
  label: string;
  value: number;
  unit?: string;
  hint?: string;
  progress?: number;
  invertProgress?: boolean;
  barClassName?: string;
}) {
  const pct = progress ?? value;
  const barWidth = invertProgress ? 100 - pct : pct;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface px-4 py-4 transition-colors duration-300 hover:border-white/[0.09] sm:px-5">
      <p className="text-[10px] font-medium tracking-wider text-muted uppercase">{label}</p>
      <p className="mt-2.5 flex items-baseline gap-1">
        <span className="text-2xl font-normal tabular-nums tracking-tight text-white/95 sm:text-[1.65rem]">
          {value}
        </span>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </p>
      {progress !== undefined ? (
        <div className="mt-3.5 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClassName}`}
            style={{ width: `${clamp(barWidth, 0, 100)}%` }}
          />
        </div>
      ) : null}
      {hint ? <p className="mt-2 text-[11px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

export type StatusBannerCopy = {
  idleLabel: string;
  idleDesc: string;
  clearedLabel: string;
  reviewLabel: string;
  blockedLabel: string;
  trustBadge: string;
  riskBadge: string;
};

export function StatusBanner({
  status,
  levelLabel,
  signalSummary,
  trustIndex,
  copy,
}: {
  status: OverallStatus;
  levelLabel: string;
  signalSummary: string;
  trustIndex: number;
  copy: StatusBannerCopy;
}) {
  const labels = {
    idle: copy.idleLabel,
    cleared: copy.clearedLabel,
    review: copy.reviewLabel,
    blocked: copy.blockedLabel,
  };

  const config = {
    idle: {
      label: labels.idle,
      desc: copy.idleDesc,
      dot: "bg-muted",
      accent: "border-l-white/20",
      ring: "ring-white/10",
    },
    cleared: {
      label: labels.cleared,
      desc: signalSummary,
      dot: "bg-emerald-500",
      accent: "border-l-emerald-500/60",
      ring: "ring-emerald-500/20",
    },
    review: {
      label: labels.review,
      desc: signalSummary,
      dot: "bg-amber-500",
      accent: "border-l-amber-500/60",
      ring: "ring-amber-500/20",
    },
    blocked: {
      label: labels.blocked,
      desc: signalSummary,
      dot: "bg-red-500",
      accent: "border-l-red-500/60",
      ring: "ring-red-500/20",
    },
  }[status];

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-white/[0.06] border-l-[3px] bg-surface-elevated px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${config.accent} ${config.ring} ring-1 ring-inset`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${config.dot}`} />
        <div>
          <p className="text-sm font-medium text-white/92">{config.label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{config.desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
        {status !== "idle" ? (
          <>
            <span className="rounded-md bg-background/80 px-2.5 py-1 font-mono text-[11px] text-muted">
              {copy.trustBadge} · {trustIndex}
            </span>
            <span className="rounded-md bg-background/80 px-2.5 py-1 font-mono text-[11px] text-muted">
              {copy.riskBadge} · {levelLabel}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function DemoChrome({
  scanId,
  enterpriseWorkspace,
  policy,
  liveEvaluation,
}: {
  isLive?: boolean;
  scanId: string | null;
  enterpriseWorkspace: string;
  policy: string;
  liveEvaluation: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <span className="rounded-md border border-white/[0.07] bg-surface px-2 py-1">
          {enterpriseWorkspace}
        </span>
        <span className="hidden font-mono sm:inline">{policy}</span>
        {scanId ? <span className="font-mono">· {scanId}</span> : null}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="inline-block h-3 w-3 animate-pulse rounded-full bg-green-400" />
        <span className="text-sm font-medium text-green-400">{liveEvaluation}</span>
      </div>
    </div>
  );
}
