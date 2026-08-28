// Copyright 2026 KARAM. All Rights Reserved.
// Private & Confidential. Unauthorized copying or distribution of this file is strictly prohibited.

function hostOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  }
  const host = request.headers.get("host");
  if (host) return host.split(":")[0]?.trim().toLowerCase() ?? "";
  try {
    return new URL(request.url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isPrivateLoopback(request: Request): boolean {
  const host = hostOf(request);
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") return false;
  if (request.headers.get("x-localtunnel-agent-ips")) return false;
  return true;
}
