// 0.9.176 — plan korak 6: organske ceste/puteljci (19), dvorišta po zgradi (23 + t436u),
// trg salun–pekara–ordinacija (t437u), raslinje oko travara (t439u), imena zgrada na dodir (t442u),
// pješačke staze unutar naselja (t443u). Izvršava stvarne .ts module (jiti); komponente se čitaju kao izvor.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const kp = await j.import(ROOT + "src/lib/game/kartaPogled.ts");
const hc = await j.import(ROOT + "src/lib/game/hodCilj.ts");
const pj = await j.import(ROOT + "src/lib/game/pjesine.ts");
const dv = await j.import(ROOT + "src/lib/game/dvorista.ts");
const tr = await j.import(ROOT + "src/lib/game/trg.ts");
const pt = await j.import(ROOT + "src/lib/game/putTraka.ts");
const ob = await j.import(ROOT + "src/lib/game/obor.ts");
const sk = await j.import(ROOT + "src/lib/game/stokaKarta.ts");
const read = (p) => readFileSync(ROOT + p, "utf8");

const SVI = u.PARCELE.map((p) => p.id);
const P = (id) => u.PARCELE.find((p) => p.id === id);
const pip = (p, poly) => { let c = false; for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) { const a = poly[i], b = poly[k]; if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k); };
const dLin = (p, l) => { let d = Infinity; for (let i = 1; i < l.length; i++) d = Math.min(d, dSeg(p, l[i - 1], l[i])); return d; };
const dPoly = (p, poly) => (pip(p, poly) ? 0 : Math.min(...poly.map((a, i) => dSeg(p, a, poly[(i + 1) % poly.length]))));
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cesta = t.tockeOd(t.STAZA.tijelo);
const spurovi = u.putelji(SVI).filter((p) => !p.veza);
const veze = u.putelji(SVI).filter((p) => p.veza);
const staze = pj.svePjesine();
const D = dv.dvorista();

/** najdulji „ravni" dio linije: niz točaka koje sve leže unutar tol px od tetive */
function najduljiRavni(l, tol = 0.6) {
  let naj = 0;
  for (let i = 0; i < l.length; i++)
    for (let k = i + 2; k < l.length; k++) {
      if (!l.slice(i + 1, k).every((q) => dSeg(q, l[i], l[k]) <= tol)) break;
      naj = Math.max(naj, d(l[i], l[k]));
    }
  return naj;
}

// ---------- 19: organske ceste ----------
test("19: puteljci do zgrada i veze vijugaju — gusto uzorkovani, bez dugih ravnih dijelova, odstupaju od starih ravnih linija", () => {
  let vijuga = 0;
  for (const p of [...spurovi, ...veze]) {
    const L = hc.duljina(p.tocke);
    for (let i = 1; i < p.tocke.length; i++) assert.ok(d(p.tocke[i - 1], p.tocke[i]) <= 16, `${p.id}: segment ${d(p.tocke[i - 1], p.tocke[i]).toFixed(1)} px`);
    if (L > 70) {
      const r = najduljiRavni(p.tocke);
      assert.ok(r < Math.max(48, L * 0.5), `${p.id}: ravni dio ${r.toFixed(0)} px od ${L.toFixed(0)}`);
    }
    const dev = Math.max(...p.tocke.map((q) => dLin(q, p.kosti ?? p.tocke)));
    if (dev > 2) vijuga++;
    assert.equal(u.putSijeceRomb(p.tocke), null, `${p.id} siječe tuđu parcelu`);
  }
  assert.ok(vijuga >= (spurovi.length + veze.length) * 0.6, `vijuga samo ${vijuga}`);
});

