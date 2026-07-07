const { spawn } = require("child_process");
const path = require("path");
const { loadVaultIntoEnv } = require("./lib/load-vault-env.cjs");
const { assertUserContext } = require("./lib/load-user-context.cjs");

const projectRoot = path.join(__dirname, "..");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

assertUserContext({ strict: true });
loadVaultIntoEnv();

const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3001"], {
  cwd: projectRoot,
  env: process.env,
  windowsHide: true,
});

child.stdout.on("data", (chunk) => process.stdout.write(chunk));
child.stderr.on("data", (chunk) => process.stderr.write(chunk));

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));