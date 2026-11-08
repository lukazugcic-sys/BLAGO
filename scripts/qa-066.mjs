#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(28000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v66-${name}.png`, fullPage: false });
};

const skloniDnevnu = async () => {
  await page
    .getByRole("button", { name: /ostaje u Zadacima/i })
    .click({ force: true, timeout: 2500 })
    .catch(() => {});
  await page
    .getByRole("button", { name: "Kasnije", exact: true })
    .click({ force: true, timeout: 800 })
    .catch(() => {});
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
  await page.waitForTimeout(1000);
  await skloniDnevnu();
  await page.waitForTimeout(200);

  const naslov = await page.locator("body").innerText();
  const imaPregled = /Pregled kaube/i.test(naslov);
  const sloj = await page.getByTestId("mreza-kauboji").count();
  const pipovi = await page.locator(".kauboj-pip").count();
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const kapovi = await page.locator("[data-testid^=mreza-kap-]").count();
  const kapTiho = await page.locator(".mreza-kap-tiho").count();
  const ivo = page.getByTestId("mreza-radnik-ivo");
  const imaIvo = (await ivo.count()) > 0;
  await shot("ured");

  if (imaIvo) {
    await ivo.evaluate((el) => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    await page.waitForTimeout(180);
  }
  await skloniDnevnu();
  const rec2 = await page.getByTestId("mreza-posalji-rec").innerText().catch(() => "");
  const imeTag = await page.locator(".mreza-kauboj-ime").innerText().catch(() => "");
  const jelo = page.locator("[data-hub=jelo] .mreza-cvor");
  if ((await jelo.count()) > 0) {
    await jelo.evaluate((el) => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    await page.waitForTimeout(500);
  }
  const kapJelo = await page.getByTestId("mreza-kap-jelo").innerText().catch(() => "");
  const kapJeloTiho = await page.getByTestId("mreza-kap-jelo").evaluate((el) => el.classList.contains("mreza-kap-tiho")).catch(() => true);
  await shot("hod");

  const leftover = await page.evaluate(() => {
    const scroller = document.querySelector(".pager-scroller");
    const panes = [...document.querySelectorAll(".pager-pane")];
    if (!scroller || !panes.length) return -1;
    const w = scroller.clientWidth;
    const idx = Math.round(scroller.scrollLeft / w);
    const pane = panes[idx];
    if (!pane) return -1;
    const sr = scroller.getBoundingClientRect();
    const pr = pane.getBoundingClientRect();
    return Math.max(Math.abs(pr.left - sr.left), Math.abs(pr.width - sr.width));
  });

  const out = { imaPregled, sloj, pipovi, glasovi, kapovi, kapTiho, imaIvo, rec2, imeTag, kapJelo, kapJeloTiho, leftover, errors };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (!imaPregled) fail.push("nema Pregled kaube");
  if (sloj < 1) fail.push("nema sloja");
  if (pipovi < 3) fail.push(`pipovi ${pipovi}`);
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (kapovi < 8) fail.push(`kapovi ${kapovi}`);
  if (kapTiho < 6) fail.push(`kap-tiho ${kapTiho}`);
  if (!imaIvo) fail.push("nema Ive");
  if (!/Ivo · dodirni sobu/.test(rec2)) fail.push(`rec2 ${rec2}`);
  if (!/Ivo/i.test(imeTag)) fail.push(`ime ${imeTag}`);
  if (kapJeloTiho) fail.push("kap jelo tiho");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.66");
} finally {
  await browser.close();
}
