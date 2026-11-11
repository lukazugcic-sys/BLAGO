// 0.9.172: bonus kupnja (dijamanti) skalira s ulogom ×1..×15 — jedan helper za prikaz, provjeru i naplatu
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const ROOT = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

test("cijenaBonusKupnje = ceil(osnovna × ulog) (+1 za znak)", async () => {
  const k = await createJiti(import.meta.url).import("../src/lib/game/knjiga.ts");
  // osnovna cijena ostaje cijenaBesplatnih(razina)
  assert.equal(k.cijenaBesplatnih(1), 15);
  assert.equal(k.cijenaBonusKupnje(1, 1), 15);
  assert.equal(k.cijenaBonusKupnje(1, 2), 30);
  assert.equal(k.cijenaBonusKupnje(1, 5), 75);
  assert.equal(k.cijenaBonusKupnje(1, 15), 225);
  assert.equal(k.cijenaBonusKupnje(3, 5), 90); // 18 × 5
  assert.equal(k.cijenaBonusKupnje(1, 2, true), 31); // znak +1, ne množi se
  assert.equal(k.cijenaBonusKupnje(1, 1.5), 23); // zaokruži gore
  for (const bad of [0, -3, NaN, undefined]) assert.equal(k.cijenaBonusKupnje(1, bad), 15);
  for (let r = 1; r <= 30; r++) for (const u of [1, 2, 3, 5, 8, 10, 15, 25]) {
    assert.equal(k.cijenaBonusKupnje(r, u), Math.ceil(k.cijenaBesplatnih(r) * u));
  }
});

test("mozeKupitiBonus i naplatiBonusKupnju koriste isti iznos", async () => {
  const k = await createJiti(import.meta.url).import("../src/lib/game/knjiga.ts");
  assert.equal(k.mozeKupitiBonus(74, 1, 5), false);
  assert.equal(k.mozeKupitiBonus(75, 1, 5), true);
  assert.deepEqual(k.naplatiBonusKupnju(74, 1, 5), { ok: false, cijena: 75, dijamanti: 74 });
  assert.deepEqual(k.naplatiBonusKupnju(100, 1, 5), { ok: true, cijena: 75, dijamanti: 25 });
  assert.deepEqual(k.naplatiBonusKupnju(225, 1, 15), { ok: true, cijena: 225, dijamanti: 0 });
  assert.deepEqual(k.naplatiBonusKupnju(31, 1, 2, true), { ok: true, cijena: 31, dijamanti: 0 });
  assert.deepEqual(k.naplatiBonusKupnju(30, 1, 2, true), { ok: false, cijena: 31, dijamanti: 30 });
  for (const u of [1, 2, 3, 5, 8, 10, 15]) {
    const c = k.cijenaBonusKupnje(4, u);
    assert.equal(k.mozeKupitiBonus(c, 4, u), k.naplatiBonusKupnju(c, 4, u).ok);
    assert.equal(k.mozeKupitiBonus(c - 1, 4, u), k.naplatiBonusKupnju(c - 1, 4, u).ok);
    assert.equal(k.naplatiBonusKupnju(c + 7, 4, u).dijamanti, 7);
  }
});

test("naplata u kupiBesplatne ide kroz helper s trenutnim ulogom; UI prikazuje istu cijenu", () => {
  const hook = read("src/lib/hooks/useSlotMachine.ts");
  const kupi = hook.slice(hook.indexOf("const kupiBesplatne"), hook.indexOf("const zavrtiMasinu"));
  assert.match(kupi, /naplatiBonusKupnju\(gs\.dijamanti, gs\.igracRazina, ss\.ulog, !!pick\)/);
  assert.match(kupi, /if \(!naplata\.ok\)/);
  assert.match(kupi, /dijamanti: s\.dijamanti - c/);
  assert.match(kupi, /const c = naplata\.cijena/);
  assert.doesNotMatch(kupi, /cijenaBesplatnih\(/, "no unscaled price in deduction");
  assert.match(kupi, /besplatneUlog: ss\.ulog/, "bonus contents/ulog unchanged");

  const slot = read("src/components/game/SlotScreen.tsx");
  assert.match(slot, /cijenaBonusKupnje\(igracRazina, ulog\)/);
  assert.match(slot, /cijenaBonusKupnje\(igracRazina, ulog, true\)/);
  assert.doesNotMatch(slot, /cijenaBesplatnih\(/);
  assert.match(slot, /disabled=\{zakljucan \|\| !mozeKupiti\}/, "KUPI greyed when diamonds insufficient");
  assert.match(slot, /data-cijena=\{cijena\}/);
  assert.match(slot, /knjiga-kupi-cijena/);

  const nav = read("src/components/game/AppNav.tsx");
  assert.match(nav, /cijenaBonusKupnje\(razina, slotUlog\)/);
  assert.doesNotMatch(nav, /cijenaBesplatnih\(/);
});
