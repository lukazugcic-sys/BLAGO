// 0.9.175 — konji po cijelom ranču i farmi, karavana cijelom cestom, heroji uvijek na karti,
// potok do južnog ruba, kauboji razmjerni konjima i jahači na konju.
// Izvršava stvarni stokaKarta.ts / kartaPogled.ts / teren.ts / agentiSim.ts (jiti); komponente se čitaju kao izvor.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const s = await jiti.import("../src/lib/game/stokaKarta.ts");
const o = await jiti.import("../src/lib/game/obor.ts");
const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
const t = await jiti.import("../src/lib/game/teren.ts");
const kp = await jiti.import("../src/lib/game/kartaPogled.ts");
const a = await jiti.import("../src/lib/game/agentiSim.ts");
const lj = await jiti.import("../src/lib/game/ljudi.ts");
const read = (p) => readFileSync(ROOT + p, "utf8");

const PUNO = { staja: 6, korali: 6, staza: 6, tor: 6 };
const P = (id) => u.PARCELE.find((p) => p.id === id);
const pip = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k); };
const dLin = (p, l) => { let d = Infinity; for (let i = 1; i < l.length; i++) d = Math.min(d, dSeg(p, l[i - 1], l[i])); return d; };
const dPoly = (p, poly) => (pip(p, poly) ? 0 : Math.min(...poly.map((a, i) => dSeg(p, a, poly[(i + 1) % poly.length]))));
const box = (g) => ({ x0: g.x + s.OTISAK.x0, x1: g.x + s.OTISAK.x1, y0: g.y + s.OTISAK.y0, y1: g.y + s.OTISAK.y1 });
const preklop = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const cesta = t.tockeOd(t.STAZA.tijelo);
const trag = t.tockeOd(t.STAZA.trag);
const putevi = u.putelji(u.PARCELE.map((p) => p.id)).map((p) => p.tocke);
const potok = t.tockeOd(t.POTOK);
const RANC = t.NASELJA.find((n) => n.id === "ranc").ids;
const FARMA = t.NASELJA.find((n) => n.id === "farma").ids;
/** naselje najbliže zgrade */
const naselje = (g) => { let naj = Infinity, id = ""; for (const p of u.PARCELE) { const d = Math.hypot(p.x - g.x, (p.y - g.y) * 1.4); if (d < naj) { naj = d; id = p.id; } } return RANC.includes(id) ? "ranc" : FARMA.includes(id) ? "farma" : "drugo"; };

function zabranjeno(g) {
  const b = box(g);
  const ob = o.oborPoligon();
  for (const q of [{ x: b.x0, y: b.y0 }, { x: b.x1, y: b.y0 }, { x: b.x0, y: b.y1 }, { x: b.x1, y: b.y1 }, { x: g.x, y: g.y }]) {
    for (const p of u.PARCELE) if (u.uRomu(q.x, q.y, p)) return `parcela ${p.id}`;
    if (pip(q, cesta)) return "cesta";
    for (const l of putevi) if (dLin(q, l) < 5.9) return "puteljak";
    if (dLin(q, potok) < 12.9) return "potok";
    if (g.vrsta === "konj" && (pip(q, ob) || dPoly(q, ob) < 6)) return "obor";
  }
  for (const k of s.kutijeUkrasa()) if (b.x1 > k.l && b.x0 < k.r && b.y1 > k.t && b.y0 < k.b) return "ukras/stablo";
  return null;
}

