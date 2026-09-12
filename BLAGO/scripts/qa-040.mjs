#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.E2E_URL || "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v41-${name}.png`, fullPage: false });
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
  const dismiss = async () => {
    for (const name of ["Kasnije", "PREUZMI", "Kreni", "Zatvori"]) {
      const b = page.getByRole("button", { name: new RegExp(name, "i") }).first();
      if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
        await b.click({ force: true }).catch(() => {});
        await page.waitForTimeout(200);
      }
    }
  };

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
  await shot("kolo");

  const body = await page.locator("body").innerText();
  const checks = {
    zavrti: /ZAVRTI/.test(body),
    blago: /\bBLAGO\b/.test(body),
    kolo: /\bKOLO\b/.test(body),
    kupi: /KUPI/.test(body),
    turbo: /TURBO/.test(body),
  };

  await page.getByLabel("Izbornik").click({ force: true });
  await page.waitForTimeout(320);
  await shot("izbornik");
  await page.keyboard.press("Escape");
  await page.mouse.click(40, 80);
  await page.waitForTimeout(200);

  await page.getByLabel("Kauba").click();
  await page.getByText("Smještaj").first().waitFor({ state: "visible" });
  await shot("kauba");
  await page.getByRole("button", { name: "Kauboji" }).click();
  await page.getByText("Kauboji kaube").first().waitFor({ state: "visible" });
  await shot("kauboji");

  await page.getByLabel("Zadaci").click();
  await page.getByText("Karavana").first().waitFor({ state: "visible" });
  await shot("zadaci");

  await page.getByLabel("Tržnica").click();
  await page.getByText("×100").first().waitFor({ state: "visible" });
  await shot("trznica");

  console.log(JSON.stringify({ ok: true, checks, errors }, null, 2));
} catch (err) {
  await shot("fail");
  console.log(JSON.stringify({ ok: false, err: String(err?.message || err), errors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
