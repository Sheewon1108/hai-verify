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

function checkoutRequest(init?: RequestInit & { url?: string }): Request {
  const url = init?.url ?? "https://hai-ic.com/api/stripe/checkout";
  const { url: _ignored, ...requestInit } = init ?? {};
  return new Request(url, {
    method: "POST",
    ...requestInit,
    headers: {
      host: new URL(url).host,
      "content-type": "application/json",
      ...(requestInit.headers as Record<string, string> | undefined),
    },
    body:
      requestInit.body ??
      JSON.stringify({ plan: "starter", email: "buyer@example.com" }),
  });
}

describe("Checkout protected", () => {
  it("Unauthenticated POST /api/stripe/checkout → 401 (expected)", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";

    const result = await checkRequestHeaders(checkoutRequest());

    assert.equal(result.blocked, true);
    assert.equal(result.status, 401);
    assert.ok(result.reason, "expected an unauthorized reason");
  });

  it("allows same-origin /order checkout without an API key", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";

    const result = await checkRequestHeaders(
      checkoutRequest({
        headers: {
          host: "hai-ic.com",
          origin: "https://hai-ic.com",
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
        },
      }),
    );

    assert.equal(result.blocked, false);
  });

  it("allows loopback Host checkout for local /order", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";

    const result = await checkRequestHeaders(
      checkoutRequest({
        url: "http://127.0.0.1:3001/api/stripe/checkout",
        headers: {
          host: "127.0.0.1:3001",
          "content-type": "application/json",
        },
      }),
    );

    assert.equal(result.blocked, false);
  });

  it("rejects cross-site checkout even when Origin is spoofed", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";

    const result = await checkRequestHeaders(
      checkoutRequest({
        headers: {
          host: "hai-ic.com",
          origin: "https://hai-ic.com",
          "sec-fetch-site": "cross-site",
          "content-type": "application/json",
        },
      }),
    );

    assert.equal(result.blocked, true);
    assert.equal(result.status, 401);
  });

  it("keeps Stripe webhooks public", async () => {
    process.env.HAI_ACCESS_MODE = "protected";
    process.env.HAI_ACCESS_LOCAL_BYPASS = "true";

    const result = await checkRequestHeaders(
      new Request("https://hai-ic.com/api/stripe/webhook", {
        method: "POST",
        headers: { host: "hai-ic.com", "content-type": "application/json" },
        body: "{}",
      }),
    );

    assert.equal(result.blocked, false);
  });
});