test("konji: malo stado (20) razmješteno po ranču I farmi u skupinama 2–5, razmaknuto, ne u redu", () => {
  const k20 = s.stokaNaKarti({ staja: 3, korali: 3, farma: 3 }, 20, 0).grla;
  assert.equal(k20.length, 20);
  const sk = s.skupine();
  assert.ok(sk.length >= 12, `skupina ${sk.length}`);
  // svaki konj pripada nekoj skupini (prvih 20 su po dva iz 10 skupina)
  const uSk = k20.map((g) => sk.findIndex((q) => q.mjesta.some((m) => m.x === g.x && m.y === g.y)));
  assert.ok(uSk.every((i) => i >= 0));
  const brojPo = new Map();
  for (const i of uSk) brojPo.set(i, (brojPo.get(i) ?? 0) + 1);
  assert.ok(brojPo.size >= 6, `samo ${brojPo.size} skupina`);
  for (const n of brojPo.values()) assert.ok(n >= 2 && n <= 5, `skupina od ${n}`);
  // pokriva oba naselja i širinu karte (ne jedan trokut)
  const nas = new Set(k20.map(naselje));
  assert.ok(nas.has("ranc") && nas.has("farma"), [...nas].join(","));
  assert.ok(k20.every((g) => naselje(g) !== "drugo"), "konj izvan ranča/farme");
  const xs = k20.map((g) => g.x), ys = k20.map((g) => g.y);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 500, `širina ${Math.max(...xs) - Math.min(...xs)}`);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 200);
  // središta skupina međusobno razmaknuta
  for (let i = 0; i < sk.length; i++) for (let j = i + 1; j < sk.length; j++) assert.ok(Math.hypot(sk[i].x - sk[j].x, sk[i].y - sk[j].y) >= 60);
  // unutar skupine razmak ≥ 22, sve skupine od ≥3 nisu na jednom pravcu
  for (const g of sk) {
    for (let i = 0; i < g.mjesta.length; i++) for (let j = i + 1; j < g.mjesta.length; j++) assert.ok(Math.hypot(g.mjesta[i].x - g.mjesta[j].x, g.mjesta[i].y - g.mjesta[j].y) >= 21.9);
    if (g.mjesta.length >= 3) {
      const [p, q, r] = g.mjesta;
      const pov = Math.abs((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)) / 2;
      const ravno = g.mjesta.every((m) => Math.abs(m.y - p.y) < 1) || g.mjesta.every((m) => Math.abs(m.x - p.x) < 1);
      assert.ok(pov > 20 || !ravno, "skupina u redu");
    }
    for (const m of g.mjesta) assert.ok(Math.hypot(m.x - g.x, m.y - g.y) <= 60, "mjesto daleko od skupine");
  }
});

test("konji: 90 stane, 1:1, stalno po id-u, bez preklapanja, nitko na zabranjenom (zgrade, ceste, puteljci, voda, obor, stabla)", () => {
  const sve = s.stokaNaKarti(PUNO, 90, 48).grla;
  const konji = sve.filter((g) => g.vrsta === "konj");
  assert.equal(konji.length, 90);
  assert.deepEqual(s.stokaNaKarti(PUNO, 90, 48).nema, { konj: 0, govedo: 0 });
  for (const g of sve) assert.equal(zabranjeno(g), null, g.id);
  for (let i = 0; i < sve.length; i++) for (let j = i + 1; j < sve.length; j++) assert.ok(!preklop(box(sve[i]), box(sve[j])), `${sve[i].id}×${sve[j].id}`);
  for (let i = 0; i < konji.length; i++) for (let j = i + 1; j < konji.length; j++) assert.ok(Math.hypot(konji[i].x - konji[j].x, konji[i].y - konji[j].y) >= 19, "premalen razmak");
  assert.ok(konji.every((g) => naselje(g) !== "drugo"), "90 konja ostaje na ranču/farmi");
  const l = konji.filter((g) => g.smjer === -1).length;
  assert.ok(l >= 30 && l <= 60, `lijevo ${l}`);
  // isti id = isto mjesto bez obzira na broj i razine; prvih 20 od 90 = 20 malog stada
  const m = new Map(s.stokaNaKarti({}, 20, 0).grla.map((g) => [g.id, `${g.x},${g.y}`]));
  for (const g of konji.slice(0, 20)) assert.equal(m.get(g.id), `${g.x},${g.y}`);
  // nema konja iza stabla/kaktusa iz obzora (krošnja)
  assert.ok(s.kutijeUkrasa().length > 60);
});

