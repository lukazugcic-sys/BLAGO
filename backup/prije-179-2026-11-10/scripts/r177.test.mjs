// 0.9.177 — trg (t446u), gornji razmak (t447u), zastajkivanje karte (t448u), donji izbornik bez trake +
// postupni blur + karta ispod ikona (t449u–t452u), ograda tora tek uz izgrađen tor (t453u),
// Sajam konja (t454u), resursi i iznosi bez kratica (t455u, t456u).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const tr = await j.import(ROOT + "src/lib/game/trg.ts");
const pj = await j.import(ROOT + "src/lib/game/pjesine.ts");
const kp = await j.import(ROOT + "src/lib/game/kartaPogled.ts");
const res = await j.import(ROOT + "src/lib/game/resursi.ts");
const ap = await j.import(ROOT + "src/lib/game/agentiSim.ts");
const read = (p) => readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css").replaceAll(".game-shell nav.nav-", "nav.nav-");
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const SVI = u.PARCELE.map((p) => p.id);

// ---------- t446u: trg ----------
test("t446u: trg ima sve nove elemente (fontana, spomenik, štand, korita, fenjeri, privez, ploča, ptice, mačka, drvo s klupom)", () => {
  const broj = (tip) => tr.TRG_STVARI.filter((s) => s.tip === tip).length;
  assert.equal(broj("fontana"), 1);
  assert.equal(broj("spomenik"), 1);
  assert.equal(broj("stand"), 1);
  assert.equal(broj("privez"), 1);
  assert.equal(broj("ploca"), 1);
  assert.equal(broj("klupa-krug"), 1);
  assert.equal(broj("drvo"), 1);
  assert.ok(broj("fenjer") >= 4 && broj("cvijece") >= 3 && broj("klupa") >= 2);
  assert.ok(broj("golub") >= 2 && broj("macka") === 1);
  const src = read("src/components/game/KaubaDvorista.tsx");
  for (const id of ["dv-trg-fontana", "dv-trg-spomenik", "dv-trg-stand", "dv-trg-cvijece", "dv-trg-ploca", "dv-trg-privez", "dv-trg-golub", "dv-trg-macka", "dv-trg-klupa-krug", "dv-trg-klupa-iza", "trg-kocke", "trg-sjaj-g"]) assert.ok(src.includes(`id="${id}"`), id);
  for (const k of ["izo-trg-blokovi", "izo-trg-zraka", "izo-trg-uzica", "izo-trg-zastavica", "izo-trg-zarulje", "izo-trg-sjaj"]) assert.ok(src.includes(k) && css.includes(`.${k}`), k);
});

test("t446u: trg i stvari ne diraju zgrade, ceste, puteljke ni staze; stalno (deterministički)", () => {
  const T = tr.TRG;
  assert.ok(T.rx > 44 && T.ry > 21, "trg je malo veći nego u 0.9.176");
  const cesta = t.tockeOd(t.STAZA.tijelo);
  const putevi = [...u.putelji(SVI).map((p) => p.tocke), ...pj.svePjesine().map((s) => s.tocke)];
  const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k); };
  const dLin = (p, l) => { let m = Infinity; for (let i = 1; i < l.length; i++) m = Math.min(m, dSeg(p, l[i - 1], l[i])); return m; };
  for (const s of tr.TRG_STVARI) {
    for (const q of u.PARCELE) {
      assert.equal(u.uRomu(s.x, s.y, q), false, `${s.tip} na parceli ${q.id}`);
      const k = pj.kutijaSlike(q.id);
      assert.ok(!(s.x > k.l && s.x < k.r && s.y > k.t && s.y < k.b), `${s.tip} na slici ${q.id}`);
    }
    for (const l of putevi) assert.ok(dLin(s, l) > 4, `${s.tip} na putu`);
    assert.ok(dLin(s, cesta) > 6, `${s.tip} na cesti`);
  }
  assert.deepEqual(tr.stvariTrga(), tr.TRG_STVARI);
  assert.deepEqual([0, 1, 2, 3].map(tr.vrhFenjera), [0, 1, 2, 3].map(tr.vrhFenjera));
});

