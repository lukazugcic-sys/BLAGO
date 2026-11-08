import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const exe = "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";

test("reduced-motion gasi izo-put-ulaz i chip-drzi, bez diranja ekonomije", () => {
  const blokovi = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/g)].map((m) => m[0]);
  const pokriven = blokovi.find((b) => b.includes(".ziva-izo .izo-put-ulaz") && b.includes(".chip-drzi:after"));
  assert.ok(pokriven, "nema reduced-motion pravila za ulaz puta i chip-drzi");
  assert.match(pokriven, /animation:\s*none\s*!important/);
  assert.match(css, /\.ziva-izo \.izo-put-ulaz \{\s*animation: izo-ulaz/);
  assert.match(css, /\.chip-drzi:after\{[^}]*animation:/);
});

test("pregled: ulaz puta i držani čip miruju kad je reduced-motion", async () => {
  const browser = await chromium.launch({
    executablePath: exe,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    page.on("request", (r) => {
      const u = r.url();
      if (u.startsWith("data:") || u.startsWith("about:")) return;
      throw new Error(`neočekivani zahtjev ${u}`);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setContent(
      `<!doctype html><style>${css.replace(/@import[^;]+;/g, "")}</style>
       <div class="ziva-izo"><div class="izo-put-ulaz" id="put"></div></div>
       <button class="chip-drzi" id="chip">POHOD</button>`,
      { waitUntil: "load" },
    );
    const stanje = await page.evaluate(() => {
      const put = getComputedStyle(document.getElementById("put"));
      const chip = getComputedStyle(document.getElementById("chip"), "::after");
      return { put: put.animationName, after: chip.animationName, tranz: put.transitionProperty };
    });
    assert.equal(stanje.put, "none");
    assert.equal(stanje.after, "none");
  } finally {
    await browser.close();
  }
});
