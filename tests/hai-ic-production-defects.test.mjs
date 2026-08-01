import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import test, { after, before } from "node:test";

const PORT = Number(process.env.HAI_IC_TEST_PORT ?? 3101);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 60_000;
const SENSITIVE_HEALTH_FIELDS = [
  "contactPhone",
  "userContext",
  "trustedAiTools",
  "USER_TIMEZONE",
];

let server;
let serverOutput = "";

async function waitForServer() {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < SERVER_READY_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/api/hai-ic/health`);
      if (response.ok) return;
      lastError = new Error(`Unexpected readiness status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(
    `Next test server did not become ready: ${lastError?.message ?? "unknown error"}\n${serverOutput}`,
  );
}

before(async () => {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(PORT),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  server.once("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      serverOutput += `\nNext test server exited with code ${code}`;
    }
    if (signal) {
      serverOutput += `\nNext test server exited with signal ${signal}`;
    }
  });

  await waitForServer();
});

after(async () => {
  if (!server || server.exitCode !== null) return;

  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(5_000)]);

  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await once(server, "exit");
  }
});

test("GET /hai-ic returns 200 and renders the public curl host", async () => {
  const response = await fetch(`${BASE_URL}/hai-ic`);
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /https:\/\/hai-ic\.com\/api\/hai-ic\/analyze/);
  assert.doesNotMatch(html, /hai-verify\.workers\.dev/);
});

test("GET /api/health returns public health only", async () => {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "HAI Verify");
  assert.equal(body.version, "0.1.0");
  assert.equal(body.status, "healthy");
  assert.deepEqual(body.publicEndpoints, [
    "/api/health",
    "/api/hai-ic/health",
    "/api/hai-ic/analyze",
  ]);

  const serialized = JSON.stringify(body);
  for (const field of SENSITIVE_HEALTH_FIELDS) {
    assert.doesNotMatch(serialized, new RegExp(field));
  }
});

test("GET /api/hai-ic/health returns 200", async () => {
  const response = await fetch(`${BASE_URL}/api/hai-ic/health`);
  assert.equal(response.status, 200);
});

test("unauthenticated POST /api/hai-ic/analyze returns 401", async () => {
  const response = await fetch(`${BASE_URL}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: "Ship 200 units to Seoul by July 15, budget $50k" }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { ok: false, error: "Unauthorized" });
});
