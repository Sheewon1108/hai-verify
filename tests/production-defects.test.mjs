import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 3101;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const STARTUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_000;

let serverProcess;
let serverLogs = "";

function appendLogs(chunk) {
  serverLogs += chunk.toString();
}

async function waitForServer() {
  const start = Date.now();

  while (Date.now() - start < STARTUP_TIMEOUT_MS) {
    if (serverProcess?.exitCode !== null) {
      throw new Error(`Next server exited early.\n\n${serverLogs}`);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for Next server.\n\n${serverLogs}`);
}

async function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  serverProcess.kill("SIGTERM");
  const exitPromise = once(serverProcess, "exit");
  const timeoutPromise = sleep(10_000).then(() => {
    if (serverProcess?.exitCode === null) {
      serverProcess.kill("SIGKILL");
    }
  });

  await Promise.race([exitPromise, timeoutPromise]);
}

before(async () => {
  serverProcess = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HAI_ACCESS_MODE: "protected",
        HAI_ACCESS_LOCAL_BYPASS: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  serverProcess.stdout.on("data", appendLogs);
  serverProcess.stderr.on("data", appendLogs);

  await waitForServer();
});

after(async () => {
  await stopServer();
});

test("/hai-ic returns 200", async () => {
  const response = await fetch(`${BASE_URL}/hai-ic`);
  assert.equal(response.status, 200);
});

test("/api/health returns 200 and excludes sensitive fields", async () => {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["endpoints", "ok", "service", "status", "version"]);
  assert.deepEqual(body.endpoints, [
    "/api/health",
    "/api/hai-ic/health",
    "/api/hai-ic/analyze",
  ]);

  const serialized = JSON.stringify(body);
  for (const forbidden of ["contactPhone", "userContext", "trustedAiTools", "USER_TIMEZONE"]) {
    assert.equal(serialized.includes(forbidden), false, `Unexpected sensitive field: ${forbidden}`);
  }
});

test("/api/hai-ic/health returns 200", async () => {
  const response = await fetch(`${BASE_URL}/api/hai-ic/health`);
  assert.equal(response.status, 200);
});

test("unauthenticated POST /api/hai-ic/analyze returns 401", async () => {
  const response = await fetch(`${BASE_URL}/api/hai-ic/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: "Ship 200 units to Seoul by July 15, budget $50k" }),
  });

  assert.equal(response.status, 401);

  const serialized = JSON.stringify(await response.json());
  for (const forbidden of ["HAI_API_KEY_SECRET", "STRIPE_SECRET_KEY", "HAI_INTERNAL_API_KEY"]) {
    assert.equal(serialized.includes(forbidden), false, `Response leaked sensitive token name: ${forbidden}`);
  }
});

test("landing curl uses hai-ic.com and not hai-verify.workers.dev", async () => {
  const response = await fetch(`${BASE_URL}/hai-ic`);
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.equal(html.includes("https://hai-ic.com/api/hai-ic/analyze"), true);
  assert.equal(html.includes("https://hai-verify.workers.dev"), false);
});
