#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
});

const skloni = async () => {
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 400 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 400 }).catch(() => {});
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
  await page.waitForTimeout(400);
  await skloni();

  const platno = page.getByTestId("mreza-platno");
  await platno.waitFor({ state: "visible" });
  const box = await platno.boundingBox();
  if (!box) throw new Error("nema platna");
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.42;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const rano = {
    prsten: await page.getByTestId("mreza-anticipacija").count(),
    meni: await page.getByTestId("tok-radial").count(),
    dur: await page.locator(".mreza-anticipacija").evaluate((el) => getComputedStyle(el).animationDuration).catch(() => ""),
  };
  await page.screenshot({ path: "/workspace/screenshots/v81-rano.png" });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const poslijeRano = await page.getByTestId("tok-radial").count();

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(420);
  const coyote = {
    prsten: await page.getByTestId("mreza-anticipacija").count(),
    meni: await page.getByTestId("tok-radial").count(),
  };
  await page.screenshot({ path: "/workspace/screenshots/v81-coyote.png" });
  await page.mouse.up();
  await page.waitForTimeout(80);
  await page.screenshot({ path: "/workspace/screenshots/v81-meni.png" });
  const meni = await page.getByTestId("tok-radial").count();

  const fail = [];
  if (rano.prsten < 1) fail.push("nema prstena na 200");
  if (rano.meni > 0) fail.push("meni prerano na 200");
  if (poslijeRano > 0) fail.push("coyote na 200");
  if (!rano.dur.startsWith("0.48")) fail.push(`trajanje ${rano.dur}`);
  if (coyote.meni < 1 && meni < 1) fail.push("nema menija na 420");
  console.log(JSON.stringify({ rano, poslijeRano, coyote, meni }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.81");
} finally {
  await browser.close();
}
