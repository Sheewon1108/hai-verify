"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { TraceLimit } from "@/app/lib/private-rooms/traces";
import type {
  BokbulbokDraw,
  BokbulbokSlip,
  PrivateRoomEntry,
  PrivateRoomId,
  PrivateRoomSeat,
  StoreHealth,
} from "@/app/lib/private-rooms/types";

type View = "gate" | "hub" | PrivateRoomId;

interface SessionState {
  authed: boolean;
  setupRequired: boolean;
  seat?: PrivateRoomSeat;
  store?: StoreHealth;
  limits: TraceLimit[];
}

const emptySession: SessionState = {
  authed: false,
  setupRequired: false,
  limits: [],
};

function seatLabel(seat: PrivateRoomSeat | undefined): string {
  if (seat === "em") return "그양반";
  if (seat === "owner") return "나";
  return "";
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export function RoomsApp({ initialRoom }: { initialRoom?: PrivateRoomId }) {
  const [session, setSession] = useState<SessionState>(emptySession);
  const [view, setView] = useState<View>(initialRoom ?? "gate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/private-rooms/session", { cache: "no-store" });
    const data = await readJson<SessionState & { ok?: boolean }>(res);
    setSession({
      authed: Boolean(data.authed),
      setupRequired: Boolean(data.setupRequired),
      seat: data.seat,
      store: data.store,
      limits: data.limits ?? [],
    });
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((data) => {
        if (cancelled) return;
        if (data.authed) {
          setView(initialRoom ?? "hub");
        } else {
          setView("gate");
        }
      })
      .catch(() => {
        if (!cancelled) setError("방을 열 수 없습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialRoom, refreshSession]);

  async function logout() {
    setBusy(true);
    await fetch("/api/private-rooms/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setSession(emptySession);
    setView("gate");
    setBusy(false);
    await refreshSession();
  }

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl items-center justify-center px-4">
        <p className="text-sm text-white/45">…</p>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[#12121f] text-[#ecece8]">
      <header className="border-b border-white/8 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-xs tracking-[0.18em] text-white/40">PRIVATE · 50/50 · BLIND</p>
          {session.authed ? (
            <div className="flex items-center gap-3 text-xs text-white/55">
              <span>{seatLabel(session.seat)}</span>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={busy}
                className="rounded-md border border-white/12 px-2 py-1 text-white/70 hover:bg-white/5"
              >
                나가기
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {session.store && !session.store.durable ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            이 호스트는 파일이 안 남습니다. 127.0.0.1 로컬에서 쓰세요.
          </p>
        ) : null}

        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

        {!session.authed ? (
          <Gate
            setupRequired={session.setupRequired}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            onAuthed={async () => {
              const next = await refreshSession();
              if (next.authed) setView(initialRoom ?? "hub");
            }}
          />
        ) : view === "hub" ? (
          <Hub onOpen={setView} />
        ) : view === "diary" ? (
          <DiaryRoom seat={session.seat} onBack={() => setView("hub")} />
        ) : (
          <BokbulbokRoom seat={session.seat} onBack={() => setView("hub")} />
        )}

        <LimitsPanel limits={session.limits} />
      </div>
    </div>
  );
}

function Gate({
  setupRequired,
  busy,
  setBusy,
  setError,
  onAuthed,
}: {
  setupRequired: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (value: string) => void;
  onAuthed: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "setup">(setupRequired ? "setup" : "login");
  const [seat, setSeat] = useState<PrivateRoomSeat>("owner");
  const [passphrase, setPassphrase] = useState("");
  const [ownerPass, setOwnerPass] = useState("");
  const [emPass, setEmPass] = useState("");

  useEffect(() => {
    setMode(setupRequired ? "setup" : "login");
  }, [setupRequired]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", seat, passphrase }),
    });
    setBusy(false);
    setPassphrase("");
    if (!res.ok) {
      setError("자리가 맞지 않습니다.");
      return;
    }
    await onAuthed();
  }

  async function setup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup", ownerPass, emPass }),
    });
    const data = await readJson<{ ok?: boolean; error?: string }>(res);
    setBusy(false);
    if (!data.ok) {
      setError(data.error === "PASS_TOO_SHORT" ? "암호는 10자 이상." : "자리를 만들 수 없습니다.");
      return;
    }
    setOwnerPass("");
    setEmPass("");
    setMode("login");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">닫힌 방</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
          구글 메일·문자앱을 열지 않는다. 이 계정 자리로 들어가면 그 기기에서 낙서와 복불복이
          바로 열린다. 나와 그양반만.
        </p>
      </div>

      {mode === "setup" ? (
        <form onSubmit={(event) => void setup(event)} className="space-y-4 rounded-2xl border border-white/8 bg-[#1b1b2c] p-4">
          <p className="text-sm text-white/70">처음 한 번 — 두 자리 암호를 이 호스트에만 심는다.</p>
          <label className="block space-y-1 text-sm">
            <span className="text-white/50">나</span>
            <input
              type="password"
              autoComplete="new-password"
              value={ownerPass}
              onChange={(event) => setOwnerPass(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              minLength={10}
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-white/50">그양반</span>
            <input
              type="password"
              autoComplete="new-password"
              value={emPass}
              onChange={(event) => setEmPass(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              minLength={10}
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#ff0033] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            자리 만들기
          </button>
        </form>
      ) : (
        <form onSubmit={(event) => void login(event)} className="space-y-4 rounded-2xl border border-white/8 bg-[#1b1b2c] p-4">
          <div className="flex gap-2">
            <SeatButton current={seat} value="owner" onPick={setSeat} label="나" />
            <SeatButton current={seat} value="em" onPick={setSeat} label="그양반" />
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-white/50">자리 암호</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#ff0033] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            이 기기에서 열기
          </button>
          {setupRequired ? (
            <button
              type="button"
              className="block text-xs text-white/40 underline"
              onClick={() => setMode("setup")}
            >
              아직 자리가 없으면 만들기
            </button>
          ) : null}
        </form>
      )}
    </section>
  );
}

function SeatButton({
  current,
  value,
  onPick,
  label,
}: {
  current: PrivateRoomSeat;
  value: PrivateRoomSeat;
  onPick: (seat: PrivateRoomSeat) => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
        active ? "border-[#ff0033]/60 bg-[#ff0033]/15 text-white" : "border-white/10 text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

function Hub({ onOpen }: { onOpen: (view: View) => void }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium">방</h1>
        <p className="mt-2 text-sm text-white/50">일기 전용으로 막 쓰고, 복불복은 따로.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onOpen("diary")}
          className="rounded-2xl border border-white/8 bg-[#1b1b2c] p-5 text-left hover:border-white/20"
        >
          <p className="text-xs tracking-[0.16em] text-white/35">READ / WRITE</p>
          <p className="mt-2 text-lg">낙서 · 일기</p>
          <p className="mt-2 text-sm text-white/50">읽기와 자유 기록. 에이전트는 안 씀.</p>
        </button>
        <button
          type="button"
          onClick={() => onOpen("bokbulbok")}
          className="rounded-2xl border border-white/8 bg-[#1b1b2c] p-5 text-left hover:border-white/20"
        >
          <p className="text-xs tracking-[0.16em] text-white/35">DRAW ONLY</p>
          <p className="mt-2 text-lg">복불복</p>
          <p className="mt-2 text-sm text-white/50">쪽지 넣고 하나 뽑기. 이 방 전용.</p>
        </button>
      </div>
    </section>
  );
}

function DiaryRoom({
  seat,
  onBack,
}: {
  seat: PrivateRoomSeat | undefined;
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<PrivateRoomEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openEntry = useMemo(
    () => entries.find((entry) => entry.id === openId) ?? null,
    [entries, openId],
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/private-rooms/entries?room=diary", { cache: "no-store" });
    const data = await readJson<{ ok?: boolean; entries?: PrivateRoomEntry[] }>(res);
    if (data.ok) setEntries(data.entries ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "diary", body: draft }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("저장 실패.");
      return;
    }
    setDraft("");
    await load();
  }

  async function saveEdit() {
    if (!openEntry) return;
    setBusy(true);
    const res = await fetch("/api/private-rooms/entries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "diary", id: openEntry.id, body: openEntry.body }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("고치기 실패.");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch("/api/private-rooms/entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "diary", id }),
    });
    setBusy(false);
    if (openId === id) setOpenId(null);
    await load();
  }

  return (
    <section className="space-y-5">
      <RoomTop title="낙서 · 일기" onBack={onBack} href="/rooms/diary" />
      <p className="text-sm text-white/50">
        {seatLabel(seat)}만 쓰는 칸이 아니다. 두 자리 모두 읽고 쓴다. 에이전트 칸 없음.
      </p>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={7}
        placeholder="막 쓰세요. 이 기기에서 저장하면 같은 자리로 들어간 다른 기기에도 보입니다."
        className="w-full resize-y rounded-2xl border border-white/10 bg-[#1b1b2c] px-4 py-3 text-[15px] leading-7"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || !draft.trim()}
        className="rounded-lg bg-[#ff0033] px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        저장
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ul className="space-y-2">
          {entries.length === 0 ? (
            <li className="text-sm text-white/35">아직 없음.</li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(entry.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    openId === entry.id
                      ? "border-white/25 bg-white/8"
                      : "border-white/8 bg-[#1b1b2c] text-white/75"
                  }`}
                >
                  <span className="block truncate">{entry.body}</span>
                  <span className="mt-1 block text-[11px] text-white/35">
                    {seatLabel(entry.authorSeat)} · {formatWhen(entry.updatedAt)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        {openEntry ? (
          <article className="space-y-3 rounded-2xl border border-white/8 bg-[#1b1b2c] p-4">
            <textarea
              value={openEntry.body}
              onChange={(event) => {
                const body = event.target.value;
                setEntries((current) =>
                  current.map((item) => (item.id === openEntry.id ? { ...item, body } : item)),
                );
              }}
              rows={12}
              className="w-full resize-y bg-transparent text-[15px] leading-7"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={busy}
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs"
              >
                고친 것 저장
              </button>
              <button
                type="button"
                onClick={() => void remove(openEntry.id)}
                disabled={busy}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50"
              >
                지우기
              </button>
            </div>
          </article>
        ) : (
          <p className="text-sm text-white/35">왼쪽에서 읽어 보세요.</p>
        )}
      </div>
    </section>
  );
}

function BokbulbokRoom({
  seat,
  onBack,
}: {
  seat: PrivateRoomSeat | undefined;
  onBack: () => void;
}) {
  const [notes, setNotes] = useState<PrivateRoomEntry[]>([]);
  const [slips, setSlips] = useState<BokbulbokSlip[]>([]);
  const [draws, setDraws] = useState<BokbulbokDraw[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [slipDraft, setSlipDraft] = useState("");
  const [lastDraw, setLastDraw] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [notesRes, drawRes] = await Promise.all([
      fetch("/api/private-rooms/entries?room=bokbulbok", { cache: "no-store" }),
      fetch("/api/private-rooms/draw", { cache: "no-store" }),
    ]);
    const notesData = await readJson<{ ok?: boolean; entries?: PrivateRoomEntry[] }>(notesRes);
    const drawData = await readJson<{
      ok?: boolean;
      slips?: BokbulbokSlip[];
      draws?: BokbulbokDraw[];
    }>(drawRes);
    if (notesData.ok) setNotes(notesData.entries ?? []);
    if (drawData.ok) {
      setSlips(drawData.slips ?? []);
      setDraws(drawData.draws ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveNote() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "bokbulbok", body: noteDraft }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("메모 저장 실패.");
      return;
    }
    setNoteDraft("");
    await load();
  }

  async function addSlip() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", text: slipDraft }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("쪽지를 넣지 못했습니다.");
      return;
    }
    setSlipDraft("");
    await load();
  }

  async function removeSlip(id: string) {
    setBusy(true);
    await fetch("/api/private-rooms/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setBusy(false);
    await load();
  }

  async function draw() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/private-rooms/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draw" }),
    });
    const data = await readJson<{ ok?: boolean; draw?: BokbulbokDraw; error?: string }>(res);
    setBusy(false);
    if (!data.ok || !data.draw) {
      setError(data.error === "NO_SLIPS" ? "쪽지가 없습니다." : "뽑기 실패.");
      return;
    }
    setLastDraw(data.draw.text);
    await load();
  }

  return (
    <section className="space-y-6">
      <RoomTop title="복불복" onBack={onBack} href="/rooms/bokbulbok" />
      <p className="text-sm text-white/50">
        전용 방. {seatLabel(seat)}와 그 한 사람만. 쪽지를 넣고 하나를 뽑는다.
      </p>

      <div className="rounded-2xl border border-white/8 bg-[#1b1b2c] p-4">
        <p className="text-xs tracking-[0.16em] text-white/35">뽑기</p>
        {lastDraw ? (
          <p className="mt-3 text-xl leading-8">{lastDraw}</p>
        ) : (
          <p className="mt-3 text-sm text-white/40">아직 안 뽑음.</p>
        )}
        <button
          type="button"
          onClick={() => void draw()}
          disabled={busy || slips.length === 0}
          className="mt-4 rounded-lg bg-[#ff0033] px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          하나 뽑기
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm text-white/60">쪽지</h2>
          <div className="flex gap-2">
            <input
              value={slipDraft}
              onChange={(event) => setSlipDraft(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#1b1b2c] px-3 py-2 text-sm"
              placeholder="넣을 말"
            />
            <button
              type="button"
              onClick={() => void addSlip()}
              disabled={busy || !slipDraft.trim()}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm"
            >
              넣기
            </button>
          </div>
          <ul className="space-y-2">
            {slips.map((slip) => (
              <li
                key={slip.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/8 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{slip.text}</span>
                <button
                  type="button"
                  onClick={() => void removeSlip(slip.id)}
                  className="shrink-0 text-xs text-white/35"
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm text-white/60">이 방 낙서</h2>
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-[#1b1b2c] px-3 py-2 text-sm"
            placeholder="복불복 전용으로 막 쓰기"
          />
          <button
            type="button"
            onClick={() => void saveNote()}
            disabled={busy || !noteDraft.trim()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm"
          >
            메모 저장
          </button>
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-white/8 px-3 py-2 text-sm text-white/75">
                <p className="whitespace-pre-wrap">{note.body}</p>
                <p className="mt-1 text-[11px] text-white/35">{formatWhen(note.updatedAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {draws.length > 0 ? (
        <div>
          <h2 className="text-sm text-white/60">최근 뽑기</h2>
          <ul className="mt-2 space-y-1 text-sm text-white/50">
            {draws.slice(0, 8).map((draw) => (
              <li key={draw.id}>
                {draw.text} · {formatWhen(draw.drawnAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}

function RoomTop({ title, onBack, href }: { title: string; onBack: () => void; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-sm text-white/45">
          방 목록
        </button>
        <h1 className="text-2xl font-medium">{title}</h1>
      </div>
      <Link href={href} className="text-[11px] text-white/25">
        주소 고정
      </Link>
    </div>
  );
}

function LimitsPanel({ limits }: { limits: TraceLimit[] }) {
  const [open, setOpen] = useState(false);
  if (limits.length === 0) return null;
  const possible = limits.filter((item) => item.possible);
  const impossible = limits.filter((item) => !item.possible);

  return (
    <section className="mt-10 border-t border-white/8 pt-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-xs tracking-[0.14em] text-white/35"
      >
        흔적 — 되는 것 / 안 되는 것 {open ? "닫기" : "열기"}
      </button>
      {open ? (
        <div className="mt-4 grid gap-6 text-sm leading-6 text-white/60 md:grid-cols-2">
          <div>
            <p className="mb-2 text-white/80">되는 것 (노력)</p>
            <ul className="space-y-3">
              {possible.map((item) => (
                <li key={item.id}>
                  <p className="text-white/85">{item.title}</p>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-white/80">불가능한 것</p>
            <ul className="space-y-3">
              {impossible.map((item) => (
                <li key={item.id}>
                  <p className="text-white/85">{item.title}</p>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
