// Copyright 2026 KARAM. All Rights Reserved.

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { GET as getPublicHealth } from "@/app/api/health/route";
import { GET as getHaiIcHealth } from "@/app/api/hai-ic/health/route";
import { checkRequestHeaders } from "@/app/lib/access-control";

const SENSITIVE_HEALTH_KEYS = [
  "access",
  "userContext",
  "endpoints",
  "pages",
  "mode",
  "trustedAiTools",
  "contactPhone",
  "product",
] as const;

const SECRET_PATTERNS =
  /sk_live_|rk_live_|pk_live_|sk-proj-|CLOUDFLARE_API_TOKEN|HAI_INTERNAL_API_KEY|HAI_API_KEY_SECRET|webhook.?secret|password\s*[:=]/i;

const envSnapshot = {
  HAI_ACCESS_MODE: process.env.HAI_ACCESS_MODE,
  HAI_ACCESS_LOCAL_BYPASS: process.env.HAI_ACCESS_LOCAL_BYPASS,
  HAI_INTERNAL_API_KEY: process.env.HAI_INTERNAL_API_KEY,
};

afterEach(() => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function productionAnalyzeRequest(init?: RequestInit): Request {
  return new Request("https://hai-ic.com/api/hai-ic/analyze", {
    method: "POST",
    ...init,
    headers: {
      host: "hai-ic.com",
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: init?.body ?? JSON.stringify({ input: "Ship 200 units by Friday" }),
  });
}

describe("GET /api/health", () => {
  it("returns non-sensitive service health only", async () => {
    const response = await getPublicHealth(
      new NextRequest("https://hai-ic.com/api/health"),
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.service, "HAI Verify");
    assert.equal(body.status, "healthy");

    const keys = Object.keys(body).sort();
    assert.deepEqual(keys, ["ok", "service", "status"].sort());

    for (const key of SENSITIVE_HEALTH_KEYS) {
      assert.equal(body[key], undefined, `health must not expose ${key}`);
    }

    assert.equal(SECRET_PATTERNS.test(JSON.stringify(body)), false);
  });
});

describe("GET /api/hai-ic/health", () => {
  it("remains a working product health endpoint", async () => {
    const response = await getHaiIcHealth(
      new NextRequest("https://hai-ic.com/api/hai-ic/health"),
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.status, "healthy");
    assert.equal(typeof body.product, "string");
    assert.equal(typeof body.version, "string");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(SECRET_PATTERNS.test(JSON.stringify(body)), false);
  });
});

describe("POST /api/hai-ic/analyze auth", () => {
  it("returns 401 for unauthenticated production requests without revealing secrets", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";
    process.env.HAI_INTERNAL_API_KEY = "test-internal-key-do-not-leak";

    const result = await checkRequestHeaders(productionAnalyzeRequest());

    assert.equal(result.blocked, true);
    assert.equal(result.status, 401);
    assert.ok(result.reason, "expected an error reason");
    assert.equal(SECRET_PATTERNS.test(result.reason ?? ""), false);
    assert.equal(result.reason?.includes("test-internal-key-do-not-leak"), false);
    assert.equal(JSON.stringify(result).includes("test-internal-key-do-not-leak"), false);
  });

  it("allows authenticated requests with a valid internal API key", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";
    process.env.HAI_INTERNAL_API_KEY = "test-internal-key-ok";

    const result = await checkRequestHeaders(
      productionAnalyzeRequest({
        headers: {
          host: "hai-ic.com",
          "content-type": "application/json",
          authorization: "Bearer test-internal-key-ok",
        },
      }),
    );

    assert.equal(result.blocked, false);
    assert.equal(result.status, undefined);
  });
});
