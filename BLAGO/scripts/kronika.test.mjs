import assert from "node:assert/strict";
import test from "node:test";

/** Spec of kronika.ts + dostignuca.ts. Keep in sync. */

const MAX_KRONIKA = 28;
const VRSTE = ["selidba", "gradnja", "pohod", "obrana", "dogadaj", "dostignuce"];
const POTJERNICE_N = 22;

function jeStav(v) {
  return v === "osvetnik" || v === "strateg" || v === "pljackas";
}
function jeVrsta(v) {
  return typeof v === "string" && VRSTE.includes(v);
}

function parsirajKroniku(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    if (typeof row.recap !== "string") continue;
    const stav = jeStav(row.stav) ? row.stav : null;
    const vrsta = jeVrsta(row.vrsta)
      ? row.vrsta
      : stav
        ? row.pobjeda === true
          ? "pohod"
          : "obrana"
        : "selidba";
    out.push({
      id: typeof row.id === "string" ? row.id : `k-${out.length}`,
      t: typeof row.t === "number" && Number.isFinite(row.t) ? row.t : 0,
      metaIme: typeof row.metaIme === "string" ? row.metaIme.slice(0, 48) : "",
      pobjeda: row.pobjeda === true,
      stav,
      recap: row.recap.slice(0, 220),
      vrsta,
    });
    if (out.length >= MAX_KRONIKA) break;
  }
  return out;
}

function kadJe(t, sad) {
  if (!t) return "Na početku.";
  const d = sad - t;
  if (d < 45_000) return "Sad.";
  if (d < 3600_000) return `Prije ${Math.max(1, Math.floor(d / 60_000))} min.`;
  const a = new Date(t);
  const b = new Date(sad);
  const istiDan =
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (istiDan) return d < 5 * 3600_000 ? "Prije par sati." : "Danas.";
  const jucer = new Date(sad);
  jucer.setDate(jucer.getDate() - 1);
  if (a.getFullYear() === jucer.getFullYear() && a.getMonth() === jucer.getMonth() && a.getDate() === jucer.getDate()) {
    return "Jučer.";
  }
  if (d < 7 * 86400_000) return "Ovaj tjedan.";
  return "Stariji zapis.";
}

function pohodPobjede(kronika) {
  let n = 0;
  for (const z of kronika) {
    if (!z.pobjeda) continue;
    if (z.vrsta === "pohod" || (!z.vrsta && z.stav)) n += 1;
  }
  return n;
}

function napredak(s, d) {
  const map = {
    spin: s.ukupnoVrtnji,
    ukupnoZlato: s.ukupnoZlata,
    prestige: s.prestigeRazina,
    gradnja: s.maxKat,
    pohod: s.pohodPobjede,
    zid: s.zid,
    set: s.setovi,
    konj: s.konjiBroj,
    ljudi: s.ljudi,
  };
  return { trenutno: map[d.tip], cilj: d.cilj };
}

test("parsiraj zadrži dogadaj i dostignuce", () => {
  const out = parsirajKroniku([
    { id: "a", t: 1, recap: "Ulica gori.", vrsta: "dogadaj", pobjeda: false },
    { id: "b", t: 2, recap: "Zvijezda: Prvo kolo.", vrsta: "dostignuce", pobjeda: true, metaIme: "Prvo kolo" },
    { id: "c", t: 3, recap: "nema vrste", pobjeda: true, stav: "pljackas" },
  ]);
  assert.equal(out.length, 3);
  assert.equal(out[0].vrsta, "dogadaj");
  assert.equal(out[1].vrsta, "dostignuce");
  assert.equal(out[1].metaIme, "Prvo kolo");
  assert.equal(out[2].vrsta, "pohod");
});

test("parsiraj reže na MAX_KRONIKA", () => {
  const raw = Array.from({ length: 40 }, (_, i) => ({ id: `k${i}`, t: i, recap: "x", vrsta: "gradnja" }));
  assert.equal(parsirajKroniku(raw).length, MAX_KRONIKA);
});

test("kadJe kante", () => {
  const sad = Date.parse("2026-09-09T22:00:00+02:00");
  assert.equal(kadJe(0, sad), "Na početku.");
  assert.equal(kadJe(sad - 10_000, sad), "Sad.");
  assert.equal(kadJe(sad - 3 * 60_000, sad), "Prije 3 min.");
  assert.equal(kadJe(sad - 2 * 3600_000, sad), "Prije par sati.");
  assert.equal(kadJe(Date.parse("2026-09-09T08:00:00+02:00"), sad), "Danas.");
  assert.equal(kadJe(Date.parse("2026-09-08T22:00:00+02:00"), sad), "Jučer.");
  assert.equal(kadJe(Date.parse("2026-09-05T22:00:00+02:00"), sad), "Ovaj tjedan.");
  assert.equal(kadJe(Date.parse("2026-08-01T22:00:00+02:00"), sad), "Stariji zapis.");
});

test("pohod pobjede broji samo pobjede", () => {
  const k = [
    { pobjeda: true, vrsta: "pohod", stav: "pljackas" },
    { pobjeda: false, vrsta: "obrana", stav: "osvetnik" },
    { pobjeda: true, vrsta: "dostignuce", stav: null },
    { pobjeda: true, vrsta: undefined, stav: "strateg" },
  ];
  assert.equal(pohodPobjede(k), 2);
});

test("napredak zvijezda: spin, zid, ljudi", () => {
  const s = {
    ukupnoVrtnji: 12,
    ukupnoZlata: 4000,
    prestigeRazina: 0,
    maxKat: 3,
    pohodPobjede: 1,
    zid: 6,
    setovi: 0,
    konjiBroj: 0,
    ljudi: 8,
  };
  assert.deepEqual(napredak(s, { tip: "spin", cilj: 10 }), { trenutno: 12, cilj: 10 });
  assert.deepEqual(napredak(s, { tip: "zid", cilj: 6 }), { trenutno: 6, cilj: 6 });
  assert.deepEqual(napredak(s, { tip: "zid", cilj: POTJERNICE_N }), { trenutno: 6, cilj: 22 });
  assert.deepEqual(napredak(s, { tip: "ljudi", cilj: 8 }), { trenutno: 8, cilj: 8 });
  assert.deepEqual(napredak(s, { tip: "pohod", cilj: 5 }), { trenutno: 1, cilj: 5 });
});

test("pun zid cilj prati 22 plakata", () => {
  assert.equal(POTJERNICE_N, 22);
});
