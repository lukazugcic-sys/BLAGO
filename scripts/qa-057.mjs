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
  await page.screenshot({ path: `/workspace/screenshots/v57-${name}.png`, fullPage: false });
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

  const selo = await page.locator(".mreza-selo").first().evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const inner = el.querySelector("span, img");
    const ir = inner ? getComputedStyle(inner) : null;
    return {
      radius: s.borderRadius,
      overflow: s.overflow,
      w: Math.round(r.width),
      h: Math.round(r.height),
      innerRadius: ir?.borderRadius ?? "",
      innerOverflow: ir?.overflow ?? "",
    };
  });

  const potrebe = await page.locator(".potreba-traka").evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).backgroundColor),
  );

  await shot("kauba");

  await page.getByRole("button", { name: /^IGRAJ$/i }).or(page.getByRole("button", { name: /Igraj/i })).first().click({ force: true });
  await page.waitForTimeout(400);
  const isplata = await page.locator("body").innerText();
  const imaSamoIsplata = /Isplata\s*×\s*\d+/.test(isplata);
  const staraLinija = /isplata ×\d+/.test(isplata) && /energij/i.test(isplata.split("Isplata")[0]?.slice(-80) ?? "");
  await shot("slot");

  await page.getByRole("button", { name: /^KAUBA$/i }).or(page.getByRole("button", { name: /Kauba/i })).first().click({ force: true });
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Izbornik" }).click({ force: true });
  await page.waitForTimeout(200);
  const beta = page.getByRole("button", { name: /Beta info/i });
  if (await beta.isVisible({ timeout: 800 }).catch(() => false)) {
    await beta.click({ force: true });
    await page.waitForTimeout(200);
    const pohod = page.getByRole("button", { name: /Pokreni pohod/i });
    if (await pohod.isVisible({ timeout: 800 }).catch(() => false)) {
      await pohod.click({ force: true });
      await page.waitForTimeout(500);
    }
  }
  await shot("pohod");
  const pohodText = await page.locator("body").innerText();
  const imaJato = /Tko jaše/i.test(pohodText) && /Do 3/i.test(pohodText);

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

  const neon = potrebe.some((c) => c.includes("255, 107, 115") || c.includes("140, 255, 90"));
  const krug = selo.w === selo.h && (selo.overflow === "hidden" || selo.innerOverflow === "hidden");

  const out = {
    selo,
    krug,
    imaSamoIsplata,
    staraLinija,
    potrebe: potrebe.slice(0, 8),
    neon,
    imaJato,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = !krug || !imaSamoIsplata || leftover > 2 || errors.length > 0;
  if (fail) {
    console.error("FAIL");
    process.exit(1);
  }
  console.log("OK 0.9.57");
} finally {
  await browser.close();
}