test("19: traka puta mijenja širinu i mekih je rubova (sužava se na vratima, širi na spoju s cestom)", () => {
  const p = spurovi.find((s) => s.tocke.length >= 12 && hc.duljina(s.tocke) > 80);
  const sir = kp.sirinaPuta(3);
  const poly = t.tockeOd(pt.trakaPuta(p.tocke, sir, p.id, { vrata: true, spoj: true }));
  const n = poly.length / 2;
  const sirine = [];
  for (let i = 0; i < n; i++) sirine.push(d(poly[i], poly[poly.length - 1 - i]));
  assert.ok(Math.max(...sirine) - Math.min(...sirine) > sir * 0.3, "širina varira");
  assert.ok(sirine[0] < sirine[Math.floor(n / 2)] * 1.05, "uže na vratima");
  assert.ok(sirine[n - 1] > sir * 1.1, "širi na spoju s cestom");
  assert.deepEqual(t.tockeOd(pt.trakaPuta(p.tocke, sir, p.id, { vrata: true, spoj: true })), poly, "deterministično (cache/hash)");
  const css = read("src/styles.css");
  assert.match(css, /\.izo-put-traka-rub/);
  assert.match(read("src/components/game/KaubaCesta.tsx"), /izo-put-traka/);
});

test("19: kauboji hodaju po nacrtanim putevima: ruta = linija puteljka, unutar trake, od vrata do ceste; ulica nepromijenjena", () => {
  const sir = kp.sirinaPuta(3);
  for (const s of kp.stazeKretanja(SVI)) {
    if (s.id === "ulica") continue;
    const p = spurovi.find((q) => q.id === s.id);
    assert.ok(p, s.id);
    assert.deepEqual(hc.puteljakZgrade(s.id), p.tocke);
    const traka = t.tockeOd(pt.trakaPuta(p.tocke, sir, p.id, { vrata: true, spoj: true }));
    for (const q of s.tocke) assert.ok(dPoly(q, traka) <= 0.8 || dPoly(q, cesta) <= 0.5, `${s.id}: hod izvan trake ${JSON.stringify(q)}`);
    // kraj (rub ulice) ostaje isti kao prije vijuganja (poligon ceste je grub, do ~13 px)
    assert.ok(d(p.tocke.at(-1), p.kosti.at(-1)) < 0.01 && dPoly(p.tocke.at(-1), cesta) <= 14, `${s.id}: kraj puteljka nije na cesti`);
    assert.ok(Math.hypot(p.tocke[0].x - p.kosti[0].x, p.tocke[0].y - p.kosti[0].y) < 0.01, `${s.id}: početak = vrata`);
  }
  for (const q of kp.putKaravane()) assert.ok(dPoly(q, cesta) <= 1.5, "karavana ide glavnom cestom");
  for (const q of hc.osUlice()) assert.ok(dPoly(q, cesta) <= 1.5);
});

// ---------- t443u: pješačke staze ----------
test("t443u: svaka zgrada naselja dostupna svakoj drugoj pješačkim stazama, bez glavne ceste", () => {
  for (const n of t.NASELJA) {
    const ids = n.ids.filter((id) => P(id));
    const rod = new Map(ids.map((id) => [id, id]));
    const f = (x) => (rod.get(x) === x ? x : f(rod.get(x)));
    for (const s of staze.filter((s) => s.naselje === n.id)) {
      assert.ok(ids.includes(s.a) && ids.includes(s.b), `${s.id} izvan naselja ${n.id}`);
      // staza ne vodi glavnom cestom (dopušten dodir s rubom ceste samo kod samih vrata)
      for (const q of s.tocke) if (dPoly(q, cesta) === 0) assert.ok(Math.min(d(q, s.tocke[0]), d(q, s.tocke.at(-1))) <= 6, `${s.id} ide cestom`);
      rod.set(f(s.a), f(s.b));
    }
    assert.equal(new Set(ids.map(f)).size, 1, `${n.id}: nisu sve zgrade povezane`);
  }
});

