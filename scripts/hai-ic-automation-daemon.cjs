const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { generateQuestions } = require("./hai-ic-question-generator.cjs");
const { generate: generateBuyerPack } = require("./generate-buyer-trust-pack.cjs");

const PROJECT_ROOT = path.join(__dirname, "..");
const STATE_PATH = path.join(PROJECT_ROOT, "hai-ic", "boost-state.json");
const LOG_PATH = path.join(PROJECT_ROOT, "hai-ic", "BOOST-LOG.md");
const REPORT_DIR = path.join(PROJECT_ROOT, "hai-ic", "reports");
const QUESTIONS_DIR = path.join(PROJECT_ROOT, "hai-ic", "test-questions");
const BOOST_TS = path.join(PROJECT_ROOT, "app", "lib", "hai-ic-boost-value.ts");
const PENALTY_TS = path.join(PROJECT_ROOT, "app", "lib", "hai-ic-dd-penalty-value.ts");
const PORT = 3001;
const DD_PENALTY_LIVE = 15;
const BOOST_LIVE = 0;

function readText(path) {
  return fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      boostPercent: 0,
      ddPenaltyReduction: 0,
      appliedCount: 0,
      maxBoosts: 0,
      intervalHours: 1,
      startedAt: "",
      lastAppliedAt: "",
      lastDailyReport: "",
      log: [],
    };
  }
  return JSON.parse(readText(STATE_PATH));
}

function writeState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n", {
    encoding: "utf8",
  });
}

function writeLiveValues() {
  fs.writeFileSync(
    BOOST_TS,
    `/** Fixed — no artificial boost (진정성) */\nexport const HAI_IC_HOURLY_BOOST = ${BOOST_LIVE};\n`,
    "utf8",
  );
  fs.writeFileSync(
    PENALTY_TS,
    `/** Fixed — no artificial DD penalty tuning */\nexport const HAI_IC_DD_MAX_PENALTY_LIVE = ${DD_PENALTY_LIVE};\n`,
    "utf8",
  );
}

function appendLog(line) {
  fs.appendFileSync(LOG_PATH, `${line}\n`, "utf8");
}

async function testHealth() {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/hai-ic/health`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data.status === "healthy";
  } catch {
    return false;
  }
}

function ensureServer() {
  return testHealth().then(async (ok) => {
    if (ok) return "ok";
    try {
      execSync("pm2 restart hai-ic-server", { stdio: "ignore" });
    } catch {
      try {
        execSync("pm2 start ecosystem.config.cjs --only hai-ic-server", {
          cwd: PROJECT_ROOT,
          stdio: "ignore",
        });
      } catch {
        /* ignore */
      }
    }
    await sleep(8000);
    return (await testHealth()) ? "restarted" : "down";
  });
}

async function analyzeQuestion(input) {
  const res = await fetch(`http://localhost:${PORT}/api/hai-ic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ input }),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

function backupQuestions(step, at, questions, results) {
  fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  const stamp = at.slice(0, 10);
  const fileName = `step-${String(step).padStart(3, "0")}-${stamp}.json`;
  const localPath = path.join(QUESTIONS_DIR, fileName);
  const payload = { step, at, questions, results };
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  fs.appendFileSync(
    path.join(QUESTIONS_DIR, "archive.jsonl"),
    JSON.stringify(payload) + "\n",
    "utf8",
  );

  const driveBases = [
    path.join(process.env.USERPROFILE || "", "OneDrive"),
    path.join(process.env.USERPROFILE || "", "Google Drive"),
    "G:\\My Drive",
  ];
  for (const base of driveBases) {
    if (base && fs.existsSync(base)) {
      const dest = path.join(base, "hai-ic-backups", "test-questions");
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(localPath, path.join(dest, fileName));
      break;
    }
  }
  return localPath;
}

async function invokeHourlyRun() {
  const state = readState();
  if (!state.startedAt) state.startedAt = new Date().toISOString();

  const step = Number(state.appliedCount || 0) + 1;
  const at = new Date().toISOString();
  const questions = generateQuestions(step, at);

  state.appliedCount = step;
  state.lastAppliedAt = at;
  state.boostPercent = BOOST_LIVE;
  state.ddPenaltyReduction = 0;

  const results = [];
  for (const q of questions) {
    try {
      const r = await analyzeQuestion(q);
      results.push({
        question: q,
        ic: r.confidence,
        dd: r.isDueDiligence,
        mode: r.sincereMode ? "ON" : "OFF",
      });
    } catch {
      results.push({ question: q, ic: "err", dd: false, mode: "err" });
    }
  }

  const valid = results.filter((r) => r.ic !== "err").map((r) => Number(r.ic));
  const avgIC =
    valid.length > 0
      ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
      : 0;

  const backupPath = backupQuestions(step, at, questions, results);

  const entry = {
    step,
    at,
    avgIC,
    tests: results.length,
    newQuestions: true,
    backup: backupPath,
  };
  if (!Array.isArray(state.log)) state.log = [];
  state.log.push(entry);
  writeState(state);

  const pack = generateBuyerPack();
  appendLog(
    `- Hour ${step} @ ${at} | new Q ${questions.length} | avg IC ${avgIC}% | backup ${path.basename(backupPath)} | buyer pack updated (OFF ${pack.off})`,
  );
  console.log(
    `[hai-ic-automation] hour ${step}: avg IC ${avgIC}%, buyer pack OFF=${pack.off} ON=${pack.on}`,
  );
  return state;
}

function invokeDailyReport() {
  const state = readState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailyReport === today) return;

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `hai-ic-report-${today}.md`);

  return testHealth().then(async (healthy) => {
    const health = healthy ? "healthy" : "down";
    let avg = 0;
    if (Array.isArray(state.log) && state.log.length > 0) {
      const last = state.log[state.log.length - 1];
      if (last.avgIC) avg = last.avgIC;
    }

    const body = `# Hai-Ic Daily Report — ${today}

- Server (:${PORT}): **${health}**
- Hourly runs: **${state.appliedCount}** (new questions + backup, no score inflation)
- Last hourly avg IC (10 tests): **${avg}%**
- Demo: http://localhost:${PORT}/hai-ic

## Targets
- Growth Loops Technology
- instinctools
- Closeloop Technologies

## Follow-up (manual until SMTP configured)
- Growth Loops: Hai-Ic 데모 어떠셨나요?
- instinctools: Hai-Ic 데모 어떠셨나요?
`;

    fs.writeFileSync(reportPath, body, "utf8");
    state.lastDailyReport = today;
    writeState(state);
    appendLog(`- Daily @ ${new Date().toISOString()} → report + backup done`);
    console.log(`[hai-ic-automation] daily report: ${reportPath}`);
  });
}

