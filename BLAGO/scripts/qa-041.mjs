#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.E2E_URL || "http://127.0.0.1:8080";
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

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v41-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (const name of ["Kasnije", "PREUZMI", "Kreni", "Zatvori"]) {
    const b = page.getByRole("button", { name: new RegExp(`^${name}$`, "i") }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(180);
    }
  }
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
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
  await shot("kolo");

  const body = await page.locator("body").innerText();
  const checks = {
    blago: /\bBLAGO\b/.test(body),
    koloNatpis: /\bKOLO\b/.test(body),
    zavrti: /ZAVRTI/.test(body),
    sretna: /Sretna|SRETNA/.test(body),
  };

  await page.getByLabel("Izbornik").click({ force: true });
  await page.waitForTimeout(280);
  await shot("karta");
  const karta = await page.locator(".karta-izbornik").isVisible().catch(() => false);
  await page.getByLabel("Beta info").waitFor({ state: "visible" });
  await page.mouse.click(40, 120);
  await page.waitForTimeout(200);

  await page.getByLabel("Kauba").click();
  await page.getByText("Smještaj").first().waitFor({ state: "visible" });
  await shot("tabor");

  const kauboji = page.getByRole("button", { name: /^Kauboji$/i });
  await kauboji.click();
  await page.getByText("Kauboji kaube").first().waitFor({ state: "visible" });
  await shot("kauboji");

  const zid = page.getByRole("button", { name: /^Zid$/i });
  await zid.click();
  await page.waitForTimeout(400);
  await shot("zid");

  const mreza = page.getByRole("button", { name: /^Mreža$/i });
  await mreza.click();
  await page.getByText("Tok kaube").first().waitFor({ state: "visible" });
  await shot("mreza");

  await page.getByLabel("Zadaci").click();
  await page.getByText("Karavana").first().waitFor({ state: "visible" });
  await shot("karavana");

  await page.getByLabel("Tržnica").click();
  await page.getByText("Mjenjačnica").first().waitFor({ state: "visible" });
  await shot("burza");
  const x100burza = await page.getByText("×100").first().isVisible().catch(() => false);
  await page.getByRole("button", { name: /^Alati$/i }).click();
  await page.waitForTimeout(250);
  const x100alati = await page.getByText("×100").first().isVisible().catch(() => false);
  await shot("alati");

  const report = {
    checks,
    karta,
    x100burza,
    x100alati,
    errors: errors.slice(0, 12),
    seif: /seif/i.test(await page.locator("body").innerText()),
  };
  console.log(JSON.stringify(report, null, 2));
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
