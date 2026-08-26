// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.
// Gmail READ-ONLY. This module never calls users.messages.send or drafts.send.

import watchList from "@/hai-ic/outreach/reply-watch.json";
import seenFile from "@/hai-ic/outreach/reply-seen.json";
import { notifyOutreachReply } from "@/app/lib/outreach-reply-notify";

const READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const GRANT_MISSING = "gmail_readonly_grant_missing";
const AFTER_YMD_DEFAULT = "2026/08/26";

export type GmailWatchContact = { id: string; company: string; email: string };

type ReplyWatchFile = {
  notifyHint?: string;
  afterYmd?: string;
  contacts: GmailWatchContact[];
};

const watch = watchList as ReplyWatchFile;

export function gmailReadonlyScope(): string {
  return READONLY_SCOPE;
}

export function gmailReadonlyGrantMissingCode(): string {
  return GRANT_MISSING;
}

export function buildWatchQuery(
  contacts: readonly GmailWatchContact[] = watch.contacts,
  afterYmd = watch.afterYmd ?? AFTER_YMD_DEFAULT,
): string {
  const from = contacts.map((c) => `from:${c.email}`).join(" OR ");
  return `(${from}) after:${afterYmd} -in:sent`;
}

function runtimeEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function oauthClientId(): string | undefined {
  return runtimeEnv("GMAIL_OAUTH_CLIENT_ID") || runtimeEnv("GMAIL_CLIENT_ID");
}

function oauthClientSecret(): string | undefined {
  return runtimeEnv("GMAIL_OAUTH_CLIENT_SECRET") || runtimeEnv("GMAIL_CLIENT_SECRET");
}

export function gmailReadonlyConfigured(): boolean {
  return Boolean(oauthClientId() && oauthClientSecret() && runtimeEnv("GMAIL_REFRESH_TOKEN"));
}

export function gmailReadonlyStatus(): {
  configured: boolean;
  readonly: true;
  scope: string;
  query: string;
  error?: string;
} {
  const configured = gmailReadonlyConfigured();
  return {
    configured,
    readonly: true,
    scope: READONLY_SCOPE,
    query: buildWatchQuery(),
    ...(configured ? {} : { error: GRANT_MISSING }),
  };
}

async function refreshAccessToken(): Promise<string> {
  const clientId = oauthClientId();
  const clientSecret = oauthClientSecret();
  const refreshToken = runtimeEnv("GMAIL_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(GRANT_MISSING);
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`gmail_token_refresh_failed:${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("gmail_token_refresh_empty");
  return json.access_token;
}

function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string,
): string {
  const hit = headers?.find((h) => (h.name || "").toLowerCase() === name.toLowerCase());
  return (hit?.value || "").trim();
}

export type GmailReplyHit = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
};

export async function listWatchedReplies(options?: {
  afterYmd?: string;
  seenIds?: readonly string[];
}): Promise<{ hits: GmailReplyHit[]; query: string }> {
  const access = await refreshAccessToken();
  const query = buildWatchQuery(watch.contacts, options?.afterYmd ?? watch.afterYmd ?? AFTER_YMD_DEFAULT);
  const listUrl = new URL(`${GMAIL_API}/messages`);
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", "20");

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!listRes.ok) {
    throw new Error(`gmail_list_failed:${listRes.status}`);
  }
  const listed = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const seen = new Set(options?.seenIds ?? seenFile.messageIds);
  const fresh = (listed.messages ?? []).filter((m) => m.id && !seen.has(m.id));

  const hits: GmailReplyHit[] = [];
  for (const msg of fresh) {
    const getUrl = new URL(`${GMAIL_API}/messages/${encodeURIComponent(msg.id)}`);
    getUrl.searchParams.set("format", "metadata");
    getUrl.searchParams.set("metadataHeaders", "From");
    getUrl.searchParams.set("metadataHeaders", "Subject");
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (!getRes.ok) continue;
    const full = (await getRes.json()) as {
      id?: string;
      snippet?: string;
      payload?: { headers?: Array<{ name?: string; value?: string }> };
    };
    hits.push({
      id: full.id ?? msg.id,
      from: headerValue(full.payload?.headers, "From"),
      subject: headerValue(full.payload?.headers, "Subject"),
      snippet: (full.snippet || "").slice(0, 240),
    });
  }

  return { hits, query };
}

export async function pollWatchedGmailRepliesAndNotify(options?: { dryRun?: boolean }): Promise<
  | { ok: false; error: string; readonly: true }
  | {
      ok: true;
      readonly: true;
      query: string;
      unseen: number;
      results: Array<{
        id: string;
        from: string;
        subject: string;
        matched: boolean;
        sent?: boolean;
        company?: string;
        grok?: boolean;
        error?: string;
      }>;
    }
> {
  if (!gmailReadonlyConfigured()) {
    return { ok: false, error: GRANT_MISSING, readonly: true };
  }

  let listed;
  try {
    listed = await listWatchedReplies();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message, readonly: true };
  }

  const results = [];
  for (const hit of listed.hits) {
    const notify = await notifyOutreachReply({
      from: hit.from,
      subject: hit.subject,
      body: hit.snippet,
      dryRun: options?.dryRun,
    });
    results.push({
      id: hit.id,
      from: hit.from,
      subject: hit.subject,
      matched: notify.ok && notify.matched,
      ...(notify.ok && notify.matched
        ? { sent: notify.sent, company: notify.company, grok: notify.grok, error: notify.error }
        : {}),
    });
  }

  return {
    ok: true,
    readonly: true,
    query: listed.query,
    unseen: listed.hits.length,
    results,
  };
}