test("karavana: ruta je CIJELA glavna cesta (rub → naselje → drugi rub), kotači na cesti, smjer prati kretanje", () => {
  const put = kp.putKaravane();
  const rub = (p) => Math.min(p.x, p.y, u.SVIJET.w - p.x, u.SVIJET.h - p.y);
  assert.ok(rub(put[0]) <= 17 && rub(put[put.length - 1]) <= 17, "počinje i završava na rubu karte");
  assert.ok(Math.hypot(put[0].x - put.at(-1).x, put[0].y - put.at(-1).y) > 1500, "s kraja na kraj karte");
  // sve točke osi ceste koje su na karti su na ruti (ništa nije odrezano)
  const unutra = trag.filter((p) => p.x >= 16 && p.y >= 16 && p.x <= u.SVIJET.w - 16 && p.y <= u.SVIJET.h - 16);
  for (const p of unutra) assert.ok(put.some((q) => q.x === p.x && q.y === p.y), `nedostaje ${p.x},${p.y}`);
  const L = put.slice(1).reduce((d, p, i) => d + Math.hypot(p.x - put[i].x, p.y - put[i].y), 0);
  const ulica = kp.stazeKretanja([])[0];
  assert.ok(L > ulica.duzina * 1.4, `ruta ${L.toFixed(0)} vs stara ulica ${ulica.duzina.toFixed(0)}`);
  const r = kp.rutaKaravane();
  assert.ok(Math.abs(r.duzina - 2 * L) < 1, "tamo-natrag = 2× cijela cesta");
  // stvarni AgentSim, brzina iz KaubaHodaci: položaj uvijek na cesti, smjer slike = smjer kretanja
  const h = read("src/components/game/KaubaHodaci.tsx");
  const v = Number(h.match(/const BRZINA_KOLA = (\d+(?:\.\d+)?);/)[1]);
  assert.ok(v >= 8 && v <= 11, `brzina ${v}`);
  const jedan = L / v;
  assert.ok(jedan >= 120 && jedan <= 240, `jedan prolaz ${jedan.toFixed(0)} s`);
  const sim = new a.AgentSim();
  sim.postavi([a.spljostiRutu(r.tocke)], [0, 1].map((k) => ({ ruta: 0, brzina: v, faza: kp.fazaKola(k, 2), tip: 1 })));
  let tt = 0, lijevo = 0, desno = 0, maks = 0;
  sim.frame(0);
  const smjer = [0, 0];
  for (let i = 0; i < 60 * 60 * 6; i++) {
    tt += 1000 / 60;
    sim.frame(tt);
    for (let k = 0; k < 2; k++) {
      const p = { x: sim.ix[k], y: sim.iy[k] };
      if (i % 30 === 0) assert.ok(pip(p, cesta) || dLin(p, trag) < 2, `kola ${k} van ceste @${p.x.toFixed(0)},${p.y.toFixed(0)}`);
      const dx = sim.x[k] - sim.prevX[k];
      if (Math.abs(dx) > 0.15) smjer[k] = dx > 0 ? 1 : -1;
      maks = Math.max(maks, Math.hypot(sim.x[k] - sim.prevX[k], sim.y[k] - sim.prevY[k]));
    }
    if (smjer[0] < 0) lijevo++; else if (smjer[0] > 0) desno++;
  }
  assert.ok(lijevo > 1000 && desno > 1000, `kola idu i lijevo (${lijevo}) i desno (${desno})`);
  assert.ok(maks <= v / 10 + 0.01, "bez skoka");
  // razmaknuta: druga kola su pola rute dalje
  assert.ok(Math.abs(kp.fazaKola(1, 2) - kp.fazaKola(0, 2) - 0.5) < 1e-9);
  // komponenta: kola na svojoj ruti, smjer iz dx (zadano lijevo, udesno se zrcali), reduced-motion: bez petlje
  assert.match(h, /flat\.push\(spljostiRutu\(RUTA_KOLA\.tocke\)\)/);
  assert.match(h, /ruta: kolaRi, brzina: BRZINA_KOLA, faza: \(fazaKola\(kolaK\+\+, kolaN\) \+ kolaPomak\) % 1/);
  // faza po satu (od prvog pokretanja), pa ponovno pokretanje petlje (zum, pogled) ne vraća kola na početak
  assert.match(h, /const kolaPomak = \(\(\(performance\.now\(\) - kolaT0\) \/ 1000\) \* BRZINA_KOLA\) \/ \(RUTA_KOLA\.duzina \|\| 1\);/);
  assert.match(h, /const start = tockaNaPutu\(RUTA_KOLA\.tocke, u\);/);
  assert.match(h, /if \(pauza \|\| mirno \|\| rute\.length === 0\) return;/);
});

