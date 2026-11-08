import { posadiExpandStupove, posadiKnjige, rasponStupova } from "./knjiga";
import { PAY_LINIJE } from "./slotFx";
import { LUCKY_WILD_P, rasponNiza } from "./tuning";
import { SVO_BLAGO } from "./constants";
import type { SimbolId } from "./types";

export type Bacanje = {
  pool: readonly SimbolId[];
  lucky: boolean;
  wildBoost: number;
  sansa: number;
  expand: SimbolId | null;
};

/** Isti red bacanja kao živa vrtnja. rng je jedini izvor slučaja. */
export function baciKolo(rng: () => number, u: Bacanje): SimbolId[] {
  let simboli: SimbolId[] = Array.from({ length: 15 }, () => {
    const luckyWild = u.lucky && rng() < LUCKY_WILD_P;
    if (luckyWild || rng() < u.wildBoost) return "wild";
    return u.pool[Math.floor(rng() * u.pool.length)] ?? "gold";
  });

  if (u.lucky) {
    const extra = 3 + Math.floor(rng() * 3);
    for (let k = 0; k < extra; k++) {
      simboli[Math.floor(rng() * 15)] = "wild";
    }
  }

  if (!u.expand && rng() < u.sansa) {
    const ponuda = SVO_BLAGO.filter((s) => s !== "skull" && s !== "gem" && s !== "knjiga");
    const dob = ponuda[Math.floor(rng() * ponuda.length)] ?? "gold";
    const linija = PAY_LINIJE[Math.floor(rng() * PAY_LINIJE.length)]!;
    for (const i of rasponNiza(dob, rng)) simboli[linija[i]!] = dob;
  }

  if (!u.expand) simboli = posadiKnjige(simboli, undefined, rng);
  else {
    simboli = posadiExpandStupove(simboli, u.expand, rasponStupova(u.expand, rng), rng);
    simboli = posadiKnjige(simboli, undefined, rng, u.expand);
  }
  return simboli;
}
