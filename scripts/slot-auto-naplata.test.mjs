// Auto-credit of slot wins (no manual PREUZMI, no red/black gamble).
// Executes the real useSlotMachine controller + gameStore/slotStore under Node.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const mem = new Map();
const noop = () => {};
globalThis.window = globalThis.window ?? {
  localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } },
  setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t), setInterval: () => 0, clearInterval: noop,
  addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
  // reduced motion: spin resolves without animation delays
  matchMedia: (q) => ({ matches: /reduce/.test(q), addEventListener: noop, removeEventListener: noop }),
  location: { href: "http://local.test/", search: "", hostname: "local.test" }, navigator: { userAgent: "node" },
};
globalThis.localStorage = globalThis.localStorage ?? window.localStorage;
globalThis.document = globalThis.document ?? {
  addEventListener: noop, removeEventListener: noop, visibilityState: "visible",
  documentElement: { dataset: {}, style: { setProperty: noop } },
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  body: { appendChild: noop, classList: { add: noop, remove: noop } },
};

const j = createJiti(import.meta.url, {
 
  alias: {
    react: ROOT + "scripts/fixtures/slot-react-stub.mjs",
    "@/lib/game/audio": ROOT + "scripts/fixtures/slot-audio-stub.mjs",
    "@": ROOT + "src",
  },
});
const audio = await j.import(ROOT + "scripts/fixtures/slot-audio-stub.mjs");
const { useGameStore } = await j.import(ROOT + "src/lib/stores/gameStore.ts");
const { useSlotStore } = await j.import(ROOT + "src/lib/stores/slotStore.ts");
const sm = await j.import(ROOT + "src/lib/hooks/useSlotMachine.ts");

const dobitak = (o = {}) => ({ zlato: 0, dijamanti: 0, energija: 0, stitovi: 0, drvo: 0, kamen: 0, zeljezo: 0, linije: 1, ...o });
const kredita = () => audio.zvuci.filter((z) => z === "collect").length;
function reset() {
  audio.zvuci.length = 0;
  useSlotStore.setState({ dobitakNaCekanju: null, gambleCount: 0, vrti: false, raidAktivan: false, knjigaFaza: null, autoVrtnja: false, ulog: 1, prikazDobitka: null });
}

test("pending win is credited exactly once; repeated calls credit nothing", () => {
  reset();
  const z0 = useGameStore.getState().zlato;
  const d0 = useGameStore.getState().resursi.drvo;
  useSlotStore.setState({ dobitakNaCekanju: dobitak({ zlato: 37, drvo: 5 }) });
  assert.equal(sm.naplatiDobitak({ automatski: true }), true);
  assert.equal(sm.naplatiDobitak({ automatski: true }), false);
  assert.equal(sm.naplatiDobitak(), false);
  assert.equal(useGameStore.getState().zlato, z0 + 37);
  assert.equal(useGameStore.getState().resursi.drvo, d0 + 5);
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
  assert.equal(kredita(), 1);
});

test("no pending win (miss) credits nothing", () => {
  reset();
  const z0 = useGameStore.getState().zlato;
  assert.equal(sm.naplatiDobitak({ automatski: true }), false);
  assert.equal(useGameStore.getState().zlato, z0);
  assert.equal(kredita(), 0);
});

test("legacy pending claim (old save / interrupted spin) is credited once by the next spin, not dropped", async () => {
  reset();
  useGameStore.setState({ energija: 50 });
  const z0 = useGameStore.getState().zlato;
  useSlotStore.setState({ dobitakNaCekanju: dobitak({ zlato: 11 }), gambleCount: 2 });
  const { zavrtiMasinu } = sm.useSlotMachine();
  await zavrtiMasinu();
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
  assert.ok(useGameStore.getState().zlato >= z0 + 11);
  assert.equal(useSlotStore.getState().gambleCount, 0);
});

test("real spins: every winning base spin credits once, nothing left pending, concurrent call ignored", async () => {
  reset();
  const { zavrtiMasinu } = sm.useSlotMachine();
  // Count actual credits via presentational key bump (set only inside naplatiDobitak).
  let krediti = 0;
  let lastKey = useSlotStore.getState().prikazDobitka?.key ?? 0;
  const unsub = useSlotStore.subscribe((s) => {
    const k = s.prikazDobitka?.key ?? lastKey;
    if (k > lastKey) { krediti += 1; lastKey = k; }
  });
  try {
    for (let i = 0; i < 60; i++) {
      useGameStore.setState({ energija: 100, besplatneVrtnje: 0, stitovi: 3 });
      useSlotStore.setState({ raidAktivan: false, knjigaFaza: null });
      const a = zavrtiMasinu();
      const b = zavrtiMasinu(); // double tap during the same spin
      await Promise.all([a, b]);
      assert.equal(useSlotStore.getState().vrti, false);
      assert.equal(useSlotStore.getState().dobitakNaCekanju, null, `spin ${i} left a pending win`);
    }
  } finally {
    unsub();
  }
  assert.ok(krediti > 0, "expected at least one winning spin in 60");
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
});

test("AUTO: auto spins keep running without manual claim (no pending blocks the next spin)", async () => {
  reset();
  useSlotStore.setState({ autoVrtnja: true });
  const { zavrtiMasinu } = sm.useSlotMachine();
  const v0 = useGameStore.getState().ukupnoVrtnji;
  for (let i = 0; i < 10; i++) {
    useGameStore.setState({ energija: 100, besplatneVrtnje: 0, stitovi: 3 });
    useSlotStore.setState({ raidAktivan: false, knjigaFaza: null });
    await zavrtiMasinu();
  }
  assert.equal(useGameStore.getState().ukupnoVrtnji, v0 + 10);
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
});

test("bonus (free) spins still credit straight into the bonus pot, never via pending", async () => {
  reset();
  useGameStore.setState({ energija: 100, besplatneVrtnje: 3, besplatneUlog: 1, besplatneExpand: null });
  useSlotStore.setState({ knjigaFaza: "igra" });
  const { zavrtiMasinu } = sm.useSlotMachine();
  const seen = [];
  const unsub = useSlotStore.subscribe((s) => { if (s.dobitakNaCekanju) seen.push(1); });
  const v0 = useGameStore.getState().ukupnoVrtnji;
  for (let i = 0; i < 3; i++) await zavrtiMasinu();
  unsub();
  assert.equal(seen.length, 0);
  assert.equal(useGameStore.getState().ukupnoVrtnji, v0 + 3);
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
});

test("slot screen has no red/black gamble or manual PREUZMI", () => {
  const src = readFileSync(ROOT + "src/components/game/SlotScreen.tsx", "utf8");
  for (const s of ["igrajGamble", "CRVENA", "CRNA (", "PREUZMI", "plijen-traka", "udvostručenja"]) {
    assert.ok(!src.includes(s), `SlotScreen still contains ${s}`);
  }
});
