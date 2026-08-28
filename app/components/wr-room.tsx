"use client";

// Copyright 2026 KARAM. All Rights Reserved.
// WR private rooms UI (낙서방 · 복불복) — key-gated, agent-blind data.

import { useCallback, useEffect, useMemo, useState } from "react";

type WrRoom = "scribble" | "bokbulbok";
type WrRole = "owner" | "em";

interface WrEntry {
  id: string;
  room: WrRoom;
  author: WrRole;
  text: string;
  tags: string[];
  createdAt: string;
}

const KEY_STORAGE = "wr_key";

const ROOM_LABELS: Record<WrRoom, string> = {
  scribble: "낙서방",
  bokbulbok: "복불복",
};

const AUTHOR_LABELS: Record<WrRole, string> = {
  owner: "가람",
  em: "EM",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Home-screen install helper: native prompt on Android/Chrome, hint on iOS. */
function InstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIOS(
        /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) &&
          !("MSStream" in window),
      );
      setStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as { standalone?: boolean }).standalone === true,
      );
    }, 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (standalone || dismissed) return null;
  if (!deferred && !isIOS) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 flex items-center justify-between gap-3">
      {deferred ? (
        <>
          <span>폰에 앱으로 설치할 수 있어요.</span>
          <button
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
            }}
            className="shrink-0 rounded-md bg-zinc-100 text-zinc-900 px-3 py-1.5 font-semibold hover:bg-white"
          >
            홈 화면에 추가
          </button>
        </>
      ) : (
        <span className="leading-relaxed">
          홈 화면에 추가: 하단 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>
        </span>
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        className="shrink-0 text-zinc-500 hover:text-zinc-300"
      >
        ✕
      </button>
    </div>
  );
}

export function WrRoomApp() {
  const [key, setKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [role, setRole] = useState<WrRole | null>(null);
  const [rooms, setRooms] = useState<WrRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<WrRoom | null>(null);
  const [entries, setEntries] = useState<WrEntry[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const loadEntries = useCallback(
    async (accessKey: string, room: WrRoom, q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ room });
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/wr/entries?${params}`, {
          headers: { "x-wr-key": accessKey },
        });
        if (!res.ok) {
          setStatus("불러오기 실패");
          return;
        }
        const data = (await res.json()) as { entries: WrEntry[] };
        setEntries(data.entries);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const authenticate = useCallback(
    async (candidate: string): Promise<boolean> => {
      const res = await fetch("/api/wr/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: candidate }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { role: WrRole; rooms: WrRoom[] };
      setKey(candidate);
      setRole(data.role);
      setRooms(data.rooms);
      const firstRoom = data.rooms[0] ?? null;
      setActiveRoom(firstRoom);
      if (firstRoom) await loadEntries(candidate, firstRoom, "");
      return true;
    },
    [loadEntries],
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/wr-sw.js", { scope: "/wr" })
        .catch(() => {
          // Installability is best-effort; the app works without the SW.
        });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Deferred so state updates happen asynchronously after mount.
    const timer = setTimeout(() => {
      const stored = window.localStorage.getItem(KEY_STORAGE);
      const boot = stored
        ? authenticate(stored).then((ok) => {
            if (!ok) window.localStorage.removeItem(KEY_STORAGE);
          })
        : Promise.resolve();
      void boot.finally(() => {
        if (!cancelled) setBooting(false);
      });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authenticate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) return;
    const ok = await authenticate(candidate);
    if (ok) {
      window.localStorage.setItem(KEY_STORAGE, candidate);
      setKeyInput("");
      setStatus(null);
    } else {
      setStatus("키가 맞지 않습니다");
    }
  }

  function switchRoom(room: WrRoom) {
    setActiveRoom(room);
    setQuery("");
    if (key) void loadEntries(key, room, "");
  }

  function handleLogout() {
    window.localStorage.removeItem(KEY_STORAGE);
    setKey(null);
    setRole(null);
    setRooms([]);
    setActiveRoom(null);
    setEntries([]);
  }

  async function handleSave() {
    if (!key || !activeRoom || !text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wr/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wr-key": key },
        body: JSON.stringify({ room: activeRoom, text }),
      });
      if (res.ok) {
        setText("");
        await loadEntries(key, activeRoom, query);
      } else {
        setStatus("저장 실패");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!key || !activeRoom) return;
    if (!window.confirm("이 글을 지울까요?")) return;
    const params = new URLSearchParams({ room: activeRoom, id });
    await fetch(`/api/wr/entries?${params}`, {
      method: "DELETE",
      headers: { "x-wr-key": key },
    });
    await loadEntries(key, activeRoom, query);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (key && activeRoom) await loadEntries(key, activeRoom, query);
  }

  async function searchTag(tag: string) {
    const q = `#${tag}`;
    setQuery(q);
    if (key && activeRoom) await loadEntries(key, activeRoom, q);
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const entry of entries) for (const tag of entry.tags) tags.add(tag);
    return [...tags];
  }, [entries]);

  if (booting) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center">
        <p>...</p>
      </main>
    );
  }

  if (!key || !role) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-lg font-semibold text-center">WR</h1>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="접근키"
            autoFocus
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-100 text-zinc-900 py-3 font-semibold hover:bg-white"
          >
            입장
          </button>
          {status && <p className="text-sm text-red-400 text-center">{status}</p>}
          <InstallHint />
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <header className="flex items-center justify-between">
          <div className="flex gap-2">
            {rooms.map((room) => (
              <button
                key={room}
                onClick={() => switchRoom(room)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  activeRoom === room
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {ROOM_LABELS[room]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{AUTHOR_LABELS[role]}</span>
            <button onClick={handleLogout} className="hover:text-zinc-300">
              나가기
            </button>
          </div>
        </header>

        <InstallHint />

        <section className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              activeRoom === "bokbulbok"
                ? "복불복 아이디어… (#태그 붙이면 나중에 찾기 쉬움)"
                : "막 써 (#태그 가능)"
            }
            rows={4}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-500 resize-y"
          />
          <button
            onClick={handleSave}
            disabled={loading || !text.trim()}
            className="rounded-lg bg-zinc-100 text-zinc-900 px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-white"
          >
            저장
          </button>
        </section>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색 (글자 또는 #태그)"
            className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            찾기
          </button>
        </form>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => searchTag(tag)}
                className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-100"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <section className="space-y-3">
          {loading && <p className="text-sm text-zinc-500">불러오는 중…</p>}
          {!loading && entries.length === 0 && (
            <p className="text-sm text-zinc-600">아직 글이 없습니다.</p>
          )}
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {AUTHOR_LABELS[entry.author]} · {formatDate(entry.createdAt)}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="hover:text-red-400"
                >
                  삭제
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {entry.text}
              </p>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => searchTag(tag)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        {status && <p className="text-sm text-red-400">{status}</p>}
      </div>
    </main>
  );
}
