#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);
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
  await page.screenshot({ path: `/workspace/screenshots/v72-${name}.png`, fullPage: false });
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
  await page
    .getByRole("button", { name: /Kreni/i })
    .click({ force: true, timeout: 800 })
    .catch(() => {});
  await page
    .getByRole("button", { name: /^Zatvori$/i })
    .click({ force: true, timeout: 800 })
    .catch(() => {});
  await page
    .locator(".modal-pozadina")
    .evaluate((el) => el.remove())
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

const drziNa = async (locator, fx = 0.5, fy = 0.22) => {
  await locator.evaluate(
    (el, pos) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerId: 7,
          pointerType: "touch",
          clientX: r.left + r.width * pos.fx,
          clientY: r.top + r.height * pos.fy,
          isPrimary: true,
        }),
      );
    },
    { fx, fy },
  );
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
  const platno = page.getByTestId("mreza-platno");
  const nacin0 = await platno.getAttribute("data-nacin");
  const strana0 = await platno.getAttribute("data-strana");
  const vezePregled = await page.locator(".mreza-veza").count();
  const kuce0 = await page.locator(".mreza-kuca").count();
  const seloBroj = await page.locator(".mreza-selo").count();
  const tablaTrg = await page.locator(".mreza-tabla").filter({ hasText: /^Trg$/i }).count();
  const glasovi = await page.getByTestId("hub-glasovi").locator("button").count();
  const alarm = await page.locator(".obavijest-rec-alarm").count();
  const selo = await page.locator(".mreza-selo").first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  await shot("trg");

  await page.getByTestId("hub-glas-voda").click({ force: true });
  await page.waitForTimeout(280);
  const stranaVoda = await platno.getAttribute("data-strana");
  const kuceVoda = await page.locator(".mreza-kuca").count();
  const tablaVoda = await page.locator(".mreza-tabla").filter({ hasText: /Voda/i }).count();
  const seloNaVodi = await page.locator(".mreza-selo").count();
  await shot("voda");

  await drziNa(platno, 0.5, 0.18);
  await page.waitForTimeout(180);
  const imaMeni = await page.getByTestId("tok-radial").isVisible().catch(() => false);
  const polukrug = await page.locator(".tok-radial-polukrug").count();
  const imaKisa = await page.getByTestId("tok-precica-kisa").isVisible().catch(() => false);
  await shot("polukrug");
  if (imaMeni) {
    await page.getByRole("button", { name: "Zatvori prečice" }).click({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(120);
  }

  await page.locator("nav").getByRole("button", { name: "Zid" }).click({ force: true, timeout: 3000 });
  await page.waitForTimeout(400);
  await skloniDnevnu();
  const zidEl = page.getByTestId("serif-zid");
  const imaZid = await zidEl.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  const zidTekst = imaZid ? await zidEl.innerText() : "";
  const imaFilm =
    /Lijepa sela|Koža je tijesna|Maratonci|Nema smrti|Topola|Trg/i.test(zidTekst);
  await shot("zid");

  await page.locator("nav").getByRole("button", { name: "Kauba" }).click({ force: true, timeout: 3000 });
  await page.waitForTimeout(250);
  const trgBtn = page.getByTestId("mreza-trg");
  if (await trgBtn.isVisible().catch(() => false)) await trgBtn.click();
  await page.waitForTimeout(200);
  const stranaTrg = await platno.getAttribute("data-strana");

  const leftover = await leftoverPx();
  const out = {
    imaPregled,
    nacin0,
    strana0,
    vezePregled,
    kuce0,
    seloBroj,
    tablaTrg,
    glasovi,
    alarm,
    selo,
    stranaVoda,
    kuceVoda,
    tablaVoda,
    seloNaVodi,
    imaMeni,
    polukrug,
    imaKisa,
    imaZid,
    imaFilm,
    stranaTrg,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (!imaPregled) fail.push("nema Pregled kaube");
  if (nacin0 !== "pregled") fail.push(`nacin0 ${nacin0}`);
  if (strana0 !== "selo") fail.push(`strana0 ${strana0}`);
  if (vezePregled > 0) fail.push(`strelice u pregledu ${vezePregled}`);
  if (kuce0 !== 0) fail.push(`kuće na trgu ${kuce0}`);
  if (seloBroj < 1) fail.push("nema trga");
  if (tablaTrg < 1) fail.push("nema table Trg");
  if (glasovi < 8) fail.push(`glasovi ${glasovi}`);
  if (alarm > 0) fail.push("šerif overlay");
  if (selo.w < 110) fail.push(`trg mali ${selo.w}`);
  if (stranaVoda !== "voda") fail.push(`stranaVoda ${stranaVoda}`);
  if (kuceVoda !== 1) fail.push(`kuće voda ${kuceVoda}`);
  if (tablaVoda < 1) fail.push("nema table Voda");
  if (seloNaVodi > 0) fail.push("trg ostao na vodi");
  if (!imaMeni) fail.push("nema polukruga");
  if (polukrug < 1) fail.push("nema klase polukrug");
  if (!imaKisa) fail.push("nema prečice Kiša");
  if (!imaZid) fail.push("nema šerifovog zida");
  if (!imaFilm) fail.push(`nema filma: ${zidTekst.slice(0, 80)}`);
  if (stranaTrg !== "selo") fail.push(`povratak trg ${stranaTrg}`);
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}: ${errors[0]}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.72");
} finally {
  await browser.close();
}
