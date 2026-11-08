import type { SimbolId } from "./types";

/** Named reel FX layers — add a class here, then CSS. */
export const REEL_FX = ["veil", "dust", "streak", "click"] as const;
export type ReelFxId = (typeof REEL_FX)[number];

/** Filler strip for a column. Deterministic so spin doesn't flicker. */
const FILL: SimbolId[] = ["wood", "stone", "iron", "gold", "energy", "wild", "shield", "gem", "knjiga"];

export function ghostCol(col: number): SimbolId[] {
  return [0, 1, 2].map((row) => FILL[(col * 3 + row * 4 + 1) % FILL.length]!);
}

/**
 * 5 linija kao Burning Hot / Book of Ra Classic:
 * 1 sredina, 2 gore, 3 dolje, 4 V, 5 Λ.
 */
export const PAY_LINIJE: readonly (readonly number[])[] = [
  [5, 6, 7, 8, 9],
  [0, 1, 2, 3, 4],
  [10, 11, 12, 13, 14],
  [0, 6, 12, 8, 4],
  [10, 6, 2, 8, 14],
] as const;

export const PAY_BOJE = ["#e85d5d", "#e8b04a", "#5ec85a", "#5ec8ff", "#d48cff"] as const;

/** Top→bottom on both cabinet sides: 2, 4, 1, 5, 3 */
export const PAY_TOCKE_RED = [1, 3, 0, 4, 2] as const;

export function payIdx(line: readonly number[]): number {
  return PAY_LINIJE.findIndex(
    (p) => p.length >= line.length && line.every((v, i) => p[i] === v),
  );
}

/** Četiri s lijeva, peti ne. Null ako nije blizu. */
export function simbolSkoro(simboli: readonly SimbolId[]): SimbolId | null {
  for (const linija of PAY_LINIJE) {
    let cilj = simboli[linija[0]!]!;
    if (cilj === "wild") {
      for (let i = 1; i < linija.length; i++) {
        const s = simboli[linija[i]!]!;
        if (s !== "wild") {
          cilj = s;
          break;
        }
      }
    }
    if (cilj === "skull" || cilj === "knjiga") continue;
    let n = 0;
    for (let i = 0; i < linija.length; i++) {
      const s = simboli[linija[i]!]!;
      if (s === cilj || s === "wild") n++;
      else break;
    }
    if (n === 4) return cilj;
  }
  return null;
}
