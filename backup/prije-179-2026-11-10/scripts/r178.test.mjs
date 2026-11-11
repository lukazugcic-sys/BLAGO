// 0.9.178 (t459u) — trg prigušen i istrošen, Firma kao Sajam konja, kontrole karte kao donji izbornik,
// Android sustavne trake u tamnoj boji igre.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const tr = await j.import(ROOT + "src/lib/game/trg.ts");
const sb = await j.import(ROOT + "src/lib/game/sustavneBoje.ts");
const read = (p) => readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css");
const dv = read("src/components/game/KaubaDvorista.tsx");
const trgBlok = dv.slice(dv.indexOf("const CVJETOVI"), dv.indexOf("/** Kapljice fontane"));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const zasic = (h) => { const [r, g, b] = hex(h).map((x) => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const svjet = (h) => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// ---------- trg ----------
test("t459u trg: nema jarkih boja (bijela, cijan, žuta zvijezda, crvena tenda) — sve prigušeno", () => {
  for (const jarka of ["#ffffff", "#ffd24a", "#bfe6f0", "#cfeef6", "#d8f2f8", "#f2e6c8", "#c8402c", "#3f7a90", "#4a8aa0", "#5aa0b8", "#6ab0c6", "#fff4c0", "#e86a7a", "#f4d04a", "#f2f0e8"])
    assert.ok(!trgBlok.toLowerCase().includes(jarka), `trg još ima ${jarka}`);
  const boje = [...trgBlok.matchAll(/(?:fill|stroke|bok|vrh|voda|gore|lijevo|desno)="(#[0-9a-f]{6})"/gi)].map((m) => m[1]);
  assert.ok(boje.length > 80, "pronađene boje trga");
  for (const b of boje) {
    assert.ok(svjet(b) < 215, `${b} presvijetla`);
    assert.ok(zasic(b) < 0.62 || svjet(b) < 80, `${b} prezasićena`);
  }
});

test("t459u trg: voda mutna, zvijezda mjedena, žarulje danju ugašene, noćni sjaj blaži, kapljice bez sjaja", () => {
  assert.match(trgBlok, /voda="#4c6764"/);
  assert.match(trgBlok, /fill="#9a8048"/, "mjedena zvijezda");
  assert.match(css, /\.ziva-izo \.izo-trg-zarulje circle \{ fill: #a89a7c;/);
  assert.match(css, /\.ziva-izo\.is-noc \.izo-trg-sjaj \{ opacity: 1; \}/);
  assert.match(css, /\.ziva-izo \.izo-trg-staklo \{ fill: #a89468; \}/);
  const kap = css.slice(css.indexOf(".ziva-izo .izo-trg-voda i {"), css.indexOf("}", css.indexOf(".ziva-izo .izo-trg-voda i {")));
  assert.ok(!/box-shadow/.test(kap), "kapljice bez box-shadow");
  assert.ok(!trgBlok.includes('fill="url(#trg-svjetlo-g)"'), "bez sjajne mrlje preko trga");
});

test("t459u trg: trošenje — falile kocke, pukotine, nanosi pijeska (po jedna staza), mahovina i mrlje", () => {
  for (const c of ["izo-trg-rupe", "izo-trg-pukotine", "izo-trg-pijesak"]) {
    assert.equal(dv.split(`className="${c}"`).length - 1, 1, c);
    assert.ok(css.includes(`.ziva-izo .${c} {`), c);
  }
  assert.match(css, /\.ziva-izo\.is-noc \.izo-trg-pijesak \{ fill: #8a7148; \}/, "pijesak prati noć");
  assert.match(trgBlok, /mahovina/);
  // raspored trga nepromijenjen (iste stvari)
  const broj = (tip) => tr.TRG_STVARI.filter((s) => s.tip === tip).length;
  assert.equal(broj("fontana"), 1);
  assert.equal(broj("spomenik"), 1);
  assert.equal(broj("stand"), 1);
  assert.equal(broj("fenjer"), 4);
});

test("t459u trg: bez filtera na karti (perf pravilo)", () => {
  assert.ok(!/filter=|drop-shadow|feGaussian/.test(trgBlok));
  const trgCss = css.slice(css.indexOf(".ziva-izo .izo-trg-bok"), css.indexOf("@keyframes izo-trg-kap"));
  assert.ok(!/filter:|drop-shadow/.test(trgCss));
});

// ---------- Firma ----------
test("t459u Firma: raspored Sajma konja, iste akcije, cijene i uvjeti; iznosi s ikonama", () => {
  const v = read("src/components/game/VillageScreen.tsx");
  const k = v.slice(v.indexOf("function GovedaKartica()"), v.indexOf("function Rogovi()"));
  assert.match(k, /potreba-stalak sajam-konja firma-178/);
  assert.match(k, /"data-testid": "firma"/);
  for (const c of ["sajam-glava", "sajam-duznosti", "sajam-korak", "sajam-kupi", "sajam-gumb is-glavni", "sajam-gumb is-obrub", "sajam-sporedno", "sajam-broj"]) assert.ok(k.includes(c), c);
  for (const s of [
    "kupiGovedo(1)", "kupiGovedo(5)", "onClick: prodajGovedo", "onClick: tjerajGovedo", "onClick: koljiGovedo",
    'pomakniGovedo(d.id, d.id === "pasa" ? izvor : "pasa")', 'pomakniGovedo(d.id === "pasa" ? izvor : "pasa", d.id)',
    "zlato < govedoZl || drvo < govedoDr || govedaBroj >= kap", "zlato < govedoZl * 5 || drvo < govedoDr * 5",
    "govedaBroj < 1 || jahanje < 1", "kap - govedaBroj >= 5", "cijenaUzKrunu(12, prestige)", "cijenaUzKrunu(3, prestige)",
    'disabled: (d.id === "pasa" ? izvor === "pasa" : duznost.pasa < 1) || govedaBroj < 1', "disabled: duznost[d.id] < 1",
  ]) assert.ok(k.includes(s), s);
  assert.match(k, /jsx\(Iznos, \{ resurs: "zlato", kolicina: govedoZl \}\)/);
  assert.match(k, /jsx\(Iznos, \{ resurs: "drvo", kolicina: govedoDr \}\)/);
  assert.match(k, /kolicina: 10 \* tjerajN/);
  assert.match(k, /kolicina: 7, predznak: true/);
  assert.ok(!/"g"\s*\]|"g"\s*$/m.test(k), "bez kratice g");
  assert.ok(!k.includes("ZGRADA_ART.tor"), "bez velike slike (manje nereda)");
  assert.ok(css.includes(".firma-metar-178"));
});

test("t459u Firma: gumbi i dalje rade (stvarna logika krda)", async () => {
  const { useGameStore } = await j.import(ROOT + "src/lib/stores/gameStore.ts");
  const s0 = useGameStore.getState();
  useGameStore.setState({ gradevine: { ...s0.gradevine, tor: 1 }, zlato: 500, resursi: { ...s0.resursi, drvo: 50 }, govedaBroj: 0 });
  useGameStore.getState().kupiGovedo(1);
  assert.equal(useGameStore.getState().govedaBroj, 1);
});

test("t459u Ćelija: Pusti bez kratice g", () => {
  const v = read("src/components/game/VillageScreen.tsx");
  const k = v.slice(v.indexOf("function ZatvorKartica()"), v.indexOf("function MetciKartica()"));
  assert.match(k, /jsx\(Iznos, \{ resurs: "zlato", kolicina: n \* 8, predznak: true \}\)/);
});

// ---------- kontrole karte ----------
test("t459u kontrole karte: lebdeće ikone kao donji izbornik (24 px, potez 2, 55 %, zlatna + točka), bez pilula, dodir 44 px", () => {
  const zu = read("src/components/game/KaubaZivaUlica.tsx");
  assert.match(zu, /className="karta-kontrole" data-testid="karta-kontrole" data-stil="178"/);
  for (const ik of ["Layers", "Workflow", "Ik"]) assert.match(zu, new RegExp(`<${ik} className="kk-glif" strokeWidth=\\{2\\} />`), ik);
  assert.match(zu, /\["voda", "Voda", Droplet\],\s*\["sreca", "Sreća", Smile\],\s*\["rad", "Rad", Hammer\]/);
  assert.match(zu, /aria-label="Tok kaube"/);
  assert.match(zu, /aria-label=\{pogled === "voda" \? "Pogled: Voda"/);
  const kb = read("src/components/game/KaubaBroj.tsx");
  assert.match(kb, /<Users className="kk-glif" strokeWidth=\{2\} \/>/);
  assert.match(kb, /<Smile className="kk-glif" strokeWidth=\{2\} \/>/);
  assert.match(kb, /aria-label=\{`\$\{n\} kauboja, sreća/);
  assert.ok(!kb.includes("karta-info-rijec"), "bez riječi uz broj");
  const K = '.ziva-ulica.ziva-izo .karta-kontrole[data-stil="178"]';
  const blok = css.slice(css.indexOf("/* ── 0.9.178 (t459u): kontrole karte"));
  assert.ok(blok.includes(`${K} .kk-glif { position: relative; width: 24px; height: 24px; opacity: 0.55;`));
  assert.ok(blok.includes(`${K} .kk-sjena {`) && /color: #000; opacity: 0\.4;/.test(blok), "sjena = tamna kopija");
  assert.ok(!/drop-shadow|filter: (?!none)|backdrop-filter: blur/.test(blok.replace(/\/\*[\s\S]*?\*\//g, "")), "bez filtera");
  assert.match(blok, /background: transparent; box-shadow: none; border: 0; border-radius: 0;/);
  assert.match(blok, /width: 44px; min-width: 44px; height: 44px; min-height: 44px;/);
  assert.match(blok, /border-radius: 50%; background: var\(--color-gold\)/, "aktivna točka");
});

// ---------- Android trake ----------
test("t459u Android trake: boja dna igre u styles.xml, MainActivity i JS (po temi)", () => {
  const col = read("android/app/src/main/res/values/colors.xml");
  assert.match(col, /<color name="blagoNav">#110905<\/color>/);
  assert.match(col, /<color name="blagoStatus">#26150D<\/color>/);
  const st = read("android/app/src/main/res/values/styles.xml");
  assert.equal(st.split('<item name="android:navigationBarColor">@color/blagoNav</item>').length - 1, 3);
  assert.ok(!st.includes("navigationBarColor\">@color/blagoVoid"));
  assert.match(st, /windowLightNavigationBar" tools:targetApi="27">false/);
  assert.match(st, /enforceNavigationBarContrast" tools:targetApi="29">false/);
  const ma = read("android/app/src/main/java/hr/blago/game/MainActivity.java");
  assert.match(ma, /BLAGO_NAV = 0xFF110905/);
  assert.match(ma, /w\.setNavigationBarColor\(navBoja\)/);
  assert.match(ma, /setNavigationBarContrastEnforced\(false\)/);
  assert.match(ma, /APPEARANCE_LIGHT_NAVIGATION_BARS/);
  assert.match(ma, /public void sustavneBoje\(String status, String nav\)/);
  assert.match(ma, /obojiRubWebViewa\(\)/);
  assert.equal(sb.sustavneBojeZa("default").nav, "#110905");
  assert.equal(sb.sustavneBojeZa(undefined).nav, "#110905");
  assert.equal(sb.sustavneBojeZa("nepoznata").nav, "#110905");
  for (const id of ["default", "medieval", "japanese", "futuristic"]) assert.match(sb.SUSTAVNE_BOJE[id].nav, /^#[0-9A-F]{6}$/);
  const pozvano = [];
  globalThis.window = { BlagoFs: { sustavneBoje: (a, b) => pozvano.push([a, b]) } };
  sb.postaviSustavneBoje("futuristic");
  globalThis.window = {};
  sb.postaviSustavneBoje("default"); // bez BlagoFs (web) ne puca
  delete globalThis.window;
  assert.deepEqual(pozvano, [["#0F121F", "#05070F"]]);
  assert.match(read("src/lib/game/constants.ts"), /postaviSustavneBoje\(skin\.id\)/);
  assert.match(read("capacitor.config.ts"), /SystemBars: \{\s*style: "DARK",/);
});

test("0.9.178 verzija", () => {
  assert.match(read("src/lib/game/version.ts"), /0\.9\.178-beta/);
  const g = read("android/app/build.gradle");
  assert.ok(Number(g.match(/versionCode (\d+)/)[1]) >= 218);
  assert.match(g, /versionName "0\.9\.178-beta"/);
  assert.match(g, /applicationId "hr\.blago\.game"/);
});
