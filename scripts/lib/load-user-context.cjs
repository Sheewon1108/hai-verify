const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ASSERT_SCRIPT = path.join(__dirname, "assert-user-timezone.ps1");
const ENV_FILE = path.join(process.env.USERPROFILE || "", "secrets", "hai-verify.env");

/** @typedef {{ timezone: string, region: string, country: string, displayLocale: string, contactPhone: string }} UserContext */

/** Read declared user context from config (never from language). */
function readUserContext() {
  /** @type {UserContext} */
  const ctx = {
    timezone: "Pacific Standard Time",
    region: "California, US",
    country: "US",
    displayLocale: "",
    contactPhone: "",
  };

  if (!fs.existsSync(ENV_FILE)) return ctx;

  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    if (key === "USER_TIMEZONE") ctx.timezone = value;
    if (key === "USER_REGION") ctx.region = value;
    if (key === "USER_COUNTRY") ctx.country = value;
    if (key === "USER_DISPLAY_LOCALE") ctx.displayLocale = value;
    if (key === "USER_CONTACT_PHONE") ctx.contactPhone = value;
  }

  return ctx;
}

/** Inject declared context into process.env (not Windows timezone). */
function applyUserContextToEnv() {
  const ctx = readUserContext();
  process.env.USER_TIMEZONE = ctx.timezone;
  process.env.USER_REGION = ctx.region;
  process.env.USER_COUNTRY = ctx.country;
  if (ctx.displayLocale) process.env.USER_DISPLAY_LOCALE = ctx.displayLocale;
  if (ctx.contactPhone) process.env.USER_CONTACT_PHONE = ctx.contactPhone;
  return ctx;
}

/**
 * Verify Windows timezone matches config.
 * @param {{ strict?: boolean }} [opts] strict=true exits process on mismatch
 */
function assertUserContext(opts = {}) {
  const strict = opts.strict !== false;
  applyUserContextToEnv();

  try {
    execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ASSERT_SCRIPT],
      { encoding: "utf8", windowsHide: true, timeout: 15_000 },
    );
    return true;
  } catch (err) {
    if (strict) {
      const out = err.stdout?.toString() || err.message;
      console.error(out);
      process.exit(typeof err.status === "number" ? err.status : 1);
    }
    console.warn("[user-context] timezone mismatch (non-strict mode)");
    return false;
  }
}

module.exports = { readUserContext, applyUserContextToEnv, assertUserContext };