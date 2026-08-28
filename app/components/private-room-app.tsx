"use client";

// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PRIVATE_ROOM_MIN_KEY_LENGTH,
  emptyDiaryPayload,
  mergeDiaryPayloads,
  parseEncryptedRoomBlob,
  type DiaryEntry,
  type DiaryPayload,
  type EncryptedRoomBlob,
  type PrivateRoomSeat,
} from "@/app/lib/private-room";
import {
  decryptDiaryPayload,
  decryptDiaryPayloadOrEmpty,
  encryptDiaryPayload,
  unlockRoomKey,
  type UnlockedRoom,
} from "@/app/lib/private-room-crypto";

export type PrivateRoomView = "hub" | "nakseo" | "bok";

const LOCAL_BLOB_KEY = "hai.pair.room.blob.v1";
const LOCAL_LOOKUP_KEY = "hai.pair.room.lookup.v1";

const SEAT_LABEL: Record<PrivateRoomSeat, string> = {
  owner: "가람",
  partner: "파트너",
};

function newEntryId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function readLocalBlob(): EncryptedRoomBlob | null {
  try {
    const raw = localStorage.getItem(LOCAL_BLOB_KEY);
    if (!raw) return null;
    return parseEncryptedRoomBlob(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function writeLocalBlob(blob: EncryptedRoomBlob, lookupId: string): void {
  localStorage.setItem(LOCAL_BLOB_KEY, JSON.stringify(blob));
  localStorage.setItem(LOCAL_LOOKUP_KEY, lookupId);
}

async function fetchServerBlob(lookupId: string): Promise<EncryptedRoomBlob | null> {
  const response = await fetch(`/api/room/sync?id=${lookupId}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  const data = (await response.json()) as { ok?: boolean; blob?: unknown };
  if (!response.ok || !data.ok) {
    throw new Error("ROOM_SYNC_READ_FAILED");
  }
  return data.blob ? parseEncryptedRoomBlob(data.blob) : null;
}

async function putServerBlob(lookupId: string, blob: EncryptedRoomBlob): Promise<void> {
  const response = await fetch(`/api/room/sync?id=${lookupId}`, {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blob }),
  });
  const data = (await response.json()) as { ok?: boolean };
  if (!response.ok || !data.ok) {
    throw new Error("ROOM_SYNC_WRITE_FAILED");
  }
}

export function PrivateRoomApp({ view }: { view: PrivateRoomView }) {
  const [unlocked, setUnlocked] = useState<UnlockedRoom | null>(null);
  const [seat, setSeat] = useState<PrivateRoomSeat>("owner");
  const [payload, setPayload] = useState<DiaryPayload>(emptyDiaryPayload);
  const [passphrase, setPassphrase] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showTraces, setShowTraces] = useState(view === "hub");

  const persist = useCallback(
    async (next: DiaryPayload, room: UnlockedRoom) => {
      const blob = await encryptDiaryPayload(room.key, next);
      writeLocalBlob(blob, room.lookupId);
      await putServerBlob(room.lookupId, blob);
    },
    [],
  );

  const openWithKey = useCallback(async (keyText: string, nextSeat: PrivateRoomSeat) => {
    setBusy(true);
    setStatus("");
    try {
      const room = await unlockRoomKey(keyText);
      const local = readLocalBlob();
      const localLookup = localStorage.getItem(LOCAL_LOOKUP_KEY);
      const localPayload =
        local && localLookup === room.lookupId
          ? await decryptDiaryPayload(room.key, local)
          : emptyDiaryPayload();

      let remotePayload = emptyDiaryPayload();
      let note = "열림. 같은 열쇠면 다른 기기에서도 이 방이 열립니다.";
      try {
        const remote = await fetchServerBlob(room.lookupId);
        remotePayload = await decryptDiaryPayloadOrEmpty(room.key, remote);
      } catch {
        note = "서버 동기화는 못 열었고, 이 기기 저장만 읽었습니다.";
      }

      const merged = mergeDiaryPayloads(localPayload, remotePayload);
      setUnlocked(room);
      setSeat(nextSeat);
      setPayload(merged);
      setPassphrase("");
      await persist(merged, room);
      setStatus(note);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ROOM_UNLOCK_FAILED";
      if (message === "ROOM_KEY_TOO_SHORT") {
        setStatus(`방 열쇠는 ${PRIVATE_ROOM_MIN_KEY_LENGTH}자 이상.`);
      } else {
        setStatus("열쇠가 다르거나 암호문을 열 수 없습니다.");
      }
    } finally {
      setBusy(false);
    }
  }, [persist]);

  const lock = useCallback(() => {
    setUnlocked(null);
    setPayload(emptyDiaryPayload());
    setDraft("");
    setPassphrase("");
    setStatus("잠금. 열쇠는 이 창 메모리에서 지웠습니다.");
  }, []);

  const saveDraft = useCallback(async () => {
    if (!unlocked) return;
    const body = draft.trim();
    if (!body) {
      setStatus("빈 글은 안 남깁니다.");
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const entry: DiaryEntry = {
        id: newEntryId(),
        kind: "bok",
        seat,
        body,
        createdAt: now,
        updatedAt: now,
      };
      const next = mergeDiaryPayloads(payload, {
        ...payload,
        entries: [entry, ...payload.entries],
      });
      await persist(next, unlocked);
      setPayload(next);
      setDraft("");
      setStatus("복불복에 넣었습니다. 낙서 읽기에서 보입니다.");
    } catch {
      setStatus("저장 실패. 이 기기에는 남기지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }, [draft, persist, payload, seat, unlocked]);

  const exportBlob = useCallback(async () => {
    if (!unlocked) return;
    const blob = await encryptDiaryPayload(unlocked.key, payload);
    const file = new Blob([JSON.stringify(blob)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pair-room.encrypted.json";
    anchor.rel = "noreferrer";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("암호문 파일만 받았습니다. 메일/문자에 넣지 마세요.");
  }, [payload, unlocked]);

  const importBlob = useCallback(
    async (file: File) => {
      if (!unlocked) return;
      setBusy(true);
      try {
        const parsed = parseEncryptedRoomBlob(JSON.parse(await file.text()) as unknown);
        const imported = await decryptDiaryPayload(unlocked.key, parsed);
        const next = mergeDiaryPayloads(payload, imported);
        await persist(next, unlocked);
        setPayload(next);
        setStatus("암호문 파일을 합쳤습니다.");
      } catch {
        setStatus("이 파일은 이 열쇠로 열리지 않습니다.");
      } finally {
        setBusy(false);
      }
    },
    [persist, payload, unlocked],
  );

  useEffect(() => {
    setShowTraces(view === "hub");
  }, [view]);

  const visibleEntries = useMemo(() => {
    return payload.entries.filter((entry) =>
      view === "bok" ? entry.kind === "bok" : true,
    );
  }, [payload.entries, view]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-white/40">50/50 · BLIND</p>
          <h1 className="mt-1 text-2xl font-medium text-white/94">
            {view === "nakseo" ? "낙서 읽기" : view === "bok" ? "복불복" : "낙서 / 복불복"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            가람과 파트너만. 에이전트는 일기를 채우지 않습니다. 구글 메일·문자앱을 쑤지 않아도
            되게, 이 계정 방 열쇠로 그 기기에서 바로 엽니다.
          </p>
        </div>
        {unlocked ? (
          <button
            type="button"
            onClick={lock}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            잠금
          </button>
        ) : null}
      </header>

      {!unlocked ? (
        <LockForm
          passphrase={passphrase}
          seat={seat}
          busy={busy}
          status={status}
          onPassphrase={setPassphrase}
          onSeat={setSeat}
          onOpen={() => void openWithKey(passphrase, seat)}
        />
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-2" aria-label="방">
            <RoomLink href="/room" active={view === "hub"}>
              문
            </RoomLink>
            <RoomLink href="/room/nakseo" active={view === "nakseo"}>
              낙서 읽기
            </RoomLink>
            <RoomLink href="/room/bok" active={view === "bok"}>
              복불복
            </RoomLink>
            <button
              type="button"
              onClick={() => setShowTraces((value) => !value)}
              className={`rounded-lg px-3 py-2 text-sm ${
                showTraces ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
              }`}
            >
              흔적
            </button>
          </nav>

          <p className="mb-4 text-xs text-white/45">
            자리: {SEAT_LABEL[seat]} · 글 {payload.entries.length}
          </p>

          {view === "hub" ? <HubCards /> : null}

          {view === "bok" ? (
            <section className="rounded-2xl border border-white/8 bg-surface p-4 sm:p-5">
              <label htmlFor="bok-draft" className="text-sm text-white/80">
                막 쓰기. 복불복 전용. 내가 채우지 않습니다.
              </label>
              <textarea
                id="bok-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={10}
                maxLength={20000}
                autoComplete="off"
                spellCheck={false}
                className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-background px-3 py-3 text-sm leading-6 text-white/90 outline-none"
                placeholder="여기다 쓰면 됩니다."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveDraft()}
                  className="rounded-lg bg-accent px-3.5 py-2 text-sm text-white disabled:opacity-50"
                >
                  넣기
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void exportBlob()}
                  className="rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/75"
                >
                  암호문 받기
                </button>
                <label className="rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/75">
                  암호문 합치기
                  <input
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void importBlob(file);
                    }}
                  />
                </label>
              </div>
            </section>
          ) : null}

          {view === "nakseo" || view === "bok" ? (
            <section className="mt-6 space-y-3">
              <h2 className="text-sm text-white/70">
                {view === "nakseo" ? "읽기" : "이 방에 넣은 글"}
              </h2>
              {visibleEntries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-white/40">
                  비어 있습니다. 복불복에서 쓰면 여기 쌓입니다.
                </p>
              ) : (
                visibleEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-white/8 bg-surface px-4 py-4"
                  >
                    <p className="text-[11px] text-white/40">
                      {SEAT_LABEL[entry.seat]} · {entry.kind === "bok" ? "복불복" : "낙서"} ·{" "}
                      {formatWhen(entry.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/88">
                      {entry.body}
                    </p>
                  </article>
                ))
              )}
            </section>
          ) : null}

          {showTraces ? <TracePanel /> : null}

          {status ? <p className="mt-5 text-sm text-white/55">{status}</p> : null}
        </>
      )}
    </main>
  );
}

function RoomLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

function HubCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/room/nakseo"
        className="rounded-2xl border border-white/8 bg-surface p-5 hover:border-white/16"
      >
        <h2 className="text-lg text-white/92">낙서 읽기</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          이미 넣은 글만 봅니다. 검색창을 뒤지지 않아도 됩니다.
        </p>
      </Link>
      <Link
        href="/room/bok"
        className="rounded-2xl border border-white/8 bg-surface p-5 hover:border-white/16"
      >
        <h2 className="text-lg text-white/92">복불복</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          일기 전용. 빈 칸. 내가 문장을 넣지 않습니다.
        </p>
      </Link>
    </div>
  );
}

function LockForm({
  passphrase,
  seat,
  busy,
  status,
  onPassphrase,
  onSeat,
  onOpen,
}: {
  passphrase: string;
  seat: PrivateRoomSeat;
  busy: boolean;
  status: string;
  onPassphrase: (value: string) => void;
  onSeat: (value: PrivateRoomSeat) => void;
  onOpen: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-surface p-5 sm:p-6">
      <p className="text-sm leading-6 text-white/75">
        방 열쇠는 채팅·메일·문자에 적지 마세요. 두 사람만 아는 문장으로 정하면, 어느
        기기에서 이 경로로 들어와도 같은 낙서가 열립니다.
      </p>
      <fieldset className="mt-5">
        <legend className="text-xs text-white/45">자리</legend>
        <div className="mt-2 flex gap-2">
          <SeatButton current={seat} value="owner" onSelect={onSeat}>
            가람
          </SeatButton>
          <SeatButton current={seat} value="partner" onSelect={onSeat}>
            파트너
          </SeatButton>
        </div>
      </fieldset>
      <label htmlFor="room-key" className="mt-5 block text-sm text-white/80">
        방 열쇠
      </label>
      <input
        id="room-key"
        type="password"
        value={passphrase}
        onChange={(event) => onPassphrase(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onOpen();
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        className="mt-2 w-full rounded-xl border border-white/10 bg-background px-3 py-3 text-sm text-white/90 outline-none"
      />
      <p className="mt-2 text-xs text-white/35">
        {PRIVATE_ROOM_MIN_KEY_LENGTH}자 이상. 브라우저 비밀번호 저장은 끄고 쓰는 편이 맞습니다.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onOpen}
        className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm text-white disabled:opacity-50"
      >
        {busy ? "여는 중" : "열기"}
      </button>
      {status ? <p className="mt-4 text-sm text-white/55">{status}</p> : null}
      <TracePanel />
    </section>
  );
}

function SeatButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: PrivateRoomSeat;
  value: PrivateRoomSeat;
  onSelect: (value: PrivateRoomSeat) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-lg px-3 py-2 text-sm ${
        active ? "bg-white/12 text-white" : "text-white/55 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function TracePanel() {
  return (
    <section className="mt-6 rounded-2xl border border-white/8 bg-background/60 p-5">
      <h2 className="text-sm font-medium text-white/80">흔적 — 노력과 불가능한 것</h2>
      <div className="mt-4 grid gap-4 text-sm leading-6 text-muted sm:grid-cols-2">
        <div>
          <h3 className="text-xs tracking-wide text-white/45">막는 쪽</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>본문 평문은 git·메일·문자에 안 둡니다.</li>
            <li>공개 메뉴·검색엔진에 이 방을 올리지 않습니다.</li>
            <li>서버·이 기기에는 암호문만 둡니다. 열쇠는 창이 잠기면 메모리에서 지웁니다.</li>
            <li>에이전트는 일기를 대신 쓰지 않습니다.</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs tracking-wide text-white/45">불가능한 쪽</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>이 기기 관리자, 백업, 스크린샷, 클립보드는 남길 수 있습니다.</li>
            <li>연 호스트는 접속 시각·IP를 로그할 수 있습니다. 완전 익명은 안 됩니다.</li>
            <li>방 코드가 저장소에 있으면 “방이 있다”는 흔적은 남습니다.</li>
            <li>약한 열쇠면 암호문만 있어도 열릴 수 있습니다. 브라우저가 열쇠를 저장하면 구글/OS 쪽으로 새는 것과 같습니다.</li>
            <li>워커가 디스크 없이 뜨면 서버 쪽 암호문은 유실될 수 있습니다. 그때는 이 기기 저장 또는 암호문 파일이 남습니다.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
