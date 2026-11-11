import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const slot = readFileSync(new URL("../src/components/game/SlotScreen.tsx", import.meta.url), "utf8");
assert.match(slot, /BONUS/);
assert.match(slot, /slot-bonus/);
assert.match(slot, /BESPLATNE_ZNAK_DIJAMANT/);
assert.match(slot, /EXPAND_ZNAKOVI/);
assert.match(slot, /kupiBesplatne\(bonusZnak\)/);
assert.match(slot, /aria-label="Bonus izbornik"/);
// 0.9.172: Znak kupnja se gasi i kad nema dijamanata za skaliranu cijenu
assert.match(slot, /disabled=\{\(!plati && zakljucan\) \|\| !mozeKupitiZnak\}/);
assert.doesNotMatch(slot, /plati && !mozeKupiti/);
assert.doesNotMatch(slot, /KUPI \$\{kupiN\}/);

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.match(css, /\.slot-bonus\s*\{/);
assert.match(css, /\.slot-bonus-znak\.on/);
assert.match(css, /\.slot-bonus-plati/);

const knjiga = readFileSync(new URL("../src/lib/game/knjiga.ts", import.meta.url), "utf8");
assert.match(knjiga, /BESPLATNE_ZNAK_DIJAMANT = 1/);

const village = readFileSync(new URL("../src/components/game/VillageScreen.tsx", import.meta.url), "utf8");
assert.match(village, /KaubaScena/);
assert.match(village, /KaubaDio/);
assert.match(village, /AlmanahSloj/);
assert.doesNotMatch(village, /MrezaSela/);
assert.doesNotMatch(village, /KaubaKolo/);

const slotHook = readFileSync(new URL("../src/lib/hooks/useSlotMachine.ts", import.meta.url), "utf8");
assert.match(slotHook, /besplatneUlog \|\| KNJIGA_ULOG/);
assert.match(slotHook, /winStreakMnozitelj/);
assert.match(slotHook, /stopDelay = turboRezim \? 110 : 220/);
assert.doesNotMatch(slotHook, /winStreakMultiplier = 1/);

const tuning = readFileSync(new URL("../src/lib/game/tuning.ts", import.meta.url), "utf8");
assert.match(tuning, /export function winStreakMnozitelj/);

const store = readFileSync(new URL("../src/lib/stores/gameStore.ts", import.meta.url), "utf8");
assert.match(store, /s\.winStreak === prev\.winStreak/);
assert.match(store, /s\.ukupnoZlata === prev\.ukupnoZlata/);
