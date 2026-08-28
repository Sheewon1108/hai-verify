// Copyright 2026 KARAM. All Rights Reserved.

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { checkRequestHeaders } from "@/app/lib/access-control";

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

function productionRequest(path: string, init?: RequestInit): Request {
  return new Request(`https://hai-ic.com${path}`, {
    method: "POST",
    ...init,
    headers: {
      host: "hai-ic.com",
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: init?.body ?? JSON.stringify({ plan: "starter", email: "buyer@example.com" }),
  });
}

describe("Checkout protected", () => {
  it("Unauthenticated POST /api/stripe/checkout → 401 (expected)", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";
    delete process.env.HAI_INTERNAL_API_KEY;

    const access = await checkRequestHeaders(
      productionRequest("/api/stripe/checkout"),
    );

    assert.equal(access.blocked, true);
    assert.equal(access.status, 401);
  });

  it("allows same-origin /order checkout without an API key", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";

    const access = await checkRequestHeaders(
      productionRequest("/api/stripe/checkout", {
        headers: { "sec-fetch-site": "same-origin" },
      }),
    );

    assert.equal(access.blocked, false);
  });

  it("allows matching Origin checkout without an API key", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";

    const access = await checkRequestHeaders(
      productionRequest("/api/stripe/checkout", {
        headers: { origin: "https://hai-ic.com" },
      }),
    );

    assert.equal(access.blocked, false);
  });

  it("rejects cross-origin checkout without an API key", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";

    const access = await checkRequestHeaders(
      productionRequest("/api/stripe/checkout", {
        headers: {
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        },
      }),
    );

    assert.equal(access.blocked, true);
    assert.equal(access.status, 401);
  });

  it("keeps GET /api/stripe/checkout public for plan discovery", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";

    const access = await checkRequestHeaders(
      new Request("https://hai-ic.com/api/stripe/checkout", {
        method: "GET",
        headers: { host: "hai-ic.com" },
      }),
    );

    assert.equal(access.blocked, false);
  });

  it("keeps Stripe webhook public so Stripe can deliver events", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "false";

    const access = await checkRequestHeaders(
      new Request("https://hai-ic.com/api/stripe/webhook", {
        method: "POST",
        headers: { host: "hai-ic.com", "content-type": "application/json" },
        body: "{}",
      }),
    );

    assert.equal(access.blocked, false);
  });
});
