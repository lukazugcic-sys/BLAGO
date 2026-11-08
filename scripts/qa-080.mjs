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
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 800 }).catch(() => {});
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

  const platno = page.getByTestId("mreza-platno");
  await platno.waitFor({ state: "visible" });
  const box = await platno.boundingBox();
  const info = await page.evaluate(() => {
    const v = document.querySelector("[data-testid=mreza-video]");
    const ton = document.querySelector(".mreza-dio-ton");
    return {
      dio: v?.getAttribute("data-dio"),
      ton: !!ton,
      mix: ton ? getComputedStyle(ton).mixBlendMode : "",
    };
  });

  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.waitForTimeout(200);
    const prsten = await page.getByTestId("mreza-anticipacija").count();
    await page.screenshot({ path: "/workspace/screenshots/v80-hold.png" });
    await page.waitForTimeout(280);
    const meni = await page.getByTestId("tok-radial").count();
    await page.mouse.up();
    await page.screenshot({ path: "/workspace/screenshots/v80-polukrug.png" });
    const fail = [];
    if (!info.ton) fail.push("nema tona");
    if (info.mix !== "color") fail.push(`mix ${info.mix}`);
    if (prsten < 1) fail.push("nema anticipacije");
    if (meni < 1) fail.push("nema polukruga");
    console.log(JSON.stringify({ info, prsten, meni }, null, 2));
    if (fail.length) {
      console.error("FAIL", fail.join("; "));
      process.exit(1);
    }
  }
  console.log("OK 0.9.80");
} finally {
  await browser.close();
}
