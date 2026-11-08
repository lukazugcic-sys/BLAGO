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
  await page.screenshot({ path: `/workspace/screenshots/v47-${name}.png`, fullPage: false });
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
  await page.getByTestId("zavrti").waitFor({ state: "visible" });
  await dismiss();

  const smanjiCta = await page.locator(".energija-cta").count();
  const smanjiBtn = await page.getByTestId("smanji-ulog").count();
  await shot("slot");

  await page.getByLabel("Kauba").click();
  await page.waitForTimeout(500);
  const mrezaBtn = page.getByRole("button", { name: /Mreža/i });
  await mrezaBtn.click({ force: true });
  await page.waitForTimeout(500);
  const tok = await page.getByText("Tok kaube").count();
  const veze = await page.locator("svg path.mreza-veza").count();
  const cvorovi = await page.locator(".mreza-cvor").count();
  await shot("mreza");

  const zidBtn = page.getByRole("button", { name: /Zid/i });
  await zidBtn.click({ force: true });
  await page.waitForTimeout(400);
  const zora = await page.getByText("Naredbe zore").count();
  const jutros = await page.getByText("Jutros", { exact: false }).count();
  await shot("zid");

  const report = {
    smanjiCta,
    smanjiBtn,
    tok,
    veze,
    cvorovi,
    zora,
    jutros,
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (smanjiCta > 0 || smanjiBtn > 0 || tok < 1 || veze < 8 || cvorovi < 8 || zora < 1 || jutros > 0) {
    process.exit(2);
  }
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
