#!/usr/bin/env node
/**
 * One-time localhost OAuth for Gmail READ-ONLY.
 * Scope: gmail.readonly only. No send. No modify.
 *
 * Writes token names + refresh token to .local/gmail-readonly.json (gitignored).
 * Never print the refresh token to stdout.
 */
import { createServer } from "node:http";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GMAIL_READONLY_SCOPE } from "./lib/gmail-readonly-core.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, ".local", "gmail-readonly.json");

const clientId = process.env.GMAIL_OAUTH_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
const port = Number(process.env.GMAIL_OAUTH_PORT || 8765);
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

if (!clientId || !clientSecret) {
  console.error("gmail_readonly_oauth_client_missing");
  console.error("Need env names only: GMAIL_OAUTH_CLIENT_ID + GMAIL_OAUTH_CLIENT_SECRET");
  process.exit(2);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", GMAIL_READONLY_SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  const err = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (err || !code) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("oauth_denied");
    server.close();
    process.exit(1);
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.refresh_token) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("oauth_token_failed");
    server.close();
    process.exit(1);
    return;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        scope: GMAIL_READONLY_SCOPE,
        createdAt: new Date().toISOString(),
        vaultKeyNames: [
          "GMAIL_OAUTH_CLIENT_ID",
          "GMAIL_OAUTH_CLIENT_SECRET",
          "GMAIL_REFRESH_TOKEN",
        ],
        refresh_token: tokenJson.refresh_token,
      },
      null,
      2
    ),
    { encoding: "utf8", mode: 0o600 }
  );

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("gmail readonly ok. close this tab. token saved locally. do not paste it in chat.");
  server.close();
  console.log("gmail_readonly_login_ok");
  console.log("saved:", existsSync(outPath) ? ".local/gmail-readonly.json" : "missing");
  console.log("vault names: GMAIL_OAUTH_CLIENT_ID GMAIL_OAUTH_CLIENT_SECRET GMAIL_REFRESH_TOKEN");
  process.exit(0);
});

server.listen(port, "127.0.0.1", () => {
  console.log("gmail_readonly_login_waiting");
  console.log("open this URL on the Owner machine (readonly scope only):");
  console.log(authUrl.toString());
});
