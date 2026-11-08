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
  await page.screenshot({ path: `/workspace/screenshots/v71-${name}.png`, fullPage: false });
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

const leftoverPx = async () =>
  page.evaluate(() => {
    const scroller = document.querySelector(".pager-scroller");
    const panes = [...document.querySelectorAll(".pager-pane")];
    if (!scroller || !panes.length) return -1;
    const w = scroller.clientWidth;
    const idx = Math.round(scroller.scrollLeft / Math.max(1, w));
    const pane = panes[idx];
    if (!pane) return -1;
    const sr = scroller.getBoundingClientRect();
    const pr = pane.getBoundingClientRect();
    return Math.max(Math.abs(pr.left - sr.left), Math.abs(pr.width - sr.width));
  });

const drzi = async (locator) => {
  await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: "touch",
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
        isPrimary: true,
      }),
    );
  });
  await page.waitForTimeout(560);
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
  const nacin0 = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const vezePregled = await page.locator(".mreza-veza").count();
  const tlo = await page.getByTestId("mreza-tlo").count();
  const kuce = await page.locator(".mreza-kuca").count();
  const table = await page.locator(".mreza-tabla").count();
  const ulica = await page.locator(".mreza-ulica").count();
  const traka = await page.locator(".mreza-kauba-traka").count();
  const prsteni = await page.locator(".mreza-prsten").count();
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const pipovi = await page.locator(".kauboj-pip").count();
  const selo = await page.locator(".mreza-selo").first().evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      radius: s.borderRadius,
      overflow: s.overflow,
      clip: s.clipPath,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  const krug = selo.w === selo.h && (selo.overflow === "hidden" || (selo.clip || "").includes("circle") || (selo.radius || "").includes("50") || (selo.radius || "").includes("999"));
  const kucaClip = await page.locator(".mreza-kuca").first().evaluate((el) => getComputedStyle(el).clipPath).catch(() => "");
  await shot("gradić");

  const seloBtn = page.locator(".mreza-selo").first();
  await drzi(seloBtn);
  await page.waitForTimeout(180);
  const imaTok = await page.getByTestId("tok-precica-tok").isVisible().catch(() => false);
  if (imaTok) {
    await page.getByTestId("tok-precica-tok").evaluate((el) => el.click());
    await page.waitForTimeout(280);
  }
  const nacinTok = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const vezeTok = await page.locator(".mreza-veza").count();
  const kuceUToku = await page.locator(".mreza-kuca").count();
  await shot("tok");

  const leftover = await leftoverPx();
  const out = {
    imaPregled,
    nacin0,
    vezePregled,
    tlo,
    kuce,
    table,
    ulica,
    traka,
    prsteni,
    glasovi,
    pipovi,
    selo,
    krug,
    kucaClip,
    imaTok,
    nacinTok,
    vezeTok,
    kuceUToku,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (!imaPregled) fail.push("nema Pregled kaube");
  if (nacin0 !== "pregled") fail.push(`nacin0 ${nacin0}`);
  if (vezePregled > 0) fail.push(`strelice u pregledu ${vezePregled}`);
  if (tlo < 1) fail.push("nema tla");
  if (kuce < 8) fail.push(`kuće ${kuce}`);
  if (table < 8) fail.push(`table ${table}`);
  if (ulica < 1) fail.push("nema ulice");
  if (traka < 1) fail.push("nema trake");
  if (prsteni < 8) fail.push(`prsteni ${prsteni}`);
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (pipovi < 3) fail.push(`pipovi ${pipovi}`);
  if (!krug) fail.push("selo nije krug");
  if (!(kucaClip || "").includes("polygon")) fail.push(`clip ${kucaClip}`);
  if (nacinTok !== "tok") fail.push(`nacinTok ${nacinTok}`);
  if (vezeTok < 8) fail.push(`veze u toku ${vezeTok}`);
  if (kuceUToku > 0) fail.push("kuće ostale u toku");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.71");
} finally {
  await browser.close();
}
