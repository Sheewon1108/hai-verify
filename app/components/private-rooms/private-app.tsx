"use client";

// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { deriveVaultKey } from "@/app/lib/private-rooms/crypto";
import { tracesByKind } from "@/app/lib/private-rooms/traces";
import {
  type PersistMode,
  type PrivateSeat,
} from "@/app/lib/private-rooms/types";
import { base64ToBytes } from "@/app/lib/private-rooms/bytes";

interface SessionState {
  configured: boolean;
  persistMode: PersistMode;
  hasPartnerKey: boolean;
  allowSetup: boolean;
  authenticated: boolean;
  seat: PrivateSeat | null;
  vaultSalt: string | null;
}

interface PrivateContextValue {
  ready: boolean;
  seat: PrivateSeat;
  persistMode: PersistMode;
  vaultKey: CryptoKey;
  refresh: () => Promise<void>;
}

const PrivateContext = createContext<PrivateContextValue | null>(null);

export function usePrivateRoom(): PrivateContextValue {
  const value = useContext(PrivateContext);
  if (!value) {
    throw new Error("Private room gate is closed");
  }
  return value;
}

async function readJson(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
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

function errorLabel(code: string): string {
  switch (code) {
    case "DENIED":
      return "열쇠가 맞지 않는다.";
    case "RATE_LIMIT":
      return "잠시 뒤에 다시.";
    case "PASS_TOO_SHORT":
      return "열쇠는 8자 이상.";
    case "SETUP_LOCKED":
      return "이 자리에서는 처음 열쇠를 만들 수 없다.";
    case "ALREADY_CONFIGURED":
      return "이미 방이 있다.";
    default:
      return "지금은 안 된다.";
  }
}

function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-5 py-12">
      <p className="text-[11px] tracking-[0.2em] text-white/35">PRIVATE · 50/50 · BLIND</p>
      <h1 className="mt-3 text-2xl font-medium text-white/92">나와 그 양반만</h1>
      <p className="mt-2 text-sm leading-6 text-white/55">
        낙서와 복불복. 검증 없음. 구글메일·문자앱보다 본문을 밖에 안 둔다.
      </p>
      <div className="mt-8">{children}</div>
    </main>
  );
}

