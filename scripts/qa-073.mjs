#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
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
  await page.screenshot({ path: `/workspace/screenshots/v73-${name}.png`, fullPage: false });
};

const skloni = async () => {
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 600 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 600 }).catch(() => {});
  await page.getByRole("button", { name: /^Zatvori$/i }).click({ force: true, timeout: 600 }).catch(() => {});
  await page.locator(".modal-pozadina").evaluate((el) => el.remove()).catch(() => {});
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
  await page.waitForTimeout(800);
  await skloni();
  await page.waitForTimeout(250);

  const platno = page.getByTestId("mreza-platno");
  const mjere = await platno.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");
    const listak = document.querySelector(".kauba-listak");
    const hr = header?.getBoundingClientRect();
    const nr = nav?.getBoundingClientRect();
    const lr = listak?.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      w: Math.round(r.width),
      headerBottom: hr ? Math.round(hr.bottom) : -1,
      listakTop: lr ? Math.round(lr.top) : -1,
      navTop: nr ? Math.round(nr.top) : -1,
    };
  });
  const video = await page.getByTestId("mreza-video").count();
  const videoSrc = await page.locator("[data-testid=mreza-video] source, [data-testid=mreza-video] video source").first().getAttribute("src").catch(() => "");
  const imaSeloMp4 = /selo\.mp4/i.test(videoSrc || "");
  const strana0 = await platno.getAttribute("data-strana");
  await shot("trg");

  await page.getByTestId("hub-glas-voda").click({ force: true });
  await page.waitForTimeout(400);
  const stranaVoda = await platno.getAttribute("data-strana");
  const vodaSrc = await page.locator("[data-testid=mreza-video] source").first().getAttribute("src").catch(() => "");
  const imaVodaMp4 = /voda\.mp4/i.test(vodaSrc || "");
  const mjereVoda = await platno.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
  });
  await shot("voda");

  const gapTop = Math.abs(mjere.top - mjere.headerBottom);
  const gapBot = Math.abs(mjere.listakTop - mjere.bottom);
  const out = {
    strana0,
    video,
    imaSeloMp4,
    videoSrc,
    mjere,
    gapTop,
    gapBot,
    stranaVoda,
    imaVodaMp4,
    mjereVoda,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (strana0 !== "selo") fail.push(`strana0 ${strana0}`);
  if (video < 1) fail.push("nema videa");
  if (!imaSeloMp4) fail.push(`trg src ${videoSrc}`);
  if (mjere.h < 420) fail.push(`platno nisko ${mjere.h}`);
  if (gapTop > 18) fail.push(`rupa ispod resursa ${gapTop}`);
  if (gapBot > 18) fail.push(`rupa iznad menija ${gapBot}`);
  if (stranaVoda !== "voda") fail.push(`stranaVoda ${stranaVoda}`);
  if (!imaVodaMp4) fail.push(`voda src ${vodaSrc}`);
  if (mjereVoda.h < 420) fail.push(`voda niska ${mjereVoda.h}`);
  if (errors.length) fail.push(`errors ${errors[0]}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.73");
} finally {
  await browser.close();
}
