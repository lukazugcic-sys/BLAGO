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
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 1500 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 500 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 500 }).catch(() => {});
  await page.getByRole("button", { name: /^Zatvori$/i }).click({ force: true, timeout: 500 }).catch(() => {});
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
  await page.waitForTimeout(700);
  await skloni();

  const platno = page.getByTestId("mreza-platno");
  await platno.waitFor({ state: "visible", timeout: 5000 });
  const strana0 = await platno.getAttribute("data-strana");
  const selo = await page.locator(".mreza-selo").first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const img = el.querySelector("img, video");
    return { w: Math.round(r.width), h: Math.round(r.height), op: getComputedStyle(el).opacity, ima: !!img };
  });
  const ulica = await page.locator(".mreza-ulica").count();
  await page.screenshot({ path: "/workspace/screenshots/v75-trg.png" });

  await page.getByTestId("hub-glas-voda").click({ force: true });
  await page.waitForTimeout(400);
  const stranaVoda = await platno.getAttribute("data-strana");
  const kuca = await page.locator(".mreza-kuca").first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      op: Number(getComputedStyle(el).opacity),
      clip: getComputedStyle(el).clipPath,
    };
  });
  const dekor = await page.locator(".mreza-strana-dekor-voda").count();
  const video = await page.getByTestId("mreza-video").count();
  await page.screenshot({ path: "/workspace/screenshots/v75-voda.png" });

  await page.getByTestId("hub-glas-zabava").click({ force: true });
  await page.waitForTimeout(300);
  const stranaZabava = await platno.getAttribute("data-strana");
  const dekorZ = await page.locator(".mreza-strana-dekor-zabava").count();
  await page.screenshot({ path: "/workspace/screenshots/v75-zabava.png" });

  const out = { strana0, selo, ulica, stranaVoda, kuca, dekor, video, stranaZabava, dekorZ };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (strana0 !== "selo") fail.push(`strana0 ${strana0}`);
  if (selo.w < 140) fail.push(`trg mali ${selo.w}`);
  if (ulica < 1) fail.push("nema ulice");
  if (stranaVoda !== "voda") fail.push(`voda ${stranaVoda}`);
  if (kuca.w < 200) fail.push(`kuca uska ${kuca.w}`);
  if (kuca.op < 0.9) fail.push(`kuca skrivena ${kuca.op}`);
  if (dekor < 1) fail.push("nema bunara");
  if (video < 1) fail.push("nema videa u kuci");
  if (stranaZabava !== "zabava") fail.push(`zabava ${stranaZabava}`);
  if (dekorZ < 1) fail.push("nema saluna dekora");
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.75");
} finally {
  await browser.close();
}
