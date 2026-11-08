#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(28000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v49-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(180);
    } else break;
  }
  const modal = page.locator(".modal-pozadina").first();
  if (await modal.isVisible({ timeout: 200 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(120);
  }
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
  await pokreni.click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  const dalje = page.getByTestId("onboard-dalje");
  if (await dalje.isVisible({ timeout: 4000 }).catch(() => false)) {
    const ime = page.locator("input").first();
    if (await ime.isVisible().catch(() => false)) await ime.fill("Test");
    await dalje.click();
    const igraj = page.getByTestId("onboard-igraj");
    if (await igraj.isVisible({ timeout: 3000 }).catch(() => false)) await igraj.click();
  }
  await dismiss();

  const kauba = page.getByLabel("Kauba", { exact: true });
  const startKauba = await kauba.getAttribute("aria-current");
  await shot("start-kauba");

  await page.getByRole("button", { name: /^Zakon$/i }).click({ force: true });
  await page.waitForTimeout(400);
  const ured = page.locator("#zgrada-ured");
  await ured.waitFor({ state: "visible", timeout: 4000 });
  await ured.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot("ured");
  const uredImg = await ured.locator("img").first().getAttribute("src");

  await page.getByLabel("Igraj").click({ force: true });
  await page.waitForTimeout(500);
  await dismiss();
  const zavrti = page.getByTestId("zavrti");
  await zavrti.waitFor({ state: "visible" });
  await shot("slot-idle");
  const tokenBox = await page.locator(".slot-token").first().boundingBox();
  const artBox = await page.locator(".slot-art").first().boundingBox();

  await zavrti.click({ force: true });
  await page.waitForTimeout(280);
  const spinning = await page.locator(".reel-col.is-spin").count();
  await shot("slot-spin");
  await page.waitForTimeout(1600);
  await shot("slot-land");

  await page.getByLabel("Zid").click({ force: true });
  await page.waitForTimeout(550);
  await shot("zid");
  await page.getByLabel("Kauba", { exact: true }).click({ force: true });
  await page.waitForTimeout(550);
  await shot("kauba-after");

  const track = page.locator(".pager-track");
  const tf = await track.evaluate((el) => getComputedStyle(el).transform);
  const leftover = await track.evaluate((el) => {
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const parts = m[1].split(",").map((x) => Number(x.trim()));
    const tx = parts[4] ?? 0;
    const w = el.parentElement?.clientWidth || 1;
    const n = 5;
    const idx = 2;
    const expected = -idx * w;
    return Math.abs(tx - expected);
  });

  const report = {
    startKauba,
    uredSrc: uredImg,
    spinning,
    token: tokenBox,
    art: artBox,
    transform: tf,
    leftoverPx: leftover,
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (startKauba !== "page") process.exit(2);
  if (!uredImg || !/ured\.webp/.test(uredImg)) process.exit(3);
  if (leftover > 2) process.exit(4);
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
