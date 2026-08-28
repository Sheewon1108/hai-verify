// Copyright 2026 KARAM. All Rights Reserved.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { checkRequestHeaders, PUBLIC_API_ROUTES } from "./access-control";

const PROD_HOST = "hai-ic.com";

function req(
  path: string,
  init: {
    method?: string;
    host?: string;
    headers?: Record<string, string>;
  } = {},
): Request {
  const host = init.host ?? PROD_HOST;
  return new Request(`https://${host}${path}`, {
    method: init.method ?? "POST",
    headers: {
      host,
      ...init.headers,
    },
  });
}

describe("access-control — checkout protection", () => {
  const prevMode = process.env.HAI_ACCESS_MODE;
  const prevBypass = process.env.HAI_ACCESS_LOCAL_BYPASS;

  before(() => {
    delete process.env.HAI_ACCESS_MODE;
    delete process.env.HAI_ACCESS_LOCAL_BYPASS;
  });

  after(() => {
    if (prevMode === undefined) delete process.env.HAI_ACCESS_MODE;
    else process.env.HAI_ACCESS_MODE = prevMode;
    if (prevBypass === undefined) delete process.env.HAI_ACCESS_LOCAL_BYPASS;
    else process.env.HAI_ACCESS_LOCAL_BYPASS = prevBypass;
  });

  it("does not list /api/stripe/checkout as a public route", () => {
    assert.equal(
      PUBLIC_API_ROUTES.some((route) => route.path === "/api/stripe/checkout"),
      false,
    );
  });

  it("keeps Stripe webhook public", () => {
    assert.equal(
      PUBLIC_API_ROUTES.some(
        (route) => route.method === "POST" && route.path === "/api/stripe/webhook",
      ),
      true,
    );
  });

  it("Unauthenticated POST /api/stripe/checkout → 401 (expected)", async () => {
    const access = await checkRequestHeaders(req("/api/stripe/checkout"));
    assert.equal(access.blocked, true);
    assert.equal(access.status, 401);
  });

  it("Unauthenticated GET /api/stripe/checkout → 401", async () => {
    const access = await checkRequestHeaders(
      req("/api/stripe/checkout", { method: "GET" }),
    );
    assert.equal(access.blocked, true);
    assert.equal(access.status, 401);
  });

  it("cross-site Origin POST /api/stripe/checkout → 401", async () => {
    const access = await checkRequestHeaders(
      req("/api/stripe/checkout", {
        headers: {
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        },
      }),
    );
    assert.equal(access.blocked, true);
    assert.equal(access.status, 401);
  });

  it("same-origin /order checkout is allowed", async () => {
    const access = await checkRequestHeaders(
      req("/api/stripe/checkout", {
        headers: {
          origin: `https://${PROD_HOST}`,
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    assert.equal(access.blocked, false);
  });

  it("same-origin Origin header without sec-fetch-site is allowed", async () => {
    const access = await checkRequestHeaders(
      req("/api/stripe/checkout", {
        headers: { origin: `https://${PROD_HOST}` },
      }),
    );
    assert.equal(access.blocked, false);
  });

  it("loopback Host still bypasses for local /order", async () => {
    const access = await checkRequestHeaders(
      req("/api/stripe/checkout", { host: "127.0.0.1" }),
    );
    assert.equal(access.blocked, false);
  });

  it("Stripe webhook stays reachable without auth", async () => {
    const access = await checkRequestHeaders(req("/api/stripe/webhook"));
    assert.equal(access.blocked, false);
  });

  it("health stays public", async () => {
    const access = await checkRequestHeaders(
      req("/api/health", { method: "GET" }),
    );
    assert.equal(access.blocked, false);
  });
});
