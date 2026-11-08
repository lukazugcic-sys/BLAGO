#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const DIO = [
  ["selo", null, "selo.mp4"],
  ["jelo", "hub-glas-jelo", "jelo.mp4"],
  ["konji", "hub-glas-konji", "konji.mp4"],
  ["krov", "hub-glas-krov", "krov.mp4"],
  ["zabava", "hub-glas-zabava", "zabava.mp4"],
];

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
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 1500 }).catch(() => {});
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
  await page.waitForTimeout(600);
  await skloni();

  const platno = page.getByTestId("mreza-platno");
  await platno.waitFor({ state: "visible", timeout: 5000 });
  const fail = [];
  const rows = [];

  for (const [id, testid, file] of DIO) {
    if (testid) await page.getByTestId(testid).click({ force: true });
    await page.waitForTimeout(350);
    await skloni();
    const info = await page.evaluate((dio) => {
      const p = document.querySelector("[data-testid=mreza-platno]");
      const v = document.querySelector("[data-testid=mreza-video]");
      const src = v?.querySelector("source")?.getAttribute("src") || v?.querySelector("video")?.getAttribute("src") || "";
      const r = v?.getBoundingClientRect();
      const kuca = document.querySelector(".mreza-kuca");
      const kop = kuca ? Number(getComputedStyle(kuca).opacity) : 0;
      return {
        strana: p?.getAttribute("data-strana"),
        dio: v?.getAttribute("data-dio"),
        src,
        w: Math.round(r?.width || 0),
        h: Math.round(r?.height || 0),
        kucaOp: kop,
      };
    }, id);
    await page.screenshot({ path: `/workspace/screenshots/v76-${id}.png` });
    rows.push({ id, ...info });
    if (info.strana !== id) fail.push(`${id} strana ${info.strana}`);
    if (info.dio !== id) fail.push(`${id} dio ${info.dio}`);
    if (!new RegExp(file.replace(".", "\\.")).test(info.src)) fail.push(`${id} src ${info.src}`);
    if (info.h < 400) fail.push(`${id} niska ${info.h}`);
    if (info.kucaOp > 0.2) fail.push(`${id} kuca vidi se ${info.kucaOp}`);
  }

  console.log(JSON.stringify(rows, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.76");
} finally {
  await browser.close();
}
