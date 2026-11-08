import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8").replace(/@import[^;]+;/g, "");
const exe = "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
const PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const TEME = {
  default: { void: "#24140c", panel: "#5a321c", panel2: "#6e3d22", ink: "#fff8e8", gold: "#ffd24a", energy: "#ff6a18" },
  medieval: { void: "#1a1014", panel: "#4a2834", panel2: "#5c3340", ink: "#fff4e8", gold: "#e8c070", energy: "#d45a6c" },
  japanese: { void: "#180c0a", panel: "#5a2418", panel2: "#6e2c1c", ink: "#fff6e8", gold: "#ffc44a", energy: "#ff3a28" },
  futuristic: { void: "#0c1020", panel: "#1c2848", panel2: "#283860", ink: "#eef4ff", gold: "#ffd27a", energy: "#8a6cff" },
};

function stupac(spin, win) {
  const stanje = spin ? "is-spin" : "";
  const celije = [0, 1, 2]
    .map(
      (i) => `<div class="reel-cell"><span class="slot-token slot-token-gold${win && i === 1 ? " slot-win" : ""}"><img class="slot-art" src="${PX}" alt=""></span></div>`,
    )
    .join("");
  return `<div class="reel-col ${stanje}" data-fx="${spin ? "spin" : "idle"}"><div class="reel-sizer" aria-hidden><span></span><span></span><span></span></div><div class="reel-window"><div class="reel-strip">${celije}</div></div></div>`;
}

function stranica(stanje) {
  const spin = stanje === "spin";
  const win = stanje === "win";
  const disabled = stanje === "disabled" || spin;
  const natpis = win ? `<p class="slot-dobitak-flash" role="status">Dobitak</p>` : "";
  const dock = win
    ? `<div class="plijen-traka"><p>Trenutni plijen</p><p>Isplata: 12 zlata</p></div>`
    : `<div class="ulozi-red"><button type="button">×1</button><button type="button">×2</button><button type="button">×5</button></div>`;
  const gumb = spin ? "VRTIM..." : disabled ? "ZAVRTI" : "ZAVRTI";
  return `<!doctype html><html data-skin="default"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    ${css}
    html,body{margin:0;height:100%}
    body{display:flex;flex-direction:column;min-height:100dvh}
    #hud{flex:none;height:54px}
    #igra{flex:1;min-height:0}
    #nav{flex:none}
  </style></head><body>
    <header id="hud">BLAGO</header>
    <div id="igra" class="slot-fx-host">
      <div class="slot-kolo-omot">
        ${natpis}
        <div class="slot-kolo${win ? " reel-frame-win" : ""}">
          <span class="slot-ploca">BLAGO</span>
          <div class="slot-kolo-okvir"><div class="slot-kolo-bunar"><div class="slot-reel-stol"><div></div><div class="slot-reel-mreza"><div class="slot-reel-stupovi">${[0, 1, 2, 3, 4].map(() => stupac(spin, win)).join("")}</div></div><div></div></div></div></div>
        </div>
      </div>
      <div class="zavrti-traka">
        <button type="button" data-testid="zavrti" class="slot-zavrti zavrti-usko bg-energy" ${disabled ? "disabled" : ""}>${gumb}</button>
        <div class="slot-status-red">
          <p class="slot-mnozitelj">Ulog ×2 množi isplatu</p>
          <div class="energija-hud" data-chip="energija"><p>Energija 8/10</p></div>
        </div>
        <div class="slot-dock">${dock}</div>
        <div class="slot-sporedno"><button type="button">TURBO</button></div>
      </div>
    </div>
    <nav id="nav" class="relative z-20 shrink-0 bg-void px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1"><button type="button" style="min-height:48px">Igraj</button></nav>
  </body></html>`;
}

