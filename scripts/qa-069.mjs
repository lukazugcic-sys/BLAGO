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

const googleFontReq = [];
const localWoff2 = [];
page.on("request", (req) => {
  const u = req.url();
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(u)) googleFontReq.push(u);
  if (/\/fonts\/.+\.woff2/i.test(u)) localWoff2.push(u);
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v69-${name}.png`, fullPage: false });
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
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const pipovi = await page.locator(".kauboj-pip").count();
  await shot("trg");

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

  const fontInfo = await page.evaluate(() => {
    const links = [...document.querySelectorAll("link")].map((l) => ({
      rel: l.rel,
      href: l.href,
      as: l.as,
    }));
    const googleCss = links.filter((l) => /fonts\.googleapis|fonts\.gstatic/i.test(l.href));
    const preload = links.filter(
      (l) => l.rel === "preload" && /BarlowCondensed-SemiBold\.woff2/i.test(l.href),
    );
    const bodyFamily = getComputedStyle(document.body).fontFamily;
    const sheets = [...document.styleSheets].map((s) => s.href || "");
    return { googleCss, preload: preload.length, bodyFamily, sheets };
  });

  const out = {
    imaPregled,
    glasovi,
    pipovi,
    leftover,
    googleFontReq,
    localWoff2: localWoff2.length,
    googleCss: fontInfo.googleCss.length,
    preloadBarlow: fontInfo.preload,
    bodyFamily: fontInfo.bodyFamily,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (!imaPregled) fail.push("nema Pregled kaube");
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (pipovi < 3) fail.push(`pipovi ${pipovi}`);
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (googleFontReq.length) fail.push(`google req ${googleFontReq.length}`);
  if (fontInfo.googleCss.length) fail.push("google css link");
  if (fontInfo.preload < 1) fail.push("nema preload Barlow");
  if (localWoff2.length < 1) fail.push("nema lokalnog woff2");
  if (!/Barlow Condensed/i.test(fontInfo.bodyFamily)) fail.push(`body ${fontInfo.bodyFamily}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.69");
} finally {
  await browser.close();
}
