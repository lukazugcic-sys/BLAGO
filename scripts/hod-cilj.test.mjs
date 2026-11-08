// Hodači idu za zadatkom: izvršava stvarni hodCilj.ts, agentiSim.ts, gdjeJe() i
// stvarni KaubaHodaci.tsx (transpiliran TypeScriptom, React hookovi zamijenjeni). Nije preglednik.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const h = await jiti.import("../src/lib/game/hodCilj.ts");
const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
const a = await jiti.import("../src/lib/game/agentiSim.ts");
const lj = await jiti.import("../src/lib/game/ljudi.ts");
const kp = await jiti.import("../src/lib/game/kartaPogled.ts");

const IDS = u.PARCELE.map((p) => p.id);
const xs = u.PARCELE.map((p) => p.x), ys = u.PARCELE.map((p) => p.y);
const B = { x0: Math.min(...xs) - 160, x1: Math.max(...xs) + 160, y0: Math.min(...ys) - 160, y1: Math.max(...ys) + 160 };
const uGranici = (t) => t.every((p) => p.x >= B.x0 && p.x <= B.x1 && p.y >= B.y0 && p.y <= B.y1);
const blizu = (p, q, eps = 0.6) => Math.hypot(p.x - q.x, p.y - q.y) <= eps;
const tockaD = (t, d) => kp.tockaNaPutu(t, Math.min(0.99999, d / (h.duljina(t) || 1)));
const vrata = (id) => h.puteljakZgrade(id)[0];

test("svaka zgrada do svake: počinje na vratima, završava na vratima cilja, ne siječe parcele, ostaje na karti", () => {
  let n = 0;
  for (const A of IDS) for (const C of IDS) {
    if (A === C) continue;
    const plan = h.preusmjeri(h.planNaCilju({ tip: "zgrada", zgrada: A }), 0, { tip: "zgrada", zgrada: C });
    assert.ok(blizu(plan.tocke[0], vrata(A)), `${A}->${C} start`);
    assert.ok(blizu(plan.tocke.at(-1), vrata(C)), `${A}->${C} kraj`);
    assert.equal(u.putSijeceRomb(plan.tocke), null, `${A}->${C} siječe parcelu`);
    assert.ok(uGranici(plan.tocke), `${A}->${C} van karte`);
    assert.ok(plan.ulazD <= plan.izlazD && plan.izlazD <= plan.duzina + 1e-6);
    n++;
  }
  assert.equal(n, IDS.length * (IDS.length - 1));
  // daleko: najudaljeniji par stvarno ide preko karte
  const far = h.preusmjeri(h.planNaCilju({ tip: "zgrada", zgrada: "blok" }), 0, { tip: "zgrada", zgrada: "rudnik" });
  assert.ok(far.duzina > 700, `ruta blok->rudnik ${far.duzina}`);
});

test("promjena zadatka usred puta kreće iz trenutne točke, bez skoka i bez rezanja parcela", () => {
  for (const [A, C, D] of [["kuca", "rudnik", "pilana"], ["kovacnica", "travar", "salun"], ["blok", "lov", "kuca"]]) {
    const plan = h.preusmjeri(h.planNaCilju({ tip: "zgrada", zgrada: A }), 0, { tip: "zgrada", zgrada: C });
    for (const f of [0.02, 0.2, 0.5, 0.8, 0.98, 1]) {
      const d = plan.duzina * f;
      const sad = tockaD(plan.tocke, d);
      for (const novi of [{ tip: "zgrada", zgrada: D }, { tip: "ulica" }]) {
        const r = h.preusmjeri(plan, d, novi);
        assert.ok(blizu(r.tocke[0], sad, 1), `${A}->${C}@${f} -> ${h.kljucCilja(novi)} skok`);
        assert.equal(u.putSijeceRomb(r.tocke), null, `${A}->${C}@${f} -> ${h.kljucCilja(novi)} siječe`);
        if (novi.tip === "zgrada") assert.ok(blizu(r.tocke.at(-1), vrata(D)));
        else assert.ok(h.naOs(r.tocke.at(-1)) && blizu(h.naOs(r.tocke.at(-1)).tocka, r.tocke.at(-1)), "ulica završava na osi");
      }
    }
  }
});

