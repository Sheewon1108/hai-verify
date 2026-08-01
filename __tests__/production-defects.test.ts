/**
 * Automated regression tests for production defects fixed on 2026-08-01.
 *
 * Covers:
 *  1. /hai-ic page route exists (returns 200)
 *  2. GET /api/health — 200 with no sensitive fields
 *  3. GET /api/hai-ic/health — 200
 *  4. POST /api/hai-ic/analyze unauthenticated — 401
 *  5. Landing curl example uses hai-ic.com, not hai-verify.workers.dev
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── 1. /hai-ic page file exists ──────────────────────────────────────────────

describe("/hai-ic page", () => {
  it("page module exists and exports a default component (route will return 200)", () => {
    const pagePath = resolve(__dirname, "../app/hai-ic/page.tsx");
    // If the file does not exist this will throw and the test will fail.
    const src = readFileSync(pagePath, "utf-8");
    // Must have a default export (the page component).
    expect(src).toMatch(/export\s+default\b/);
  });
});

// ── 2 & 3. API health routes ──────────────────────────────────────────────────

// We call the route handlers directly using the Web Fetch API globals that
// Node 22 provides natively (no server needed).

describe("GET /api/health", () => {
  it("returns 200", async () => {
    const { GET } = await import("../app/api/health/route");
    const req = new Request("http://localhost/api/health") as never;
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("body contains ok, service, version, status, and endpoints", async () => {
    const { GET } = await import("../app/api/health/route");
    const req = new Request("http://localhost/api/health") as never;
    const res = await GET(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.ok).toBe(true);
    expect(typeof data.service).toBe("string");
    expect(typeof data.version).toBe("string");
    expect(typeof data.status).toBe("string");
    expect(data.endpoints).toBeDefined();
  });

  const BANNED_FIELDS = ["contactPhone", "userContext", "trustedAiTools", "USER_TIMEZONE"];

  it.each(BANNED_FIELDS)("body does NOT contain sensitive field: %s", async (field) => {
    const { GET } = await import("../app/api/health/route");
    const req = new Request("http://localhost/api/health") as never;
    const res = await GET(req);
    const text = await res.text();
    expect(text).not.toContain(field);
  });
});

describe("GET /api/hai-ic/health", () => {
  it("returns 200", async () => {
    const { GET } = await import("../app/api/hai-ic/health/route");
    const req = new Request("http://localhost/api/hai-ic/health") as never;
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("body contains ok: true", async () => {
    const { GET } = await import("../app/api/hai-ic/health/route");
    const req = new Request("http://localhost/api/hai-ic/health") as never;
    const res = await GET(req);
    const data = await res.json() as Record<string, unknown>;
    expect(data.ok).toBe(true);
  });
});

// ── 4. Unauthenticated POST /api/hai-ic/analyze → 401 ───────────────────────

describe("POST /api/hai-ic/analyze (unauthenticated)", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const { checkRequestHeaders } = await import("../app/lib/access-control");

    // Simulate an external request with no auth and a non-loopback host.
    const req = new Request("https://hai-ic.com/api/hai-ic/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "test" }),
    });

    const result = await checkRequestHeaders(req);
    expect(result.blocked).toBe(true);
    expect(result.status).toBe(401);
    // Must not reveal secrets in the reason string.
    expect(result.reason ?? "").not.toMatch(/HAI_API_KEY_SECRET|internal/i);
  });

  it("does not reveal env secrets in 401 reason", async () => {
    const { checkRequestHeaders } = await import("../app/lib/access-control");
    const req = new Request("https://hai-ic.com/api/hai-ic/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "test" }),
    });
    const result = await checkRequestHeaders(req);
    const reason = result.reason ?? "";
    expect(reason).not.toContain("HAI_API_KEY_SECRET");
    expect(reason).not.toContain("HAI_INTERNAL_API_KEY");
  });
});

// ── 5. Landing page curl example URL ─────────────────────────────────────────

describe("Hai-ic landing curl example", () => {
  it("uses hai-ic.com, not hai-verify.workers.dev", () => {
    const src = readFileSync(
      resolve(__dirname, "../app/components/hai-ic-landing.tsx"),
      "utf-8",
    );
    expect(src).not.toContain("hai-verify.workers.dev");
    expect(src).toContain("https://hai-ic.com/api/hai-ic/analyze");
  });
});
