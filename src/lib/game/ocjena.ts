import { BLAGO } from "./constants";
import { KNJIGA_PLIJEN } from "./knjiga";
import { PAY_LINIJE } from "./slotFx";
import { JACKPOT_BONUS, linijaMnozitelj, minNiz } from "./tuning";
import type { Dobitak, SimbolId } from "./types";

export type OcjenaUlaz = {
  ulog: number;
  pojacalo: number;
  prestige: number;
  streak: number;
  event: number;
  bonus: boolean;
};

export type OcjenaVrtnje = Dobitak & {
  jackpot: boolean;
  polja: number[];
  linijePolja: number[][];
  celije: number;
};

/** Čisti obračun linija. Ne dira kasu. */
export function ocijeniVrtnju(simboli: readonly SimbolId[], ulaz: OcjenaUlaz): OcjenaVrtnje {
  let zlato = 0;
  let dijamanti = 0;
  let energija = 0;
  let stitovi = 0;
  let drvo = 0;
  let kamen = 0;
  let zeljezo = 0;
  let linije = 0;
  let jackpot = false;
  let celije = 0;
  const polja: number[] = [];
  const linijePolja: number[][] = [];

  for (const linija of PAY_LINIJE) {
    let targetSymbol: SimbolId = simboli[linija[0]!]!;
    if (targetSymbol === "wild") {
      for (let i = 1; i < 5; i++) {
        if (simboli[linija[i]!] !== "wild") {
          targetSymbol = simboli[linija[i]!]!;
          break;
        }
      }
    }
    if (targetSymbol === "skull" || targetSymbol === "knjiga") continue;

    let consecutiveCount = 0;
    for (let i = 0; i < 5; i++) {
      const cell = simboli[linija[i]!]!;
      if (cell === targetSymbol || cell === "wild") consecutiveCount++;
      else break;
    }

    if (consecutiveCount < minNiz(targetSymbol)) continue;
    linije++;
    const isAllWilds = targetSymbol === "wild";
    const isJackpot = consecutiveCount === 5;
    if (isJackpot) jackpot = true;
    const detalji = isAllWilds ? BLAGO.gem : BLAGO[targetSymbol];
    const multiplier = linijaMnozitelj(consecutiveCount);
    const jackpotBonus = isJackpot ? JACKPOT_BONUS : 1;
    celije += consecutiveCount;

    if (targetSymbol === "shield" && !isAllWilds) {
      stitovi += (ulaz.ulog >= 10 ? 2 : 1) * Math.max(1, consecutiveCount - 1);
    } else if (targetSymbol === "energy" && !isAllWilds) {
      const vrtnje = consecutiveCount >= 3 ? consecutiveCount : 0;
      energija += vrtnje * Math.max(1, ulaz.ulog);
    } else if (targetSymbol === "gem" || isAllWilds) {
      dijamanti += Math.max(
        1,
        Math.floor(
          (isAllWilds ? 2 : 1) *
            (1 + ulaz.ulog * 0.15) *
            multiplier *
            jackpotBonus *
            ulaz.prestige *
            ulaz.streak *
            ulaz.event,
        ),
      );
    } else {
      const kolicina = Math.floor(
        detalji.baza *
          ulaz.ulog *
          multiplier *
          jackpotBonus *
          (1 + ulaz.pojacalo) *
          ulaz.prestige *
          ulaz.streak *
          ulaz.event,
      );
      if (targetSymbol === "gold") zlato += kolicina;
      else if (detalji.tip === "drvo") drvo += kolicina;
      else if (detalji.tip === "kamen") kamen += kolicina;
      else if (detalji.tip === "zeljezo") zeljezo += kolicina;
    }
    const odrez = linija.slice(0, consecutiveCount);
    for (const idx of odrez) polja.push(idx);
    linijePolja.push(odrez);
  }

  if (ulaz.bonus) {
    zlato = Math.floor(zlato * KNJIGA_PLIJEN);
    dijamanti = dijamanti > 0 ? Math.max(1, Math.floor(dijamanti * KNJIGA_PLIJEN)) : 0;
    drvo = Math.floor(drvo * KNJIGA_PLIJEN);
    kamen = Math.floor(kamen * KNJIGA_PLIJEN);
    zeljezo = Math.floor(zeljezo * KNJIGA_PLIJEN);
  }

  return { zlato, dijamanti, energija, stitovi, drvo, kamen, zeljezo, linije, jackpot, polja, linijePolja, celije };
}
