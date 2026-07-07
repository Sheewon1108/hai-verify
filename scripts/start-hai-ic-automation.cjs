const { spawn } = require("child_process");
const path = require("path");
const { assertUserContext } = require("./lib/load-user-context.cjs");

assertUserContext({ strict: true });

const projectRoot = path.join(__dirname, "..");
const script = path.join(__dirname, "hai-ic-automation-daemon.ps1");

const child = spawn(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
  { cwd: projectRoot, stdio: "inherit", windowsHide: false },
);

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));