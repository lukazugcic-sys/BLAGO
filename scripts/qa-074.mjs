#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const BOJE = {
  energy: "#ff7a12",
  shield: "#3d8bff",
  gold: "#ffd24a",
  wood: "#a35a22",
  stone: "#cfd3d8",
  iron: "#b56a42",
  gem: "#9b4dff",
  wild: "#2ec85a",
};

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const skloni = async () => {
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 1500 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 500 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 500 }).catch(() => {});
  await page.getByRole("button", { name: /^Zatvori$/i }).click({ force: true, timeout: 500 }).catch(() => {});
  await page.locator(".modal-pozadina").evaluate((el) => el.remove()).catch(() => {});
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
  await page.waitForTimeout(700);
  await skloni();
  await page.getByRole("button", { name: "Igraj", exact: true }).click({ force: true });
  await page.waitForTimeout(400);
  await skloni();
  await page.locator(".slot-token").first().waitFor({ state: "visible", timeout: 4000 });

  await page.evaluate((boje) => {
    const ids = Object.keys(boje);
    document.querySelectorAll(".slot-token").forEach((el, i) => {
      const id = ids[i % ids.length];
      el.setAttribute("data-simbol", id);
      el.className = el.className.replace(/slot-token-\w+/g, "").trim() + ` slot-token-${id}`;
      el.style.setProperty("--sym", boje[id]);
      const img = el.querySelector("img");
      if (img) img.src = `/art/symbols/${id}.png`;
    });
    document.querySelectorAll(".iko").forEach((el) => {
      const src = el.querySelector("img")?.getAttribute("src") || "";
      const id = ids.find((k) => src.includes(k));
      if (!id) return;
      el.setAttribute("data-simbol", id);
      el.style.setProperty("--sym", boje[id]);
    });
  }, BOJE);

  await page.waitForTimeout(200);
  await page.screenshot({ path: "/workspace/screenshots/v74-simboli.png" });

  const tokeni = await page.evaluate(() =>
    [...document.querySelectorAll(".slot-token")].slice(0, 8).map((el) => ({
      id: el.getAttribute("data-simbol"),
      cls: [...el.classList].filter((c) => c.startsWith("slot-token-")).join(" "),
      bg: getComputedStyle(el).backgroundColor,
      border: getComputedStyle(el).borderColor,
    })),
  );
  const ikone = await page.evaluate(() =>
    [...document.querySelectorAll("header .iko")].map((el) => ({
      id: el.getAttribute("data-simbol"),
      bg: getComputedStyle(el).backgroundColor,
    })),
  );

  console.log(JSON.stringify({ tokeni, ikone }, null, 2));
  const fail = [];
  const treba = ["energy", "shield", "gold", "wood", "stone", "iron", "gem", "wild"];
  for (const id of treba) {
    if (!tokeni.some((t) => t.id === id && t.cls.includes(`slot-token-${id}`))) fail.push(`nema ${id}`);
  }
  const bgs = new Set(tokeni.map((t) => t.bg));
  if (bgs.size < 6) fail.push(`boje se preklapaju ${bgs.size}`);
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.74");
} finally {
  await browser.close();
}
