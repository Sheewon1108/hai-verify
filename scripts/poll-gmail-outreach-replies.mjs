#!/usr/bin/env node
/**
 * Read-only poll: Gmail API gmail.readonly → match 3 buyers → existing notify/Grok.
 * Never sends Gmail. Never logs tokens.
 *
 * Exit: 0 polled · 2 grant missing (system error, not an empty inbox) · 1 unexpected
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GMAIL_READONLY_AFTER_YMD_DEFAULT,
  GMAIL_READONLY_GRANT_MISSING,
  buildWatchQuery,
  gmailGrantConfigured,
  gmailGrantFromEnv,
  headerValue,
  unseenMessages,
} from "./lib/gmail-readonly-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WATCH_PATH = join(ROOT, "hai-ic", "outreach", "reply-watch.json");
const LOCAL_GRANT_PATH = join(ROOT, ".local", "gmail-readonly.json");
const SEEN_PATH = join(ROOT, ".local", "gmail-reply-seen.json");
const SEED_SEEN_PATH = join(ROOT, "hai-ic", "outreach", "reply-seen.json");
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const dryRun = process.argv.includes("--dry-run");

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function loadGrant() {
  const fromEnv = gmailGrantFromEnv(process.env);
  if (fromEnv.refreshToken) return fromEnv;
  const local = loadJson(LOCAL_GRANT_PATH, {});
  return {
    clientId: fromEnv.clientId,
    clientSecret: fromEnv.clientSecret,
    refreshToken: typeof local.refresh_token === "string" ? local.refresh_token : "",
  };
}

function loadSeenIds() {
  const local = loadJson(SEEN_PATH, null);
  if (local && Array.isArray(local.messageIds)) return local.messageIds;
  const seed = loadJson(SEED_SEEN_PATH, { messageIds: [] });
  return Array.isArray(seed.messageIds) ? seed.messageIds : [];
}

function saveSeenIds(ids) {
  mkdirSync(dirname(SEEN_PATH), { recursive: true });
  writeFileSync(
    SEEN_PATH,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), messageIds: ids.slice(-200) }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

async function refreshAccessToken(grant) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: grant.clientId,
      client_secret: grant.clientSecret,
      refresh_token: grant.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`gmail_token_refresh_failed:${res.status}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error("gmail_token_refresh_empty");
  return json.access_token;
}

async function listFreshMessages(access, query, seenIds) {
  const listUrl = new URL(`${GMAIL_API}/messages`);
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", "20");
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!listRes.ok) {
    throw new Error(`gmail_list_failed:${listRes.status}`);
  }
  const listed = await listRes.json();
  const fresh = unseenMessages(seenIds, listed.messages ?? []);
  const hits = [];
  for (const msg of fresh) {
    const getUrl = new URL(`${GMAIL_API}/messages/${encodeURIComponent(msg.id)}`);
    getUrl.searchParams.set("format", "metadata");
    getUrl.searchParams.set("metadataHeaders", "From");
    getUrl.searchParams.set("metadataHeaders", "Subject");
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (!getRes.ok) continue;
    const full = await getRes.json();
    hits.push({
      id: full.id ?? msg.id,
      from: headerValue(full.payload?.headers, "From"),
      subject: headerValue(full.payload?.headers, "Subject"),
      snippet: String(full.snippet || "").slice(0, 240),
    });
  }
  return { scanned: (listed.messages ?? []).length, hits };
}

function notifyOne(hit) {
  const args = [
    join(ROOT, "scripts", "notify-outreach-reply.mjs"),
    "--from",
    hit.from,
    "--subject",
    hit.subject,
    "--body",
    hit.snippet,
  ];
  if (dryRun) args.push("--dry-run");
  const ran = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: process.env,
  });
  return {
    status: ran.status,
    stdout: (ran.stdout || "").trim(),
    stderr: (ran.stderr || "").trim(),
  };
}

async function main() {
  const grant = loadGrant();
  if (!gmailGrantConfigured(grant)) {
    console.error(GMAIL_READONLY_GRANT_MISSING);
    process.exit(2);
  }

  const watch = loadJson(WATCH_PATH, { contacts: [] });
  const query = buildWatchQuery(watch.contacts ?? [], watch.afterYmd ?? GMAIL_READONLY_AFTER_YMD_DEFAULT);
  const seenIds = loadSeenIds();
  const access = await refreshAccessToken(grant);
  const { scanned, hits } = await listFreshMessages(access, query, seenIds);

  const results = [];
  for (const hit of hits) {
    const notify = notifyOne(hit);
    results.push({
      id: hit.id,
      from: hit.from,
      subject: hit.subject,
      notifyStatus: notify.status,
    });
    if (notify.stdout) console.log(notify.stdout);
    if (notify.stderr) console.warn(notify.stderr);
  }

  if (!dryRun && hits.length > 0) {
    const next = [...seenIds];
    for (const hit of hits) {
      if (!next.includes(hit.id)) next.push(hit.id);
    }
    saveSeenIds(next);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        readonly: true,
        dryRun,
        query,
        scanned,
        unseen: hits.length,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(message === GMAIL_READONLY_GRANT_MISSING ? 2 : 1);
});
