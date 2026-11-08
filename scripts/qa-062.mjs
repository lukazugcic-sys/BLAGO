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
  await page.screenshot({ path: `/workspace/screenshots/v62-${name}.png`, fullPage: false });
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

  const dosje = await page.getByTestId("hub-dosje").count();
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const doba = await page.locator("[data-testid=mreza-platno]").getAttribute("data-doba");
  const pohod = await page.getByTestId("hub-naredba-pohod").count();
  await shot("selo-glasovi");

  await page.getByTestId("hub-glas-krov").evaluate((el) => el.click());
  await page.waitForTimeout(250);
  await skloniDnevnu();
  const kuca = await page.getByRole("button", { name: /Diži kuću/i }).count();
  const ruke = await page.getByTestId("hub-ruke").count();
  await shot("hub-krov");

  await page.getByRole("button", { name: /^Hrana$/i }).last().evaluate((el) => el.click()).catch(() => {});
  await page.waitForTimeout(250);
  const farma = await page.getByRole("button", { name: /Otvori farmu/i }).count();
  await shot("hub-jelo");

  await page.locator(".mreza-selo").evaluate((el) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
  });
  await page.waitForTimeout(250);

  const cowboy = page.locator(".mreza-ispis > li > button").first();
  if (await cowboy.count()) {
    await cowboy.evaluate((el) => el.click());
    await page.waitForTimeout(200);
  }
  const birac = await page.getByTestId("lik-hub-birac").count();
  if (birac) {
    const posao = page.getByTestId("lik-hub-birac").getByRole("button", { name: "Posao" });
    if (await posao.count()) {
      await posao.evaluate((el) => el.click());
      await page.waitForTimeout(250);
    }
  }
  await shot("ruke");

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

  const out = {
    dosje,
    glasovi,
    doba,
    pohod,
    kuca,
    ruke,
    farma,
    birac,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (dosje < 1) fail.push("nema dosje");
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (!doba) fail.push("nema doba");
  if (pohod < 1) fail.push("nema pohod uredbe");
  if (kuca < 1) fail.push("nema diži kuću");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.62");
} finally {
  await browser.close();
}
