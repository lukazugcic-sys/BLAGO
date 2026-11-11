// 0.9.170: IGRAJ slot HUD + cabinet cleanup (plan step 3)
// 0.9.171: ZAVRTI vertical centre @ old chip-strip (~68vh); tools below
// 0.9.172: ZAVRTI anchored from bottom nav (fixed dock below), replaces 0.9.171 68vh contract
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");

test("no gold cabinet frame / rivets; soft lamps kept", () => {
  const slot = read("src/components/game/SlotScreen.tsx");
  const css = read("src/styles.css");
  assert.ok(slot.includes("slot-kolo--frameless"));
  assert.ok(!slot.includes("slot-zakovica"), "rivets removed from markup");
  assert.ok(slot.includes("slot-lampa"));
  assert.ok(css.includes("0.9.170-test: IGRAJ slot"));
  const chunk = css.slice(css.indexOf("0.9.170-test: IGRAJ slot"));
  assert.ok(chunk.includes("slot-zakovica") && chunk.includes("display: none"));
  assert.ok(chunk.includes("slot-lampa-treper"));
  assert.ok(!/inset 0 0 0 2px color-mix\(in oklab, var\(--color-gold\)/.test(
    chunk.slice(chunk.indexOf("slot-kolo-okvir"), chunk.indexOf("slot-kolo-okvir") + 500),
  ), "no thick gold ring on okvir in 170 overrides");
});

test("BLAGO plaque marked and optically centred in CSS", () => {
  const slot = read("src/components/game/SlotScreen.tsx");
  const css = read("src/styles.css");
  assert.ok(slot.includes('data-testid="slot-ploca"'));
  assert.ok(slot.includes(">BLAGO<") || slot.includes(">BLAGO</"));
  const chunk = css.slice(css.indexOf("0.9.170-test: IGRAJ slot"));
  assert.ok(chunk.includes("padding-left: calc(0.7rem + 0.28em)"));
  assert.ok(chunk.includes("letter-spacing: 0.28em"));
  assert.ok(chunk.includes("translateX(-50%)"));
});

test("payline markers symmetric gutters left and right", () => {
  const reel = read("src/components/game/SlotReel.tsx");
  const css = read("src/styles.css");
  assert.ok(reel.includes("data-pay-symmetric"));
  assert.ok(reel.includes('side="l"') && reel.includes('side="d"'));
  assert.ok(reel.includes("--pay-gutter"));
  assert.ok(reel.includes("pay-tocke-l") && reel.includes("pay-tocke-d"));
  const chunk = css.slice(css.indexOf("0.9.170-test: IGRAJ slot"));
  assert.ok(chunk.includes("--pay-gutter: 1.4rem"));
  assert.ok(chunk.includes(".pay-tocke-l") && chunk.includes(".pay-tocke-d"));
});

test("0.9.172: info row → ZAVRTI → fixed bottom dock (chips + tools)", () => {
  const slot = read("src/components/game/SlotScreen.tsx");
  assert.ok(slot.includes('data-testid="zavrti-slot"'));
  assert.ok(slot.includes("slot-dock-172"));
  const info = slot.indexOf("slot-dock-info");
  const zavrtiSlot = slot.indexOf('className="slot-zavrti-slot"');
  const zavrtiBtn = slot.indexOf('data-testid="zavrti"');
  const dno = slot.indexOf('data-testid="slot-dock-dno"');
  const chips = slot.indexOf("ulozi-red");
  const tools = slot.indexOf("slot-alat-red");
  assert.ok(info > 0 && zavrtiSlot > info, "stake/energy row immediately above ZAVRTI");
  assert.ok(zavrtiBtn > zavrtiSlot, "ZAVRTI button inside reserved slot");
  assert.ok(dno > zavrtiBtn, "bottom dock after ZAVRTI");
  assert.ok(chips > dno && tools > chips, "chips then tools inside bottom dock");
  assert.ok(!slot.includes('className="slot-dock-tail"'), "no flexible tail under the dock");
});

test("0.9.172: ZAVRTI centre anchored from bottom nav (old ×2..×15 strip), reel absorbs space", () => {
  const css = read("src/styles.css");
  const i = css.indexOf("0.9.172-test: ZAVRTI anchored from bottom");
  assert.ok(i > 0);
  const chunk = css.slice(i);
  // measured: 0.9.166 strip centre 254px above webview bottom = 12rem above 62px nav
  assert.ok(chunk.includes("--zavrti-iznad-nava: 12rem"), "anchor distance");
  assert.ok(chunk.includes("--slot-host-pb: max(0.4rem, env(safe-area-inset-bottom"), "safe-area aware");
  assert.ok(
    chunk.includes("--dock-dno-h: calc(var(--zavrti-iznad-nava) - (var(--zavrti-slot-h) / 2) - var(--slot-host-pb))"),
    "dock height derived so spin centre = anchor",
  );
  const dno = chunk.slice(chunk.indexOf(".slot-dock-172 .slot-dock-dno{"));
  assert.ok(dno.includes("flex: 0 0 var(--dock-dno-h)") && dno.includes("max-height: var(--dock-dno-h)"), "fixed height");
  assert.ok(dno.includes("overflow-y: auto"), "extra content scrolls instead of moving ZAVRTI");
  const omot = chunk.slice(chunk.indexOf(".slot-fx-host .slot-kolo-omot{"));
  assert.ok(omot.includes("flex: 1 1 0") && omot.includes("max-height: none"), "reel area flexes, no vh cap");
  assert.ok(!chunk.includes("68vh"), "no viewport-percentage anchor (failed on device in 0.9.171)");
  assert.ok(chunk.includes("@media (max-height: 600px)"), "short-screen fallback only below 600px");
});

test("HUD resources flattened: no coloured chip rings in 170 CSS", () => {
  const css = read("src/styles.css");
  const chunk = css.slice(css.indexOf("0.9.170-test: IGRAJ slot"));
  assert.ok(chunk.includes("header .hud-resursi"));
  assert.ok(chunk.includes("box-shadow: none !important"));
  assert.ok(chunk.includes("chip-zlato"));
  assert.ok(chunk.includes("header .xp-traka"));
  assert.ok(chunk.includes("height: 1.15rem"));
});

test("compact dock keeps bonus/turbo/kupi and 44px targets", () => {
  const slot = read("src/components/game/SlotScreen.tsx");
  const css = read("src/styles.css");
  assert.ok(slot.includes("slot-alat-red"));
  assert.ok(slot.includes("BONUS") && slot.includes("KnjigaTraka"));
  assert.ok(slot.includes("kupiBesplatne"));
  const chunk = css.slice(css.indexOf("0.9.170-test: IGRAJ slot"));
  assert.ok(chunk.includes("min-height: 2.75rem"));
  assert.ok(chunk.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(chunk.includes("slot-lampa") && chunk.includes("animation: none"));
});
