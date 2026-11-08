import assert from "node:assert/strict";
import test from "node:test";

const FILL = ["wood", "stone", "iron", "gold", "energy", "wild", "shield", "gem", "knjiga"];
function ghostCol(col) {
  return [0, 1, 2].map((row) => FILL[(col * 3 + row * 4 + 1) % FILL.length]);
}

function paneFromScroll(scrollLeft, width, n) {
  if (width <= 0 || n <= 0) return 0;
  return Math.max(0, Math.min(n - 1, Math.round(scrollLeft / width)));
}

test("ghost strip is 3 symbols and stable per column", () => {
  const a = ghostCol(0);
  const b = ghostCol(0);
  assert.equal(a.length, 3);
  assert.deepEqual(a, b);
  assert.notDeepEqual(ghostCol(0), ghostCol(1));
});

test("pager snap index is exact for 5 panes", () => {
  const n = 5;
  const w = 390;
  assert.equal(paneFromScroll(0, w, n), 0);
  assert.equal(paneFromScroll(w, w, n), 1);
  assert.equal(paneFromScroll(2 * w, w, n), 2);
  assert.equal(paneFromScroll(2 * w + 20, w, n), 2);
  assert.equal(paneFromScroll(2 * w + w * 0.6, w, n), 3);
  assert.equal(paneFromScroll(-10, w, n), 0);
  assert.equal(paneFromScroll(9 * w, w, n), 4);
});

const PAY_LINIJE = [
  [5, 6, 7, 8, 9],
  [0, 1, 2, 3, 4],
  [10, 11, 12, 13, 14],
  [0, 6, 12, 8, 4],
  [10, 6, 2, 8, 14],
];
function payIdx(line) {
  return PAY_LINIJE.findIndex((p) => p.length >= line.length && line.every((v, i) => p[i] === v));
}

test("pet linija: 1 sredina 2 gore 3 dolje 4 V 5 lambda, prefiks i dalje pogađa", () => {
  assert.equal(PAY_LINIJE.length, 5);
  assert.equal(payIdx([5, 6, 7]), 0);
  assert.equal(payIdx([0, 1, 2, 3, 4]), 1);
  assert.equal(payIdx([10, 11, 12]), 2);
  assert.equal(payIdx([0, 6, 12]), 3);
  assert.equal(payIdx([10, 6, 2, 8, 14]), 4);
  assert.equal(payIdx([1, 2, 3]), -1);
  const tocke = [1, 3, 0, 4, 2];
  assert.deepEqual(tocke.map((i) => i + 1), [2, 4, 1, 5, 3]);
});

const CHUNK_RE = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w.-]+ failed|ChunkLoadError/i;

test("chunk load error is detected", () => {
  assert.equal(
    CHUNK_RE.test("Failed to fetch dynamically imported module: https://blago.grok.me/assets/routes-Bauw1jBA.js"),
    true,
  );
  assert.equal(CHUNK_RE.test("TypeError: undefined is not a function"), false);
});

test("missing horse count is empty stable, not a free herd", () => {
  const konjaKap = (g) => (g.staja || 0) * 6 + (g.korali || 0) * 5 + (g.staza || 0) * 4;
  const parsirajKonje = (d, g) => {
    const kap = konjaKap(g);
    if (typeof d.konjiBroj === "number" && Number.isFinite(d.konjiBroj)) {
      return Math.max(0, Math.min(kap, Math.floor(d.konjiBroj)));
    }
    return 0;
  };
  assert.equal(parsirajKonje({}, { staja: 2, korali: 1, staza: 1 }), 0);
  assert.equal(parsirajKonje({ konjiBroj: 3 }, { staja: 1 }), 3);
});

test("daily pack reopens the morning after a claim", () => {
  const DAY = 86_400_000;
  const dayDiff = (fromKey, toKey) => {
    const [fy, fm, fd] = fromKey.split("-").map(Number);
    const [ty, tm, td] = toKey.split("-").map(Number);
    const a = Date.UTC(fy, fm - 1, fd);
    const b = Date.UTC(ty, tm - 1, td);
    return Math.round((b - a) / DAY);
  };
  const resolveDaily = (save, today) => {
    if (!save?.zadnjaDnevna) return { streak: 1, claimedToday: false };
    const diff = dayDiff(save.zadnjaDnevna, today);
    if (diff <= 0) return { streak: save.streak, claimedToday: true };
    if (diff === 1) return { streak: save.streak + 1, claimedToday: false };
    return { streak: 1, claimedToday: false };
  };
  assert.equal(resolveDaily({ streak: 3, zadnjaDnevna: "2026-09-13" }, "2026-09-13").claimedToday, true);
  assert.equal(resolveDaily({ streak: 3, zadnjaDnevna: "2026-09-13" }, "2026-09-14").claimedToday, false);
  assert.equal(resolveDaily({ streak: 3, zadnjaDnevna: "2026-09-13" }, "2026-09-14").streak, 4);
});

test("kauba without horse count starts empty, not a free herd", () => {
  const kap = (g) => (g.staja || 0) * 6 + (g.korali || 0) * 5 + (g.staza || 0) * 4;
  const konji = (extra, g) => {
    const konjiKapN = kap(g);
    return Math.max(0, Math.min(konjiKapN, Math.floor(extra?.konjiBroj ?? 0)));
  };
  assert.equal(konji(undefined, { staja: 2 }), 0);
  assert.equal(konji({ konjiBroj: 4 }, { staja: 2 }), 4);
});

test("zgrade rastu 1.82 po katu, kruna množi kupnje", () => {
  const rast = (baza, lv, k = 1.82) => Math.max(0, Math.floor(baza * Math.pow(k, Math.max(0, lv - 1))));
  const kruna = (p) => (p <= 0 ? 1 : Math.pow(1.85, p));
  const uzKrunu = (n, p) => (n > 0 ? Math.floor(n * kruna(p) + 1e-9) : 0);
  assert.equal(rast(28, 1), 28);
  assert.equal(rast(28, 2), 50);
  assert.ok(rast(28, 5) > rast(28, 4));
  assert.equal(uzKrunu(28, 0), 28);
  assert.equal(uzKrunu(28, 1), 51);
  assert.equal(uzKrunu(28, 2), 95);
  assert.ok(kruna(3) > 6);
});