test("besposlen: petlja ulicom tamo-natrag bez skoka s kraja na početak", () => {
  const p = h.planUlice();
  assert.equal(p.jednom, false);
  assert.ok(blizu(p.tocke[0], p.tocke.at(-1)));
  assert.equal(u.putSijeceRomb(p.tocke), null);
  const r = h.preusmjeri(p, p.duzina * 0.3, { tip: "zgrada", zgrada: "farma" });
  assert.ok(blizu(r.tocke[0], tockaD(p.tocke, p.duzina * 0.3), 1));
  assert.equal(u.putSijeceRomb(r.tocke), null);
});

test("AgentSim: jednosmjerno stiže i čeka; zamjena rute ne teleportira", () => {
  const sim = new a.AgentSim();
  const plan = h.preusmjeri(h.planNaCilju({ tip: "zgrada", zgrada: "kuca" }), 0, { tip: "zgrada", zgrada: "rudnik" });
  const r = a.spljostiRutu(plan.tocke);
  sim.postavi([r, r], [{ ruta: 0, brzina: 32, faza: 0, tip: 0 }]);
  sim.zamijeniRutu(0, 1, r, 0, true);
  let t = 0;
  sim.frame(t);
  let max = 0, px = sim.x[0], py = sim.y[0];
  const korak = () => { t += 100; sim.frame(t); max = Math.max(max, Math.hypot(sim.x[0] - px, sim.y[0] - py)); px = sim.x[0]; py = sim.y[0]; };
  for (let k = 0; k < 150; k++) korak();
  // usred puta: preusmjeri iz trenutne točke
  const d = sim.napredak(0);
  assert.ok(d > 0 && d < plan.duzina);
  const novi = h.preusmjeri(plan, d, { tip: "zgrada", zgrada: "pilana" });
  assert.ok(blizu(novi.tocke[0], { x: sim.x[0], y: sim.y[0] }, 1.5));
  sim.zamijeniRutu(0, 1, a.spljostiRutu(novi.tocke), 0, true);
  for (let k = 0; k < 3000 && !sim.stigao(0); k++) korak();
  assert.ok(sim.stigao(0));
  assert.ok(max <= 32 * 0.1 + 0.5, `najveći korak ${max}`);
  const kraj = novi.tocke.at(-1);
  assert.ok(blizu({ x: sim.x[0], y: sim.y[0] }, kraj, 0.5));
  for (let k = 0; k < 50; k++) korak();
  assert.ok(blizu({ x: sim.x[0], y: sim.y[0] }, kraj, 0.5), "čeka na cilju");
});

const pool = (posao) => ({ id: "t-" + posao, ime: "T", spol: "m", posao, hub: "posao", rec: "", alat: "cekic", xp: 0, razina: 1, buffovi: [], mane: [] });
const G = new Proxy({ kovacnica: 1, salun: 1, kuca: 1 }, { get: (o, k) => (k in o ? o[k] : 0) });
const OST = new Proxy({}, { get: () => false });

test("cilj iz gdjeJe(): gradilište ima prednost, doba dana, karavana = van karte", () => {
  const ivo = { ...pool("Građevinac"), id: "ivo", hub: "krov" };
  const gr = [{ zgrada: "rudnik", ciljLv: 1, start: 0, kraj: 1, majstorId: "ivo", majstorIme: "Ivo" }];
  for (const doba of ["jutro", "dan", "suton", "noc"]) {
    assert.deepEqual(h.ciljIzGdje(lj.gdjeJe(ivo, G, gr, OST, doba, null, [ivo])), { tip: "zgrada", zgrada: "rudnik" }, doba);
  }
  const p = { ...pool("Kovač"), id: "kov" };
  assert.deepEqual(h.ciljIzGdje(lj.gdjeJe(p, G, [], OST, "jutro", null, [p])), { tip: "ulica" });
  const dan = h.ciljIzGdje(lj.gdjeJe(p, G, [], OST, "dan", null, [p]));
  assert.equal(dan.tip, "zgrada");
  assert.equal(dan.zgrada, lj.gdjeJe(p, G, [], OST, "dan", null, [p]).zgrada);
  const kar = { vozacId: "kov" };
  assert.deepEqual(h.ciljIzGdje(lj.gdjeJe(p, G, [], OST, "dan", kar, [p])), { tip: "put" });
  assert.deepEqual(h.ciljIzGdje({ mjesto: "zgrada", zgrada: "nepostoji" }), { tip: "ulica" });
});