test("t443u: staze su uže od puteljaka i ceste; spoj s glavnom cestom preko puteljaka zgrada", () => {
  assert.ok(pj.SIRINA_PJESINE < kp.sirinaPuta(1, true));
  assert.ok(pj.SIRINA_PJESINE < kp.sirinaPuta(1));
  const trag = t.tockeOd(t.STAZA.trag);
  const sirCeste = Math.min(...cesta.slice(0, cesta.length / 2).map((q) => dLin(q, trag))) * 2;
  assert.ok(pj.SIRINA_PJESINE * 4 < sirCeste, `cesta ${sirCeste}`);
  for (const s of staze) {
    assert.ok(d(s.tocke[0], pj.vrataZgrade(s.a)) < 0.5 && d(s.tocke.at(-1), pj.vrataZgrade(s.b)) < 0.5, `${s.id}: krajevi na vratima`);
    assert.ok(spurovi.some((p) => p.id === s.a) || veze.length, "vrata imaju puteljak do ceste");
  }
  const kc = read("src/components/game/KaubaCesta.tsx");
  assert.match(kc, /SIRINA_PJESINE/);
  assert.match(read("src/styles.css"), /is-pjesina/);
});

test("t443u: staze zaobilaze zgrade, tor, trg i vodu (vodu samo preko mosta)", () => {
  const mostovi = [...t.MOSTOVI, ...pj.mostoviPjesina()];
  for (const s of staze) {
    s.tocke.forEach((q, i) => {
      const odKraja = Math.min(d(q, s.tocke[0]), d(q, s.tocke.at(-1)));
      if (odKraja > 24) assert.equal(pj.preprekaPjesini(q), false, `${s.id}[${i}] na prepreci`);
      assert.equal(ob.uOboru(q.x, q.y, 0), false, `${s.id} kroz tor`);
      assert.equal(tr.uTrgu(q.x, q.y, 0), false, `${s.id} kroz trg`);
      if (t.doPotoka(q.x, q.y) < 6) assert.ok(Math.min(...mostovi.map((m) => d(m, q))) < 16, `${s.id} gazi potok bez mosta`);
    });
    for (const id of SVI) if (id !== s.a && id !== s.b) for (const q of s.tocke) assert.equal(u.uRomu(q.x, q.y, P(id)), false, `${s.id} kroz ${id}`);
  }
});

test("t443u: konji ne stoje na pješačkim stazama (zivotinje-175 pravila ostaju)", () => {
  for (const [k, g] of [[20, 10], [90, 48]]) {
    const r = sk.stokaNaKarti({ staja: 6, korali: 6, staza: 6, tor: 6 }, k, g);
    assert.deepEqual(r.nema, { konj: 0, govedo: 0 });
    for (const z of r.grla.filter((x) => x.vrsta === "konj")) for (const s of staze) assert.ok(dLin(z, s.tocke) >= 3, `${z.id} na stazi ${s.id}`);
  }
});

// ---------- pečeni podaci ----------
test("pečeni terenPodaci = svježi izračun (staze, mostovi, dvorišta); stabilno", () => {
  const svj = pj.izracunajPjesine();
  assert.deepEqual(JSON.parse(JSON.stringify(svj)), JSON.parse(JSON.stringify(staze)));
  const mo = pj.izracunajMostovePjesina(svj);
  assert.deepEqual(mo, pj.mostoviPjesina());
  const dvs = dv.izracunajDvorista({ pj: svj, mo });
  assert.deepEqual(JSON.parse(JSON.stringify(dvs)), JSON.parse(JSON.stringify(D)));
});

// ---------- 23 + t436u: dvorišta ----------
test("23/t436u: svaka zgrada ima tematsko dvorište; ukrasi deterministični i zrcaljeni", () => {
  const po = new Map();
  for (const x of D.ukrasi) po.set(x.zgrada, [...(po.get(x.zgrada) ?? []), x]);
  for (const id of SVI) {
    const l = po.get(id) ?? [];
    assert.ok(l.length >= 4, `${id}: samo ${l.length} ukrasa`);
    assert.ok(new Set(l.map((x) => x.tip)).size >= 2, `${id}: jednolično`);
  }
  assert.equal(new Set(D.ukrasi.map((x) => x.id)).size, D.ukrasi.length, "jedinstveni id");
  assert.ok(D.ukrasi.some((x) => x.zrcalo) && D.ukrasi.some((x) => !x.zrcalo));
  assert.ok(D.ukrasi.length <= 420, `previše elemenata ${D.ukrasi.length}`);
  for (const x of D.ukrasi) assert.ok(dv.DV_R[x.tip] > 0, x.tip);
});

