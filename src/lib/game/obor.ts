/**
 * 0.9.174: obor (ograđeni prostor za goveda) oko tora. Čista geometrija prikaza,
 * izvedena iz parcele tora; ništa se ne sprema.
 */
import { PARCELE } from "./ulicaRaspored";

type Tocka = { x: number; y: number };

/** Središte romba je (tor.x + dx, tor.y + dy); poluosi a (vodoravno) i b (okomito). */
export const OBOR = { dx: -22, dy: 92, a: 172, b: 112 };

let poly: Tocka[] | null = null;
/** Osmerokut izometrijskog romba (odrezani vrhovi), stražarnica tora u stražnjem kutu. */
export function oborPoligon(): Tocka[] {
  if (poly) return poly;
  const tor = PARCELE.find((p) => p.id === "tor");
  if (!tor) return (poly = []);
  const c = { x: tor.x + OBOR.dx, y: tor.y + OBOR.dy };
  const { a, b } = OBOR;
  const k = 0.2;
  const vrh = [
    { x: c.x, y: c.y - b },
    { x: c.x + a, y: c.y },
    { x: c.x, y: c.y + b },
    { x: c.x - a, y: c.y },
  ];
  const out: Tocka[] = [];
  for (let i = 0; i < 4; i++) {
    const p = vrh[i]!;
    const n = vrh[(i + 1) % 4]!;
    out.push({ x: Math.round(p.x + (n.x - p.x) * k), y: Math.round(p.y + (n.y - p.y) * k) });
    out.push({ x: Math.round(n.x + (p.x - n.x) * k), y: Math.round(n.y + (p.y - n.y) * k) });
  }
  return (poly = out);
}

export function uPoligonu(p: Tocka, poly: readonly Tocka[]) {
  let in_ = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) in_ = !in_;
  }
  return in_;
}

function dSeg(p: Tocka, a: Tocka, b: Tocka) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

/** Udaljenost do ruba poligona. */
export function dRuba(p: Tocka, poly: readonly Tocka[]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, dSeg(p, poly[i]!, poly[(i + 1) % poly.length]!));
  return d;
}

/** true ako je točka u oboru ili bliže od `rub` njegovoj ogradi (za ukrase: stabla, kaktusi, grmlje). */
export function uOboru(x: number, y: number, rub = 0) {
  const o = oborPoligon();
  if (o.length < 3) return false;
  const p = { x, y };
  return uPoligonu(p, o) || dRuba(p, o) < rub;
}
