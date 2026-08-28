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

function checkoutRequest(init?: RequestInit): Request {
  return new Request("https://hai-ic.com/api/stripe/checkout", {
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

function protectEnv() {
  process.env.HAI_ACCESS_MODE = "protected";
  process.env.HAI_ACCESS_LOCAL_BYPASS = "true";
  process.env.HAI_INTERNAL_API_KEY = "test-internal-key-ok";
}

describe("POST /api/stripe/checkout protected", () => {
  it("returns 401 for unauthenticated production POST (expected)", async () => {
    protectEnv();

    const result = await checkRequestHeaders(checkoutRequest());

    assert.equal(result.blocked, true);
    assert.equal(result.status, 401);
    assert.ok(result.reason, "expected an unauthorized reason");
  });

  it("allows same-origin /order browser POST without an API key", async () => {
    protectEnv();

    const result = await checkRequestHeaders(
      checkoutRequest({
        headers: {
          host: "hai-ic.com",
          "content-type": "application/json",
          "sec-fetch-site": "same-origin",
        },
      }),
    );

    assert.equal(result.blocked, false);
  });

  it("allows loopback Host without an API key", async () => {
    protectEnv();

    const result = await checkRequestHeaders(
      new Request("http://127.0.0.1:3001/api/stripe/checkout", {
        method: "POST",
        headers: {
          host: "127.0.0.1:3001",
          "content-type": "application/json",
        },
        body: JSON.stringify({ plan: "starter", email: "buyer@example.com" }),
      }),
    );

    assert.equal(result.blocked, false);
  });

  it("allows authenticated POST with a valid internal API key", async () => {
    protectEnv();

    const result = await checkRequestHeaders(
      checkoutRequest({
        headers: {
          host: "hai-ic.com",
          "content-type": "application/json",
          authorization: "Bearer test-internal-key-ok",
        },
      }),
    );

    assert.equal(result.blocked, false);
  });

  it("keeps Stripe webhook public (signature-verified, no HAI key)", async () => {
    protectEnv();

    const result = await checkRequestHeaders(
      new Request("https://hai-ic.com/api/stripe/webhook", {
        method: "POST",
        headers: {
          host: "hai-ic.com",
          "stripe-signature": "t=1,v1=test",
        },
      }),
    );

    assert.equal(result.blocked, false);
  });
});
