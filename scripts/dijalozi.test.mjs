import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/game/dijalozi.ts", import.meta.url), "utf8");
for (const s of [
  "Valter. To je ovaj grad.",
  "Mi nismo stigli. Autobus jeste.",
  "Svi su sumnjivi. I ti.",
  "Srebrno jezero čeka. Mi kopamo.",
  "Dobar, loš, ružan. Svi plaćaju.",
  "Podne. Nema pomoći.",
  "Sedam. Kauba plaća koliko može.",
  "Derviš i smrt. Šerif i zakon.",
  "Čojstvo i junaštvo. Onda porez.",
  "Das ist Walter. To je ulica.",
  "Paklenica je Arizona. Mi smo kući.",
  "Most se ruši. Mi prelazimo.",
  "Kapetan na granici. Zakon na sedlu.",
  "Neretva nosi. Mi ne damo most.",
  "Prljavi tucet. Čista naredba.",
  "Jadran drži konje. Šerif drži zakon.",
]) {
  assert.match(src, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(src, /slice\(0, 6\)/);
assert.match(src, /KORPUS/);
