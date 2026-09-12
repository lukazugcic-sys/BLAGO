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
  await page.screenshot({ path: `/workspace/screenshots/v42-${name}.png`, fullPage: false });
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
  const zavrti = page.getByTestId("zavrti");
  await zavrti.waitFor({ state: "visible" });
  await dismiss();
  const box = await zavrti.boundingBox();
  const zavrtiUEkranu = !!box && box.y >= 0 && box.y + box.height <= 844;
  await shot("kolo");

  const body = await page.locator("body").innerText();
  const turbo = page.getByRole("button", { name: /^TURBO$/ });
  const kupi = page.getByRole("button", { name: /^KUPI$/ });
  const turboBox = await turbo.boundingBox().catch(() => null);
  const kupiBox = await kupi.boundingBox().catch(() => null);
  const turboUzKupi =
    !!turboBox &&
    !!kupiBox &&
    Math.abs(turboBox.y - kupiBox.y) < 12 &&
    kupiBox.x > turboBox.x &&
    kupiBox.x - (turboBox.x + turboBox.width) < 24;

  const ulozi = await page.locator(".ulozi-red button").count();
  const stit = await page.locator(".kru-stit").isVisible().catch(() => false);
  const niz = /\bNIZ\s*×/.test(body);

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
  const taborGrad = await page.locator(".tabor-grad").count();
  const hubPrikaz = await page.locator(".hub-prikaz").count();

  const mreza = page.getByRole("button", { name: /^Mreža$/i });
  await mreza.click();
  await page.getByText("Tok kaube").first().waitFor({ state: "visible" });
  await page.locator(".mreza-platno").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  await shot("mreza");
  const tok = await page.evaluate(() => {
    const rub = document.querySelector(".mreza-rub");
    const platno = document.querySelector(".mreza-platno");
    if (!rub || !platno) return { overflow: true, missing: true };
    const r = platno.getBoundingClientRect();
    const shell = document.querySelector(".game-shell")?.getBoundingClientRect();
    const sirina = shell?.width ?? window.innerWidth;
    const lijevo = shell?.left ?? 0;
    return {
      overflow: rub.scrollWidth > rub.clientWidth + 8,
      missing: false,
      sw: rub.scrollWidth,
      cw: rub.clientWidth,
      left: r.left,
      right: r.right,
      sirina,
    };
  });

  const report = {
    zavrtiUEkranu,
    zavrtiBox: box,
    turboUzKupi,
    ulozi,
    stit,
    niz,
    karta,
    taborGrad,
    hubPrikaz,
    tok,
    blago: /\bBLAGO\b/.test(body),
    errors: errors.slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!zavrtiUEkranu || !turboUzKupi || ulozi !== 6 || !stit || niz || taborGrad !== 0 || tok.overflow) {
    process.exit(2);
  }
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
