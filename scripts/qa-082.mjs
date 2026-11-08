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

const skloni = async () => {
  await page.getByRole("button", { name: /Uzet ću kasnije/i }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.locator(".modal-pozadina").evaluate((el) => el.remove()).catch(() => {});
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pokreni igru" }).click({ force: true });
  await page.waitForTimeout(400);
  const dalje = page.getByTestId("onboard-dalje");
  if (await dalje.isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.locator("input").first().fill("Test").catch(() => {});
    await dalje.click();
    const igraj = page.getByTestId("onboard-igraj");
    if (await igraj.isVisible({ timeout: 3000 }).catch(() => false)) await igraj.click();
  }
  await page.waitForTimeout(400);
  await skloni();

  const sloj = page.getByTestId("cestice-sloj");
  await sloj.waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid='cestice-sloj']");
    return el && el.getAttribute("data-backend") && el.getAttribute("data-backend") !== "ceka";
  }, { timeout: 4000 }).catch(() => {});
  const backend = await sloj.getAttribute("data-backend");
  const chip = await page.locator('[data-chip="zlato"]').count();

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("blago-feel", { detail: { rang: "win", x: 195, y: 520 } }));
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "/workspace/screenshots/v82-win.png" });
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("blago-feel", { detail: { rang: "raid", x: 195, y: 480 } }));
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "/workspace/screenshots/v82-raid.png" });

  const fail = [];
  if (!backend || backend === "ceka") fail.push("nema backenda");
  if (chip < 1) fail.push("nema data-chip zlato");
  console.log(JSON.stringify({ backend, chip }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.82");
} finally {
  await browser.close();
}
