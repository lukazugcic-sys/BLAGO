import { writeFileSync } from "node:fs";
import { baciKolo } from "../src/lib/game/bacanje.ts";
import { izgradiTezinskiPool } from "../src/lib/game/constants.ts";
import { izracunajSansuZaDobitak } from "../src/lib/game/economy.ts";
import { ocijeniVrtnju } from "../src/lib/game/ocjena.ts";

function sjeme(n) {
  let s = n >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pool = izgradiTezinskiPool();
const sansa = izracunajSansuZaDobitak(0);
const ulog = 5;
const rng = sjeme(7042);
const redovi = [];
for (let i = 0; i < 4000; i++) {
  const simboli = baciKolo(rng, { pool, lucky: false, wildBoost: 0, sansa, expand: null });
  const ocjena = ocijeniVrtnju(simboli, {
    ulog,
    pojacalo: 0,
    prestige: 1,
    streak: 1,
    event: 1,
    bonus: false,
  });
  redovi.push({
    ulog,
    zlato: ocjena.zlato,
    linije: ocjena.linije,
    jackpot: ocjena.jackpot,
    dijamanti: ocjena.dijamanti,
    drvo: ocjena.drvo,
    kamen: ocjena.kamen,
    zeljezo: ocjena.zeljezo,
  });
}

writeFileSync("/workspace/native/vrtnje.json", JSON.stringify(redovi));
console.log(redovi.length);
