#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-webgpu"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
});

const dismiss = async () => {
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.locator("input").first().fill("Test").catch(() => {});
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByTestId("onboard-igraj").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 400 }).catch(() => {});
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Pokreni igru").click({ force: true });
  await page.waitForTimeout(500);
  await dismiss();
  await page.waitForTimeout(350);
  await page.getByTestId("kauba-ulica").waitFor({ state: "visible" });

  const box = await page.getByTestId("kauba-prsten").boundingBox();
  if (!box) throw new Error("nema prstena");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(850);
  await page.mouse.up();
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 2500 });
  const info = await page.evaluate(() => {
    const ulica = document.querySelector("[data-testid=kauba-ulica]");
    const video = document.querySelector("[data-testid=mreza-video]");
    const stavke = [...document.querySelectorAll("[data-testid^=tok-precica-]")].map((el) =>
      (el.textContent || "").trim(),
    );
    return {
      trg: ulica?.getAttribute("data-trg"),
      imaSliku: !!video?.querySelector("img, video, .video-loop-sloj"),
      n: stavke.length,
      stavke,
      tokGumb: !!document.querySelector("[data-testid=mreza-tok]"),
    };
  });
  await page.screenshot({ path: "/workspace/screenshots/v101-osmica.png" });

  const fail = [];
  if (info.trg !== "1") fail.push(`trg ${info.trg}`);
  if (!info.imaSliku) fail.push("nema slike ulice");
  if (info.n < 8) fail.push(`osmica ${info.n}`);
  if (!info.stavke.some((s) => /Zabava/i.test(s))) fail.push("nema zabave");
  if (info.stavke.some((s) => /Almanah|\bTok\b/i.test(s))) fail.push("osmica laže");
  if (info.tokGumb) fail.push("gumb Tok se vratio");
  console.log(JSON.stringify(info, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.101");
} finally {
  await browser.close();
}