test("slot izgled: fokusi, teme, stanja, reduced-motion, bez mreže i savea", async () => {
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
    const mjeri = () =>
      page.evaluate(() => {
        const kolo = document.querySelector(".slot-kolo").getBoundingClientRect();
        const gumb = document.querySelector("[data-testid=zavrti]");
        const gb = gumb.getBoundingClientRect();
        const hud = document.getElementById("hud").getBoundingClientRect();
        const nav = document.getElementById("nav").getBoundingClientRect();
        const token = document.querySelector(".slot-token");
        const ts = getComputedStyle(token);
        const strip = document.querySelector(".reel-strip");
        const ss = getComputedStyle(strip);
        const gs = getComputedStyle(gumb);
        return {
          stupaca: document.querySelectorAll(".reel-col").length,
          celija: document.querySelector(".reel-col").querySelectorAll(".reel-cell").length,
          koloW: Math.round(kolo.width),
          koloTop: Math.round(kolo.top),
          gumbTop: Math.round(gb.top),
          gumbH: Math.round(gb.height),
          gumbW: Math.round(gb.width),
          preklopHud: Math.round(kolo.top - hud.bottom),
          preklopNav: Math.round(nav.top - gb.bottom),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          panel: getComputedStyle(document.documentElement).getPropertyValue("--color-panel").trim(),
          tokenRadius: ts.borderRadius,
          anim: ss.animationName,
          gumbAnim: gs.animationName,
          flash: document.querySelector(".slot-dobitak-flash")?.textContent ?? "",
          disabled: gumb.disabled,
          tekst: gumb.textContent,
        };
      });

    for (const [w, h] of [
      [390, 844],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setContent(stranica("idle"), { waitUntil: "load" });
      const paneli = [];
      for (const [id, t] of Object.entries(TEME)) {
        await page.evaluate((tema) => {
          const r = document.documentElement;
          r.dataset.skin = tema.id;
          for (const [k, v] of Object.entries(tema.boje)) r.style.setProperty(`--color-${k}`, v);
        }, { id, boje: t });
        const m = await mjeri();
        paneli.push(m.panel);
        assert.equal(m.stupaca, 5, `${w} stupaca`);
        assert.equal(m.celija, 3, `${w} redova`);
        assert.ok(m.gumbH >= 56, `${w} gumb ${m.gumbH}`);
        assert.ok(m.gumbW >= Math.min(w, 512) * 0.7, `${w} gumb preuzak ${m.gumbW}`);
        assert.ok(m.preklopHud >= -1, `${w} bubanj prekriva status ${m.preklopHud}`);
        assert.ok(m.preklopNav >= -1, `${w} gumb prekriva izbornik ${m.preklopNav}`);
        assert.ok(m.overflow <= 1, `${w} vodoravni preljev ${m.overflow}`);
        assert.ok(m.tokenRadius.endsWith("px") && !m.tokenRadius.startsWith("0"), "polje simbola nije odvojeno");
        assert.equal(m.disabled, false);
        assert.equal(m.tekst, "ZAVRTI");
      }
      assert.equal(new Set(paneli).size, 4, `teme ${w}`);

      const idle = await mjeri();
      await page.setContent(stranica("win"), { waitUntil: "load" });
      await page.evaluate((t) => {
        const r = document.documentElement;
        r.dataset.skin = "default";
        for (const [k, v] of Object.entries(t)) r.style.setProperty(`--color-${k}`, v);
      }, TEME.default);
      const dobitak = await mjeri();
      assert.equal(dobitak.flash, "Dobitak");
      assert.equal(dobitak.koloW, idle.koloW, `${w} dobitak mijenja širinu bubnja`);
      assert.ok(Math.abs(dobitak.gumbTop - idle.gumbTop) <= 2, `${w} dobitak pomiče gumb`);

      await page.setContent(stranica("spin"), { waitUntil: "load" });
      const vrtnja = await mjeri();
      assert.equal(vrtnja.disabled, true);
      assert.equal(vrtnja.tekst, "VRTIM...");
      assert.notEqual(vrtnja.anim, "none");

      await page.setContent(stranica("disabled"), { waitUntil: "load" });
      const gasen = await mjeri();
      assert.equal(gasen.disabled, true);
      assert.equal(gasen.tekst, "ZAVRTI");

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setContent(stranica("spin"), { waitUntil: "load" });
      const mir = await mjeri();
      assert.equal(mir.anim, "none", `${w} vrtnja nije mirna`);
      await page.setContent(stranica("win"), { waitUntil: "load" });
      const mirWin = await page.evaluate(() => getComputedStyle(document.querySelector(".slot-win")).animationName);
      assert.equal(mirWin, "none", `${w} dobitak nije miran`);
    }
  } finally {
    await browser.close();
  }
});
