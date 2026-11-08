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
  await page.screenshot({ path: `/workspace/screenshots/v59-${name}.png`, fullPage: false });
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
  await page.waitForTimeout(900);
  await skloniDnevnu();
  await page.waitForTimeout(200);

  await shot("prsten-ulaz");
  await page.waitForTimeout(850);

  const prsteni = await page.getByTestId("mreza-prsten").count();
  const iskre = await page.locator(".mreza-prsten-glint").count();
  const orbite = await page.locator(".mreza-prsten-orbita").count();
  const stanje = await page.locator(".mreza-prsten-pun").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      const dash = s.strokeDasharray;
      const n = parseFloat(String(dash).split(/[\s,]+/)[0] || "0");
      return { dash, n, trans: s.transitionProperty };
    }),
  );
  const orbitAnim = await page
    .locator(".mreza-prsten-orbita")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName)
    .catch(() => "");
  const puni = stanje.filter((s) => s.n > 1).length;

  await shot("prsten-ziv");

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

  const out = {
    prsteni,
    iskre,
    orbite,
    puni,
    orbitAnim,
    dash: stanje.slice(0, 3),
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (prsteni < 8) fail.push(`prsteni ${prsteni}`);
  if (iskre < 1) fail.push("nema iskre");
  if (orbite < 1) fail.push("nema orbite");
  if (puni < 1) fail.push("prsten nije napunjen");
  if (!String(orbitAnim).includes("mreza-prsten-okret")) fail.push(`anim ${orbitAnim}`);
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join(", "));
    process.exit(1);
  }
  console.log("OK 0.9.59");
} finally {
  await browser.close();
}
