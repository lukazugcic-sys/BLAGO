import { indeksSimbola, SIMBOLI_GL, simbolNa, type HodStupca } from "./slotHod";
import type { SimbolId } from "./types";

/** Isti kvadrati za GLSL i WGSL. Sedam brojeva po vrhu: xy, uv, ny, blur, flash. */
export function upisiStupce(
  podaci: Float32Array,
  hod: HodStupca[],
  ghosts: SimbolId[][],
  ids: SimbolId[][],
  bw: number,
  bh: number,
) {
  const colW = bw / 5;
  const cellH = bh / 3;
  const pad = cellH * 0.07;
  const nSim = SIMBOLI_GL.length;
  let p = 0;
  for (let c = 0; c < 5; c++) {
    const hcol = hod[c];
    if (!hcol) continue;
    const prvi = Math.floor(hcol.offset);
    const frac = hcol.offset - prvi;
    const komada = hcol.mode === "idle" ? 3 : 4;
    const blur = Math.min(0.045, Math.abs(hcol.brzina) * 0.003);
    const flash = hcol.bljesak;
    for (let k = 0; k < komada; k++) {
      const id = simbolNa(hcol, ghosts[c] ?? [], ids[c] ?? [], prvi + k);
      const ti = indeksSimbola(id);
      const u0 = ti / nSim;
      const u1 = (ti + 1) / nSim;
      const x = c * colW + pad;
      const y = (k - frac) * cellH + pad;
      const qw = colW - pad * 2;
      const qh = cellH - pad * 2;
      const vrh = [
        [x, y, u0, 1, y / bh],
        [x + qw, y, u1, 1, y / bh],
        [x, y + qh, u0, 0, (y + qh) / bh],
        [x, y + qh, u0, 0, (y + qh) / bh],
        [x + qw, y, u1, 1, y / bh],
        [x + qw, y + qh, u1, 0, (y + qh) / bh],
      ];
      for (let i = 0; i < 6; i++) {
        const t = vrh[i]!;
        podaci[p++] = t[0]!;
        podaci[p++] = t[1]!;
        podaci[p++] = t[2]!;
        podaci[p++] = t[3]!;
        podaci[p++] = t[4]!;
        podaci[p++] = blur;
        podaci[p++] = flash;
      }
    }
  }
  return p;
}
