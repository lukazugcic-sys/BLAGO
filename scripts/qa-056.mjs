#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(28000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const shot = async (name) => {
  await page.screenshot({ path: `/workspace/screenshots/v56-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(180);
    } else break;
  }
  const modal = page.locator(".modal-pozadina").first();
  if (await modal.isVisible({ timeout: 200 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(120);
  }
};

const leftoverPx = async () => {
  return page.evaluate(() => {
    const scroller = document.querySelector(".pager-scroller");
    const panes = [...document.querySelectorAll(".pager-pane")];
    if (!scroller || !panes.length) return -1;
    const sr = scroller.getBoundingClientRect();
    const w = scroller.clientWidth;
    if (w <= 0) return -1;
    const idx = Math.round(scroller.scrollLeft / w);
    const pane = panes[idx];
    if (!pane) return -1;
    const pr = pane.getBoundingClientRect();
    return Math.max(
      Math.abs(pr.left - sr.left),
      Math.abs(pr.right - sr.right),
      Math.abs(pr.width - sr.width),
      Math.abs(scroller.scrollLeft - idx * w),
    );
  });
};

const body = async () => page.locator(".pager-pane").nth(2);

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
  await pokreni.click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  const dalje = page.getByTestId("onboard-dalje");
  if (await dalje.isVisible({ timeout: 4000 }).catch(() => false)) {
    const ime = page.locator("input").first();
    if (await ime.isVisible().catch(() => false)) await ime.fill("Test");
    await dalje.click();
    const igraj = page.getByTestId("onboard-igraj");
    if (await igraj.isVisible({ timeout: 3000 }).catch(() => false)) await igraj.click();
  }
  await dismiss();
  await page.waitForTimeout(500);

  const kauba = page.getByRole("button", { name: /^KAUBA$/i }).or(page.getByRole("button", { name: /Kauba/i })).first();
  if (await kauba.isVisible({ timeout: 3000 }).catch(() => false)) {
    await kauba.click({ force: true });
    await page.waitForTimeout(400);
  }
  await dismiss();
  await shot("kauba");

  const text = await page.locator("body").innerText();
  const imaTok = /Tok kaube/i.test(text);
  const imaUnutarnje = /KAUBOJI/.test(text) || /\bMREŽA\b/.test(text);
  const imaUzivoTab = /UŽIVO/.test(text);
  const imaPotrebe =
    /smještaj/i.test(text) && /hrana/i.test(text) && /zabava/i.test(text) && /zdravlje/i.test(text);
  const imaPopis = /Tko drži kaubu|Tko se angažira/.test(text);
  const imaHeroja = /★/.test(text) || /★ /.test(await page.content());
  const imaUber = /Uber/.test(text);

  const imenaPrije = await page.locator(".mreza-ime").count();
  const zakon = page.getByRole("button", { name: /^Zakon$/i }).first();
  if (await zakon.isVisible({ timeout: 1500 }).catch(() => false)) {
    await zakon.click({ force: true });
    await page.waitForTimeout(250);
  }
  await shot("zakon");
  const imenaPoslije = await page.locator(".mreza-ime").count();
  const textZakon = await page.locator("body").innerText();
  const imaBoru = /Boro|★/.test(textZakon);

  const zadaci = page.getByRole("button", { name: /^ZADACI$/i }).or(page.getByRole("button", { name: /Zadaci/i })).first();
  await zadaci.click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  await shot("zadaci");
  const textZadaci = await page.locator("body").innerText();
  const imaUzivoUZadacima = /UŽIVO|Uživo/.test(textZadaci);

  const uzivoBtn = page.getByRole("button", { name: /Uživo/i }).first();
  if (await uzivoBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await uzivoBtn.click({ force: true });
    await page.waitForTimeout(350);
  }
  await shot("uzivo");

  const leftover = await leftoverPx();

  const report = {
    imaTok,
    imaUnutarnje,
    imaUzivoTabNaKaubi: imaUzivoTab && !imaUzivoUZadacima ? true : imaUzivoTab && imaUnutarnje,
    imaPotrebe,
    imaPopis,
    imaHeroja,
    imaUber,
    imenaPrije,
    imenaPoslije,
    imaBoru,
    imaUzivoUZadacima,
    leftover,
    errors: errors.slice(0, 8),
  };
  writeFileSync("/tmp/qa-056.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  const fail = [];
  if (!imaTok) fail.push("nema Tok kaube");
  if (imaUnutarnje) fail.push("unutarnji tabovi još stoje");
  if (!imaPotrebe) fail.push("nema 8 potreba");
  if (!imaPopis) fail.push("nema popisa");
  if (imaUber) fail.push("Uber još stoji");
  if (!imaUzivoUZadacima) fail.push("nema Uživo u Zadacima");
  if (leftover > 2) fail.push(`leftover ${leftover}`);
  if (errors.length) fail.push(`errors ${errors.length}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exitCode = 1;
  } else {
    console.log("OK 0.9.56");
  }
} finally {
  await browser.close();
}
