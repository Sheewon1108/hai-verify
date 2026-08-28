"use client";

// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import { useCallback, useEffect, useMemo, useState } from "react";
import { decryptText, encryptText } from "@/app/lib/private-rooms/crypto";
import { drawOne, parseDrawLines } from "@/app/lib/private-rooms/draw";
import {
  MAX_NOTE_CHARS,
  type EncryptedNote,
  type NoteKind,
  type PrivateRoomId,
  type PrivateSeat,
} from "@/app/lib/private-rooms/types";
import { usePrivateRoom } from "./private-app";

interface OpenNote {
  id: string;
  kind: NoteKind;
  seat: PrivateSeat;
  createdAt: string;
  updatedAt: string;
  text: string;
  locked: boolean;
}

function seatLabel(seat: PrivateSeat): string {
  return seat === "owner" ? "나" : "그양반";
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function api(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok || data.ok === false) {
    throw new Error(typeof data.error === "string" ? data.error : "REQUEST_FAILED");
  }
  return data;
}

export function RoomView({ room }: { room: PrivateRoomId }) {
  const { vaultKey } = usePrivateRoom();
  const [notes, setNotes] = useState<OpenNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [drawInput, setDrawInput] = useState("");
  const [drawResult, setDrawResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const active = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [activeId, notes],
  );

  const load = useCallback(async () => {
    const data = await api(`/api/private-rooms/notes?room=${room}`);
    const encrypted = Array.isArray(data.notes) ? (data.notes as EncryptedNote[]) : [];
    const opened = await Promise.all(
      encrypted.map(async (note) => {
        try {
          const text = await decryptText(vaultKey, note.iv, note.ciphertext);
          return {
            id: note.id,
            kind: note.kind,
            seat: note.seat,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            text,
            locked: false,
          } satisfies OpenNote;
        } catch {
          return {
            id: note.id,
            kind: note.kind,
            seat: note.seat,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            text: "",
            locked: true,
          } satisfies OpenNote;
        }
      }),
    );
    setNotes(opened);
    setActiveId((current) => current ?? opened[0]?.id ?? null);
    setLoading(false);
  }, [room, vaultKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeId) {
      setDraft("");
      return;
    }
    const current = notes.find((note) => note.id === activeId);
    if (!current || current.locked) return;
    setDraft(current.text);
    // Switching notes only — do not reset while the same note autosaves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const persist = useCallback(
    async (id: string | null, text: string, kind: NoteKind = "note") => {
      if (text.length > MAX_NOTE_CHARS) {
        setSaving("error");
        return;
      }
      setSaving("saving");
      try {
        const packed = await encryptText(vaultKey, text);
        if (id) {
          await api("/api/private-rooms/notes", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...packed }),
          });
          setNotes((current) =>
            current.map((note) =>
              note.id === id
                ? { ...note, text, updatedAt: new Date().toISOString() }
                : note,
            ),
          );
        } else {
          const created = await api("/api/private-rooms/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room, kind, ...packed }),
          });
          const note = created.note as EncryptedNote;
          const open: OpenNote = {
            id: note.id,
            kind: note.kind,
            seat: note.seat,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            text,
            locked: false,
          };
          setNotes((current) => [open, ...current.filter((item) => item.id !== open.id)]);
          setActiveId(open.id);
        }
        setSaving("saved");
      } catch {
        setSaving("error");
      }
    },
    [room, vaultKey],
  );

  useEffect(() => {
    if (loading) return;
    if (active?.locked) return;
    if (active && draft === active.text) return;
    if (!active && draft.length === 0) return;
    const timer = window.setTimeout(() => {
      void persist(active?.id ?? null, draft, active?.kind ?? "note");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [active, draft, loading, persist]);

  const createNote = useCallback(async () => {
    setDraft("");
    setActiveId(null);
    await persist(null, "", "note");
  }, [persist]);

  const remove = useCallback(async (id: string) => {
    await api(`/api/private-rooms/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setNotes((current) => current.filter((note) => note.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const runDraw = useCallback(async () => {
    const options = parseDrawLines(drawInput);
    if (options.length === 0) {
      setDrawResult(null);
      return;
    }
    const picked = drawOne(options);
    setDrawResult(picked);
    const record = `뽑기: ${picked}\n\n${options.map((line) => `- ${line}`).join("\n")}`;
    await persist(null, record, "draw");
  }, [drawInput, persist]);

  const title = room === "nakseo" ? "낙서" : "복불복";
  const hint =
    room === "nakseo"
      ? "일기처럼 막 쓰면 된다. 자동 저장."
      : "전용. 줄마다 하나, 복불복 누르면 하나가 남는다.";

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-3.25rem)] w-full max-w-5xl grid-cols-1 md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-white/[0.06] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-white/90">{title}</p>
            <p className="mt-1 text-[11px] text-white/35">{hint}</p>
          </div>
          <button
            type="button"
            onClick={() => void createNote()}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70"
          >
            새 글
          </button>
        </div>
        <ul className="max-h-56 overflow-auto px-2 pb-3 md:max-h-none">
          {loading ? <li className="px-2 py-3 text-xs text-white/35">불러오는 중…</li> : null}
          {!loading && notes.length === 0 ? (
            <li className="px-2 py-3 text-xs text-white/35">아직 없음</li>
          ) : null}
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setActiveId(note.id)}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-left ${
                  note.id === activeId ? "bg-white/10" : "hover:bg-white/[0.04]"
                }`}
              >
                <p className="truncate text-sm text-white/85">
                  {note.locked ? "열 수 없음" : note.text.split("\n")[0] || "빈 글"}
                </p>
                <p className="mt-1 text-[11px] text-white/35">
                  {note.kind === "draw" ? "복불복 · " : ""}
                  {seatLabel(note.seat)} · {formatWhen(note.updatedAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex flex-col px-4 py-4">
        {room === "bokbulbok" ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="block text-xs text-white/45">한 줄에 하나</label>
            <textarea
              value={drawInput}
              onChange={(event) => setDrawInput(event.target.value)}
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/90 outline-none"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void runDraw()}
                className="rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-[#1a1a2e]"
              >
                복불복
              </button>
              {drawResult ? <p className="text-sm text-white/80">{drawResult}</p> : null}
            </div>
          </div>
        ) : null}
        {active?.locked ? (
          <p className="text-sm text-white/50">이 열쇠로는 안 열리는 글.</p>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={room === "nakseo" ? "여기." : "뽑아낸 것, 남겨둘 말."}
              className="min-h-72 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-base leading-7 text-white caret-white outline-none placeholder:text-white/30"
            />
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/35">
              <span>
                {saving === "saving"
                  ? "저장 중"
                  : saving === "saved"
                    ? "저장됨"
                    : saving === "error"
                      ? "저장 실패"
                      : "자동 저장"}
              </span>
              {active ? (
                <button type="button" onClick={() => void remove(active.id)} className="text-white/45 hover:text-white/80">
                  지우기
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
