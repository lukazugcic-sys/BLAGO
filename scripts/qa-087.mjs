#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-webgpu"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Pokreni igru").click({ force: true });
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

  const sloj = page.getByTestId("cestice-sloj");
  await sloj.waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid='cestice-sloj']");
    return el && el.getAttribute("data-backend") && el.getAttribute("data-backend") !== "ceka";
  }, { timeout: 5000 }).catch(() => {});
  const backend = await sloj.getAttribute("data-backend");
  const chip = await page.locator('[data-chip="zlato"]').count();

  await page.evaluate(() => {
    document.querySelector('[data-chip="zlato"]')?.classList.remove("chip-pogodak");
    window.dispatchEvent(new CustomEvent("blago-feel", {
      detail: { rang: "win", x: 195, y: 520, cips: { zlato: 12 } },
    }));
  });
  await page.screenshot({ path: "/workspace/screenshots/v87-win.png" });
  const pogodak = await page.waitForFunction(() =>
    document.querySelector('[data-chip="zlato"]')?.classList.contains("chip-pogodak") === true,
  { timeout: 900 }).then(() => true).catch(() => false);
  await page.screenshot({ path: "/workspace/screenshots/v87-slet.png" });
  await page.screenshot({ path: "/workspace/screenshots/v87-kauba.png" });

  const fail = [];
  if (!backend || backend === "ceka") fail.push("nema backenda");
  if (chip < 1) fail.push("nema data-chip zlato");
  if (!pogodak) fail.push("chip nije trepnuo");
  console.log(JSON.stringify({ backend, chip, pogodak }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.87");
} finally {
  await browser.close();
}
