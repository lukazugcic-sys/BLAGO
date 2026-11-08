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
  try { localStorage.clear(); } catch {}
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v46-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    } else break;
  }
  const modal = page.locator(".modal-pozadina").first();
  if (await modal.isVisible({ timeout: 200 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(150);
  }
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
  await shot("splash");
  await pokreni.click({ force: true });
  await page.waitForTimeout(500);
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
  await page.getByTestId("zavrti").waitFor({ state: "visible" });
  await dismiss();

  const slotHasJutro = await page.getByText("Jutros", { exact: false }).count();
  const slotHasCilj = await page.getByText("Sljedeći cilj", { exact: false }).count();
  await shot("slot");

  await page.getByLabel("dijamanti:", { exact: false }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  const dijamantiIme = await page.locator(".chip-ime-on").allTextContents();
  await shot("chip");

  await page.getByLabel("razina").click({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  const razinaIme = await page.locator(".chip-ime-on").allTextContents();
  await page.getByLabel("štitovi").click({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  const stitIme = await page.locator(".chip-ime-on").allTextContents();
  await shot("imena");

  await page.getByLabel("Kauba").click();
  await page.waitForTimeout(300);
  const zidBtn = page.getByRole("button", { name: /Zid/i }).first();
  await zidBtn.click({ force: true });
  await page.waitForTimeout(500);
  const zidMood = await page.locator(".zid-mood").innerText().catch(() => "");
  const zidJutro = await page.getByText("Jutros", { exact: false }).count();
  const zidCilj = await page.locator(".cilj-kartica").count();
  const heroMood = await page.locator(".kauba-mood-rec").count();
  await shot("zid");

  const report = {
    slotHasJutro,
    slotHasCilj,
    dijamantiIme,
    razinaIme,
    stitIme,
    zidMood: zidMood.slice(0, 120),
    zidJutro,
    zidCilj,
    heroMood,
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (slotHasCilj > 0 || heroMood > 0 || !zidMood || zidCilj < 1) {
    process.exit(2);
  }
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
