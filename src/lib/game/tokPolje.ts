/**
 * Polje smjerova po cestama.
 * Slaže se samo kad se ključ ceste promijeni. Tick ga ne dira.
 * Hod ga još ne sluša: ljudi idu starom stazom.
 */
const CELIJA = 32;
const MAX_W = 96;
const MAX_H = 64;

export type TokRuta = { xy: Float32Array; n: number };

export class TokPolje {
  dx = new Float32Array(0);
  dy = new Float32Array(0);
  w = 0;
  h = 0;
  ox = 0;
  oy = 0;
  private kljuc = "";

  /** True samo kad je polje nanovo složeno. Isti ključ ne dira nizove. */
  slozi(kljuc: string, rute: readonly TokRuta[]): boolean {
    if (kljuc === this.kljuc) return false;
    this.kljuc = kljuc;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (let r = 0; r < rute.length; r++) {
      const ruta = rute[r]!;
      const n = ruta.n;
      const xy = ruta.xy;
      for (let i = 0; i < n; i++) {
        const x = xy[i * 2]!;
        const y = xy[i * 2 + 1]!;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        any = true;
      }
    }
    if (!any) {
      this.w = 0;
      this.h = 0;
      this.dx = new Float32Array(0);
      this.dy = new Float32Array(0);
      return true;
    }
    minX -= CELIJA;
    minY -= CELIJA;
    maxX += CELIJA;
    maxY += CELIJA;
    const w = Math.min(MAX_W, Math.max(1, Math.ceil((maxX - minX) / CELIJA)));
    const h = Math.min(MAX_H, Math.max(1, Math.ceil((maxY - minY) / CELIJA)));
    const dx = new Float32Array(w * h);
    const dy = new Float32Array(w * h);
    for (let r = 0; r < rute.length; r++) {
      const ruta = rute[r]!;
      const n = ruta.n;
      const xy = ruta.xy;
      for (let i = 1; i < n; i++) {
        const x0 = xy[(i - 1) * 2]!;
        const y0 = xy[(i - 1) * 2 + 1]!;
        const x1 = xy[i * 2]!;
        const y1 = xy[i * 2 + 1]!;
        const len = Math.hypot(x1 - x0, y1 - y0);
        if (len < 1e-3) continue;
        const ux = (x1 - x0) / len;
        const uy = (y1 - y0) / len;
        const steps = Math.max(1, Math.ceil(len / (CELIJA * 0.5)));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          otisni(dx, dy, w, h, minX, minY, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, ux, uy);
        }
      }
    }
    this.dx = dx;
    this.dy = dy;
    this.w = w;
    this.h = h;
    this.ox = minX;
    this.oy = minY;
    return true;
  }

  /** Piše u postojeće nizove. Ne alocira. */
  smjer(x: number, y: number, outX: Float32Array, outY: Float32Array, i: number) {
    if (this.w === 0) {
      outX[i] = 0;
      outY[i] = 0;
      return;
    }
    const cx = (x - this.ox) / CELIJA;
    const cy = (y - this.oy) / CELIJA;
    const ix = cx < 0 ? -1 : cx | 0;
    const iy = cy < 0 ? -1 : cy | 0;
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) {
      outX[i] = 0;
      outY[i] = 0;
      return;
    }
    const k = iy * this.w + ix;
    outX[i] = this.dx[k]!;
    outY[i] = this.dy[k]!;
  }
}

function otisni(
  dx: Float32Array,
  dy: Float32Array,
  w: number,
  h: number,
  ox: number,
  oy: number,
  x: number,
  y: number,
  ux: number,
  uy: number,
) {
  const cx = (x - ox) / CELIJA;
  const cy = (y - oy) / CELIJA;
  const ix = cx < 0 ? -1 : cx | 0;
  const iy = cy < 0 ? -1 : cy | 0;
  for (let oy2 = -1; oy2 <= 1; oy2++) {
    for (let ox2 = -1; ox2 <= 1; ox2++) {
      const gx = ix + ox2;
      const gy = iy + oy2;
      if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
      const k = gy * w + gx;
      if (dx[k] !== 0 || dy[k] !== 0) continue;
      dx[k] = ux;
      dy[k] = uy;
    }
  }
}
