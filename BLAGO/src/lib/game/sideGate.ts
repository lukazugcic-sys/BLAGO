import type { Gradevine } from "./types";

/**
 * Review fix #5 — soft-gate competing side systems until the early core loop
 * sticks: spin → spend → first house (Kuća LVL ≥ 1).
 */
export const SIDE_GATE_MIN_KUCA = 1;

/** Single unlock copy shown on every soft-gated entry. */
export const SIDE_GATE_REC = "Prvo nadogradi Kuću";

export const SIDE_GATE_OPIS =
  "Zavrti, potroši u tabor, pa digneš Kuću. LVL 1 otključava sporedne staze.";

export function jeSideOtkljucan(g: Pick<Gradevine, "kuca"> | { kuca?: number } | null | undefined) {
  return (g?.kuca || 0) >= SIDE_GATE_MIN_KUCA;
}
