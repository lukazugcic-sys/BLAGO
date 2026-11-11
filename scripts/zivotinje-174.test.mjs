// 0.9.174 — plan korak 5 (Kauba karta: životinje i karavana). Jedan blok po stavci 12/13/11/14/20/21.
// Izvršava stvarni stokaKarta.ts / obor.ts / KaubaCesta.tsx / KaravanaKola.tsx / agentiSim.ts
// (transpilirano TypeScriptom, React zamijenjen). Vizualna provjera je odvojeno (headless PNG).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const s = await jiti.import("../src/lib/game/stokaKarta.ts");
const o = await jiti.import("../src/lib/game/obor.ts");
const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
const t = await jiti.import("../src/lib/game/teren.ts");
const tun = await jiti.import("../src/lib/game/tuning.ts");
const read = (p) => readFileSync(ROOT + p, "utf8");

const PUNO = { staja: 6, korali: 6, staza: 6, tor: 6 };
const LV3 = { staja: 3, korali: 3, staza: 3, tor: 3, farma: 3 };
const P = (id) => u.PARCELE.find((p) => p.id === id);
const pip = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k); };
const dLin = (p, l) => { let d = Infinity; for (let i = 1; i < l.length; i++) d = Math.min(d, dSeg(p, l[i - 1], l[i])); return d; };
const dPoly = (p, poly) => (pip(p, poly) ? 0 : Math.min(...poly.map((a, i) => dSeg(p, a, poly[(i + 1) % poly.length]))));
const box = (g) => ({ x0: g.x + s.OTISAK.x0, x1: g.x + s.OTISAK.x1, y0: g.y + s.OTISAK.y0, y1: g.y + s.OTISAK.y1 });
const preklop = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const cesta = t.tockeOd(t.STAZA.tijelo);
const putevi = u.putelji(u.PARCELE.map((p) => p.id)).map((p) => p.tocke);
const potok = t.tockeOd(t.POTOK);
// slika zgrade pri najvećem rastu (1.08): izmjereno u headless renderu ~[x-58, y-52, x+58, y+48] za 112×96
function slikaZgrade(p) {
  const { w, h } = u.velicinaSpritea(p.id, true);
  const uvuci = p.id === "tor" ? w * 1.08 * 0.32 : 8;
  return { l: p.x - (w * 1.08) / 2 + uvuci, r: p.x + (w * 1.08) / 2 - uvuci, t: p.y - h * 1.08 * 0.52 + 10, b: p.y + h * 1.08 * 0.4 };
}
function geometrija(grla) {
  for (const g of grla) {
    const b = box(g);
    assert.ok(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= u.SVIJET.w && b.y1 <= u.SVIJET.h, `${g.id} van karte`);
    for (const q of [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }, { x: g.x, y: g.y }]) {
      for (const p of u.PARCELE) assert.ok(!u.uRomu(q.x, q.y, p), `${g.id} u parceli ${p.id}`);
      assert.ok(!pip(q, cesta), `${g.id} na cesti`);
      for (const l of putevi) assert.ok(dLin(q, l) >= 5.9, `${g.id} na puteljku`);
      assert.ok(dLin(q, potok) >= 12.9, `${g.id} u potoku`);
    }
    for (const p of u.PARCELE) {
      const k = slikaZgrade(p);
      assert.ok(!(b.x1 > k.l && b.x0 < k.r && b.y1 > k.t && b.y0 - 5 < k.b), `${g.id} skriven iza slike ${p.id}`);
    }
  }
  for (let i = 0; i < grla.length; i++) for (let j = i + 1; j < grla.length; j++) assert.ok(!preklop(box(grla[i]), box(grla[j])), `${grla[i].id} preklapa ${grla[j].id}`);
}

