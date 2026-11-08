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
  await page.screenshot({ path: `/workspace/screenshots/v61-${name}.png`, fullPage: false });
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
  await page.waitForTimeout(1000);
  await skloniDnevnu();
  await page.waitForTimeout(200);

  const dosje = await page.getByTestId("hub-dosje").count();
  const touch = await page.locator("[data-testid=mreza-platno]").evaluate((el) => getComputedStyle(el).touchAction);

  const skrol = await page.locator(".kauba-skrol").evaluate((el) => ({
    sh: el.scrollHeight,
    ch: el.clientHeight,
    moze: el.scrollHeight > el.clientHeight + 8,
  }));
  await page.locator(".kauba-skrol").evaluate((el) => {
    el.scrollTop = Math.min(el.scrollHeight, el.clientHeight + 220);
  });
  await page.waitForTimeout(200);
  const skrolPoslije = await page.locator(".kauba-skrol").evaluate((el) => el.scrollTop);
  await shot("kauba-dolje");

  await page.locator(".kauba-skrol").evaluate((el) => {
    el.scrollTop = 0;
  });
  await skloniDnevnu();

  const pohodBtn = page.getByRole("button", { name: /^Pohod$/i }).first();
  await pohodBtn.evaluate((el) => el.click());
  await page.waitForTimeout(400);

  const lista = page.locator(".pohod-lista");
  const imaLista = (await lista.count()) > 0;
  const jatoBtns = page.locator(".pohod-jato-traka button");
  const nJato = await jatoBtns.count();
  if (nJato > 0) {
    await jatoBtns.nth(0).evaluate((el) => el.click());
    await page.waitForTimeout(80);
    await jatoBtns.nth(Math.min(1, nJato - 1)).evaluate((el) => el.click());
    await page.waitForTimeout(80);
  }
  const pritisnuti = await jatoBtns.evaluateAll((els) => els.filter((el) => el.getAttribute("aria-pressed") === "true").length);
  const listaSkrol = imaLista
    ? await lista.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }))
    : { sh: 0, ch: 0 };
  await shot("pohod-jato");

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
    dosje,
    touch,
    skrol,
    skrolPoslije,
    imaLista,
    nJato,
    pritisnuti,
    listaSkrol,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (dosje < 1) fail.push("nema dosje");
  if (!String(touch).includes("pan-y") && touch !== "auto") fail.push(`touch ${touch}`);
  if (!skrol.moze) fail.push("kauba se ne skrola");
  if (skrolPoslije < 20) fail.push(`scrollTop ${skrolPoslije}`);
  if (!imaLista) fail.push("nema pohod liste");
  if (pritisnuti < 1) fail.push("jato se ne bira");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.61");
} finally {
  await browser.close();
}
