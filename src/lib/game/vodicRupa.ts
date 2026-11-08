export type Rupa = { l: number; t: number; r: number; b: number };

export type Kutija = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width?: number;
  height?: number;
};

/** Isti razmak sa sve četiri strane. Ne dodaje visinu trake. */
export const VODIC_RUPA_PAD = 8;

/**
 * Rupa u koordinatama overlaya: cilj.getBoundingClientRect minus overlay.getBoundingClientRect.
 * Ako overlay ne počinje u (0, 0) (safe-area, visualViewport), oduzimanje drži rupu na cilju.
 */
export function rupaIzRect(cilj: Kutija, overlay: Kutija, pad = VODIC_RUPA_PAD): Rupa | null {
  const w = cilj.width ?? cilj.right - cilj.left;
  const h = cilj.height ?? cilj.bottom - cilj.top;
  if (w < 2 || h < 2) return null;
  const l = cilj.left - overlay.left - pad;
  const t = cilj.top - overlay.top - pad;
  const r = cilj.right - overlay.left + pad;
  const b = cilj.bottom - overlay.top + pad;
  if (r - l < 16 || b - t < 16) return null;
  return { l, t, r, b };
}
