"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "../components/site-header";
import type { WatchedOpenFile } from "../lib/approval-reminder";

type ApprovalsPayload = {
  ok: true;
  files: WatchedOpenFile[];
  pendingImportant: WatchedOpenFile[];
  reminderDue: boolean;
  reminderReason: string;
  lastReminderSentAt: string | null;
  intervalMinutes: number;
};

type ApprovalsError = { ok: false; error: string };

export default function ApprovalsPage() {
  const [data, setData] = useState<ApprovalsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/approvals", { cache: "no-store" });
    const json = (await res.json()) as ApprovalsPayload | ApprovalsError;
    if (!res.ok || !json.ok) {
      throw new Error("error" in json ? json.error : "목록을 불러오지 못했습니다.");
    }
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
    });
  }, [refresh]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: true }),
      });
      const json = (await res.json()) as ApprovalsPayload | ApprovalsError;
      if (!res.ok || !json.ok) {
        throw new Error("error" in json ? json.error : "승인에 실패했습니다.");
      }
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "승인에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = data?.pendingImportant.length ?? 0;

  return (
    <div className="relative min-h-full flex-1 bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] font-medium tracking-wider text-muted uppercase">
          Human approval
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white/95 sm:text-3xl">
          열린 파일 승인
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          지금 보고 있는 파일 둘 중, 중요한데 아직 승인하지 않은 항목이 있으면 1시간마다
          이메일로 알려 드립니다. 승인하면 해당 파일 알림은 멈춥니다.
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {data ? (
          <section className="mt-8 space-y-3">
            <p className="text-xs text-muted">
              미승인 중요 파일 {pendingCount}건
              {data.lastReminderSentAt
                ? ` · 마지막 알림 ${new Date(data.lastReminderSentAt).toLocaleString()}`
                : " · 아직 알림을 보내지 않음"}
              {data.reminderDue ? " · 다음 틱에서 메일 발송" : ""}
            </p>

            {data.files.map((file) => {
              const pending = file.important && !file.approvedAt;
              return (
                <article
                  key={file.id}
                  className="rounded-2xl border border-white/[0.06] bg-surface px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-medium text-white/93">{file.title}</h2>
                      <p className="mt-1 font-mono text-xs text-muted">{file.path}</p>
                    </div>
                    <span
                      className={
                        pending
                          ? "rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] text-amber-300 ring-1 ring-amber-500/20"
                          : file.approvedAt
                            ? "rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] text-emerald-300 ring-1 ring-emerald-500/20"
                            : "rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted ring-1 ring-white/10"
                      }
                    >
                      {pending ? "중요 · 미승인" : file.approvedAt ? "승인됨" : "중요 아님"}
                    </span>
                  </div>
                  {file.approvedAt ? (
                    <p className="mt-3 text-xs text-muted">
                      승인 시각 {new Date(file.approvedAt).toLocaleString()}
                    </p>
                  ) : file.important ? (
                    <button
                      type="button"
                      disabled={busyId === file.id}
                      onClick={() => approve(file.id)}
                      className="mt-4 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {busyId === file.id ? "승인 중…" : "이 파일 승인"}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : !error ? (
          <p className="mt-8 text-sm text-muted">불러오는 중…</p>
        ) : null}
      </main>
    </div>
  );
}