// --- stvarni KaubaHodaci.tsx s lažnim Reactom i DOM-om ---
function ucitajKomponentu(stanje, mirno, detalj, pauza = false) {
  const src = readFileSync(ROOT + "src/components/game/KaubaHodaci.tsx", "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const efekti = [];
  const refovi = [];
  const ctx = { petlja: null, dom: [] };
  const world = { style: { setProperty() {} }, closest: () => null };
  const korijen = { closest: () => world, querySelectorAll: () => ({ forEach: (f) => ctx.dom.forEach(f) }) };
  const jsx = (type, props) => ({ type, props });
  const sat = { t: 0 };
  const stubs = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "F" },
    react: {
      useEffect: (f) => efekti.push(f),
      useMemo: (f) => f(),
      // redoslijed u komponenti: balonTimer, korijen, ciljRef, planovi, simRef
      useRef: (v) => { const r = { current: refovi.length === 1 ? korijen : v }; refovi.push(r); return r; },
      useState: (v) => [typeof v === "function" ? v() : v, () => {}],
    },
    "@/lib/game/agentiSim": a, "@/lib/game/hodCilj": h, "@/lib/game/kartaPogled": kp, "@/lib/game/ulicaRaspored": u,
    "@/lib/game/ljudi": { ...lj, danDoba: () => stanje.doba },
    "@/lib/game/audio": { playSfx: () => {} },
    "@/lib/game/kartaPetlja": { kartaPetljaPokreni: (fn) => { ctx.petlja = fn; return () => { ctx.petlja = null; }; } },
    "@/lib/game/termika": { Termika: class { frame() { return 0; } } },
    "@/lib/game/tokPolje": { TokPolje: class { slozi() {} } },
    "@/lib/stores/gameStore": { useGameStore: (f) => f(stanje) },
    "./LikAvatar": { LikAvatar: "AV" },
  };
  const module = { exports: {} };
  runInNewContext(js, { module, exports: module.exports, require: (n) => { if (!(n in stubs)) throw new Error("stub " + n); return stubs[n]; },
    window: { setInterval: () => 0, clearInterval() {}, setTimeout: () => 0, clearTimeout() {}, dispatchEvent() {} }, performance: { now: () => sat.t } });
  const rute = kp.stazeKretanja(u.PARCELE.map((p) => p.id));
  const props = { rute, aktivnih: 3, pauza, mirno, detalj, kadarRef: { current: { x0: -1e5, y0: -1e5, x1: 1e5, y1: 1e5, z: 1 } }, centrirajRef: { current() {} }, gutRef: { current: 0 }, tapRef: { current: null }, otvorenoU: { current: 0 } };
  const out = module.exports.KaubaHodaci(props);
  const sve = (v) => (!v || typeof v !== "object" ? [] : Array.isArray(v) ? v.flatMap(sve) : [v, ...sve(v.props?.children)]);
  const cvorovi = sve(out).filter((n) => n.props?.["data-agent"]);
  ctx.dom = cvorovi.map((n) => ({ dataset: { agent: n.props["data-agent"], id: n.props["data-id"], alat: n.props["data-alat"] }, style: { transform: n.props.style?.transform ?? "", visibility: "", setProperty() {} }, classList: { toggle() {}, remove() {} } }));
  for (const f of efekti) f();
  return { cvorovi, ctx, sat, refovi };
}
const pos = (tr) => { const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(tr); return { x: +m[1], y: +m[2] }; };

