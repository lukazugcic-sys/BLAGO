#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.E2E_URL || "http://127.0.0.1:8080";
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
  await page.screenshot({ path: `/workspace/screenshots/v44-${name}.png`, fullPage: false });
};

const dismiss = async () => {
  for (let i = 0; i < 4; i++) {
    const b = page.getByRole("button", { name: /Kasnije|Kreni|Zatvori|PREUZMI/i }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    } else break;
  }
  const modal = page.locator(".modal-pozadina").first();
  if (await modal.isVisible({ timeout: 200 }).catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(150);
  }
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const pokreni = page.getByRole("button", { name: "Pokreni igru" });
  await pokreni.waitFor({ state: "visible", timeout: 20000 });
  await pokreni.click({ force: true });
  await page.waitForTimeout(500);
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
  const zavrti = page.getByTestId("zavrti");
  await zavrti.waitFor({ state: "visible" });
  await dismiss();
  const box = await zavrti.boundingBox();
  const zavrtiUEkranu = !!box && box.y >= 0 && box.y + box.height <= 844;
  const bunari = await page.locator(".knjiga-bunar").count();
  await shot("kolo");

  const turbo = page.getByRole("button", { name: /^TURBO$/ });
  const kupi = page.getByRole("button", { name: /^KUPI$/ });
  await kupi.click({ force: true }).catch(() => {});
  await page.waitForTimeout(220);
  const cijenaTekst = await page.locator(".zavrti-traka").innerText();
  const cijena15 = /\b15\b/.test(cijenaTekst);
  const cijenaGem = await page.locator(".zavrti-traka img[src*='gem']").count();
  const cijenaGold = await page.locator(".zavrti-traka img[src*='gold']").count();
  const energijaTekst = await page.locator(".zavrti-traka p").last().innerText().catch(() => "");
  const energija20 = energijaTekst.trim() === "20";
  await shot("kupi");

  const knjigaKlasa = await page.evaluate(() => {
    const css = [...document.styleSheets]
      .map((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");
    return /knjiga-ulaz/.test(css) && /knjiga-korice/.test(css);
  });

  await page.getByLabel("Kauba").click();
  await page.getByRole("button", { name: /^Kauboji$/i }).click();
  await page.getByText("Kauboji kaube").waitFor({ state: "visible" });
  await page.waitForTimeout(220);
  const kaubojiLayout = await page.evaluate(() => {
    const mreza = document.querySelector(".kauboji-mreza");
    const style = mreza ? getComputedStyle(mreza) : null;
    return {
      cols: style?.gridTemplateColumns.split(" ").filter(Boolean).length ?? 0,
      display: style?.display ?? "",
      kartice: document.querySelectorAll(".kauboj-kartica").length,
      avatari: document.querySelectorAll(".kauboji-mreza .kauba-chip-avatar").length,
    };
  });
  await page.locator(".kauboj-glava").first().click({ force: true });
  await page.waitForTimeout(200);
  const otvoren = await page.evaluate(() => {
    const kartica = document.querySelector(".kauboj-kartica-otvoren");
    const letEl = kartica?.querySelector(".lik-let");
    return {
      cols: kartica ? getComputedStyle(kartica).gridColumn : "",
      letPosao: letEl?.querySelector(".text-gold.uppercase")?.textContent ?? "",
      letIme: [...(letEl?.querySelectorAll("button") ?? [])].map((b) => b.textContent ?? ""),
    };
  });
  await shot("kauboji");

  const report = {
    zavrtiUEkranu,
    zavrtiBox: box,
    bunari,
    cijena15,
    cijenaTekst: cijenaTekst.slice(0, 180),
    cijenaGem,
    cijenaGold,
    energija20,
    energijaTekst,
    knjigaKlasa,
    kauboji: { ...kaubojiLayout, ...otvoren },
    errors: errors.slice(0, 12),
  };
  console.log(JSON.stringify(report, null, 2));
  if (
    !zavrtiUEkranu ||
    bunari !== 5 ||
    !cijena15 ||
    cijenaGold > 0 ||
    cijenaGem < 1 ||
    !energija20 ||
    !knjigaKlasa ||
    kaubojiLayout.cols !== 2 ||
    kaubojiLayout.avatari !== 0 ||
    kaubojiLayout.kartice < 4 ||
    !otvoren.letIme.some((t) => /Preimenuj/i.test(t)) ||
    otvoren.letPosao.trim() !== ""
  ) {
    process.exit(2);
  }
} catch (err) {
  await shot("fail");
  console.error(String(err?.stack || err));
  process.exit(1);
} finally {
  await browser.close();
}
