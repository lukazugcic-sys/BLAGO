/**
 * 0.9.175: podaci ukrasa obzora (ograda naselja, stabla, kaktusi, grmlje, rasute biljke)
 * izdvojeni iz KaubaObzor.tsx bez promjene, da ih stokaKarta može zaobići (konji ne stoje pod stablom).
 */
import { uOboru } from "./obor";
import { CELIJA_H, CELIJA_W, CESTA, PARCELE, ZGRADA_H, okvirNaselja, uRomu } from "./ulicaRaspored";

type Tocka2 = { x: number; y: number };

/** 0.9.174: ukras (stablo/kaktus/grm) ne stoji u oboru tora niti krošnjom prekriva goveda. */
export const izvanObora = (p: Tocka2) => !uOboru(p.x, p.y, 18) && !uOboru(p.x, p.y - 40, 0);

function omot(pts: Tocka2[]) {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Tocka2, a: Tocka2, b: Tocka2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Tocka2[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Tocka2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, pt) <= 0) upper.pop();
    upper.push(pt);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function odMak(p: Tocka2, c: Tocka2, d: number): Tocka2 {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: p.x + (dx / len) * d, y: p.y + (dy / len) * d };
}

const SREDIS = PARCELE.reduce(
  (a, p) => ({ x: a.x + p.x / PARCELE.length, y: a.y + p.y / PARCELE.length }),
  { x: 0, y: 0 },
);

const OMOT = omot(
  PARCELE.flatMap((p) => [
    { x: p.x, y: p.y - ZGRADA_H / 2 - 46 },
    { x: p.x + CELIJA_W / 2 + 50, y: p.y },
    { x: p.x, y: p.y + CELIJA_H / 2 + 54 },
    { x: p.x - CELIJA_W / 2 - 50, y: p.y },
  ]),
);

export const NASELJE = (() => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of PARCELE) {
    minX = Math.min(minX, p.x - CELIJA_W / 2);
    maxX = Math.max(maxX, p.x + CELIJA_W / 2);
    minY = Math.min(minY, p.y - ZGRADA_H);
    maxY = Math.max(maxY, p.y + CELIJA_H / 2);
  }
  return { minX: minX - 280, minY: minY - 200, maxX: maxX + 180, maxY: maxY + 160 };
})();

function ulicniTrag(t: number) {
  const a = CESTA[0];
  const b = CESTA[1];
  const c = CESTA[2];
  const d = CESTA[3];
  if (!a || !b || !c || !d) return "";
  const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  const q = { x: d.x + (c.x - d.x) * t, y: d.y + (c.y - d.y) * t };
  return `${p.x},${p.y} ${q.x},${q.y}`;
}

export const TRAGOVI = [0.38, 0.62].map(ulicniTrag);


