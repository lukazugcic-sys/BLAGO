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
  await page.screenshot({ path: `/workspace/screenshots/v48-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (let i = 0; i < 5; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI|U redu/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(180);
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
  await page.waitForTimeout(400);

  const navLabels = await page.locator("nav button").evaluateAll((els) =>
    els.map((el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim()),
  );
  const navJoined = navLabels.join(" | ");
  const zidIdx = navLabels.findIndex((t) => /Zid/i.test(t));
  const igrajIdx = navLabels.findIndex((t) => /Igraj/i.test(t));
  const kaubaIdx = navLabels.findIndex((t) => /Kauba/i.test(t));
  const startKauba = await page.getByRole("button", { name: /Tabor|Kauboji|Mreža/i }).first().isVisible().catch(() => false);
  await shot("start-kauba");

  await page.locator(".kauba-listak button[aria-label='Kauboji']").click({ force: true });
  await page.waitForTimeout(500);
  await dismiss();
  const lovacica = await page.getByText(/lovačica/i).count();
  const lovac = await page.locator(".kauboj-kartica").filter({ hasText: /^lovac$/i }).count();
  const serifKartice = page.locator(".kauboj-kartica").filter({ hasText: /Šerif/i });
  const serifPrije = await serifKartice.count();
  await shot("kauboji");

  if (serifPrije > 0) {
    await serifKartice.first().locator("button.kauboj-glava").click({ force: true });
    await page.waitForTimeout(250);
    const preimenuj = page.getByRole("button", { name: /^Preimenuj$/i });
    if (await preimenuj.isVisible({ timeout: 1500 }).catch(() => false)) {
      await preimenuj.click({ force: true });
      const inp = page.getByLabel("Ime");
      await inp.waitFor({ state: "visible", timeout: 2000 });
      await inp.fill("Maks");
      await inp.press("Enter");
      await page.waitForTimeout(400);
    }
  }
  const serifPoslije = await page.locator(".kauboj-kartica").filter({ hasText: /Šerif/i }).count();
  const boroOstao = await page.locator(".kauboj-kartica").filter({ hasText: /Boro/i }).count();
  const maks = await page.locator(".kauboj-kartica").filter({ hasText: /Maks/i }).count();
  await shot("serif-ime");

  await page.locator(".kauba-listak button[aria-label='Tabor']").click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Posao/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const pilana = page.locator("#zgrada-pilana");
  if (await pilana.count()) await pilana.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(250);
  await shot("pilana");
  const kamen = page.locator("#zgrada-kamenolom");
  if (await kamen.count()) await kamen.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(250);
  await shot("kamenolom");

  await page.getByRole("button", { name: /Zid/i }).click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  const zora = await page.getByText(/Naredbe zore|Tri naredbe|Zora/i).count();
  await shot("zid");

  await page.getByRole("button", { name: /Igraj/i }).click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  const zavrti = await page.getByTestId("zavrti").isVisible().catch(() => false);
  await shot("slot");

  const report = {
    navJoined,
    navOrderOk: igrajIdx >= 0 && zidIdx === igrajIdx + 1 && kaubaIdx === zidIdx + 1,
    startKauba,
    lovacica,
    lovac,
    serifPrije,
    serifPoslije,
    boroOstao,
    maks,
    zora,
    zavrti,
    errors: errors.filter((e) => !/favicon|Download the React DevTools/i.test(e)).slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.navOrderOk || !startKauba || lovacica > 0 || serifPoslije > 1 || !zavrti || zora < 1) {
    process.exit(2);
  }
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