function AuthForm({
  mode,
  busy,
  error,
  onSubmit,
}: {
  mode: "setup" | "login";
  busy: boolean;
  error: string | null;
  onSubmit: (input: { passphrase: string; partnerPassphrase: string; seat: PrivateSeat }) => void;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [partnerPassphrase, setPartnerPassphrase] = useState("");
  const [seat, setSeat] = useState<PrivateSeat>("owner");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ passphrase, partnerPassphrase, seat });
      }}
    >
      <label className="block space-y-2">
        <span className="text-xs text-white/50">{mode === "setup" ? "방 열쇠" : "열쇠"}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-white/25"
        />
      </label>
      {mode === "setup" ? (
        <label className="block space-y-2">
          <span className="text-xs text-white/50">그 양반 열쇠 (비우면 같은 열쇠)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={partnerPassphrase}
            onChange={(event) => setPartnerPassphrase(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </label>
      ) : null}
      <fieldset className="flex gap-3">
        <legend className="sr-only">좌석</legend>
        {(
          [
            ["owner", "나"],
            ["partner", "그양반"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm ${
              seat === value
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-white/60"
            }`}
          >
            <input
              type="radio"
              name="seat"
              value={value}
              checked={seat === value}
              onChange={() => setSeat(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>
      {error ? <p className="text-sm text-[#ff8a9a]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || passphrase.length === 0}
        className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm font-medium text-[#1a1a2e] disabled:opacity-40"
      >
        {busy ? "여는 중…" : mode === "setup" ? "방 만들기" : "들어가기"}
      </button>
    </form>
  );
}

function PrivateNav({
  seat,
  persistMode,
  onLeave,
}: {
  seat: PrivateSeat;
  persistMode: PersistMode;
  onLeave: () => void;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/private", label: "로비" },
    { href: "/private/nakseo", label: "낙서" },
    { href: "/private/bokbulbok", label: "복불복" },
  ];

  return (
    <header className="border-b border-white/[0.06] px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm" aria-label="Private rooms">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 ${
                  active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span>{seat === "owner" ? "나" : "그양반"}</span>
          {persistMode === "memory" ? <span>이 프로세스가 꺼지면 글이 사라질 수 있음</span> : null}
          <button type="button" onClick={onLeave} className="text-white/55 hover:text-white">
            나가기
          </button>
        </div>
      </div>
    </header>
  );
}

export function PrivateApp({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionState | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const data = await readJson("/api/private-rooms/session");
    setStatus({
      configured: Boolean(data.configured),
      persistMode: (data.persistMode as PersistMode) ?? "file",
      hasPartnerKey: Boolean(data.hasPartnerKey),
      allowSetup: Boolean(data.allowSetup),
      authenticated: Boolean(data.authenticated),
      seat: data.seat === "partner" || data.seat === "owner" ? data.seat : null,
      vaultSalt: typeof data.vaultSalt === "string" ? data.vaultSalt : null,
    });
  }, []);

  useEffect(() => {
    void loadStatus().catch(() => {
      setStatus({
        configured: false,
        persistMode: "memory",
        hasPartnerKey: false,
        allowSetup: false,
        authenticated: false,
        seat: null,
        vaultSalt: null,
      });
    });
  }, [loadStatus]);

  const unlock = useCallback(async (passphrase: string, vaultSalt: string) => {
    const key = await deriveVaultKey(passphrase, base64ToBytes(vaultSalt));
    setVaultKey(key);
  }, []);

  const submit = useCallback(
    async (input: { passphrase: string; partnerPassphrase: string; seat: PrivateSeat }) => {
      setBusy(true);
      setError(null);
      try {
        const action = status?.configured ? "login" : "setup";
        const data = await readJson("/api/private-rooms/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            passphrase: input.passphrase,
            partnerPassphrase: input.partnerPassphrase || undefined,
            seat: input.seat,
          }),
        });
        const salt = typeof data.vaultSalt === "string" ? data.vaultSalt : "";
        await unlock(input.passphrase, salt);
        await loadStatus();
      } catch (err) {
        setError(errorLabel(err instanceof Error ? err.message : "REQUEST_FAILED"));
      } finally {
        setBusy(false);
      }
    },
    [loadStatus, status?.configured, unlock],
  );

  const leave = useCallback(async () => {
    setVaultKey(null);
    await fetch("/api/private-rooms/session", { method: "DELETE", credentials: "same-origin" });
    await loadStatus();
  }, [loadStatus]);

  const contextValue = useMemo<PrivateContextValue | null>(() => {
    if (!status?.authenticated || !status.seat || !vaultKey) return null;
    return {
      ready: true,
      seat: status.seat,
      persistMode: status.persistMode,
      vaultKey,
      refresh: loadStatus,
    };
  }, [loadStatus, status, vaultKey]);

  if (!status) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-white/40">
        여는 중…
      </div>
    );
  }

  if (!status.configured && !status.allowSetup) {
    return (
      <GateShell>
        <p className="text-sm leading-6 text-white/60">
          이 서버에는 아직 방 열쇠가 없다. 로컬(127.0.0.1)에서 처음 만들거나, Owner가
          서버 설정으로 열어야 한다.
        </p>
      </GateShell>
    );
  }

  if (!contextValue) {
    return (
      <GateShell>
        <AuthForm
          mode={status.configured ? "login" : "setup"}
          busy={busy}
          error={error}
          onSubmit={submit}
        />
      </GateShell>
    );
  }

  return (
    <PrivateContext.Provider value={contextValue}>
      <div className="flex min-h-dvh flex-col">
        <PrivateNav seat={contextValue.seat} persistMode={contextValue.persistMode} onLeave={() => void leave()} />
        <div className="flex-1">{children}</div>
      </div>
    </PrivateContext.Provider>
  );
}

export function LobbyView() {
  const reduced = tracesByKind("reduced");
  const impossible = tracesByKind("impossible");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] tracking-[0.2em] text-white/35">BLIND · 50/50</p>
      <h1 className="mt-3 text-3xl font-medium text-white/92">막 쓰면 된다</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
        에이전트 규칙 없음. 낙서는 일기, 복불복은 제비. 같은 열쇠로 이 서버에 붙은 기기에서
        그대로 보인다.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/private/nakseo"
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 hover:border-white/20"
        >
          <p className="text-lg text-white/90">낙서</p>
          <p className="mt-2 text-sm text-white/45">읽고 쓰기. 잔소리 없음.</p>
        </Link>
        <Link
          href="/private/bokbulbok"
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 hover:border-white/20"
        >
          <p className="text-lg text-white/90">복불복</p>
          <p className="mt-2 text-sm text-white/45">전용. 줄 적고 하나 뽑기.</p>
        </Link>
      </div>
      <section className="mt-12 space-y-6">
        <h2 className="text-sm text-white/70">흔적 — 노력한 것 / 불가능한 것</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs tracking-wide text-white/40">줄인 것</p>
            <ul className="mt-3 space-y-3">
              {reduced.map((item) => (
                <li key={item.id} className="text-sm leading-6 text-white/70">
                  <span className="text-white/90">{item.title}</span>
                  <span className="mt-1 block text-white/45">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wide text-white/40">지울 수 없는 것</p>
            <ul className="mt-3 space-y-3">
              {impossible.map((item) => (
                <li key={item.id} className="text-sm leading-6 text-white/70">
                  <span className="text-white/90">{item.title}</span>
                  <span className="mt-1 block text-white/45">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
