// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import {
  listOpenFiles,
  listUnapprovedImportant,
} from "@/app/lib/open-file-approvals";

export const metadata: Metadata = {
  title: "Open file approvals | HAI Verify",
  description: "Owner status — important open files waiting on KARAM approval.",
  robots: { index: false, follow: false },
};

const CATALOG_EDIT_URL =
  "https://github.com/Sheewon1108/hai-verify/edit/main/hai-ic/open-file-approvals.json";
const CATALOG_BLOB_URL =
  "https://github.com/Sheewon1108/hai-verify/blob/main/hai-ic/open-file-approvals.json";

export default function ApprovalsPage() {
  const openFiles = listOpenFiles();
  const pending = listUnapprovedImportant();

  return (
    <div className="min-h-dvh bg-background text-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs tracking-wide text-white/45">Owner · Human approval</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          열려 있는 파일 — 승인 상태
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          현재 보고 있는 파일 중 <strong className="text-white/90">important</strong> 이고
          아직 승인하지 않은 항목이 있으면 1시간마다 이메일 알림이 갑니다.
        </p>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface-elevated/50 p-4 sm:p-5">
          {pending.length === 0 ? (
            <p className="text-sm text-emerald-300/90">
              미승인 중요 파일 없음 — 시간별 이메일은 보내지 않습니다.
            </p>
          ) : (
            <p className="text-sm text-amber-200/90">
              미승인 중요 파일 {pending.length}건 — 승인하기 전까지 매시간 알림.
            </p>
          )}
        </div>

        <ul className="mt-6 space-y-3">
          {openFiles.map((file) => {
            const waiting = file.important && !file.approved;
            return (
              <li
                key={file.id}
                className="rounded-2xl border border-white/[0.08] bg-surface-elevated/40 px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-medium text-white/92">{file.title}</h2>
                  {file.important ? (
                    <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-200 ring-1 ring-amber-200/20">
                      important
                    </span>
                  ) : (
                    <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] text-white/50 ring-1 ring-white/10">
                      not important
                    </span>
                  )}
                  {file.approved ? (
                    <span className="rounded-md bg-emerald-400/12 px-2 py-0.5 text-[11px] text-emerald-200 ring-1 ring-emerald-200/20">
                      approved
                    </span>
                  ) : (
                    <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] text-white/50 ring-1 ring-white/10">
                      unapproved
                    </span>
                  )}
                  {waiting ? (
                    <span className="rounded-md bg-[#FF0033]/15 px-2 py-0.5 text-[11px] text-red-200 ring-1 ring-red-300/20">
                      hourly email
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-mono text-xs text-white/55">{file.path}</p>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-white/60">
          승인하려면{" "}
          <Link href={CATALOG_EDIT_URL} className="text-accent underline-offset-2 hover:underline">
            open-file-approvals.json
          </Link>
          에서 해당 파일의 <code className="text-white/80">approved</code> 를{" "}
          <code className="text-white/80">true</code> 로 바꾸세요.{" "}
          <Link href={CATALOG_BLOB_URL} className="text-white/70 underline-offset-2 hover:underline">
            현재 목록
          </Link>
        </p>
      </main>
    </div>
  );
}
