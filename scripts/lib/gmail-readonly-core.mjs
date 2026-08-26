/**
 * Gmail READ-ONLY helpers. No send, no modify, no delete.
 */

export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_READONLY_GRANT_MISSING = "gmail_readonly_grant_missing";
export const GMAIL_READONLY_AFTER_YMD_DEFAULT = "2026/08/26";

export function gmailReadonlyScope() {
  return GMAIL_READONLY_SCOPE;
}

/**
 * @param {readonly { email: string }[]} contacts
 * @param {string} [afterYmd] YYYY/MM/DD
 */
export function buildWatchQuery(contacts, afterYmd = GMAIL_READONLY_AFTER_YMD_DEFAULT) {
  const from = contacts.map((c) => `from:${c.email}`).join(" OR ");
  return `(${from}) after:${afterYmd} -in:sent`;
}

/**
 * @param {Array<{ name?: string, value?: string }> | undefined} headers
 * @param {string} name
 */
export function headerValue(headers, name) {
  const list = headers ?? [];
  const hit = list.find((h) => (h.name || "").toLowerCase() === name.toLowerCase());
  return (hit?.value || "").trim();
}

/**
 * @param {Set<string> | readonly string[]} seen
 * @param {Array<{ id: string }>} messages
 */
export function unseenMessages(seen, messages) {
  const set = seen instanceof Set ? seen : new Set(seen);
  return messages.filter((m) => m.id && !set.has(m.id));
}

export function accessTokenLooksSet(token) {
  return typeof token === "string" && token.length > 20;
}

export function gmailGrantFromEnv(env = process.env) {
  const clientId = env.GMAIL_OAUTH_CLIENT_ID?.trim() || env.GMAIL_CLIENT_ID?.trim() || "";
  const clientSecret = env.GMAIL_OAUTH_CLIENT_SECRET?.trim() || env.GMAIL_CLIENT_SECRET?.trim() || "";
  const refreshToken = env.GMAIL_REFRESH_TOKEN?.trim() || "";
  return { clientId, clientSecret, refreshToken };
}

export function gmailGrantConfigured(grant) {
  return Boolean(grant?.clientId && grant?.clientSecret && grant?.refreshToken);
}
