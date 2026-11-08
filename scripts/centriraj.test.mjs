import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url);
const exe = [
  "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell",
].find((p) => existsSync(p));

function cssBezUvoza() {
  return readFileSync(new URL("src/styles.css", root), "utf8").replace(/@import[^;]+;/g, "");
}

test("nema Centriraj ni kompas, traka kauboja je u kutu", async () => {
  assert.ok(exe, "nema headless preglednika za hit-test");
  const browser = await chromium.launch({
    executablePath: exe,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;width:360px;height:640px;background:#140c08}
      #app{display:flex;flex-direction:column;width:360px;height:640px}
      #spin{flex:0 0 44px;height:44px}
      .kauba-skrol{position:relative;flex:1 1 auto;min-height:0;height:596px}
      ${cssBezUvoza()}
    </style></head><body>
      <div id="app">
        <div id="spin"></div>
        <div class="kauba-skrol">
          <div class="kauba-scena" data-testid="kauba-ulica">
            <div class="kauba-scena-slika mreza-dio-prikaz" data-dio="selo">
              <div class="ziva-ulica ziva-izo" data-detalj="daleko">
                <div class="izo-okvir"></div>
                <button type="button" class="karta-info" data-testid="karta-info">3 kauboja Kauboji</button>
              </div>
            </div>
            <div class="kauba-scena-donji"><button type="button" class="kauba-prsten">8</button></div>
          </div>
        </div>
      </div>
    </body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    const izvjestaj = await page.evaluate(() => {
      const gumb = document.querySelector("[data-testid=karta-info]");
      const scena = document.querySelector(".kauba-scena");
      if (!(gumb instanceof HTMLElement) || !(scena instanceof HTMLElement)) return { greska: "nema čvorova" };
      const g = gumb.getBoundingClientRect();
      const s = scena.getBoundingClientRect();
      const x = g.left + g.width / 2;
      const y = g.top + g.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        w: g.width,
        h: g.height,
        gx: g.left,
        gy: g.top,
        sh: s.height,
        pe: getComputedStyle(gumb).pointerEvents,
        hitId: hit instanceof HTMLElement ? hit.getAttribute("data-testid") : "",
        centriraj: document.querySelectorAll(".kauba-centriraj, .izo-kompas").length,
        prikaz: getComputedStyle(document.querySelector(".kauba-centriraj") || document.body).display,
      };
    });
    assert.equal(izvjestaj.greska, undefined);
    assert.equal(izvjestaj.centriraj, 0);
    assert.ok(izvjestaj.w > 40, `širina ${izvjestaj.w}`);
    assert.ok(izvjestaj.sh > 300, `scena ${izvjestaj.sh}`);
    assert.ok(izvjestaj.gy > 400, `traka nije u donjem kutu y=${izvjestaj.gy}`);
    assert.ok(izvjestaj.gx > 80, `traka nije desno x=${izvjestaj.gx}`);
    assert.equal(izvjestaj.pe, "auto");
    assert.equal(izvjestaj.hitId, "karta-info", JSON.stringify(izvjestaj));
  } finally {
    await browser.close();
  }
});
