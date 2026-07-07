const { execFileSync } = require("child_process");
const path = require("path");

const VAULT_SCRIPT = path.join(__dirname, "secrets-vault.ps1");

/** @type {Record<string, string> | null} */
let cached = null;

function readVaultSecrets() {
  if (cached) return cached;

  try {
    const json = execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", VAULT_SCRIPT, "export-json"],
      { encoding: "utf8", windowsHide: true, timeout: 15_000 },
    ).trim();

    if (!json || json === "{}") {
      cached = {};
      return cached;
    }

    cached = JSON.parse(json);
    return cached;
  } catch {
    cached = {};
    return cached;
  }
}

/** Merge DPAPI vault secrets into process.env (does not override existing vars). */
function loadVaultIntoEnv() {
  const secrets = readVaultSecrets();
  for (const [key, value] of Object.entries(secrets)) {
    if (typeof value === "string" && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
  return secrets;
}

module.exports = { loadVaultIntoEnv, readVaultSecrets };