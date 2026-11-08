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
  await page.screenshot({ path: `/workspace/screenshots/v58-${name}.png`, fullPage: false });
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
  for (const name of [/ostaje u Zadacima/i, /^PREUZMI$/i]) {
    const b = page.getByRole("button", { name });
    if (await b.first().isVisible({ timeout: 800 }).catch(() => false)) {
      await b.first().click({ force: true });
      await page.waitForTimeout(250);
    }
  }
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 600 }).catch(() => {});
  await page.locator(".modal-pozadina").waitFor({ state: "detached", timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(200);





  const nacin0 = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const pregledNaslov = await page.locator("body").innerText();
  const imaPregled = /Pregled kaube/i.test(pregledNaslov);
  const imaDrzi = /Drži ikonu/i.test(pregledNaslov);
  const prsteni = await page.locator(".mreza-prsten").count();
  const radnici = await page.locator(".mreza-radnik").count();

  await shot("pregled");

  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 600 }).catch(() => {});
  await page.locator(".modal-pozadina").waitFor({ state: "detached", timeout: 1200 }).catch(() => {});

  const seloBtn = page.locator(".mreza-selo").first();

  await seloBtn.evaluate((el) => el.click());
  await page.waitForTimeout(200);
  const radialPoslijeTapa = await page.locator("[data-testid=tok-radial]").count();

  const box = await seloBtn.boundingBox();
  if (!box) throw new Error("nema sela");
  await seloBtn.evaluate((el) => {
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
  await seloBtn.evaluate((el) => {
    el.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: "touch",
        isPrimary: true,
      }),
    );
  });
  await page.waitForTimeout(180);


  const radial = page.locator("[data-testid=tok-radial]");
  const imaRadial = await radial.isVisible().catch(() => false);
  const tokBtn = page.getByTestId("tok-precica-tok");
  const imaTokPrecica = await tokBtn.isVisible().catch(() => false);
  await shot("radial");

  if (imaTokPrecica) {
    await tokBtn.evaluate((el) => el.click());
    await page.waitForTimeout(280);
  }

  const nacinTok = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");
  const tokNaslov = await page.locator("body").innerText();
  const imaTokNaslov = /Tok kaube/i.test(tokNaslov);
  const ziveLinije = await page.locator(".mreza-veza-tok").count();
  await shot("tok");

  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Pregled");
    b?.click();
  });
  await page.waitForTimeout(220);

  const nacinBack = await page.locator("[data-testid=mreza-platno]").getAttribute("data-nacin");

  const selo = await page.locator(".mreza-selo").first().evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      radius: s.borderRadius,
      overflow: s.overflow,
      clip: s.clipPath,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  const krug = selo.w === selo.h && (selo.overflow === "hidden" || (selo.clip || "").includes("circle"));

  const leftover = await leftoverPx();

  const out = {
    nacin0,
    imaPregled,
    imaDrzi,
    prsteni,
    radnici,
    radialPoslijeTapa,
    imaRadial,
    imaTokPrecica,
    nacinTok,
    imaTokNaslov,
    ziveLinije,
    nacinBack,
    selo,
    krug,
    leftover,
    errors,
  };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  if (nacin0 !== "pregled") fail.push("nacin0");
  if (!imaPregled) fail.push("pregled naslov");
  if (prsteni < 8) fail.push(`prsteni ${prsteni}`);
  if (radialPoslijeTapa !== 0) fail.push("radial na tap");
  if (!imaRadial) fail.push("nema radial");
  if (!imaTokPrecica) fail.push("nema tok precica");
  if (nacinTok !== "tok") fail.push("nacin tok");
  if (!imaTokNaslov) fail.push("tok naslov");
  if (nacinBack !== "pregled") fail.push("povratak pregled");
  if (!krug) fail.push("krug");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push("errors");
  if (fail.length) {
    console.error("FAIL", fail.join(", "));
    process.exit(1);
  }
  console.log("OK 0.9.58");
} finally {
  await browser.close();
}
