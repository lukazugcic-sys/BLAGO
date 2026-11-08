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
  await page.screenshot({ path: `/workspace/screenshots/v50-${name}.png`, fullPage: false });
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

const leftoverPx = async () => {
  return page.evaluate(() => {
    const scroller = document.querySelector(".pager-scroller");
    const panes = [...document.querySelectorAll(".pager-pane")];
    if (!scroller || !panes.length) return -1;
    const sr = scroller.getBoundingClientRect();
    const w = scroller.clientWidth;
    if (w <= 0) return -1;
    const idx = Math.round(scroller.scrollLeft / w);
    const pane = panes[idx];
    if (!pane) return -1;
    const pr = pane.getBoundingClientRect();
    return Math.max(
      Math.abs(pr.left - sr.left),
      Math.abs(pr.right - sr.right),
      Math.abs(pr.width - sr.width),
      Math.abs(scroller.scrollLeft - idx * w),
    );
  });
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
  await page.waitForTimeout(400);
  await shot("start-kauba");
  const leftoverStart = await leftoverPx();

  await page.getByLabel("Zid").click({ force: true });
  await page.waitForTimeout(650);
  await shot("zid");
  const leftoverZid = await leftoverPx();

  await page.getByLabel("Kauba", { exact: true }).click({ force: true });
  await page.waitForTimeout(650);
  await shot("kauba-after");
  const leftoverKauba = await leftoverPx();

  await page.getByLabel("Igraj").click({ force: true });
  await page.waitForTimeout(700);
  await dismiss();
  const leftoverIgraj = await leftoverPx();
  await shot("igraj");

  await page.getByLabel("Kauba", { exact: true }).click({ force: true });
  await page.waitForTimeout(700);
  const leftoverBack = await leftoverPx();
  await shot("kauba-back");

  const report = {
    startKauba,
    leftoverStart,
    leftoverZid,
    leftoverKauba,
    leftoverIgraj,
    leftoverBack,
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (startKauba !== "page") process.exit(2);
  const worst = Math.max(leftoverStart, leftoverZid, leftoverKauba, leftoverIgraj, leftoverBack);
  if (worst > 2) process.exit(4);
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