test("heroji: svaki heroj (★) u kaubi je uvijek na karti; obični popune do granice; bez duplikata; bez dodatne oznake", () => {
  const obicni = Array.from({ length: 10 }, (_, i) => ({ id: `obican-${i}` }));
  for (const n of [0, 1, 5, 8]) {
    const heroji = lj.GLAVNI_ID.slice(0, n).map((id) => ({ id }));
    const tu = lj.poredajGlavne([...obicni, ...heroji, ...heroji.slice(0, 1)]);
    for (const granica of [0, 2, 4]) {
      const h = kp.odaberiHodace(tu, granica);
      assert.equal(h.filter((p) => lj.jeGlavni(p.id)).length, n, `${n} heroja, granica ${granica}`);
      assert.equal(h.length, Math.max(n, granica));
      assert.equal(new Set(h.map((p) => p.id)).size, h.length, "duplikat");
    }
  }
  assert.equal(lj.GLAVNI_ID.length, 8);
  // AgentSim mora primiti 8 heroja + 2 kola + psa
  assert.ok(a.AGENT_CAP >= 8 + 2 + 1, `AGENT_CAP ${a.AGENT_CAP}`);
  const h = read("src/components/game/KaubaHodaci.tsx");
  assert.match(h, /hodaci: odaberiHodace\(tu, brojAgenata\(stanovnici, 0\)\.hodaci\)/);
  assert.ok(!h.includes("★") && !/zvjezd|heroj-znak|is-heroj/i.test(h), "bez zvjezdice na karti");
});

test("potok: nastavlja uz cisternu i rudnik i izlazi s karte na jugu; ne kroz parcele; mostić na svakom prijelazu; ukrasi ne u vodi", () => {
  const cis = P("cisterna"), rud = P("rudnik");
  assert.ok(dLin(cis, potok) < 90, `cisterna ${dLin(cis, potok).toFixed(0)}`);
  assert.ok(dLin(rud, potok) < 110, `rudnik ${dLin(rud, potok).toFixed(0)}`);
  assert.ok(potok.at(-1).y > u.SVIJET.h, "završava južno od karte");
  assert.ok(potok.length >= 40);
  for (const q of potok) for (const p of u.PARCELE) assert.ok(!u.uRomu(q.x, q.y, p), `potok u parceli ${p.id}`);
  // novi dio (od mlina dalje) ne prolazi ispod slika cisterne, rudnika ni kamenoloma
  const nov = potok.slice(19);
  for (const id of ["cisterna", "rudnik", "kamenolom", "banka"]) {
    const p = P(id), { w, h } = u.velicinaSpritea(id, true);
    for (const q of nov) assert.ok(!(Math.abs(q.x - p.x) < w * 0.5 - 8 && q.y > p.y - h * 0.5 && q.y < p.y + h * 0.4), `potok kroz sliku ${id}`);
  }
  for (const k of t.KAMENOLOM_KAMENJE) assert.ok(dLin(k, potok) > 10, "potok kroz kamenje kamenoloma");
  // mostić gdje god puteljak ili cesta siječe potok
  const presjeci = [];
  const sijece = (a1, b1, c, d) => { const r = (b1.x - a1.x) * (d.y - c.y) - (b1.y - a1.y) * (d.x - c.x); if (!r) return null; const s1 = ((c.x - a1.x) * (d.y - c.y) - (c.y - a1.y) * (d.x - c.x)) / r, s2 = ((c.x - a1.x) * (b1.y - a1.y) - (c.y - a1.y) * (b1.x - a1.x)) / r; return s1 >= 0 && s1 <= 1 && s2 >= 0 && s2 <= 1 ? { x: a1.x + (b1.x - a1.x) * s1, y: a1.y + (b1.y - a1.y) * s1 } : null; };
  for (const l of [...putevi, trag]) for (let i = 1; i < l.length; i++) for (let j = 1; j < potok.length; j++) { const x = sijece(l[i - 1], l[i], potok[j - 1], potok[j]); if (x) presjeci.push(x); }
  assert.ok(presjeci.length >= 2);
  for (const x of presjeci) assert.ok(t.MOSTOVI.some((m) => Math.hypot(m.x - x.x, m.y - x.y) < 25), `nema mosta @${x.x.toFixed(0)},${x.y.toFixed(0)}`);
  assert.match(read("src/components/game/KaubaCesta.tsx"), /MOSTOVI\.map/);
  // ukrasi (šipak, rekviziti) ne stoje u vodi; grla ne stoje u vodi (slobodnoZaGrlo koristi isti POTOK)
  for (const p of [...t.SIPAK, ...t.REKVIZITI]) assert.ok(t.doPotoka(p.x, p.y) >= 12, `ukras u vodi @${p.x},${p.y}`);
  for (const q of nov.filter((q) => q.y < u.SVIJET.h - 20)) assert.ok(!s.slobodnoZaGrlo(q.x, q.y), "grlo bi stalo u potok");
  // tekstura vode ostaje u korisničkim koordinatama (ne rasteže se s duljim potokom)
  assert.match(read("src/components/game/KaubaCesta.tsx"), /<pattern id="izo-voda-tk" width="64" height="36" patternUnits="userSpaceOnUse">/);
});

