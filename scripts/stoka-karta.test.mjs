// Svaki konj i govedo na karti. Izvršava stvarni stokaKarta.ts i stvarni KaubaCesta.tsx
// (transpiliran TypeScriptom; React zamijenjen). Nije preglednik ni vizualna provjera.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import postcss from "postcss";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const s = await jiti.import("../src/lib/game/stokaKarta.ts");
const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
const t = await jiti.import("../src/lib/game/teren.ts");
const tun = await jiti.import("../src/lib/game/tuning.ts");

const PUNO = { staja: 6, korali: 6, staza: 6, tor: 6 };
const box = (g) => ({ x0: g.x + s.OTISAK.x0, x1: g.x + s.OTISAK.x1, y0: g.y + s.OTISAK.y0, y1: g.y + s.OTISAK.y1 });
const preklop = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

// neovisna provjera (ne koristi slobodnoZaGrlo)
const cesta = t.tockeOd(t.STAZA.tijelo);
const pip = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k); };
const dLin = (p, l) => { let d = Infinity; for (let i = 1; i < l.length; i++) d = Math.min(d, dSeg(p, l[i - 1], l[i])); return d; };
const putevi = u.putelji(u.PARCELE.map((p) => p.id)).map((p) => p.tocke);
const potok = t.tockeOd(t.POTOK);
function provjeriGeometriju(grla) {
  for (const g of grla) {
    const b = box(g);
    assert.ok(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= u.SVIJET.w && b.y1 <= u.SVIJET.h, `${g.id} van karte`);
    for (const p of [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }, { x: g.x, y: g.y }]) {
      for (const q of u.PARCELE) assert.ok(!u.uRomu(p.x, p.y, q), `${g.id} u parceli ${q.id}`);
      assert.ok(!pip(p, cesta), `${g.id} na cesti`);
      for (const l of putevi) assert.ok(dLin(p, l) >= 5.9, `${g.id} na puteljku`);
      assert.ok(dLin(p, potok) >= 12.9, `${g.id} u potoku`);
      if (t.LOKVA) assert.ok(((p.x - t.LOKVA.x) / 28) ** 2 + ((p.y - t.LOKVA.y) / 12) ** 2 >= 1, `${g.id} u lokvi`);
    }
  }
  for (let i = 0; i < grla.length; i++) for (let j = i + 1; j < grla.length; j++) assert.ok(!preklop(box(grla[i]), box(grla[j])), `${grla[i].id} preklapa ${grla[j].id}`);
}

test("0 grla: ništa se ne crta, bez izmišljenih", () => {
  for (const g of [{}, PUNO]) assert.deepEqual(s.stokaNaKarti(g, 0, 0), { grla: [], nema: { konj: 0, govedo: 0 } });
  for (const v of [undefined, null, NaN, -3, "5", Infinity]) assert.equal(s.brojGrla(v), 0, String(v));
  assert.equal(s.brojGrla(2.7), 2);
});

test("točan broj: 1, nekoliko i najviše (90 konja, 48 goveda) – svako zasebno, bez preklapanja, izvan parcela/ceste/puteljka/vode", () => {
  const maxK = 6 * tun.POKRICE.staja + 6 * tun.POKRICE.korali + 6 * tun.POKRICE.staza;
  const maxG = 6 * tun.POKRICE.tor;
  assert.equal(maxK, 90);
  assert.equal(maxG, 48);
  for (const [k, g] of [[1, 0], [0, 1], [3, 5], [maxK, maxG]]) {
    const r = s.stokaNaKarti(PUNO, k, g);
    assert.equal(r.grla.filter((x) => x.vrsta === "konj").length, k);
    assert.equal(r.grla.filter((x) => x.vrsta === "govedo").length, g);
    assert.deepEqual(r.nema, { konj: 0, govedo: 0 });
    assert.equal(new Set(r.grla.map((x) => x.id)).size, k + g);
    provjeriGeometriju(r.grla);
  }
  // pune zgrade: unutar kapaciteta svako grlo stoji uz svoju zgradu
  const r = s.stokaNaKarti(PUNO, 90, 48);
  assert.ok(r.grla.every((x) => !x.kod.endsWith("-visak")));
  assert.equal(r.grla.filter((x) => x.kod === "staja").length, 36);
  assert.equal(r.grla.filter((x) => x.kod === "tor").length, 48);
});

test("kupnja dodaje na kraj, prodaja miče zadnjeg: ostali ID-ovi i mjesta ostaju", () => {
  const a = s.stokaNaKarti(PUNO, 10, 7).grla;
  const b = s.stokaNaKarti(PUNO, 11, 7).grla;
  const c = s.stokaNaKarti(PUNO, 10, 6).grla;
  const kljuc = (l) => new Map(l.map((x) => [x.id, `${x.x},${x.y}`]));
  for (const [id, p] of kljuc(a)) assert.equal(kljuc(b).get(id), p);
  for (const [id, p] of kljuc(c)) assert.equal(kljuc(a).get(id), p);
  assert.ok(kljuc(b).has("konj-10") && !kljuc(a).has("konj-10"));
  assert.ok(!kljuc(c).has("govedo-6"));
  assert.deepEqual(s.stokaNaKarti(PUNO, 10, 7), s.stokaNaKarti(PUNO, 10, 7), "deterministično");
});

