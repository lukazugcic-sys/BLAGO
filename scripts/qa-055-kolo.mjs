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

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const bbox = () =>
  page.evaluate(() => {
    const el = document.querySelector("[data-testid=slot-kolo]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const bunar = el.querySelector(".slot-kolo-bunar")?.getBoundingClientRect();
    const metri = el.querySelector(".slot-metri")?.getBoundingClientRect();
    return {
      top: Math.round(r.top * 10) / 10,
      height: Math.round(r.height * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      bunarH: bunar ? Math.round(bunar.height * 10) / 10 : 0,
      metriH: metri ? Math.round(metri.height * 10) / 10 : 0,
    };
  });

const dismiss = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(180);
    } else break;
  }
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pokreni igru" }).click({ force: true });
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
  await page.getByLabel("Igraj").click({ force: true });
  await page.waitForTimeout(800);
  await dismiss();
  await page.waitForSelector("[data-testid=slot-kolo]", { timeout: 8000 });

  const idle = await bbox();
  await page.screenshot({ path: "/workspace/screenshots/v55-idle.png" });

  await page.evaluate(() => {
    const el = document.querySelector("[data-testid=slot-kolo]");
    el?.classList.add("reel-frame-win", "reel-win");
  });
  await page.waitForTimeout(200);
  const framed = await bbox();
  await page.screenshot({ path: "/workspace/screenshots/v55-frame-win.png" });

  const zavrti = page.getByTestId("zavrti");
  for (let i = 0; i < 3; i++) {
    if (await zavrti.isEnabled().catch(() => false)) {
      await zavrti.click({ force: true });
      await page.waitForTimeout(1400);
    }
  }
  await page.waitForTimeout(400);
  const afterSpin = await bbox();
  await page.screenshot({ path: "/workspace/screenshots/v55-after-spin.png" });

  const delta = (a, b) =>
    a && b ? { top: Math.abs(a.top - b.top), height: Math.abs(a.height - b.height), bunarH: Math.abs(a.bunarH - b.bunarH) } : null;

  const report = {
    idle,
    framed,
    afterSpin,
    vsFrame: delta(idle, framed),
    vsSpin: delta(idle, afterSpin),
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 8),
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
