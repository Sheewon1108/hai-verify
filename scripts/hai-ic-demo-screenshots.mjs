import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = process.env.DEMO_OUT_DIR || "/opt/cursor/artifacts";

async function analyzeAndCapture(page, text, outName) {
  const input = page.locator("textarea").first();
  await input.fill(text);
  await page.locator('button:has-text("Analyze")').first().click();

  // Wait for confidence result if it appears; fall back to timeout
  const confidence = page.locator("text=Intent Confidence").first();
  try {
    await confidence.waitFor({ state: "visible", timeout: 5000 });
    await confidence.scrollIntoViewIfNeeded();
  } catch {
    await page.waitForTimeout(2500);
    const demo = page.locator("#demo").first();
    if (await demo.count()) await demo.scrollIntoViewIfNeeded();
  }

  await page.waitForTimeout(500);
  const artifactPath = path.join(OUT_DIR, outName);
  await page.screenshot({ path: artifactPath, fullPage: false });
  await page.screenshot({ path: outName, fullPage: false });
  return artifactPath;
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

  await page.goto("https://hai-ic.com", { waitUntil: "networkidle" });

  const demo = page.locator("#demo").first();
  if (await demo.count()) await demo.scrollIntoViewIfNeeded();

  const weakPath = await analyzeAndCapture(
    page,
    "AI 도입 어떻게 해?",
    "demo-weak.png",
  );

  const strongPath = await analyzeAndCapture(
    page,
    "물류 파트너와 재거래하려고 해. 담당자 확인하고 다음 주 미팅을 잡고 싶어.",
    "demo-strong.png",
  );

  console.log(`Done. Check ${weakPath} and ${strongPath}`);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
