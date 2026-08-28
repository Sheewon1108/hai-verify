import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const BASE = process.env.ROOM_TEST_BASE ?? "http://127.0.0.1:3000";
const KEY = "demo-pair-key-1";
const BODY = "복불복 테스트 한 줄";
const ART = process.env.ROOM_TEST_ART ?? "/opt/cursor/artifacts";

await mkdir(ART, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.setViewport({ width: 1280, height: 900 });

const shot = async (name) => {
  const path = `${ART}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
};

const log = [];
const note = (line) => {
  log.push(line);
  console.log(line);
};

try {
  await page.goto(`${BASE}/hai-ic`, { waitUntil: "networkidle0" });
  const publicNav = await page.evaluate(() => document.body.innerText);
  if (/낙서|복불복|\/room/.test(publicNav)) {
    throw new Error("public nav leaked room");
  }
  await shot("public_landing_no_room_nav");
  note("PASS public landing hides room");

  await page.goto(`${BASE}/robots.txt`, { waitUntil: "domcontentloaded" });
  const robots = await page.evaluate(() => document.body.innerText);
  if (!robots.includes("Disallow: /room") || !robots.includes("Disallow: /api/room")) {
    throw new Error(`robots missing disallow: ${robots}`);
  }
  await shot("robots_disallow_room");
  note("PASS robots disallow");

  await page.goto(`${BASE}/room`, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.documentElement.dataset.roomHydrated === "1",
  );
  await page.waitForSelector("#room-key");
  await shot("room_lock_screen");

  const clickOpen = async () => {
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await page.evaluate((el) => el.textContent?.trim(), button);
      if (text === "열기" || text === "여는 중") {
        await button.click();
        return;
      }
    }
    throw new Error("open button missing");
  };

  await page.$eval("#room-key", (el) => {
    el.value = "abc";
  });
  await clickOpen();
  await page.waitForFunction(
    () => document.body.innerText.includes("방 열쇠는 10자 이상"),
    { timeout: 8000 },
  );
  await shot("room_short_key_rejected");
  note("PASS short key rejected");

  await page.$eval("#room-key", (el, value) => {
    el.value = value;
  }, KEY);
  await clickOpen();
  await page.waitForFunction(
    () => document.body.innerText.includes("낙서 읽기") && document.body.innerText.includes("잠금"),
    { timeout: 15000 },
  );
  await shot("room_hub_unlocked");
  note("PASS unlocked hub");

  await page.waitForSelector('a[href="/room/bok"]');
  await page.click('a[href="/room/bok"]');
  await page.waitForFunction(() => location.pathname === "/room/bok");
  await page.waitForSelector("#bok-draft");
  await page.$eval("#bok-draft", (el, value) => {
    el.value = value;
  }, BODY);
  const putButtons = await page.$$("button");
  for (const button of putButtons) {
    const text = await page.evaluate((el) => el.textContent, button);
    if (text?.trim() === "넣기") {
      await button.click();
      break;
    }
  }
  await page.waitForFunction(
    (body) => document.body.innerText.includes(body),
    { timeout: 8000 },
    BODY,
  );
  await shot("room_bok_saved");
  note("PASS bok save");

  await page.click('a[href="/room/nakseo"]');
  await page.waitForFunction(
    (body) => document.body.innerText.includes(body) && document.body.innerText.includes("읽기"),
    { timeout: 8000 },
    BODY,
  );
  await shot("room_nakseo_read");
  note("PASS nakseo read");

  const lockButtons = await page.$$("button");
  for (const button of lockButtons) {
    const text = await page.evaluate((el) => el.textContent, button);
    if (text?.trim() === "잠금") {
      await button.click();
      break;
    }
  }
  await page.waitForSelector("#room-key");
  const lockedText = await page.evaluate(() => document.body.innerText);
  if (lockedText.includes(BODY)) {
    throw new Error("diary body still visible after lock");
  }
  await shot("room_locked_again");
  note("PASS lock hides body");

  await page.$eval("#room-key", (el, value) => {
    el.value = value;
  }, KEY);
  await clickOpen();
  await page.waitForFunction(
    () => document.body.innerText.includes("잠금"),
    { timeout: 15000 },
  );
  await page.click('a[href="/room/nakseo"]');
  await page.waitForFunction(
    (body) => document.body.innerText.includes(body),
    { timeout: 8000 },
    BODY,
  );
  await shot("room_reopen_persisted");
  note("PASS reopen shows same entry");

  await writeFile(`${ART}/private_room_browser_test.log`, `${log.join("\n")}\n`, "utf8");
  console.log("ALL_PASS");
} catch (error) {
  await shot("room_browser_test_failure");
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
