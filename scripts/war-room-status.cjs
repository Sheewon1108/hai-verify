#!/usr/bin/env node
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PORT = 3001;

function homePath(...parts) {
  return path.join(process.env.USERPROFILE || process.env.HOME || os.homedir(), ...parts);
}

function portBindings() {
  try {
    const out = execFileSync("ss", ["-ltnH"], { encoding: "utf8" });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes(`:${PORT}`))
      .map((line) => line.split(/\s+/)[3])
      .filter(Boolean);
  } catch {
    return [];
  }
}

function canConnect(host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: PORT, timeout: 1000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

async function portStatus() {
  const bindings = portBindings();
  if (bindings.length > 0) {
    const exposed = bindings.find((addr) => {
      const host = addr.replace(/:\d+$/, "").replace(/^\[(.*)\]$/, "$1");
      return host === "0.0.0.0" || host === "::" || host === "*";
    });
    if (exposed) return `[ALERT] Port ${PORT} bind: ${exposed}`;
    return `[OK] Port ${PORT} bind: ${bindings.join(", ")}`;
  }

  const reachable = await canConnect("127.0.0.1");
  return reachable
    ? `[OK] Port ${PORT} loopback reachable`
    : `[WARN] Port ${PORT} not listening`;
}

function latestRestorePoint() {
  const dir = homePath("secrets", "restore-points");
  try {
    const latest = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .at(-1);
    return latest ? path.join(dir, latest) : null;
  } catch {
    return null;
  }
}

function pm2Status() {
  try {
    const raw = execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const apps = JSON.parse(raw);
    const server = apps.find((app) => app.name === "hai-ic-server");
    return server?.pm2_env?.status === "online"
      ? "[OK] PM2 hai-ic-server online"
      : "[WARN] PM2 hai-ic-server not online";
  } catch {
    return "[WARN] PM2 unavailable";
  }
}

async function healthStatus() {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/api/health`, {
      signal: AbortSignal.timeout(6000),
    });
    const health = await response.json();
    return `[OK] /api/health mode=${health.mode}`;
  } catch {
    return "[WARN] /api/health unreachable";
  }
}

async function main() {
  process.chdir(ROOT);

  console.log("=== HAI VERIFY WAR ROOM ===");
  console.log(new Date().toISOString());
  console.log("");

  console.log(await portStatus());

  const vault = homePath("secrets", "vault.dat");
  console.log(`${fs.existsSync(vault) ? "[OK]" : "[FAIL]"} DPAPI vault: ${vault}`);

  const restorePoint = latestRestorePoint();
  console.log(
    restorePoint
      ? `[OK] Latest restore point: ${restorePoint}`
      : "[WARN] No restore point yet - npm run backup:restore-point",
  );

  console.log(pm2Status());
  console.log(await healthStatus());

  console.log("");
  console.log("War room rules: .cursor/rules/war-room.mdc");
  console.log("MODE: COMPLETELY BLIND ACTIVE (re-applied 2026-08-11) + 50/50 - NO LOOP");
  console.log("Unlock: 실행: / GO: / 해·마무리 | lift: blind off | close: hai-ic/WR-CLOSE-5050.md | secrets never in chat");
  console.log("No secrets in chat. Owner: money/family/law. Partner: product half when unlocked.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
