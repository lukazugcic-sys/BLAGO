import assert from "node:assert/strict";
import test from "node:test";

const izracunajMaxEnergiju = (baterija) => 80 + baterija * 35;
const izracunajEnergijaRegenMs = (baterija) =>
  Math.max(800, 2000 - Math.max(0, baterija) * 180);
const izracunajMaxStitova = (oklop) => 1 + oklop;
const izracunajSansuZaDobitak = (sreca) => Math.min(0.28, 0.11 + sreca * 0.012);
const izracunajPotrebniXp = (razina) =>
  Math.floor(85 * Math.pow(1.2, Math.max(0, razina - 1)) + 15 * Math.max(1, razina));
const izracunajPrestigeMnozitelj = (prestige) => 1 + prestige * 0.5;
const izracunajTokMnozitelj = (kvalitetaSela) => {
  const k = Math.max(0, Math.min(100, kvalitetaSela));
  return 0.88 + (0.24 * k) / 100;
};
const LINE_MULT = { 3: 1, 4: 3, 5: 8 };
const JACKPOT_BONUS = 1.5;
const izracunajXpVrtnje = (ulog, dobitneCelije, sretna) => {
  const baza = Math.max(1, ulog) * 4;
  const linija = dobitneCelije * Math.max(1, ulog) * 5;
  const sreca = sretna ? 25 : 0;
  return baza + linija + sreca;
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function formatHud(n) {
  const v = Math.floor(Math.abs(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

const cycleDay = (streak) => ((Math.max(1, streak) - 1) % 7) + 1;

test("energija raste s baterijom, regen ne ide ispod 800ms", () => {
  assert.equal(izracunajMaxEnergiju(0), 80);
  assert.equal(izracunajMaxEnergiju(2), 150);
  assert.equal(izracunajEnergijaRegenMs(0), 2000);
  assert.equal(izracunajEnergijaRegenMs(20), 800);
});

test("štitovi i sreća su ograničeni", () => {
  assert.equal(izracunajMaxStitova(0), 1);
  assert.equal(izracunajMaxStitova(4), 5);
  assert.equal(izracunajSansuZaDobitak(0), 0.11);
  assert.ok(izracunajSansuZaDobitak(99) <= 0.28);
});

test("xp i prestige", () => {
  assert.equal(izracunajPotrebniXp(1), 100);
  assert.equal(izracunajPrestigeMnozitelj(0), 1);
  assert.equal(izracunajPrestigeMnozitelj(2), 2);
});

test("tok sela i linije 3/4/5", () => {
  assert.equal(izracunajTokMnozitelj(50), 1);
  assert.equal(LINE_MULT[3], 1);
  assert.equal(LINE_MULT[4], 3);
  assert.equal(LINE_MULT[5], 8);
  assert.equal(JACKPOT_BONUS, 1.5);
});

test("xp vrtnje: promašaj, linija, sretna", () => {
  assert.equal(izracunajXpVrtnje(1, 0, false), 4);
  assert.equal(izracunajXpVrtnje(1, 3, false), 19);
  assert.equal(izracunajXpVrtnje(1, 0, true), 29);
});

test("hud brojevi", () => {
  assert.equal(formatHud(12), "12");
  assert.equal(formatHud(1500), "1.5k");
  assert.equal(formatHud(12000), "12k");
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
});

test("dnevni ciklus 1–7", () => {
  assert.equal(cycleDay(1), 1);
  assert.equal(cycleDay(7), 7);
  assert.equal(cycleDay(8), 1);
});
