// 0.9.179 (t465u) — stil donjeg izbornika karte prenesen na cijeli GUI: lebdeće ikone, bez ploča,
// prozirni listovi preko karte, popisi kao redovi, prigušena paleta. Samo izgled — sve funkcije dostupne.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css");
const start = css.indexOf("/* ══ 0.9.179 (t465u)");
const end = css.indexOf("/* ══ kraj 0.9.179 ══ */");
const blok = css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, "");
const pravila = (sel) => {
  const tocno = sel.endsWith(" {");
  const q = tocno ? sel.slice(0, -2) : sel;
  return [...blok.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => (tocno ? razdvoji(m[1]).some((x) => x.endsWith(q)) : m[1].includes(q)))
    .map((m) => m[2])
    .join("\n");
};
function razdvoji(sel) {
  const out = [];
  let d = 0, cur = "";
  for (const ch of sel) {
    if (ch === "(") d++;
    if (ch === ")") d--;
    if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const komp = (f) => read(`src/components/game/${f}`);

test("r179: jedan GUI sloj je uključen i zatvoren, zadnji u styles.css", () => {
  assert.ok(start > 0 && end > start, "blok 0.9.179 postoji");
  const ostatak = css.slice(end + "/* ══ kraj 0.9.179 ══ */".length).trim();
  assert.ok(
    ostatak === "" || ostatak.startsWith("/* ══ 0.9.180"),
    "iza 0.9.179 smije samo sloj 0.9.180 (on pobjeđuje)",
  );
  assert.match(komp("GameApp.tsx"), /classList\.add\("gui-179"\)/);
  // sva pravila su pod html.gui-179 — ništa ne curi izvan sloja
  for (const m of blok.matchAll(/(^|\})\s*([^{}@/][^{}]*)\{/g)) {
    for (const sel of razdvoji(m[2])) if (!sel.startsWith("@")) assert.match(sel, /^html\.gui-179\b/, sel);
  }
});

test("r179: gornja traka bez trake — tamni prijelaz do prozirnog, resursi bez pilula, karta ide ispod", () => {
  assert.match(komp("Header.tsx"), /className="hdr-179 /);
  const h = pravila("header.hdr-179 {");
  assert.match(h, /linear-gradient\(to bottom/);
  assert.match(h, /transparent\) 100%/);
  assert.match(h, /border-bottom: 0 !important/);
  assert.doesNotMatch(h, /backdrop-filter/, "bez blura iznad karte koja se vuče");
  assert.match(blok, /\.game-shell\[data-tab="selo"\] > header\.hdr-179 \{ position: absolute;/);
  const c = pravila(".hud-resursi > .header-chip");
  assert.match(c, /background: transparent !important/);
  assert.match(c, /border: 0 !important/);
});

test("r179: lebdeća ikona = ista kao donji izbornik (24 px, potez 2, tamna kopija 1 px niže)", () => {
  const ik = komp("IkonaG.tsx");
  assert.match(ik, /strokeWidth=\{3\.6\}/);
  assert.match(ik, /strokeWidth=\{2\}/);
  assert.match(ik, /aria-hidden/);
  assert.match(blok, /--g-ik: 24px/);
  assert.match(pravila(".g179-sjena"), /translate\(-50%, calc\(-50% \+ 1px\)\)/);
  // aktivno = svjetlije + točka/podcrta, nikad obojena pozadina
  const akt = pravila('g179-tipka[aria-pressed="true"]');
  assert.doesNotMatch(akt.replace(/background: var\(--g-akcent\)/, ""), /background:(?! transparent)/);
  assert.match(pravila("button.g179-tipka {"), /background: transparent !important/);
});

test("r179: slot — okvir bubnjeva ostaje, kontrole su lebdeće ikone, sve funkcije dostupne", () => {
  const s = komp("SlotScreen.tsx");
  assert.ok(s.includes("BONUS") && s.includes("TURBO") && s.includes("KnjigaTraka"));
  assert.match(s, /aria-label="Bonus izbornik"/);
  assert.match(s, /<IkonaG ikona=\{Sparkles\} rijec="BONUS" \/>/);
  assert.match(s, /aria-label=\{turbo \? "Turbo uključen" : "Turbo"\}/);
  assert.match(s, /aria-pressed=\{turbo\}/);
  assert.match(s, /aria-pressed=\{ulog === op\}/);
  assert.match(s, /aria-label=\{`Ulog ×\$\{op\}`\}/);
  assert.match(s, /data-testid="zavrti"/);
  assert.match(s, /data-testid="bonus-kupi"/);
  assert.match(s, /kupiBesplatne\(bonusZnak\)/);
  assert.match(s, /setTurboRezim\(!turboRezim\)/);
  // okvir bubnjeva nije diran u 0.9.179
  assert.doesNotMatch(blok, /slot-kolo-okvir|slot-kolo-bunar|reel-window|slot-token/);
  assert.match(pravila(".ulozi-cip {"), /background: transparent !important/);
});

test("r179: dijelovi kaube i dijalozi su prozirni listovi preko karte; povratak radi", () => {
  assert.match(pravila(".kauba-dio {"), /background: transparent !important/);
  assert.match(pravila(".kauba-dio-info {"), /background: transparent !important/);
  const v = komp("VillageScreen.tsx");
  const natrag = v.slice(v.indexOf('className: "kauba-natrag'), v.indexOf('className: "kauba-natrag') + 900);
  assert.match(natrag, /"aria-label": "Natrag na kartu"/);
  assert.match(natrag, /setDio\(null\)/);
  assert.match(natrag, /IkonaG, \{ ikona: MapIkona, rijec: "KARTA" \}/);
  assert.match(pravila(".modal-pozadina {"), /color-mix\(in oklab, var\(--color-void\) 42%, transparent\)/);
  // postupni blur u 2 sloja (slabiji šire, jači samo uz rub)
  assert.match(pravila(".modal-pozadina::before {"), /blur\(2px\)/);
  assert.match(pravila(".modal-pozadina::after {"), /blur\(8px\)/);
  assert.match(pravila(".kauba-dio::after {"), /mask-image/);
});

test("r179: blur nikad na karti koja se vuče; bez :has i bez pravila po cijelom pageru (0.9.177 vučenje)", () => {
  const sBlurom = [...blok.matchAll(/([^{}]+)\{([^{}]*backdrop-filter:\s*blur[^{}]*)\}/g)].map((m) => m[1].trim());
  assert.ok(sBlurom.length >= 4);
  for (const sel of sBlurom) assert.match(sel, /modal-pozadina|kauba-dio|karta-izbornik/, sel);
  assert.doesNotMatch(blok, /:has\(/);
  assert.doesNotMatch(blok, /\.pager-scroller/);
  assert.doesNotMatch(blok, /ziva-ulica|izo-svijet|karta-kontrole/);
  // stari prekidač blura tijekom vučenja ostaje
  assert.match(css, /\.nav-blur\.is-vuce i \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/);
});

test("r179: popisi bez kartica — redovi s tankim razdjelnikom, odabir je podcrta", () => {
  const red = pravila("article, .zgrada-kartica");
  assert.match(red, /border-bottom: 1px solid var\(--g-crta\) !important/);
  assert.match(red, /border-radius: 0 !important/);
  assert.match(komp("BuildingCard.tsx"), /zgrada-kartica relative/);
  assert.match(komp("ScreenTabs.tsx"), /aria-pressed=\{aktivan\}/);
  assert.match(komp("ShopScreen.tsx"), /aria-pressed=\{mnoz === n\}/);
  assert.match(pravila('.zaslon-tabovi > button[aria-pressed="true"]'), /text-decoration-line: underline/);
});

test("r179: samo izgled — ekonomija, cijene i save se ne spominju; reduced-motion poštovan", () => {
  assert.doesNotMatch(blok, /@keyframes|animation:/);
  assert.match(blok, /@media \(prefers-reduced-motion: reduce\)/);
  const nove = komp("IkonaG.tsx");
  assert.doesNotMatch(nove, /useGameStore|economy|cijena/);
  // nigdje „g“ kao zlato u novim natpisima
  for (const t of ['rijec="BONUS"', 'rijec="TURBO"', 'rijec: "KARTA"']) assert.ok(!/\d\s?g\b/.test(t));
});

test("r179: verzija 0.9.181-beta / code 221", () => {
  assert.match(read("src/lib/game/version.ts"), /0\.9\.181-beta/);
  const g = read("android/app/build.gradle");
  assert.ok(Number(g.match(/versionCode (\d+)/)[1]) >= 221);
  assert.match(g, /versionName "0\.9\.181-beta"/);
  assert.match(g, /applicationId "hr\.blago\.game"/);
});