test("kauboji razmjerni konjima, klik-površina ≥ 32 px; jahači na konju i 1.5× brži; reduced-motion statično", () => {
  const css = read("src/styles.css");
  const sc = Number(css.match(/\.ziva-izo \{ --lik-sc: ([\d.]+); \}/)[1]);
  // sličica kauboja je 40×58 (avatar), konj s glavom ~20 visok (kopita y=0 … uši y≈-17, OTISAK y1=3)
  const lik = 58 * sc;
  const konj = 3 - -17;
  assert.ok(lik / konj >= 0.7 && lik / konj <= 0.9, `omjer ${(lik / konj).toFixed(2)}`);
  assert.match(css, /\.ziva-izo \.izo-setac \.izo-setac-hod \{ left: -4px; bottom: 4px; scale: var\(--lik-sc\); transform-origin: 50% 100%; \}/);
  const m = css.match(/\.ziva-izo \.izo-setac \{ width: (\d+)px; height: (\d+)px;/);
  assert.ok(+m[1] >= 32 && +m[2] >= 32, "klik-površina");
  assert.match(css, /\.ziva-izo \.izo-setac \.ziva-balon \{ scale: calc\(1 \/ var\(--lik-sc\)\);/, "balon ostaje čitljiv");
  // jahači: isto pravilo kao popis kauboja (tkoJaše), na konju istog crteža, smjer prati kretanje
  const h = read("src/components/game/KaubaHodaci.tsx");
  assert.match(h, /const jase = tkoJaše\(svi, gradevine, ostecenja, konjiDuznost\);/);
  assert.match(h, /data-jase=\{jase\.has\(p\.id\) \? "1" : undefined\}/);
  assert.match(h, /<KonjZnak \{\.\.\.bojaKonja\(`jahac-\$\{p\.id\}`\)\} \/>/);
  assert.match(h, /brzina: n\.dataset\.jase === "1" \? BRZINA_JAHACA : BRZINA_HODA/);
  assert.match(css, /\.ziva-izo \.izo-setac\[data-smjer="l"\] \.izo-jahac-konj \{ transform: scaleX\(-1\); \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.ziva-izo \.izo-setac \.izo-jahac-konj \{ transition: none; \} \}/);
  assert.equal(kp.BRZINA_JAHACA / kp.BRZINA_HODA, 1.5);
  // tkoJaše: staja + kapacitet; bez staje nitko ne jaše; šegrt nikad
  const ljudi = [{ id: "boro", posao: "Šerif", hub: "red", razina: 1, mane: [], buffovi: [] }, { id: "x", posao: "Šegrt", hub: "krov", razina: 1, mane: [], buffovi: [] }];
  assert.equal(lj.tkoJaše(ljudi, {}, {}, null).size, 0);
  const j = lj.tkoJaše(ljudi, { staja: 3 }, {}, null);
  assert.ok(j.has("boro") && !j.has("x"));
  // jahački konji ne mijenjaju stado: stokaNaKarti ovisi samo o konjiBroj
  assert.equal(s.stokaNaKarti({ staja: 3 }, 0, 0).grla.length, 0);
  // stvarni sim: jahač na istoj ruti prijeđe 1.5× više
  const r = a.spljostiRutu([{ x: 0, y: 0 }, { x: 4000, y: 0 }]);
  const sim = new a.AgentSim();
  sim.postavi([r], [{ ruta: 0, brzina: kp.BRZINA_HODA, faza: 0, tip: 0 }, { ruta: 0, brzina: kp.BRZINA_JAHACA, faza: 0, tip: 0 }]);
  sim.frame(0);
  for (let i = 1; i <= 100; i++) sim.frame(i * 100);
  assert.ok(Math.abs(sim.x[1] / sim.x[0] - 1.5) < 0.01);
});
