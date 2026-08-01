import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 3101;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 90_000;

function startDevServer() {
  const child = spawn(
    "node",
    ["./node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopServer(child) {
  if (!child?.pid || child.killed) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    once(child, "exit").then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (!exited && child.pid) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

async function waitForServerReady() {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.status === 200) return;
    } catch {
      // Retry until timeout.
    }
    await delay(1_000);
  }
  throw new Error(`Server was not ready within ${START_TIMEOUT_MS}ms`);
}

async function fetchJson(path, init) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data, text };
}

async function runTests() {
  const page = await fetch(`${BASE_URL}/hai-ic`);
  assert.equal(page.status, 200, "/hai-ic must return 200");

  const health = await fetchJson("/api/health");
  assert.equal(health.response.status, 200, "/api/health must return 200");
  const expectedKeys = ["ok", "service", "version", "status", "endpoints"];
  assert.deepEqual(
    Object.keys(health.data).sort(),
    expectedKeys.sort(),
    "/api/health must expose only non-sensitive top-level fields",
  );
  const serializedHealth = JSON.stringify(health.data);
  for (const forbidden of ["contactPhone", "userContext", "trustedAiTools", "USER_TIMEZONE"]) {
    assert.equal(
      serializedHealth.includes(forbidden),
      false,
      `/api/health must not include ${forbidden}`,
    );
  }

  const haiIcHealth = await fetchJson("/api/hai-ic/health");
  assert.equal(haiIcHealth.response.status, 200, "/api/hai-ic/health must return 200");

  const unauthorizedAnalyze = await fetchJson("/api/hai-ic/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-host": "hai-ic.com",
    },
    body: JSON.stringify({ input: "Check intent confidence" }),
  });
  assert.equal(
    unauthorizedAnalyze.response.status,
    401,
    "Unauthenticated POST /api/hai-ic/analyze must return 401",
  );

  const landingHtml = await page.text();
  assert.equal(
    landingHtml.includes("https://hai-ic.com/api/hai-ic/analyze"),
    true,
    "Landing curl example must use hai-ic.com",
  );
  assert.equal(
    landingHtml.includes("https://hai-verify.workers.dev"),
    false,
    "Landing curl example must not use hai-verify.workers.dev",
  );
}

async function main() {
  const server = startDevServer();
  let exitCode = 0;

  try {
    await waitForServerReady();
    await runTests();
    console.log("All production defect tests passed.");
  } catch (error) {
    exitCode = 1;
    console.error(error);
  } finally {
    await stopServer(server);
    process.exitCode = exitCode;
  }
}

main();