test("23/t436u: ukrasi ne na cestama, puteljcima, stazama, vodi, parcelama, imenima, toru ni trgu", () => {
  const putevi = u.putelji(SVI).map((p) => p.tocke);
  for (const x of D.ukrasi) {
    const r = (dv.DV_R[x.tip] * x.sc) / dv.DV_MJERILO;
    const tag = `${x.id} (${x.tip})`;
    assert.ok(dPoly(x, cesta) > r, `${tag} na cesti`);
    for (const l of putevi) assert.ok(dLin(x, l) > r, `${tag} na puteljku`);
    for (const s of staze) assert.ok(dLin(x, s.tocke) > r, `${tag} na stazi`);
    assert.ok(t.doPotoka(x.x, x.y) > r, `${tag} u potoku`);
    for (const q of u.PARCELE) {
      assert.equal(u.uRomu(x.x, x.y, q), false, `${tag} na parceli ${q.id}`);
      const k = pj.kutijaSlike(q.id);
      assert.ok(!(x.x > k.l && x.x < k.r && x.y > k.t && x.y < k.b), `${tag} na slici ${q.id}`);
      const n = dv.kutijaImena(q.id);
      assert.ok(!(x.x + r > n.l && x.x - r < n.r && x.y + r * 0.6 > n.t && x.y - r * 0.6 < n.b), `${tag} na imenu ${q.id}`);
    }
    assert.equal(ob.uOboru(x.x, x.y, r), false, `${tag} u toru`);
    assert.equal(tr.uTrgu(x.x, x.y, r), false, `${tag} na trgu`);
    assert.equal(dv.slobodnoZaUkras(x.x, x.y, dv.DV_R[x.tip] * 0.5), true, tag);
  }
});

test("23/t436u: konji i ukrasi se ne preklapaju (zabrane u oba smjera)", () => {
  const r = sk.stokaNaKarti({ staja: 6, korali: 6, staza: 6, tor: 6 }, 90, 48);
  for (const z of r.grla) for (const x of D.ukrasi) assert.ok(d(z, x) > dv.DV_R[x.tip] * 0.8, `${z.id} na ${x.id}`);
  for (const x of D.ukrasi) assert.equal(sk.slobodnoZaGrlo(x.x, x.y), false, `${x.id} bi primio konja`);
});