test("t446u: trg je statičan memo sloj; kapljice su zaseban HTML sloj i miruju uz smanjen pokret", () => {
  const src = read("src/components/game/KaubaDvorista.tsx");
  assert.match(src, /export const KaubaTrg = memo\(/);
  assert.match(src, /export const KaubaTrgVoda = memo\(/);
  assert.ok(!/useState|useEffect/.test(src.slice(src.indexOf("export const KaubaTrg"))), "trg bez stanja");
  assert.ok(read("src/components/game/KaubaZivaUlica.tsx").includes("<KaubaTrgVoda />"));
  const rm = css.slice(css.indexOf("@keyframes izo-trg-kap"));
  assert.match(rm, /prefers-reduced-motion: reduce\)\s*\{\s*\.ziva-izo \.izo-trg-voda i \{ animation: none/);
  assert.match(css, /\.ziva-izo\.is-noc \.izo-trg-sjaj \{ opacity: 1; \}/);
});

// ---------- t453u: ograde ----------
test("t453u: ograda obora tek uz izgrađen tor; ograde ranča nose zgradu i crtaju se samo uz izgrađenu", () => {
  const kc = read("src/components/game/KaubaCesta.tsx");
  assert.match(kc, /\(gradevine\.tor \|\| 0\) > 0 && OBOR_OGRADA\.letve/);
  assert.match(kc, /\(gradevine\.tor \|\| 0\) > 0 && OBOR_OGRADA\.stupovi/);
  const og = kp.ogradeRanca();
  assert.ok(og.length > 0 && og.every((o) => ["farma", "staja", "lov"].includes(o.zgrada)));
  const zu = read("src/components/game/KaubaZivaUlica.tsx");
  assert.match(zu, /OGRADE\.map\(\(d, i\) => \(gradevine\[d\.zgrada as keyof Gradevine\] \|\| 0\) > 0 \?/);
  // ponašanje filtra: neizgrađeno → ništa, izgrađeno → samo svoje
  const vidi = (g) => og.filter((d) => (g[d.zgrada] || 0) > 0);
  assert.equal(vidi({}).length, 0);
  assert.ok(vidi({ farma: 1 }).every((d) => d.zgrada === "farma"));
});

// ---------- t447u ----------
test("t447u: gornji razmak = 5 px + stvarni inset (bez starog minimuma 1.75rem)", () => {
  const h = read("src/components/game/Header.tsx");
  assert.ok(!h.includes("max(1.75rem"), "stari minimum");
  assert.match(h, /hdr-gore/);
  assert.match(css, /header\.hdr-gore \{ padding-top: calc\(env\(safe-area-inset-top, 0px\) \+ 5px\); \}/);
  assert.match(css, /--blago-header-h: calc\(env\(safe-area-inset-top, 0px\) \+ 6\.75rem - 23px\)/);
  assert.match(read("capacitor.config.ts"), /overlaysWebView: false/);
});

// ---------- t448u ----------
test("t448u: karta ne piše naslijeđeno svojstvo na korijen svijeta svaki kadar; bez prisilnog layouta; hodači miruju dok se kamera miče", () => {
  const h = read("src/components/game/KaubaHodaci.tsx");
  assert.ok(!/world\.style\.setProperty\("--t"/.test(h));
  assert.match(h, /kameraSeMice\?\.\(sad\)/);
  const zu = read("src/components/game/KaubaZivaUlica.tsx");
  const a = zu.indexOf("const apply = ");
  const b = zu.indexOf("const zatrazi", a);
  assert.ok(!zu.slice(a, b).includes("el.clientWidth"), "apply() ne čita clientWidth");
  assert.match(zu.slice(a, b), /kameraSeMakla\(\)/);
  const kp2 = read("src/lib/game/kartaPetlja.ts");
  assert.match(kp2, /export function kameraSeMice/);
  const sim = new ap.AgentSim();
  assert.equal(typeof sim.preskoci, "function");
});

// ---------- t449u–t452u ----------
test("t449u/t450u: donji izbornik — samo ikone (lucide, potez 2), bez trake/pozadina/okvira, aktivna = točka", () => {
  const n = read("src/components/game/AppNav.tsx");
  assert.ok(!n.includes("bg-void px-2"), "nav bez pozadine");
  assert.ok(!/bg-gold text-void|bg-ink\/8|bg-ink\/5/.test(n), "bez pozadine po ikoni");
  assert.match(n, /strokeWidth=\{2\}/);
  assert.match(n, /nav-177/);
  assert.match(n, /aria-label=\{zakljucan \? `\$\{t\.label\} · \$\{lokot\}` : t\.label\}/);
  assert.match(css, /nav\.nav-donji\.nav-177 \{ background: transparent; pointer-events: none; \}/);
  assert.match(css, /nav\.nav-177 \.nav-donji-traka \{[^}]*background: transparent;[^}]*box-shadow: none;/);
  assert.match(css, /nav\.nav-177 button\.nav-aktivan::after \{[^}]*width: 4px;[^}]*border-radius: 50%;/);
  assert.match(css, /nav\.nav-177 \.nav-glif \{[^}]*width: 24px;[^}]*opacity: 0\.55;/);
  assert.match(css, /nav\.nav-177 \.nav-glif-sjena \{[^}]*color: #000;/, "sjena glifa bez CSS filtera");
  assert.match(n, /nav-glif-sjena/);
  assert.match(css, /nav\.nav-177 button\.nav-donji-tipka \{\s*pointer-events: auto;/);
});

test("t451u/t452u: na Kaubi karta ide do dna ispod ikona; kontrole iznad; postupni blur (2 sloja + maska), gasi se pri vučenju", () => {
  assert.match(css, /\.game-shell\[data-tab="selo"\] > \.pager-scroller \{ margin-bottom: calc\(-1 \* var\(--nav-donji-h, 62px\)\); \}/);
  assert.match(css, /\.game-shell\[data-tab="selo"\] \.ziva-ulica\.ziva-izo \.karta-kontrole \{ bottom: calc\(8px \+ var\(--nav-donji-h, 62px\)\); \}/);
  assert.match(read("src/components/game/GameApp.tsx"), /data-tab=\{tab\}/);
  assert.match(read("src/components/game/AppNav.tsx"), /--nav-donji-h/);
  const blur = css.slice(css.indexOf("nav.nav-177 .nav-blur {"));
  assert.equal((blur.match(/(?<!-webkit-)backdrop-filter: blur\(/g) || []).length, 2, "točno 2 sloja blura");
  assert.match(blur, /mask-image: linear-gradient\(to top/);
  assert.match(blur, /-webkit-mask-image/);
  assert.match(css, /nav\.nav-177 \.nav-blur\.is-vuce i \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/);
  assert.match(read("src/components/game/KaubaZivaUlica.tsx"), /navBlur\?\.classList\.toggle\("is-vuce", on\)/);
});

// ---------- t454u ----------
test("t454u: Sajam konja — novi raspored, iste akcije i uvjeti; cijene kao broj + ikona", () => {
  const v = read("src/components/game/VillageScreen.tsx");
  const a = v.indexOf("function KonjiKartica()");
  const k = v.slice(a, v.indexOf("function LijekKartica()"));
  assert.match(k, /sajam-konja/);
  for (const s of ["kupiKonja()", "kupiKonja(5)", "prodajKonja", "kupiSijeno", "potkovaj", "pomakniKonja(d.id, d.id === \"jahanje\" ? izvor : \"jahanje\")", "zlato < konjZl || drvo < konjDr || konjiBroj >= kap", "zlato < konjZl * 5 || drvo < konjDr * 5", "cijenaUzKrunu(16, prestige)", "cijenaUzKrunu(4, prestige)", "cijenaUzKrunu(6, prestige)"]) assert.ok(k.includes(s), s);
  assert.match(k, /jsx\(Iznos, \{ resurs: "zlato", kolicina: konjZl \}\)/);
  assert.match(k, /jsx\(Iznos, \{ resurs: "drvo", kolicina: konjDr \}\)/);
  assert.ok(!/"g "|"d"\s*\]|"g"\s*\]/.test(k), "bez kratica g/d");
  for (const c of [".sajam-glava", ".sajam-duznost", ".sajam-korak", ".sajam-gumb.is-glavni"]) assert.ok(css.includes(c), c);
  assert.match(css, /\.sajam-korak \{ width: 2\.75rem; height: 2\.75rem;/, "dodir ≥ 44 px");
});

// ---------- t455u/t456u ----------
test("t455u/t456u: jedan zapis iznosa (kao traka resursa), bez slova „g\" na kraju", () => {
  const f = res.formatIznos;
  assert.equal(f(8), "8");
  assert.equal(f(950), "950");
  assert.equal(f(1250), "1.3k");
  assert.equal(f(12_400), "12k");
  assert.equal(f(1_200_000), "1.2m");
  assert.equal(f(50, true), "+50");
  assert.equal(f(-50), "−50");
  for (const n of [0, 6, 80, 999, 1000, 4321, 99_999, 3_000_000]) assert.ok(!/g$/.test(f(n)) && !/g$/.test(f(n, true)), String(n));
  assert.deepEqual(Object.keys(res.RESURSI).sort(), ["dijamanti", "drvo", "energija", "kamen", "stitovi", "xp", "zeljezo", "zlato"].sort());
  for (const r of Object.values(res.RESURSI)) assert.ok(r.ime && r.gen && r.boja);
  const dio = res.rastaviTekst("Baci 8 zlata · +2 dijamanta i 12 XP.");
  assert.deepEqual(dio.filter((x) => typeof x !== "string").map((x) => [x.znak + x.broj, x.resurs]), [["8", "zlato"], ["+2", "dijamanti"], ["12", "xp"]]);
  assert.equal(res.rastaviTekst("Bez iznosa.").length, 1);
});

test("t455u/t456u: u izvoru nema starih kratica iznosa (8g, ${x}g, „N kam/žel/d\")", () => {
  const datoteke = [];
  const hodaj = (dir) => {
    for (const f of readdirSync(ROOT + dir)) {
      const p = `${dir}/${f}`;
      if (statSync(ROOT + p).isDirectory()) hodaj(p);
      else if (/\.(ts|tsx)$/.test(f) && !f.includes("terenPodaci")) datoteke.push(p);
    }
  };
  hodaj("src/components");
  hodaj("src/lib");
  const losi = [];
  const re = [/\d\s?g\b(?![a-zA-Zčćšžđ\-])/, /\$\{[^}]+\}\s?g\b(?![a-zA-Zčćšžđ])/, /\}g\b(?![a-zA-Zčćšžđ])/, /\$\{[^}]+\} (kam|žel)`/, /"g "|"g"\s*\]/];
  for (const p of datoteke) {
    const lines = read(p).split("\n");
    lines.forEach((l, i) => {
      const kod = l.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
      if (/className|d=\{?"|d: "M|points|#[0-9a-f]{3}|toFixed|viewBox/.test(kod)) return;
      for (const r of re) if (r.test(kod)) losi.push(`${p}:${i + 1}: ${l.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(losi, []);
});
