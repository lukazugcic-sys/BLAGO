import type { Dobitak, SimbolId } from "./types";

export const KNJIGA_P = 0.006;
export const KNJIGA_SKUP_CILJ = 5;
export const BESPLATNE_NASUMICE_P = 0.011;
export const BESPLATNE_NASUMICE_N = 4;
export const KNJIGA_ULOG = 3;
export const KNJIGA_PLIJEN = 0.62;
export const KNJIGA_ZNACKA_PLUS = 2;
export const BESPLATNE_KUPI_BAZA = 15;
export const BESPLATNE_KUPI_SKOK = 3;
export const BESPLATNE_KUPI = {
  dijamanti: BESPLATNE_KUPI_BAZA,
  n: 8,
} as const;

export function cijenaBesplatnih(razina: number): number {
  const lv = Math.max(1, Math.floor(razina));
  return BESPLATNE_KUPI_BAZA + BESPLATNE_KUPI_SKOK * Math.floor(lv / 3);
}

export const EXPAND_ZNAKOVI: readonly SimbolId[] = [
  "wood",
  "stone",
  "iron",
  "gold",
  "energy",
];

export function prazanDobitak(): Dobitak {
  return {
    zlato: 0,
    dijamanti: 0,
    energija: 0,
    stitovi: 0,
    drvo: 0,
    kamen: 0,
    zeljezo: 0,
    linije: 0,
  };
}

export function zbrojiDobitak(a: Dobitak, b: Dobitak): Dobitak {
  return {
    zlato: a.zlato + b.zlato,
    dijamanti: a.dijamanti + b.dijamanti,
    energija: a.energija + b.energija,
    stitovi: a.stitovi + b.stitovi,
    drvo: a.drvo + b.drvo,
    kamen: a.kamen + b.kamen,
    zeljezo: a.zeljezo + b.zeljezo,
    linije: a.linije + b.linije,
  };
}

export function knjigaBroj(simboli: readonly SimbolId[]): number {
  let n = 0;
  for (const s of simboli) if (s === "knjiga") n += 1;
  return n;
}

export function vrtnjeZaKnjige(n: number): number {
  if (n >= 5) return 10;
  if (n >= 4) return 8;
  if (n >= 3) return 6;
  return 0;
}

export function izaberiExpand(rng: () => number = Math.random): SimbolId {
  return EXPAND_ZNAKOVI[Math.floor(rng() * EXPAND_ZNAKOVI.length)] ?? "gold";
}

export function jeExpandZnak(v: unknown): v is SimbolId {
  return typeof v === "string" && (EXPAND_ZNAKOVI as readonly string[]).includes(v);
}

export function posadiKnjige(
  simboli: SimbolId[],
  p: number = KNJIGA_P,
  rng: () => number = Math.random,
  skip?: SimbolId | null,
): SimbolId[] {
  const out = simboli.slice();
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    if (cur === "skull" || cur === "knjiga" || (skip && cur === skip)) continue;
    if (rng() < p) out[i] = "knjiga";
  }
  return out;
}

export function expandStupove(
  simboli: SimbolId[],
  expand: SimbolId,
): { simboli: SimbolId[]; polja: number[] } {
  const out = simboli.slice();
  const polja: number[] = [];
  for (let col = 0; col < 5; col++) {
    const cells = [col, col + 5, col + 10];
    if (!cells.some((i) => out[i] === expand)) continue;
    for (const i of cells) {
      if (out[i] !== expand) out[i] = expand;
      polja.push(i);
    }
  }
  return { simboli: out, polja };
}

/** Jaki 2–3, slabi 3. Četiri i pet stupaca rijetki. Energija 4, pet rijetko. */
export function rasponStupova(id: SimbolId, rng: () => number = Math.random): number {
  const r = rng();
  if (id === "energy") return r > 0.96 ? 5 : 4;
  if (id === "wood" || id === "stone") {
    if (r > 0.97) return 5;
    if (r > 0.9) return 4;
    return 3;
  }
  if (r > 0.98) return 5;
  if (r > 0.93) return 4;
  if (r > 0.62) return 3;
  return 2;
}

export function posadiExpandStupove(
  simboli: SimbolId[],
  expand: SimbolId,
  n: number,
  rng: () => number = Math.random,
): SimbolId[] {
  const out = simboli.slice();
  const cols = [0, 1, 2, 3, 4];
  for (let i = cols.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = cols[i]!;
    cols[i] = cols[j]!;
    cols[j] = a;
  }
  const take = Math.min(5, Math.max(1, Math.floor(n)));
  for (let c = 0; c < take; c++) {
    const col = cols[c]!;
    const row = Math.floor(rng() * 3);
    out[row * 5 + col] = expand;
  }
  return out;
}
