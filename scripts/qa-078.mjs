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

  const platno = page.getByTestId("mreza-platno");
  await platno.waitFor({ state: "visible" });
  const layout = await page.evaluate(() => {
    const res = document.querySelector("header");
    const v = document.querySelector("[data-testid=mreza-video]");
    const img = v?.querySelector("img, video");
    const hr = res?.getBoundingClientRect();
    const vr = v?.getBoundingClientRect();
    const ir = img?.getBoundingClientRect();
    return {
      headerBottom: Math.round(hr?.bottom || 0),
      videoTop: Math.round(vr?.top || 0),
      imgTop: Math.round(ir?.top || 0),
      pos: img ? getComputedStyle(img).objectPosition : "",
      fit: img ? getComputedStyle(img).objectFit : "",
    };
  });
  await page.screenshot({ path: "/workspace/screenshots/v78-trg.png" });

  const kauba = page.getByRole("button", { name: "Kauba", exact: true }).first();
  const box = await kauba.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();
  }
  const navMeni = await page.getByTestId("tok-radial").count();
  await page.screenshot({ path: "/workspace/screenshots/v78-nav.png" });
  await page.keyboard.press("Escape").catch(() => {});
  await page.getByLabel("Zatvori prečice").click({ force: true, timeout: 800 }).catch(() => {});

  const fail = [];
  if (layout.videoTop - layout.headerBottom > 8) fail.push(`praznina ${layout.videoTop - layout.headerBottom}`);
  if (layout.imgTop - layout.headerBottom > 24) fail.push(`slika nisko ${layout.imgTop - layout.headerBottom}`);
  if (!/top|0%/.test(layout.pos)) fail.push(`pos ${layout.pos}`);
  if (layout.fit !== "contain") fail.push(`fit ${layout.fit}`);
  if (navMeni < 1) fail.push("nema nav polukruga");
  console.log(JSON.stringify({ layout, navMeni }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.78");
} finally {
  await browser.close();
}
