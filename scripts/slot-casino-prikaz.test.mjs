// Visual win-tier mapping is presentational only; auto-claim stays exactly-once.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(ROOT + "/" + p, "utf8");

test("razinaDobitka is presentational and never mutates the win object", async () => {
  const j = createJiti(import.meta.url, { alias: { "@": ROOT + "/src" } });
  const { razinaDobitka, natpisRazina } = await j.import(ROOT + "/src/lib/game/slotPrikaz.ts");
  const d = { zlato: 10, dijamanti: 0, linije: 1 };
  const kopija = { ...d };
  assert.equal(razinaDobitka(d, 1), "veliki");
  assert.equal(razinaDobitka({ zlato: 2, dijamanti: 0, linije: 1 }, 1), "mali");
  assert.equal(razinaDobitka({ zlato: 40, dijamanti: 0, linije: 1 }, 1), "mega");
  assert.equal(razinaDobitka({ zlato: 0, dijamanti: 5, linije: 0 }, 1), "mega");
  assert.deepEqual(d, kopija);
  assert.equal(natpisRazina("mali"), "DOBITAK");
  assert.equal(natpisRazina("mega"), "MEGA DOBITAK");
});

test("auto-claim still credits exactly once and records a display amount", async () => {
  const mem = new Map();
  const noop = () => {};
  globalThis.window = globalThis.window ?? {
    localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } },
    setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (t) => clearTimeout(t), setInterval: () => 0, clearInterval: noop,
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
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
      react: ROOT + "/scripts/fixtures/slot-react-stub.mjs",
      "@/lib/game/audio": ROOT + "/scripts/fixtures/slot-audio-stub.mjs",
      "@": ROOT + "/src",
    },
  });
  const audio = await j.import(ROOT + "/scripts/fixtures/slot-audio-stub.mjs");
  const { useGameStore } = await j.import(ROOT + "/src/lib/stores/gameStore.ts");
  const { useSlotStore } = await j.import(ROOT + "/src/lib/stores/slotStore.ts");
  const sm = await j.import(ROOT + "/src/lib/hooks/useSlotMachine.ts");
  audio.zvuci.length = 0;
  useSlotStore.setState({ dobitakNaCekanju: null, prikazDobitka: null, ulog: 2, gambleCount: 0 });
  const z0 = useGameStore.getState().zlato;
  useSlotStore.setState({ dobitakNaCekanju: { zlato: 24, dijamanti: 0, energija: 0, stitovi: 0, drvo: 0, kamen: 0, zeljezo: 0, linije: 2 } });
  assert.equal(sm.naplatiDobitak({ automatski: true }), true);
  assert.equal(sm.naplatiDobitak({ automatski: true }), false);
  assert.equal(useGameStore.getState().zlato, z0 + 24);
  assert.equal(useSlotStore.getState().dobitakNaCekanju, null);
  const p = useSlotStore.getState().prikazDobitka;
  assert.ok(p);
  assert.equal(p.zlato, 24);
  assert.equal(p.razina, "veliki");
  assert.equal(audio.zvuci.filter((z) => z === "collect").length, 1);
});

test("reduced-motion CSS kills casino win/spin animations", () => {
  const css = read("src/styles.css");
  const start = css.indexOf("0.9.166-test: western casino slot overhaul");
  assert.ok(start > 0);
  const chunk = css.slice(start);
  assert.ok(chunk.includes("@media (prefers-reduced-motion: reduce)"));
  for (const sel of [".slot-pobjeda", ".slot-pobjeda-kovanice", ".slot-win::after", "slot-zavrti"]) {
    assert.ok(chunk.includes(sel), `missing ${sel} in 0.9.166 CSS`);
  }
  assert.ok(chunk.includes("animation: none !important") || chunk.includes("animation:none !important"));
  assert.ok(chunk.includes("slot-pobjeda-kovanice{ display: none") || chunk.includes(".slot-pobjeda-kovanice{ display: none"));
});


test("new slot CSS avoids forbidden short-line drop-shadow (map perf rule)", () => {
  const css = read("src/styles.css");
  const start = css.indexOf("0.9.166-test: western casino slot overhaul");
  assert.ok(start > 0);
  const chunk = css.slice(start);
  for (const line of chunk.split("\n")) {
    if (line.length >= 400) continue;
    const t = line.trim();
    if (t.startsWith("/*") || t.startsWith("*") || t.startsWith("//")) continue;
    assert.ok(!line.includes("drop-shadow"), `new short drop-shadow: ${line.slice(0, 80)}`);
  }
});

test("SlotScreen keeps auto-claim (no PREUZMI) and uses casino dock + WinCelebration", () => {
  const s = read("src/components/game/SlotScreen.tsx");
  assert.ok(!s.includes("PREUZMI"));
  assert.ok(!s.includes("igrajGamble"));
  assert.ok(s.includes("slot-dock-casino"));
  assert.ok(s.includes("<WinCelebration"));
  assert.ok(!s.includes("slot-dobitak-flash"));
});