function stanjeIgre(doba) {
  const ljudi = [{ ...pool("Građevinac"), id: "ivo", hub: "krov" }, { ...pool("Šerif"), id: "boro", hub: "red" }, { ...pool("Kovač"), id: "kata" }];
  return { ljudi, segrti: [], zamjenici: [], stanovnici: 8, gradevine: G, ostecenja: OST, karavana: { vozacId: "kata" }, doba,
    gradnje: [{ zgrada: "rudnik", ciljLv: 1, start: 0, kraj: 1, majstorId: "ivo", majstorIme: "Ivo" }] };
}

test("KaubaHodaci: smanjen pokret i pauza: hodač stoji na stvarnom cilju, karavana nije na karti, petlja se ne pokreće", () => {
  for (const [mirno, pauza] of [[true, false], [false, true]]) {
    const k = ucitajKomponentu(stanjeIgre("dan"), mirno, "srednje", pauza);
    const hod = k.cvorovi.filter((n) => n.props["data-agent"] === "hod");
    assert.deepEqual(hod.map((n) => n.props["data-id"]).sort(), ["boro", "ivo"]);
    const ivo = hod.find((n) => n.props["data-id"] === "ivo");
    assert.equal(ivo.props["data-cilj"], "z:rudnik");
    assert.ok(blizu(pos(ivo.props.style.transform), vrata("rudnik"), 1));
    assert.equal(k.ctx.petlja, null);
  }
});

test("KaubaHodaci izdaleka: promjena gradilišta vodi hodača preko karte bez skoka i kroz tuđe parcele; kola i pas miruju", () => {
  const k = ucitajKomponentu(stanjeIgre("dan"), false, "daleko");
  assert.equal(typeof k.ctx.petlja, "function", "izdaleka se hodači miču");
  const iv = k.ctx.dom.findIndex((d) => d.dataset.id === "ivo");
  const staticni = k.ctx.dom.filter((d) => d.dataset.agent !== "hod").map((d) => d.style.transform);
  const korak = () => { k.sat.t += 100; k.ctx.petlja(); return pos(k.ctx.dom[iv].style.transform); };
  korak();
  let p = korak();
  assert.ok(blizu(p, vrata("rudnik"), 1), "kreće s gradilišta");
  // zadatak se mijenja: gradilište sada pilana (druga strana karte)
  const [, , ciljRef, , simRef] = k.refovi;
  const novi = new Map(ciljRef.current);
  novi.set("ivo", { tip: "zgrada", zgrada: "pilana" });
  ciljRef.current = novi;
  simRef.current.preusmjeri();
  let max = 0, stigao = false, put = 0;
  for (let n = 0; n < 4000 && !stigao; n++) {
    const q = korak();
    const s = Math.hypot(q.x - p.x, q.y - p.y);
    max = Math.max(max, s);
    put += s;
    for (const z of u.PARCELE) assert.ok(!u.uRomu(q.x, q.y, z), `u parceli ${z.id} @${q.x},${q.y}`);
    p = q;
    stigao = blizu(p, vrata("pilana"), 0.6);
  }
  assert.ok(stigao, "stigao na pilanu");
  assert.ok(put > 400, `prijeđeno ${put}`);
  assert.ok(max <= 3.3 * 1.2 + 0.5, `najveći pomak po tiku ${max}`);
  for (let n = 0; n < 40; n++) assert.ok(blizu(korak(), vrata("pilana"), 0.6), "čeka na cilju");
  assert.deepEqual(k.ctx.dom.filter((d) => d.dataset.agent !== "hod").map((d) => d.style.transform), staticni);
});

test("KaubaHodaci: besposlen (jutro) hoda ulicom tamo-natrag", () => {
  const k = ucitajKomponentu(stanjeIgre("jutro"), false, "srednje");
  const bi = k.ctx.dom.findIndex((d) => d.dataset.id === "boro");
  const tocke = [];
  for (let n = 0; n < 200; n++) { k.sat.t += 100; k.ctx.petlja(); tocke.push(pos(k.ctx.dom[bi].style.transform)); }
  for (const q of tocke) assert.ok(blizu(h.naOs(q).tocka, q, 1), "na osi ulice");
  assert.ok(Math.hypot(tocke[199].x - tocke[0].x, tocke[199].y - tocke[0].y) > 20, "kreće se");
});
