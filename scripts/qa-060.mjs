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
  await page.screenshot({ path: `/workspace/screenshots/v60-${name}.png`, fullPage: false });
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

const zatvoriMeni = async () => {
  await page.locator(".tok-radial-poz").evaluate((el) => el.click()).catch(() => {});
  await page.waitForTimeout(120);
};

const unutar = async () =>
  page.evaluate(() => {
    const platno = document.querySelector("[data-testid=mreza-platno]");
    const stavke = [...document.querySelectorAll(".tok-radial-stavka")];
    if (!platno || !stavke.length) return { ok: false, n: stavke.length, van: [] };
    const p = platno.getBoundingClientRect();
    const van = stavke
      .map((el) => {
        const r = el.getBoundingClientRect();
        const dx = Math.max(0, p.left - r.left, r.right - p.right);
        const dy = Math.max(0, p.top - r.top, r.bottom - p.bottom);
        return { dx: Math.round(dx), dy: Math.round(dy), t: el.textContent };
      })
      .filter((v) => v.dx > 1 || v.dy > 1);
    return { ok: van.length === 0, n: stavke.length, van };
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
  await page.waitForTimeout(1000);
  await skloniDnevnu();
  await page.waitForTimeout(250);

  const rubovi = [
    { ime: "selo", loc: page.locator(".mreza-selo").first() },
    { ime: "krov", loc: page.getByRole("button", { name: "Smještaj. Drži za prečice." }) },
    { ime: "red", loc: page.getByRole("button", { name: "Zakon. Drži za prečice." }) },
    { ime: "zabava", loc: page.getByRole("button", { name: "Zabava. Drži za prečice." }) },
    { ime: "jelo", loc: page.getByRole("button", { name: "Hrana. Drži za prečice." }) },
  ];

  const rezultati = [];
  for (const r of rubovi) {
    await skloniDnevnu();
    await drzi(r.loc);
    await page.waitForTimeout(180);
    const u = await unutar();
    await shot(`meni-${r.ime}`);
    rezultati.push({ ime: r.ime, ...u });
    await zatvoriMeni();
  }

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

  const out = { rezultati, leftover, errors };
  console.log(JSON.stringify(out, null, 2));
  const fail = [];
  for (const r of rezultati) {
    if (!r.ok) fail.push(`${r.ime} van ${JSON.stringify(r.van)}`);
    if (r.n < 2) fail.push(`${r.ime} stavke ${r.n}`);
  }
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.60");
} finally {
  await browser.close();
}
