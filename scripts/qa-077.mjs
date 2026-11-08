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

const info = async () =>
  page.evaluate(() => {
    const p = document.querySelector("[data-testid=mreza-platno]");
    const v = document.querySelector("[data-testid=mreza-video]");
    const vid = v?.querySelector("video");
    const img = v?.querySelector("img");
    const src = vid?.getAttribute("src") || vid?.currentSrc || img?.getAttribute("src") || "";
    const fit = vid ? getComputedStyle(vid).objectFit : img ? getComputedStyle(img).objectFit : "";
    const pos = vid ? getComputedStyle(vid).objectPosition : img ? getComputedStyle(img).objectPosition : "";
    return {
      strana: p?.getAttribute("data-strana"),
      dio: v?.getAttribute("data-dio"),
      src,
      fit,
      pos,
      dogadajNaKaubi: !!document.querySelector(".kauba-tabor .kauba-dogadaj"),
    };
  });

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

  const trg = await info();
  await page.screenshot({ path: "/workspace/screenshots/v77-trg.png" });

  await page.getByTestId("hub-glas-jelo").click({ force: true });
  await page.waitForTimeout(400);
  const jelo = await info();
  await page.screenshot({ path: "/workspace/screenshots/v77-jelo.png" });

  await page.getByTestId("hub-glas-konji").click({ force: true });
  await page.waitForTimeout(400);
  const konji = await info();
  await page.screenshot({ path: "/workspace/screenshots/v77-konji.png" });

  await page.getByTestId("hub-glas-zabava").click({ force: true });
  await page.waitForTimeout(400);
  const zabava = await info();
  await page.screenshot({ path: "/workspace/screenshots/v77-zabava.png" });

  await page.getByRole("button", { name: "Zid", exact: true }).first().click({ force: true, timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(400);
  await skloni();
  const zidCin = await page.locator("[data-testid=serif-zid]").count();
  await page.screenshot({ path: "/workspace/screenshots/v77-zid.png" });

  const out = { trg, jelo, konji, zabava, zidCin };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (trg.strana !== "selo") fail.push(`trg ${trg.strana}`);
  if (!/kauba\.webp/.test(trg.src)) fail.push(`trg src ${trg.src}`);
  if (trg.fit !== "contain") fail.push(`trg fit ${trg.fit}`);
  if (trg.dogadajNaKaubi) fail.push("prašina na kaubi");
  if (jelo.strana !== "jelo" || !/jelo\.mp4/.test(jelo.src)) fail.push(`jelo ${jelo.strana} ${jelo.src}`);
  if (konji.strana !== "konji" || !/konji\.mp4/.test(konji.src)) fail.push(`konji ${konji.strana} ${konji.src}`);
  if (zabava.strana !== "zabava" || !/zabava\.mp4/.test(zabava.src)) fail.push(`zabava ${zabava.strana} ${zabava.src}`);
  if (jelo.src === trg.src) fail.push("meni ne mijenja kadar");
  if (zidCin < 1) fail.push("nema zida");
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.77");
} finally {
  await browser.close();
}
