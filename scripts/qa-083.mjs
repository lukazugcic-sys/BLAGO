#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pokreni igru" }).click({ force: true });
  await page.waitForTimeout(500);
  const dalje = page.getByTestId("onboard-dalje");
  if (await dalje.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.locator("input").first().fill("Test").catch(() => {});
    await dalje.click();
    const igraj = page.getByTestId("onboard-igraj");
    if (await igraj.isVisible({ timeout: 3000 }).catch(() => false)) await igraj.click();
  }
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelectorAll(".modal-pozadina").forEach((el) => el.remove());
  });

  const scroller = page.locator(".pager-scroller");
  await scroller.waitFor({ state: "visible" });
  const paneW = await page.locator(".pager-pane").evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().width)),
  );
  const viewW = await scroller.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  await page.screenshot({ path: "/workspace/screenshots/v83-kauba.png" });

  const fail = [];
  if (viewW < 300) fail.push(`scroller ${viewW}`);
  for (const w of paneW) {
    if (Math.abs(w - viewW) > 2) fail.push(`pane ${w} != ${viewW}`);
  }
  console.log(JSON.stringify({ viewW, paneW }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.83");
} finally {
  await browser.close();
}
