const cp = require("child_process");

const DEV_PORT = 3210;
const BASE_URL = `http://127.0.0.1:${DEV_PORT}`;

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopProcess(proc) {
  if (!proc || !proc.pid || proc.killed) return;

  const exited = new Promise((resolve) => {
    proc.once("exit", () => resolve());
  });

  try {
    process.kill(-proc.pid, "SIGTERM");
  } catch {
    try {
      process.kill(proc.pid, "SIGTERM");
    } catch {
      return;
    }
  }

  const timeout = sleep(5000).then(() => "timeout");
  const result = await Promise.race([exited.then(() => "exited"), timeout]);

  if (result === "timeout") {
    try {
      process.kill(-proc.pid, "SIGKILL");
    } catch {
      try {
        process.kill(proc.pid, "SIGKILL");
      } catch {}
    }
    return;
  }
}

function waitForReady(proc) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for dev server"));
    }, 120000);

    const handleOutput = (chunk) => {
      const text = chunk.toString();
      if (text.includes("Ready in")) {
        clearTimeout(timeout);
        resolve();
      }
    };

    proc.stdout.on("data", handleOutput);
    proc.stderr.on("data", handleOutput);

    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Dev server exited early with code ${code}`));
    });
  });
}

function parseCsrfCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/hai_csrf=([^;]+)/);
  return match ? match[1] : null;
}

async function run() {
  const dev = cp.spawn("npm", ["run", "dev", "--", "--port", String(DEV_PORT)], {
    env: {
      ...process.env,
      HAI_ACCESS_LOCAL_BYPASS: "false",
    },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForReady(dev);

    const pageRes = await fetch(`${BASE_URL}/hai-ic`);
    const csrf = parseCsrfCookie(pageRes.headers.get("set-cookie"));
    if (!csrf) {
      throw new Error("Missing CSRF cookie from page response");
    }

    const blockedRes = await fetch(`${BASE_URL}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "csrf test" }),
    });
    if (blockedRes.status !== 401) {
      throw new Error(`Expected 401 without CSRF, got ${blockedRes.status}`);
    }

    const allowedRes = await fetch(`${BASE_URL}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hai-csrf": csrf,
        Cookie: `hai_csrf=${csrf}`,
      },
      body: JSON.stringify({ content: "csrf test" }),
    });
    if (allowedRes.status !== 200) {
      throw new Error(`Expected 200 with CSRF, got ${allowedRes.status}`);
    }

    console.log("CSRF test passed.");
  } finally {
    await stopProcess(dev);
  }
}

run().catch((error) => {
  console.error(`CSRF test failed: ${error.message}`);
  process.exit(1);
});
