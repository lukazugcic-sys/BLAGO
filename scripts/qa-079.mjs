#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const skloni = async () => {
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 1200 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.getByRole("button", { name: /^Zatvori$/i }).click({ force: true, timeout: 400 }).catch(() => {});
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
  await page.waitForTimeout(500);
  await skloni();

  await page.getByTestId("mreza-platno").waitFor({ state: "visible" });
  const info = await page.evaluate(() => {
    const header = document.querySelector("header")?.getBoundingClientRect();
    const glava = document.querySelector(".mreza-glava")?.getBoundingClientRect();
    const video = document.querySelector("[data-testid=mreza-video]")?.getBoundingClientRect();
    const donji = document.querySelector(".mreza-donji")?.getBoundingClientRect();
    const listak = document.querySelector(".kauba-listak")?.getBoundingClientRect();
    const tabla = document.querySelector(".mreza-tabla");
    const kadar = document.querySelector(".mreza-dio-kadar");
    const sumrak = document.querySelectorAll(".mreza-dio-sumrak").length;
    return {
      headerBottom: Math.round(header?.bottom || 0),
      glavaBottom: Math.round(glava?.bottom || 0),
      videoTop: Math.round(video?.top || 0),
      videoBottom: Math.round(video?.bottom || 0),
      donjiTop: Math.round(donji?.top || 0),
      listakTop: Math.round(listak?.top || 0),
      tablaOp: tabla ? Number(getComputedStyle(tabla).opacity) : 0,
      kadar: !!kadar,
      sumrak,
    };
  });
  await page.screenshot({ path: "/workspace/screenshots/v79-trg.png" });

  await page.getByTestId("hub-glas-jelo").click({ force: true });
  await page.waitForTimeout(450);
  await page.screenshot({ path: "/workspace/screenshots/v79-jelo.png" });

  const fail = [];
  if (info.videoTop + 2 < info.glavaBottom) fail.push(`preko glave ${info.videoTop}<${info.glavaBottom}`);
  if (info.videoBottom - 8 > info.donjiTop && info.donjiTop > 0) fail.push(`preko dosjea ${info.videoBottom}>${info.donjiTop}`);
  if (info.tablaOp > 0.1) fail.push(`tabla ${info.tablaOp}`);
  if (!info.kadar) fail.push("nema kadra");
  if (info.sumrak < 2) fail.push("nema sumraka");
  console.log(JSON.stringify(info, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.79");
} finally {
  await browser.close();
}