function invokeNightlyBackup() {
  const stamp = new Date().toISOString().slice(0, 10);
  let destRoot = path.join(path.dirname(PROJECT_ROOT), "backups");

  const drivePaths = [
    path.join(process.env.USERPROFILE || "", "Google Drive"),
    path.join(process.env.USERPROFILE || "", "OneDrive"),
    "G:\\My Drive",
  ];
  for (const d of drivePaths) {
    if (d && fs.existsSync(d)) {
      destRoot = path.join(d, "hai-ic-backups");
      break;
    }
  }

  const dest = path.join(destRoot, `hai-ic-${stamp}`);
  fs.mkdirSync(dest, { recursive: true });

  try {
    execSync(
      `robocopy "${path.join(PROJECT_ROOT, "hai-ic")}" "${dest}" /E /NFL /NDL /NJH /NJS /nc /ns /np`,
      { stdio: "ignore" },
    );
    execSync(
      `robocopy "${path.join(PROJECT_ROOT, "app", "lib")}" "${path.join(dest, "app-lib")}" hai-ic-*.ts /NFL /NDL /NJH /NJS /nc /ns /np`,
      { stdio: "ignore" },
    );
    console.log(`[hai-ic-automation] backup: ${dest}`);
  } catch {
    /* robocopy exit codes 0-7 are success */
  }
}

function init() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const state = readState();
  if (!state.startedAt) {
    state.startedAt = new Date().toISOString();
    writeState(state);
    writeLiveValues();
  }
  writeLiveValues();
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(
      LOG_PATH,
      `# Hai-Ic Automation Log\n\nStarted: ${state.startedAt}\n- Hourly: new 10 questions + backup (no +1% boost)\n- Watch: 30min health check\n- Daily: 07:00 report + backup\n`,
      "utf8",
    );
  }
  return state;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  init();
  console.log("[hai-ic-automation] running (node daemon)...");

  let lastHourly = 0;
  let lastWatch = 0;
  let lastDailyDate = "";

  // First health check + hourly adjust on start
  const bootStatus = await ensureServer();
  appendLog(`- Boot @ ${new Date().toISOString()} → server ${bootStatus}`);
  await invokeHourlyRun();
  lastHourly = Date.now();
  lastWatch = Date.now();

  while (true) {
    const now = Date.now();
    const date = new Date();

    if (now - lastWatch >= 30 * 60 * 1000) {
      const status = await ensureServer();
      appendLog(`- Watch @ ${new Date().toISOString()} → server ${status}`);
      lastWatch = now;
    }

    if (now - lastHourly >= 60 * 60 * 1000) {
      await invokeHourlyRun();
      lastHourly = now;
    }

    const today = date.toISOString().slice(0, 10);
    if (date.getHours() === 7 && lastDailyDate !== today) {
      await invokeDailyReport();
      invokeNightlyBackup();
      lastDailyDate = today;
    }

    await sleep(60_000);
  }
}

main().catch((err) => {
  console.error("[hai-ic-automation] fatal:", err);
  process.exit(1);
});