async function renderCesta(stoka) {
  const js = ts.transpileModule(read("src/components/game/KaubaCesta.tsx"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const req = {};
  for (const m of [...js.matchAll(/require\("([^"]+)"\)/g)].map((x) => x[1])) if (m.startsWith("@/lib/")) req[m] = await jiti.import(m.replace("@/", "../src/") + ".ts");
  const jsx = (type, props) => (typeof type === "function" ? { type: type.name, props, out: type(props) } : { type, props });
  req["react"] = { memo: (f) => f };
  req["react/jsx-runtime"] = { jsx, jsxs: jsx, Fragment: "F" };
  req["@/components/game/KaubaObzor"] = { Raslina: "R", TRAGOVI: [] };
  // 0.9.176: sloj dvorišta/trga (zaseban memo sloj, ne crta grla)
  req["@/components/game/KaubaDvorista"] = { KaubaDvorista: "DV", KaubaGazeno: "GZ", KaubaTrg: "TRG", DvSimboli: "DS" };
  req["@/lib/utils"] = { cn: (...a) => a.filter((x) => typeof x === "string").join(" ") };
  const module = { exports: {} };
  runInNewContext(js, { module, exports: module.exports, require: (n) => { if (!(n in req)) throw new Error("stub " + n); return req[n]; } });
  const out = module.exports.KaubaCesta({ gradevine: PUNO, gradnje: [], pogled: null, staze: [], mirno: true, skok: null, stoka });
  const sve = (v) => (!v || typeof v !== "object" ? [] : Array.isArray(v) ? v.flatMap(sve) : [v, ...sve(v.out), ...sve(v.props?.children)]);
  return sve(out);
}
const brojevi = (d) => [...String(d).matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

test("12: konj ima glavu (vrat, glava s njuškom, dva uha, griva) — vidljivo iznad i ispred tijela", async () => {
  const [konj] = s.stokaNaKarti(LV3, 1, 0).grla;
  const cv = await renderCesta([konj]);
  const g = cv.find((n) => n.props?.["data-zivotinja"] === konj.id);
  assert.ok(g, "grupa konja");
  const pod = (v) => (!v || typeof v !== "object" ? [] : Array.isArray(v) ? v.flatMap(pod) : [v, ...pod(v.out), ...pod(v.props?.children)]);
  const djeca = pod(g.props.children).filter((n) => n.type === "path" || n.type === "ellipse" || n.type === "circle");
  const pathovi = djeca.filter((n) => n.type === "path").map((n) => ({ d: n.props.d, xy: brojevi(n.props.d) }));
  const xs = (p) => p.xy.filter((_, i) => i % 2 === 0);
  const ys = (p) => p.xy.filter((_, i) => i % 2 === 1);
  // glava: zatvoreni oblik koji ide do x ≥ 11.5 (njuška) i iznad y ≤ -15 (čelo)
  const glava = pathovi.find((p) => /Z$/.test(p.d.trim()) && Math.max(...xs(p)) >= 11.5 && Math.min(...ys(p)) <= -15);
  assert.ok(glava, "oblik glave s njuškom");
  // vrat spaja tijelo (y≈-9) s glavom (y≈-14)
  assert.ok(pathovi.some((p) => /Z$/.test(p.d.trim()) && Math.min(...ys(p)) <= -14 && Math.max(...ys(p)) >= -8 && Math.min(...xs(p)) >= 3), "vrat");
  // dva uha iznad glave
  const usi = pathovi.filter((p) => /Z$/.test(p.d.trim()) && p.xy.length === 6 && Math.min(...ys(p)) <= -17);
  assert.equal(usi.length, 2, "dva uha");
  // griva (crta, ne ispuna) uz vrat; rep na suprotnoj strani
  assert.ok(pathovi.some((p) => !/Z$/.test(p.d.trim()) && Math.min(...xs(p)) >= 3 && Math.min(...ys(p)) <= -14), "griva");
  assert.ok(pathovi.some((p) => !/Z$/.test(p.d.trim()) && Math.max(...xs(p)) <= -6), "rep");
  // oko i nozdrva
  assert.ok(djeca.some((n) => n.type === "circle" && Number(n.props.cx) > 7));
  assert.ok(djeca.some((n) => n.type === "ellipse" && Number(n.props.cx) > 10));
  // stara sličica (bez glave) je nestala
  assert.ok(!read("src/components/game/KaubaCesta.tsx").includes("M4.6 -2.6 L7.4 -6.4 L8 -4.6 L5.8 -1.4 Z"));
  // sličica je veća nego prije (16 px), stane u otisak po širini, glava smije viriti ≤ 6 px iznad
  assert.ok(s.OTISAK.x1 - s.OTISAK.x0 >= 20);
  const sviX = pathovi.flatMap(xs);
  assert.ok(Math.max(...sviX) <= s.OTISAK.x1 + 3 && Math.min(...sviX) >= s.OTISAK.x0 - 1);
  assert.ok(Math.min(...pathovi.flatMap(ys)) >= s.OTISAK.y0 - 7);
});

test("13: konji (i goveda) gledaju lijevo i desno ~50/50, stalno po ID-u; crtež zrcali samo lijeve", async () => {
  const r = s.stokaNaKarti(PUNO, 90, 48).grla;
  const konji = r.filter((g) => g.vrsta === "konj");
  const lijevo = konji.filter((g) => g.smjer === -1).length;
  assert.ok(lijevo >= 36 && lijevo <= 54, `lijevo ${lijevo}/90`);
  assert.ok(konji.every((g) => g.smjer === 1 || g.smjer === -1));
  // stalno: isti ID → isti smjer bez obzira na broj grla i razine
  const a = new Map(s.stokaNaKarti({}, 12, 5).grla.map((g) => [g.id, g.smjer]));
  for (const g of r) if (a.has(g.id)) assert.equal(a.get(g.id), g.smjer, g.id);
  assert.equal(s.smjerGrla("konj-7"), s.smjerGrla("konj-7"));
  // malo stado (14) nije jednosmjerno
  const mala = s.stokaNaKarti(LV3, 14, 12).grla;
  for (const v of ["konj", "govedo"]) {
    const l = mala.filter((g) => g.vrsta === v);
    assert.ok(l.some((g) => g.smjer === 1) && l.some((g) => g.smjer === -1), `${v} miješano`);
  }
  const cv = await renderCesta(mala);
  for (const g of mala) {
    const n = cv.find((x) => x.props?.["data-zivotinja"] === g.id);
    assert.equal(n.props["data-smjer"], g.smjer < 0 ? "l" : "d");
    assert.equal(n.props.transform.includes("scale(-1 1)"), g.smjer < 0, g.id);
  }
  // crta se po dubini (y), pa glava bližeg konja prekriva onoga iza
  const red = cv.filter((x) => typeof x.props?.["data-zivotinja"] === "string").map((x) => mala.find((g) => g.id === x.props["data-zivotinja"]).y);
  assert.deepEqual(red, [...red].sort((p, q) => p - q));
});

test("11: konji na pašnjaku ranča/farme (0.9.175: raspoređeni po cijelom ranču i farmi, v. zivotinje-175); broj 1:1; ne na zgradama, cestama, puteljcima ni vodi", () => {
  const ob = o.oborPoligon();
  // 0.9.175 namjerno mijenja pravilo: konji više nisu zbijeni u trokut staja–ispust–farma,
  // nego u skupinama po cijelom ranču i farmi (provjera rasporeda je u zivotinje-175.test.mjs).
  const sve = s.stokaNaKarti(PUNO, 90, 48).grla;
  const konji = sve.filter((g) => g.vrsta === "konj");
  assert.equal(konji.length, 90);
  for (const g of konji) assert.ok(!pip(g, ob) && dPoly(g, ob) > 6, `${g.id} u oboru`);
  geometrija(sve);
  // 1:1 i stabilno (kupnja dodaje na kraj, prodaja miče zadnjeg; razine ne pomiču konje)
  for (const n of [0, 1, 7, 33, 90]) assert.equal(s.stokaNaKarti(PUNO, n, 0).grla.length, n);
  const a = s.stokaNaKarti(PUNO, 10, 0).grla, b = s.stokaNaKarti({ staja: 1 }, 11, 0).grla;
  for (const g of a) { const h = b.find((x) => x.id === g.id); assert.equal(`${h.x},${h.y}`, `${g.x},${g.y}`); }
});

test("14: ograda oko tora (obor) i goveda raspoređena unutra: razbacano, bez preklapanja, miješan smjer", () => {
  const tor = P("tor");
  const ob = o.oborPoligon();
  assert.ok(ob.length >= 8);
  // stražarnica tora stoji u stražnjem kutu obora
  assert.ok(pip({ x: tor.x, y: tor.y + 4 }, ob) || dPoly({ x: tor.x, y: tor.y }, ob) < 14, "tor uz/u oboru");
  const og = s.ogradaTora();
  assert.ok(og.stupovi.length >= 30, `stupova ${og.stupovi.length}`);
  assert.ok(og.letve.length >= og.stupovi.length - 6);
  for (const p of og.stupovi) {
    assert.ok(dPoly(p, ob) < 1, "stup na rubu obora");
    for (const q of u.PARCELE) assert.ok(!u.uRomu(p.x, p.y, q), `stup u parceli ${q.id}`);
    for (const l of putevi) assert.ok(dLin(p, l) >= 8.9, "stup na puteljku");
    assert.ok(!pip(p, cesta));
  }
  for (const [a, b] of og.letve) assert.ok(Math.hypot(b.x - a.x, b.y - a.y) < 18, "letva samo između susjednih stupova");
  // obor ne dira tuđe zgrade (slike)
  for (const p of u.PARCELE) {
    if (p.id === "tor") continue;
    const k = slikaZgrade(p);
    for (const q of ob) assert.ok(!(q.x > k.l && q.x < k.r && q.y > k.t && q.y < k.b), `obor u ${p.id}`);
  }
  // puni tor (48) – sva goveda u oboru, ≥ 7 px od ograde, bez preklapanja
  const sve = s.stokaNaKarti(PUNO, 90, 48).grla;
  const gov = sve.filter((g) => g.vrsta === "govedo");
  assert.equal(gov.length, 48);
  for (const g of gov) {
    const b = box(g);
    for (const q of [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }]) {
      assert.ok(pip(q, ob), `${g.id} van obora`);
      assert.ok(dPoly({ x: q.x, y: q.y }, ob) === 0 && Math.min(...ob.map((a, i) => dSeg(q, a, ob[(i + 1) % ob.length]))) >= 6.9, `${g.id} uz ogradu`);
    }
  }
  geometrija(sve);
  const l = gov.filter((g) => g.smjer === -1).length;
  assert.ok(l >= 14 && l <= 34, `goveda lijevo ${l}/48`);
  // razbacano: 12 goveda zauzima širok dio obora (ne zbijeni blok)
  const g12 = s.stokaNaKarti(LV3, 0, 12).grla;
  const xs = g12.map((g) => g.x), ys = g12.map((g) => g.y);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= o.OBOR.a * 0.8, `širina ${Math.max(...xs) - Math.min(...xs)}`);
  assert.ok(Math.max(...ys) - Math.min(...ys) >= 40);
  // trzaj: nisu svi na istoj rešetki (x mod korak različit)
  assert.ok(new Set(gov.map((g) => (g.x * 10) % 115)).size > 10);
  // ukrasi (stabla/kaktusi/grmlje) se ne crtaju u oboru; mali PLOT uz tor zamijenjen ogradom
  const obz = read("src/components/game/KaubaObzor.tsx");
  assert.match(obz, /izvanObora/);
  for (const k of ["OBZOR.kaktusi", "OBZOR.grmlje", "OBZOR.stabla"]) assert.match(obz.slice(obz.indexOf(k), obz.indexOf(k) + 140), /izvanObora/, k);
  assert.ok(o.uOboru(tor.x, tor.y + 80) && !o.uOboru(P("staja").x, P("staja").y));
  assert.ok(!read("src/components/game/KaubaCesta.tsx").includes("PLOT.stupovi.map"));
  const kp = read("src/lib/game/kartaPogled.ts");
  assert.match(kp, /const ids = \["farma", "staja", "lov"\]/);
});

test("20: karavana gleda ULIJEVO (zadano), smjer prati kretanje; prikaz putovanja ide zdesna nalijevo", () => {
  const js = ts.transpileModule(read("src/components/game/KaravanaKola.tsx"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  runInNewContext(js, { module, exports: module.exports, require: (n) => (n === "react/jsx-runtime" ? { jsx, jsxs: jsx } : {}) });
  const el = module.exports.KaravanaKola({});
  const kids = [el.props.children].flat(3);
  const g = kids.find((k) => k?.type === "g" && k.props.className === "karavana-kola-lijevo");
  assert.ok(g, "zrcalna grupa");
  assert.equal(g.props.transform, "translate(96 0) scale(-1 1)");
  // konj (tijelo 70..88 u izvornim koordinatama) nakon zrcaljenja: x' = 96 - x → lijevo od kola (kola 18..64 → 32..78)
  const flat = (n) => (!n || typeof n !== "object" ? [] : Array.isArray(n) ? n.flatMap(flat) : [n, ...flat(n.props?.children)]);
  const poly = flat(g).filter((n) => n.type === "polygon").map((n) => n.props.points.split(" ").map((p) => 96 - Number(p.split(",")[0])));
  const konj = poly[0], kola = poly.find((p) => Math.max(...p) - Math.min(...p) > 40);
  assert.ok(Math.max(...konj) < Math.min(...kola), "konj je lijevo od kola");
  assert.equal(el.props["data-smjer-slike"], "l");
  // karta: smjer iz kretanja (dx), udesno se zrcali CSS-om; početni smjer iz tangente rute
  const h = read("src/components/game/KaubaHodaci.tsx");
  assert.match(h, /sim\.tip\[i\] === 1/);
  assert.match(h, /n\.dataset\.smjer = "d"/);
  assert.match(h, /n\.dataset\.smjer = "l"/);
  assert.match(h, /data-smjer=\{dalje\.x > start\.x \+ 0\.01 \? "d" : "l"\}/);
  const css = read("src/styles.css");
  assert.match(css, /\.izo-kola-agent\[data-smjer="d"\] \.izo-kola-svg \{ transform: scaleX\(-1\); \}/);
  // karavana (Tržnica): kola idu od Tabora (desno) prema cilju (lijevo), pa gledaju naprijed
  const k = read("src/components/game/KaravanaIgra.tsx");
  assert.match(k, /left: `\$\{100 - pct\}%`/);
  assert.match(k, /<span>\{dest\}<\/span>\s*<span>\{od\}<\/span>/);
  assert.ok(!/style=\{\{ left: `\$\{pct\}%` \}\}/.test(k));
});

test("21: kola na karti voze sporije (≤ 11 px/s, prije 22) i glatko; reduced-motion ih zaustavlja", async () => {
  const h = read("src/components/game/KaubaHodaci.tsx");
  const m = h.match(/const BRZINA_KOLA = (\d+(?:\.\d+)?);/);
  assert.ok(m);
  const v = Number(m[1]);
  assert.ok(v > 0 && v <= 11, `brzina ${v}`);
  // 0.9.175: kola imaju vlastitu rutu (cijela cesta), brzina i dalje BRZINA_KOLA
  assert.match(h, /brzina: BRZINA_KOLA/);
  assert.match(h, /if \(pauza \|\| mirno \|\| rute\.length === 0\) return;/, "reduced-motion: bez petlje");
  // stvarni AgentSim: 10 s vožnje ravnom rutom = v·10 px, korak po tiku ≤ v/10 + ε (glatko, interpolirano)
  const a = await jiti.import("../src/lib/game/agentiSim.ts");
  const r = a.spljostiRutu([{ x: 0, y: 0 }, { x: 4000, y: 0 }]);
  const sim = new a.AgentSim();
  sim.postavi([r], [{ ruta: 0, brzina: v, faza: 0, tip: 1 }]);
  let tt = 0, maxKorak = 0, pret = 0;
  sim.frame(tt);
  for (let i = 0; i < 600; i++) { tt += 1000 / 60; sim.frame(tt); maxKorak = Math.max(maxKorak, Math.abs(sim.ix[0] - pret)); pret = sim.ix[0]; }
  assert.ok(Math.abs(sim.ix[0] - v * 10) < v * 0.3, `put ${sim.ix[0]}`);
  assert.ok(maxKorak <= v / 60 + 0.5, `korak po kadru ${maxKorak}`);
  const css = read("src/styles.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.ziva-izo \.izo-kola-agent \.izo-kola-svg \{ transition: none; \} \}/);
});

test("stres: 90 konja + 48 goveda — svi nacrtani, bez preklapanja; mreža se računa jednom i brzo", async () => {
  const t0 = performance.now();
  const r = s.stokaNaKarti(PUNO, 90, 48);
  const t1 = performance.now();
  s.stokaNaKarti(PUNO, 90, 48);
  const t2 = performance.now();
  assert.deepEqual(r.nema, { konj: 0, govedo: 0 });
  assert.equal(r.grla.length, 138);
  assert.ok(t2 - t1 < 30, `ponovni poziv ${(t2 - t1).toFixed(1)} ms`);
  assert.ok(t1 - t0 < 3000, `prvi poziv ${(t1 - t0).toFixed(0)} ms`);
  assert.equal(90, 6 * tun.POKRICE.staja + 6 * tun.POKRICE.korali + 6 * tun.POKRICE.staza);
  const cv = await renderCesta(r.grla);
  const z = cv.filter((n) => typeof n.props?.className === "string" && n.props.className.includes("izo-zivotinja "));
  assert.equal(z.filter((n) => n.props.className.includes("is-konj")).length, 90);
  assert.equal(z.filter((n) => n.props.className.includes("is-govedo")).length, 48);
  // i preko kapaciteta (bez zgrada) sve ostaje vidljivo
  const v = s.stokaNaKarti({}, 300, 200);
  assert.equal(v.grla.length, 500);
});
