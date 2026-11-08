// Kompatibilnost spremanja: izvršava stvarni gameStore ucitaj()/spremi()/primijeniCloudSave()
// i provjeriCloudPayload() s in-memory localStorageom i SINTETIČKIM fixtureima (nisu pravi saveovi).
// Uspoređuje ovaj izvor s netaknutom kopijom (SAVE_COMPAT_PRISTINE) ako postoji.
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
// Kopija netaknutog izvora s node_modules (src identičan source-20261108-1317).
const PRISTINE = process.env.SAVE_COMPAT_PRISTINE || "/workspace/scratch-pristine-20261108/";
const KEY = "blago-v1:game";
const T0 = Date.UTC(2026, 10, 8, 12, 0, 0);

const mem = new Map();
const noop = () => {};
globalThis.window = globalThis.window ?? {
  localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } },
  setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop, addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  location: { href: "http://local.test/", search: "", hostname: "local.test" }, navigator: { userAgent: "node" },
};
globalThis.localStorage = globalThis.localStorage ?? window.localStorage;
globalThis.document = globalThis.document ?? { addEventListener: noop, visibilityState: "visible", documentElement: { dataset: {} } };
const realNow = Date.now;
const realRandom = Math.random;

async function ucitajKorijen(root) {
  // i početno stanje modula koristi Date.now/Math.random: isto sjeme za oba izvora
  Date.now = () => T0;
  let seed = 777;
  Math.random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  try {
    return await ucitajKorijenSirovo(root);
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
}
async function ucitajKorijenSirovo(root) {
  const j = createJiti(import.meta.url, { alias: { "@": root + "src" }, moduleCache: false, fsCache: false });
  const store = await j.import(root + "src/lib/stores/gameStore.ts");
  const cloud = await j.import(root + "src/lib/game/cloud.ts");
  return { store: store.useGameStore, cloud };
}

/** ucitaj() iz sintetičkog blob-a pa spremi(); vraća {stanje, spremljeno}. */
function krug(useGameStore, blob) {
  Date.now = () => T0;
  let seed = 12345; // deterministički Math.random da se misije generiraju isto u oba izvora
  Math.random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  try {
    mem.clear();
    if (blob) mem.set(KEY, JSON.stringify(blob));
    useGameStore.setState(useGameStore.getInitialState(), true);
    useGameStore.getState().ucitaj();
    const s = useGameStore.getState();
    useGameStore.getState().spremi();
    return { s, spremljeno: JSON.parse(mem.get(KEY) ?? "null") };
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
}

const covjek = (id, posao, hub) => ({ id, ime: id, spol: "m", posao, hub, rec: "", alat: "cekic", xp: 3, razina: 2, buffovi: [], mane: [] });
const FIX = {
  // stari save bez polja za stoku (sintetički "legacy")
  legacy: { zlato: 1234, energija: 40, dijamanti: 7, gradevine: { kuca: 2, salun: 1, staja: 1 }, stanovnici: 3 },
  // trenutni oblik, 0 grla
  nula: { zlato: 50, gradevine: { kuca: 1 }, konjiBroj: 0, govedaBroj: 0, stanovnici: 2 },
  // trenutni oblik, puni ranč (90 konja / 48 goveda) + ljudi i gradilište
  max: {
    zlato: 99999, dijamanti: 12, energija: 55, stanovnici: 3,
    gradevine: { kuca: 3, salun: 2, staja: 6, korali: 6, staza: 6, tor: 6, rudnik: 1 },
    konjiBroj: 90, konjiDuznost: { jahanje: 40, ophodnja: 20, rad: 20, rodeo: 10 },
    govedaBroj: 48, govedaDuznost: { pasa: 30, tjeranje: 10, klanje: 8 },
    ljudi: [covjek("ivo", "Građevinac", "krov"), covjek("boro", "Šerif", "red"), covjek("kata", "Lovac", "jelo")],
    gradnje: [{ zgrada: "rudnik", ciljLv: 2, start: T0 - 1000, kraj: T0 + 3_600_000, majstorId: "ivo", majstorIme: "Ivo" }],
  },
  // spremljeno više nego kapacitet
  previse: { zlato: 1, gradevine: { staja: 1 }, konjiBroj: 20, govedaBroj: 9, stanovnici: 1 },
};

const tu = await ucitajKorijen(ROOT);
const imaPristine = existsSync(PRISTINE + "src/lib/stores/gameStore.ts");
const prije = imaPristine ? await ucitajKorijen(PRISTINE) : null;

const IZVEDENO = /zivotinj|grl[oa]|ruta|rute|plan|cilj|hodac|stokaNaKarti|data-/i;

test("ucitaj/spremi: konji i goveda", () => {
  assert.equal(krug(tu.store, FIX.legacy).s.konjiBroj, 0, "legacy bez polja = 0");
  assert.equal(krug(tu.store, FIX.legacy).s.govedaBroj, 0);
  assert.equal(krug(tu.store, null).s.konjiBroj, 0, "bez savea = 0");
  const n = krug(tu.store, FIX.nula);
  assert.deepEqual([n.spremljeno.konjiBroj, n.spremljeno.govedaBroj], [0, 0]);
  const m = krug(tu.store, FIX.max);
  assert.deepEqual([m.s.konjiBroj, m.s.govedaBroj, m.spremljeno.konjiBroj, m.spremljeno.govedaBroj], [90, 48, 90, 48]);
  // postojeće ponašanje hidracije: parsirajKonje/parsirajGoveda stišću na kapacitet (nije dio ove izmjene)
  const p = krug(tu.store, FIX.previse);
  assert.deepEqual([p.s.konjiBroj, p.s.govedaBroj], [6, 0]);
});

test("ucitaj/spremi: ljudi, gradilište, valute ostaju; spremljeni ključevi bez izvedenih ruta/ID-ova", () => {
  const m = krug(tu.store, FIX.max);
  assert.deepEqual(m.spremljeno.ljudi.map((l) => l.id), ["ivo", "boro", "kata"]);
  assert.equal(m.spremljeno.gradnje[0].majstorId, "ivo");
  assert.equal(m.spremljeno.gradnje[0].zgrada, "rudnik");
  assert.deepEqual([m.spremljeno.zlato, m.spremljeno.dijamanti], [99999, 12]);
  const kljucevi = Object.keys(m.spremljeno);
  assert.deepEqual(kljucevi.filter((k) => IZVEDENO.test(k)), [], "spremljeni ključevi: " + kljucevi.join(","));
  // drugi krug iz upravo spremljenog: stabilno
  const dva = krug(tu.store, m.spremljeno);
  assert.deepEqual(dva.spremljeno, m.spremljeno);
});

test("isti spremljeni JSON kao netaknuti izvor (ucitaj→spremi i provjeriCloudPayload)", { skip: !imaPristine && "nema netaknute kopije" }, () => {
  for (const [ime, f] of Object.entries(FIX)) {
    const a = krug(tu.store, f).spremljeno;
    const b = krug(prije.store, f).spremljeno;
    assert.deepEqual(a, b, ime);
    assert.deepEqual(tu.cloud.provjeriCloudPayload(structuredClone(a)), prije.cloud.provjeriCloudPayload(structuredClone(b)), "cloud " + ime);
  }
});

test("prikaz ne mijenja stanje: stokaNaKarti, gdjeJe/ciljIzGdje i rute na zamrznutom stanju", async () => {
  const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
  const sk = await j.import("../src/lib/game/stokaKarta.ts");
  const hc = await j.import("../src/lib/game/hodCilj.ts");
  const lj = await j.import("../src/lib/game/ljudi.ts");
  const { s } = krug(tu.store, FIX.max);
  const snimka = JSON.stringify(s);
  const zamrzni = (o) => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) zamrzni(v); } return o; };
  zamrzni(s);
  const r = sk.stokaNaKarti(s.gradevine, s.konjiBroj, s.govedaBroj);
  assert.equal(r.grla.length, 138);
  const svi = s.ljudi.concat(s.segrti).concat(s.zamjenici);
  for (const p of svi) {
    const c = hc.ciljIzGdje(lj.gdjeJe(p, s.gradevine, s.gradnje, s.ostecenja, "dan", s.karavana, svi));
    hc.preusmjeri(hc.planNaCilju(c), 0, { tip: "zgrada", zgrada: "rudnik" });
  }
  assert.equal(JSON.stringify(s), snimka);
  assert.equal(JSON.stringify(tu.store.getState()), snimka);
});
