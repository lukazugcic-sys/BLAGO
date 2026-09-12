#!/usr/bin/env node
import { chromium } from "playwright";

const url = process.env.E2E_URL || "http://127.0.0.1:8080";
const timeout = Number(process.env.E2E_TIMEOUT_MS || 45000);

const steps = [];
const fail = (name, err) => {
  steps.push({ name, ok: false, err: String(err?.message || err) });
};
const ok = (name) => steps.push({ name, ok: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(timeout);

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pokreni igru" }).waitFor({ state: "visible" });
  ok("otvori");

  await page.getByRole("button", { name: "Pokreni igru" }).click();
  ok("ulaz");

  await page.getByTestId("onboard-dalje").waitFor({ state: "visible" });
  const ime = page.locator("input").first();
  if (await ime.isVisible().catch(() => false)) await ime.fill("Test");
  await page.getByTestId("onboard-dalje").click();
  await page.getByTestId("onboard-igraj").click();
  ok("uvod");

  await page.getByTestId("zavrti").waitFor({ state: "visible" });
  ok("zavrti");

  const dnevna = page.getByRole("dialog", { name: "Dnevna nagrada" });
  if (await dnevna.isVisible({ timeout: 3000 }).catch(() => false)) {
    const preuzmi = dnevna.getByRole("button", { name: "PREUZMI" });
    if (await preuzmi.isVisible().catch(() => false)) await preuzmi.click();
    else await page.getByRole("button", { name: /Kasnije/ }).first().click();
    ok("dnevna");
  } else {
    ok("dnevna-nema");
  }

  await page.getByLabel("Kauba").click();
  await page.getByText("Smještaj").first().waitFor({ state: "visible" });
  ok("selo");

  await page.getByLabel("Tržnica").click();
  await page.getByText("PRODAJ").first().waitFor({ state: "visible" });
  ok("trznica");

  await page.getByLabel("Izbornik").click();
  await page.getByLabel("Beta info").click();
  await page.getByRole("button", { name: "Pokreni auto-test" }).click();
  await page.getByText(/Auto-test \d+\/\d+/).waitFor({ state: "visible" });
  const tekst = await page.getByText(/Auto-test \d+\/\d+/).innerText();
  if (!/8\/8/.test(tekst) && !/6\/6/.test(tekst) && !/7\/7/.test(tekst)) {
    throw new Error(`auto-test nije savršen: ${tekst}`);
  }
  ok("auto-test");
} catch (err) {
  fail(steps.at(-1)?.name ? `poslije-${steps.at(-1).name}` : "e2e", err);
} finally {
  await browser.close();
}

const bad = steps.filter((s) => !s.ok);
const report = { ok: bad.length === 0, steps };
console.log(JSON.stringify(report, null, 2));
process.exit(bad.length ? 1 : 0);
