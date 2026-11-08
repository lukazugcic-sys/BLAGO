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
  await page.screenshot({ path: `/workspace/screenshots/v70-${name}.png`, fullPage: false });
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

const leftoverPx = async () =>
  page.evaluate(() => {
    const scroller = document.querySelector(".pager-scroller");
    const panes = [...document.querySelectorAll(".pager-pane")];
    if (!scroller || !panes.length) return -1;
    const w = scroller.clientWidth;
    const idx = Math.round(scroller.scrollLeft / Math.max(1, w));
    const pane = panes[idx];
    if (!pane) return -1;
    const sr = scroller.getBoundingClientRect();
    const pr = pane.getBoundingClientRect();
    return Math.max(Math.abs(pr.left - sr.left), Math.abs(pr.width - sr.width));
  });

const drzi = async (locator) => {
  await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: "touch",
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
        isPrimary: true,
      }),
    );
  });
  await page.waitForTimeout(560);
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

  const naslov = await page.locator("body").innerText();
  const imaPregled = /Pregled kaube/i.test(naslov);
  const nacin0 = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const vezePregled = await page.locator(".mreza-veza").count();
  const vezeDosjePregled = await page.locator(".hub-veza").count();
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  await shot("pregled");

  const seloBtn = page.locator(".mreza-selo").first();
  await drzi(seloBtn);
  await page.waitForTimeout(180);
  const imaRadial = await page.locator("[data-testid=tok-radial]").isVisible().catch(() => false);
  const imaTokPrecica = await page.getByTestId("tok-precica-tok").isVisible().catch(() => false);
  if (imaTokPrecica) {
    await page.getByTestId("tok-precica-tok").evaluate((el) => el.click());
    await page.waitForTimeout(300);
  }
  const nacinTok = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const vezeTok = await page.locator(".mreza-veza").count();
  const tokNaslov = /Tok kaube/i.test(await page.locator("body").innerText());
  await shot("tok");

  await drzi(seloBtn);
  await page.waitForTimeout(180);
  const imaPregledPrecica = await page.getByTestId("tok-precica-pregled").isVisible().catch(() => false);
  if (imaPregledPrecica) {
    await page.getByTestId("tok-precica-pregled").evaluate((el) => el.click());
    await page.waitForTimeout(280);
  }

  const zabava = page.locator("[data-hub=zabava] .mreza-cvor").first();
  await drzi(zabava);
  await page.waitForTimeout(180);
  const imaSalun = await page.getByTestId("tok-precica-salun").isVisible().catch(() => false);
  if (imaSalun) {
    await page.getByTestId("tok-precica-salun").evaluate((el) => el.click());
    await page.waitForTimeout(500);
  }
  await skloniDnevnu();
  const nacinSalun = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const imaZgradaSalun = await page.locator("#zgrada-salun").count();
  const salunUVidiku = await page.evaluate(() => {
    const el = document.getElementById("zgrada-salun");
    const box = document.querySelector(".kauba-skrol");
    if (!el || !box) return { ok: false, scroll: 0 };
    const er = el.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    const vidi = er.top < br.bottom - 24 && er.bottom > br.top + 24;
    return { ok: vidi, scroll: Math.round(box.scrollTop) };
  });
  await shot("salun");

  const krov = page.locator("[data-hub=krov] .mreza-cvor").first();
  await page.evaluate(() => {
    const box = document.querySelector(".kauba-skrol");
    if (box) box.scrollTop = 0;
  });
  await page.waitForTimeout(120);
  await drzi(krov);
  await page.waitForTimeout(180);
  const imaAlmanah = await page.getByTestId("tok-precica-almanah").isVisible().catch(() => false);
  if (imaAlmanah) {
    await page.getByTestId("tok-precica-almanah").evaluate((el) => el.click());
    await page.waitForTimeout(300);
  }
  const nacinAlmanah = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const imaAlmanahPanel = await page.getByTestId("tok-almanah").count();
  const vezeAlmanah = await page.locator(".mreza-veza").count();
  await shot("almanah");

  const leftover = await leftoverPx();
  const out = {
    imaPregled,
    nacin0,
    vezePregled,
    vezeDosjePregled,
    glasovi,
    imaRadial,
    imaTokPrecica,
    nacinTok,
    vezeTok,
    tokNaslov,
    imaPregledPrecica,
    imaSalun,
    nacinSalun,
    imaZgradaSalun,
    salunUVidiku,
    imaAlmanah,
    nacinAlmanah,
    imaAlmanahPanel,
    vezeAlmanah,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (!imaPregled) fail.push("nema Pregled kaube");
  if (nacin0 !== "pregled") fail.push(`nacin0 ${nacin0}`);
  if (vezePregled > 0) fail.push(`strelice u pregledu ${vezePregled}`);
  if (vezeDosjePregled > 0) fail.push(`poveznice u pregledu ${vezeDosjePregled}`);
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (!imaRadial) fail.push("nema radial");
  if (!imaTokPrecica) fail.push("nema Tok prečice");
  if (nacinTok !== "tok") fail.push(`nacinTok ${nacinTok}`);
  if (vezeTok < 8) fail.push(`veze u toku ${vezeTok}`);
  if (!tokNaslov) fail.push("nema Tok kaube");
  if (!imaSalun) fail.push("nema Salun prečice");
  if (nacinSalun !== "pregled") fail.push(`nacinSalun ${nacinSalun}`);
  if (imaZgradaSalun < 1) fail.push("nema kartice saluna");
  if (!salunUVidiku.ok) fail.push(`salun nije u vidiku scroll=${salunUVidiku.scroll}`);
  if (!imaAlmanah) fail.push("nema Almanah prečice");
  if (nacinAlmanah !== "tok") fail.push(`nacinAlmanah ${nacinAlmanah}`);
  if (imaAlmanahPanel < 1) fail.push("nema almanaha");
  if (vezeAlmanah < 1) fail.push("almanah bez strelica");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.70");
} finally {
  await browser.close();
}
