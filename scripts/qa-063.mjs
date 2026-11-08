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
  await page.screenshot({ path: `/workspace/screenshots/v63-${name}.png`, fullPage: false });
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

  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const kapovi = await page.locator("[data-testid^=mreza-kap-]").count();
  const ivo = page.getByTestId("mreza-radnik-ivo");
  const imaIvo = (await ivo.count()) > 0;
  await shot("pregled");

  let vuceno = false;
  if (imaIvo) {
    const a = await ivo.boundingBox();
    const jelo = page.locator("[data-hub=jelo]");
    const b = await jelo.boundingBox();
    if (a && b) {
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
      await page.waitForTimeout(80);
      await page.mouse.up();
      await page.waitForTimeout(350);
      const kapJelo = await page.getByTestId("mreza-kap-jelo").innerText().catch(() => "");
      vuceno = /2\s*\/\s*\d/.test(kapJelo);
    }
  }
  await shot("vuci");

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

  const out = { glasovi, kapovi, imaIvo, vuceno, leftover, errors };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (kapovi < 8) fail.push(`kapovi ${kapovi}`);
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.63");
} finally {
  await browser.close();
}