test("23: dvorišta su statični memo sloj (jedan <use> po ukrasu, simboli jednom)", () => {
  const src = read("src/components/game/KaubaDvorista.tsx");
  assert.match(src, /memo\(/);
  assert.match(src, /<use/);
  assert.match(src, /<symbol/);
  const kc = read("src/components/game/KaubaCesta.tsx");
  for (const k of ["<KaubaDvorista", "<KaubaGazeno", "<KaubaTrg", "<DvSimboli"]) assert.ok(kc.includes(k), k);
});

// ---------- t437u: trg ----------
test("t437u: trg između saluna, pekare, ordinacije i ceste; bez preklapanja; fontana, klupe, fenjeri, cvijeće, drvo", () => {
  const T = tr.TRG;
  const tri = ["salun", "pekara", "ordinacija"].map(P);
  for (const p of tri) assert.ok(d(p, T) < 170, `${p.id} daleko ${d(p, T).toFixed(0)}`);
  assert.ok(dPoly(T, cesta) < 90, "uz cestu");
  for (const q of u.PARCELE) {
    const k = pj.kutijaSlike(q.id);
    assert.ok(k.r < T.x - T.rx || k.l > T.x + T.rx || k.b < T.y - T.ry || k.t > T.y + T.ry, `trg preklapa ${q.id}`);
    for (let a = 0; a < 24; a++) {
      const p = { x: T.x + Math.cos((a / 12) * Math.PI) * T.rx, y: T.y + Math.sin((a / 12) * Math.PI) * T.ry };
      assert.equal(u.uRomu(p.x, p.y, q), false, `rub trga u parceli ${q.id}`);
    }
  }
  for (let a = 0; a < 24; a++) {
    const p = { x: T.x + Math.cos((a / 12) * Math.PI) * T.rx, y: T.y + Math.sin((a / 12) * Math.PI) * T.ry };
    assert.ok(dPoly(p, cesta) > 0, "trg ne na cesti");
    for (const s of [...u.putelji(SVI), ...staze]) assert.ok(dLin(p, s.tocke) > 2, `${s.id} kroz trg`);
  }
  const broj = (tip) => tr.TRG_STVARI.filter((s) => s.tip === tip).length;
  assert.equal(broj("fontana"), 1);
  assert.ok(broj("klupa") >= 2 && broj("fenjer") >= 3 && broj("cvijece") >= 3 && broj("drvo") >= 1);
  for (const s of tr.TRG_STVARI) for (const q of u.PARCELE) assert.equal(u.uRomu(s.x, s.y, q), false, `${s.tip} na ${q.id}`);
  // stara ravna grana salun–pekara zamijenjena trgom
  assert.ok(!t.GRANE?.some?.((g) => g.id === "salun-pekara"));
});

// ---------- t439u: travar ----------
test("t439u: puno raslinja oko travara (≥ 40 biljaka) i više nego oko ijedne druge zgrade", () => {
  const biljke = (id) => D.ukrasi.filter((x) => x.zgrada === id && dv.BILJKE.has(x.tip));
  const tv = biljke("travar");
  assert.ok(tv.length >= 40, `travar ${tv.length}`);
  for (const x of tv) assert.ok(d(x, P("travar")) < 170, `${x.id} daleko`);
  for (const id of SVI) if (id !== "travar") assert.ok(biljke(id).length < tv.length, id);
});

// ---------- t442u: imena na dodir ----------
const ulica = read("src/components/game/KaubaZivaUlica.tsx");
const kuce = read("src/components/game/KaubaKuce.tsx");
test("t442u: ime zgrade skriveno po defaultu — ime/razina se crtaju samo za dodirnutu zgradu", () => {
  assert.match(ulica, /const \[natpisId, setNatpisId\] = useState<string \| null>\(null\)/);
  assert.match(ulica, /const dodirnuta = natpisId === z\.id;/);
  assert.match(ulica, /const pokazi = !!posao \|\| dodirnuta;/);
  assert.match(ulica, /\{dodirnuta \? \(\s*<span className="izo-red">[\s\S]*?izo-lv[\s\S]*?izo-ime/);
  // nema više stalno prikazanih imena
  assert.equal((ulica.match(/className="izo-ime"/g) ?? []).length, 1);
  assert.match(read("src/styles.css"), /\.izo-natpis\.is-tap\s*\{[^}]*animation/);
});

test("t442u: dodir pokaže točno tu zgradu, drugi dodir iste / dodir izvan / ~3 s sakrije; druga zgrada prebaci", () => {
  assert.match(ulica, /const NATPIS_MS = 3000;/);
  assert.match(ulica, /setTimeout\(\(\) => setNatpisId\(null\), NATPIS_MS\)/);
  assert.match(ulica, /addEventListener\("pointerdown", van, true\)/);
  assert.match(ulica, /closest\(".izo-kuca"\)\) return;\s*setNatpisId\(null\)/);
  assert.match(ulica, /if \(prekidac && natpisRef\.current === id\) \{\s*radnje\.current\.setNatpisId\(null\)/);
  assert.match(ulica, /radnje\.current\.setNatpisId\(id\);/);
  // običan dodir = prekidač; dugi pritisak uvijek pokaže (izbornik nepromijenjen)
  assert.match(kuce, /sad2\.odaberi\(id, true\);/);
  assert.match(kuce, /sadD\.odaberi\(id\);\s*sadD\.izbornik\(\{ id, x, y \}\);/);
});

test("t442u: oznake područja (Grad/Ranč/…) i broj sloja u Pogledu ostaju", () => {
  const kc = read("src/components/game/KaubaCesta.tsx") + read("src/components/game/KaubaZivaUlica.tsx");
  assert.match(kc, /NASELJA/);
  assert.match(ulica, /\{pogled \? <span className="izo-broj">/);
});