export const OBZOR = (() => {
  const sjever = CESTA[0] && CESTA[1] ? { x: (CESTA[0].x + CESTA[1].x) / 2, y: (CESTA[0].y + CESTA[1].y) / 2 } : SREDIS;
  const juzni = CESTA[2] && CESTA[3] ? { x: (CESTA[2].x + CESTA[3].x) / 2, y: (CESTA[2].y + CESTA[3].y) / 2 } : SREDIS;
  let idx = 0;
  let best = Infinity;
  OMOT.forEach((p, i) => {
    const dist = Math.hypot(p.x - juzni.x, p.y - juzni.y);
    if (dist < best) {
      best = dist;
      idx = i;
    }
  });
  const dx = sjever.x - juzni.x;
  const dy = sjever.y - juzni.y;
  const len = Math.hypot(dx, dy) || 1;
  const g = { x: juzni.x + dx * 0.3, y: juzni.y + dy * 0.3 };
  const px = (dy / len) * 38;
  const py = (-dx / len) * 38;
  const kapija = { x: g.x, y: g.y, x1: g.x - px, y1: g.y - py, x2: g.x + px, y2: g.y + py };
  const vrh = OMOT[idx] ?? SREDIS;
  const slobodno = (x: number, y: number) => PARCELE.every((p) => !uRomu(x, y, p));
  const trazi = (baza: Tocka2 | undefined, koraci: Array<[number, number]>): Tocka2 | null => {
    if (!baza) return null;
    for (const [ox, oy] of koraci) {
      const q = { x: baza.x + ox, y: baza.y + oy };
      if (slobodno(q.x, q.y)) return q;
    }
    return null;
  };
  const kuca = PARCELE.find((p) => p.id === "kuca");
  const farma = PARCELE.find((p) => p.id === "farma");
  const staja = PARCELE.find((p) => p.id === "staja");
  const cvijet = trazi(kuca, [
    [70, 24],
    [-70, 22],
    [64, -8],
    [-62, 12],
  ]);
  const cvijet2 = trazi(kuca, [
    [-70, 22],
    [76, -6],
    [58, 30],
  ]);
  const zivFarma = trazi(farma, [
    [70, 20],
    [-70, 18],
    [64, -8],
    [0, 52],
  ]);
  const zivStaja = trazi(staja, [
    [-70, 18],
    [70, 16],
    [-64, -6],
    [0, 52],
  ]);
  const potok = trazi({ x: 300, y: 620 }, [
    [0, 0],
    [40, 0],
    [-30, 12],
    [80, -6],
    [0, 20],
  ]) ?? { x: 300, y: 620 };
  const n = OMOT.length;
  const sve: Tocka2[] = [];
  for (let i = 0; i < n; i++) {
    const a = OMOT[i]!;
    const b = OMOT[(i + 1) % n]!;
    const dulj = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const steps = Math.max(1, Math.ceil(dulj / 36));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      sve.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  const van = sve.map((p) => Math.hypot(p.x - vrh.x, p.y - vrh.y) >= 64);
  let start = van.findIndex((ok, i) => ok && !van[(i + van.length - 1) % van.length]);
  if (start < 0) start = 0;
  const linije: Tocka2[][] = [];
  let cur: Tocka2[] = [];
  for (let k = 0; k < sve.length; k++) {
    const i = (start + k) % sve.length;
    if (!van[i]) {
      if (cur.length > 1) linije.push(cur);
      cur = [];
      continue;
    }
    cur.push(sve[i]!);
  }
  if (cur.length > 1) linije.push(cur);
  const niz = (linija: Tocka2[], ox = 0, oy = 0) =>
    linija
      .map((p, i) => {
        const j = Math.sin(i * 1.7) * 2.4;
        const k = Math.cos(i * 1.15) * 1.6;
        return `${Math.round(p.x + ox + j)},${Math.round(p.y + oy + k)}`;
      })
      .join(" ");
  return {
    kapija,
    gore: linije.map((l) => niz(l)),
    dolje: linije.map((l) => niz(l, 3, 2)),
    stupovi: OMOT.filter((_, i) => i !== idx),
    stabla: OMOT.filter((_, i) => i !== idx).map((p) => odMak(p, SREDIS, 34)),
    kaktusi: OMOT.filter((_, i) => i % 2 === 0).map((p) => odMak(p, SREDIS, 96)),
    grmlje: OMOT.filter((_, i) => i % 2 === 1 && i !== idx).map((p) => odMak(p, SREDIS, 58)),
    cvijet,
    cvijet2: cvijet2 && cvijet && cvijet2.x === cvijet.x && cvijet2.y === cvijet.y ? null : cvijet2,
    zivFarma,
    zivStaja,
    potok,
  };
})();

export const RASUTE = (() => {
  const out: { x: number; y: number; tip: number; sc: number }[] = [];
  let s = 91;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const o = okvirNaselja();
  for (let i = 0; i < 90 && out.length < 24; i++) {
    const x = o.minX - 30 + rnd() * (o.w + 60);
    const y = o.minY - 20 + rnd() * (o.h + 40);
    if (PARCELE.some((p) => Math.abs(p.x - x) / (CELIJA_W / 2) + Math.abs(p.y - y) / (CELIJA_H / 2) < 1.15)) continue;
    if (!izvanObora({ x, y })) continue;
    out.push({ x, y, tip: i % 5, sc: 0.7 + (i % 4) * 0.16 });
  }
  return out;
})();