test("iznad kapaciteta i bez zgrade: sva grla ostaju vidljiva (višak uz isto područje)", () => {
  const r = s.stokaNaKarti({ staja: 1 }, 20, 0);
  assert.equal(r.grla.length, 20);
  assert.equal(r.grla.filter((x) => x.kod === "staja").length, 6);
  assert.equal(r.grla.filter((x) => x.kod.endsWith("-visak")).length, 14);
  provjeriGeometriju(r.grla);
  const bez = s.stokaNaKarti({}, 3, 2);
  assert.equal(bez.grla.length, 5);
  provjeriGeometriju(bez.grla);
  const veliko = s.stokaNaKarti({}, 300, 200);
  assert.equal(veliko.grla.length, 500);
  assert.deepEqual(veliko.nema, { konj: 0, govedo: 0 });
});

// --- stvarni KaubaCesta.tsx ---
async function renderCesta(stoka) {
  const src = readFileSync(ROOT + "src/components/game/KaubaCesta.tsx", "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const req = {};
  for (const m of [...js.matchAll(/require\("([^"]+)"\)/g)].map((x) => x[1])) {
    if (m.startsWith("@/lib/")) req[m] = await jiti.import(m.replace("@/", "../src/") + ".ts");
  }
  const jsx = (type, props) => ({ type, props });
  req["react"] = { memo: (f) => f };
  req["react/jsx-runtime"] = { jsx, jsxs: jsx, Fragment: "F" };
  req["@/components/game/KaubaObzor"] = { Raslina: "R", TRAGOVI: [] };
  req["@/lib/utils"] = { cn: (...a) => a.filter((x) => typeof x === "string").join(" ") };
  const module = { exports: {} };
  runInNewContext(js, { module, exports: module.exports, require: (n) => { if (!(n in req)) throw new Error("stub " + n); return req[n]; } });
  const out = module.exports.KaubaCesta({ gradevine: PUNO, gradnje: [], pogled: null, staze: [], mirno: true, skok: null, stoka });
  const sve = (v) => (!v || typeof v !== "object" ? [] : Array.isArray(v) ? v.flatMap(sve) : [v, ...sve(v.props?.children)]);
  return sve(out);
}

test("KaubaCesta: jedna sličica po grlu (0/1/max), konj i govedo različiti, nema starih ukrasnih goveda", async () => {
  for (const [k, g] of [[0, 0], [1, 0], [0, 1], [90, 48]]) {
    const cvorovi = await renderCesta(s.stokaNaKarti(PUNO, k, g).grla);
    const z = cvorovi.filter((n) => typeof n.props?.className === "string" && n.props.className.includes("izo-zivotinja "));
    assert.equal(z.filter((n) => n.props.className.includes("is-konj")).length, k);
    assert.equal(z.filter((n) => n.props.className.includes("is-govedo")).length, g);
    assert.equal(new Set(z.map((n) => n.props["data-zivotinja"])).size, k + g);
    assert.equal(cvorovi.filter((n) => n.props?.className === "izo-stoka").length, 0);
  }
});

test("KaubaZivaUlica (strukturno, transpilirani izvor): nema ukrasnih konja uz salun/staju, stoka iz stokaNaKarti", () => {
  const js = ts.transpileModule(readFileSync(ROOT + "src/components/game/KaubaZivaUlica.tsx", "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX } }).outputText;
  assert.doesNotMatch(js, /className: "izo-konj"/);
  assert.doesNotMatch(js, /className: "izo-konj-staja"/);
  assert.doesNotMatch(js, /stokaTocke|konjiSaluna/);
  assert.match(js, /stokaNaKarti\)?\(gradevine, konjiBroj, govedaBroj\)/);
});

test("CSS: izdaleka ništa ne skriva .izo-zivotinja ni .izo-cesta (nelayerirana pravila)", () => {
  const css = readFileSync(ROOT + "src/styles.css", "utf8");
  const skriva = [];
  postcss.parse(css).walkRules((r) => {
    let p = r.parent, n = false;
    while (p && p.type !== "root") { if (p.type === "atrule" && p.name !== "media") n = true; p = p.parent; }
    if (n) return;
    let none = false, vis = false;
    r.walkDecls((d) => { if (d.prop === "display" && d.value.trim() === "none") none = true; if ((d.prop === "visibility" && d.value.trim() === "hidden") || (d.prop === "opacity" && d.value.trim() === "0")) vis = true; });
    if (!none && !vis) return;
    for (const sel of r.selectors) if (/izo-zivotinja|izo-cesta(?![-\w])|\.ziva-izo[^ ]* g\b|\bsvg\b/.test(sel)) skriva.push(sel);
  });
  assert.deepEqual(skriva, []);
});
