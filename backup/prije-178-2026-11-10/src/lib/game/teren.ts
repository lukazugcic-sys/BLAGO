import { CESTA, PARCELE, SVIJET, okvirNaselja, uRomu, type SitniTip } from "./ulicaRaspored";

export function stazaPoligon() {
  const a = CESTA[0];
  const b = CESTA[1];
  const c = CESTA[2];
  const d = CESTA[3];
  if (!a || !b || !c || !d) return { tijelo: "", trag: "" };
  const brez = (t: number, s: number, w: number) => Math.exp(-(((t - s) / w) ** 2));
  const tocka = (t: number) => {
    const l = { x: a.x + (d.x - a.x) * t, y: a.y + (d.y - a.y) * t };
    const r = { x: b.x + (c.x - b.x) * t, y: b.y + (c.y - b.y) * t };
    const dx = r.x - l.x;
    const dy = r.y - l.y;
    const len = Math.hypot(dx, dy) || 1;
    const wob = Math.sin(t * Math.PI * 2.2) * 16 + Math.sin(t * Math.PI * 5.5) * 5;
    const sir =
      18 +
      brez(t, 0.27, 0.07) * 18 +
      brez(t, 0.2, 0.05) * 8 +
      brez(t, 0.58, 0.06) * 11 +
      brez(t, 0.9, 0.05) * 9;
    return {
      cx: (l.x + r.x) / 2 + (dx / len) * wob,
      cy: (l.y + r.y) / 2 + (dy / len) * wob,
      nx: dx / len,
      ny: dy / len,
      sir,
    };
  };
  const van = (t: number) => {
    const p = tocka(t);
    return p.cx < -48 || p.cy < -48 || p.cx > SVIJET.w + 48 || p.cy > SVIJET.h + 48;
  };
  let t0 = 0;
  while (t0 > -1 && !van(t0)) t0 -= 0.02;
  let t1 = 1;
  while (t1 < 2 && !van(t1)) t1 += 0.02;
  const lijevo: string[] = [];
  const desno: string[] = [];
  const trag: string[] = [];
  const koraka = 48;
  for (let i = 0; i <= koraka; i++) {
    const p = tocka(t0 + ((t1 - t0) * i) / koraka);
    lijevo.push(`${Math.round(p.cx - p.nx * p.sir)},${Math.round(p.cy - p.ny * p.sir)}`);
    desno.push(`${Math.round(p.cx + p.nx * p.sir)},${Math.round(p.cy + p.ny * p.sir)}`);
    trag.push(`${Math.round(p.cx)},${Math.round(p.cy)}`);
  }
  return { tijelo: [...lijevo, ...desno.reverse()].join(" "), trag: trag.join(" ") };
}

export const STAZA = stazaPoligon();

export function zakrpa(id: string, ox: number, oy: number, rx: number, ry: number, tip: string) {
  const p = PARCELE.find((z) => z.id === id);
  if (!p) return null;
  return { x: p.x + ox, y: p.y + oy, rx, ry, tip };
}

export const ZAKRPE = [
  zakrpa("bunar", 18, 8, 46, 18, "pijesak"),
  zakrpa("kuca", -36, 14, 62, 24, "pijesak"),
  zakrpa("salun", 8, -6, 40, 16, "pijesak"),
  zakrpa("korali", 10, 70, 96, 32, "trava"),
  zakrpa("farma", 22, 30, 84, 32, "trava"),
  zakrpa("mlin", -12, 22, 54, 20, "trava"),
  zakrpa("rudnik", 20, 12, 70, 26, "kamen"),
  zakrpa("kamenolom", -8, 20, 56, 20, "kamen"),
  zakrpa("banka", 24, -8, 36, 14, "kamen"),
].filter((z) => z !== null);

export function potokTocke() {
  const korali = PARCELE.find((p) => p.id === "korali");
  const farma = PARCELE.find((p) => p.id === "farma");
  const mlin = PARCELE.find((p) => p.id === "mlin");
  if (!korali || !farma || !mlin) return "";
  const sidro = [
    { x: korali.x - 86, y: korali.y + 30 },
    { x: (korali.x + farma.x) / 2 - 22, y: (korali.y + farma.y) / 2 + 8 },
    { x: farma.x + 34, y: farma.y + 16 },
    { x: (farma.x + mlin.x) / 2 + 6, y: (farma.y + mlin.y) / 2 + 18 },
    { x: mlin.x - 40, y: mlin.y + 16 },
  ];
  const pts: string[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const seg = t * (sidro.length - 1);
    const a = Math.min(sidro.length - 2, Math.floor(seg));
    const u = seg - a;
    const p0 = sidro[a]!;
    const p1 = sidro[a + 1]!;
    let x = p0.x + (p1.x - p0.x) * u + Math.sin(t * Math.PI * 2.4) * 6;
    let y = p0.y + (p1.y - p0.y) * u + Math.sin(t * Math.PI * 3.1) * 5;
    for (let k = 0; k < 8; k++) {
      const hit = PARCELE.find((p) => uRomu(x, y, p));
      if (!hit) break;
      const dx = x - hit.x || 1;
      const dy = y - hit.y || 1;
      const len = Math.hypot(dx, dy) || 1;
      x += (dx / len) * 10;
      y += (dy / len) * 7;
    }
    pts.push(`${Math.round(x)},${Math.round(y)}`);
  }
  return pts.join(" ");
}

export const POTOK = potokTocke();

export function uzPotok() {
  const pts = POTOK.split(" ").flatMap((p) => {
    const [xs, ys] = p.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (Number.isNaN(x) || Number.isNaN(y)) return [];
    return [{ x, y }];
  });
  if (pts.length < 2) return [];
  const out: { x: number; y: number; tip: number; sc: number }[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    const n = pts[i + 1] ?? pts[i - 1];
    if (!p || !n) continue;
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const strana = i % 4 === 0 ? 1 : -1;
    const px = p.x + (-dy / len) * 16 * strana;
    const py = p.y + (dx / len) * 16 * strana;
    if (PARCELE.some((q) => uRomu(px, py, q))) continue;
    out.push({ x: px, y: py, tip: i % 3, sc: 0.42 + (i % 3) * 0.12 });
  }
  return out;
}

export function rubSikare() {
  const o = okvirNaselja();
  const mjesta: [number, number][] = [
    [o.minX + 22, o.minY + 70],
    [o.minX + 14, o.cy],
    [o.minX + 26, o.maxY - 80],
    [o.maxX - 18, o.minY + 90],
    [o.maxX - 24, o.cy + 30],
    [o.maxX - 16, o.maxY - 60],
  ];
  return mjesta.flatMap(([x, y], i) => {
    if (PARCELE.some((p) => uRomu(x, y, p))) return [];
    return [{ x, y, tip: i % 2, sc: 0.7 + (i % 3) * 0.12 }];
  });
}

export const OBALA = uzPotok();
export const SIKARA = rubSikare();

export function mrlja(cx: number, cy: number, rx: number, ry: number) {
  const pts: string[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const j = 0.78 + ((i * 3) % 5) * 0.06;
    const x = cx + Math.cos(a) * rx * j;
    const y = cy + Math.sin(a) * ry * j;
    if (PARCELE.some((p) => uRomu(x, y, p))) return "";
    pts.push(`${Math.round(x)},${Math.round(y)}`);
  }
  return pts.join(" ");
}

export function livadaTocke() {
  const a = PARCELE.find((p) => p.id === "ordinacija");
  const b = PARCELE.find((p) => p.id === "pekara");
  if (!a || !b) return "";
  return mrlja((a.x + b.x) / 2 - 20, (a.y + b.y) / 2, 48, 20);
}

export function gazTocke() {
  const a = PARCELE.find((p) => p.id === "cisterna");
  const b = PARCELE.find((p) => p.id === "rudnik");
  if (!a || !b) return [];
  const out: { x: number; y: number; r: number }[] = [];
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const x = a.x + (b.x - a.x) * t + (i % 2 === 0 ? 10 : -8);
    const y = a.y + (b.y - a.y) * t;
    if (PARCELE.some((p) => uRomu(x, y, p))) continue;
    out.push({ x, y, r: 5 + (i % 2) * 2 });
  }
  return out;
}

export function lokvaTocka() {
  const a = PARCELE.find((p) => p.id === "korali");
  const b = PARCELE.find((p) => p.id === "farma");
  if (!a || !b) return null;
  const x = (a.x + b.x) / 2 - 10;
  const y = (a.y + b.y) / 2 + 6;
  if (PARCELE.some((p) => uRomu(x, y, p))) return null;
  return { x, y };
}

export const LIVADA = livadaTocke();
export const GAZ = gazTocke();
export const LOKVA = lokvaTocka();

export function tockeOd(s: string) {
  return s.split(" ").flatMap((p) => {
    const [xs, ys] = p.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (Number.isNaN(x) || Number.isNaN(y)) return [];
    return [{ x, y }];
  });
}

export function detaljiUzCestu() {
  const trag = tockeOd(STAZA.trag);
  const voda = tockeOd(POTOK);
  let brv: { x: number; y: number; kut: number } | null = null;
  let naj = 42;
  for (let i = 0; i < trag.length; i++) {
    const t = trag[i];
    if (!t) continue;
    for (const v of voda) {
      const d = Math.hypot(t.x - v.x, t.y - v.y);
      if (d >= naj) continue;
      naj = d;
      const n = trag[i + 1] ?? trag[i - 1] ?? t;
      brv = { x: (t.x + v.x) / 2, y: (t.y + v.y) / 2, kut: (Math.atan2(n.y - t.y, n.x - t.x) * 180) / Math.PI };
    }
  }
  const kamen = trag.flatMap((t, i) => {
    if (i % 6 !== 3) return [];
    const n = trag[i + 1] ?? trag[i - 1];
    if (!n) return [];
    const dx = n.x - t.x;
    const dy = n.y - t.y;
    const len = Math.hypot(dx, dy) || 1;
    const strana = i % 12 === 3 ? 1 : -1;
    const x = t.x + (-dy / len) * 18 * strana;
    const y = t.y + (dx / len) * 18 * strana;
    if (PARCELE.some((p) => uRomu(x, y, p))) return [];
    return [{ x, y }];
  });
  return { brv, kamen };
}

export const DETALJ = detaljiUzCestu();

export function plotRanca() {
  const a = PARCELE.find((p) => p.id === "tor");
  const b = PARCELE.find((p) => p.id === "korali");
  if (!a || !b) return { zica: "", letva: "", stupovi: [] as { x: number; y: number }[] };
  const stupovi: { x: number; y: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const x = a.x + (b.x - a.x) * t + 36;
    const y = a.y + (b.y - a.y) * t + 20;
    if (PARCELE.some((p) => uRomu(x, y, p))) return { zica: "", letva: "", stupovi: [] };
    stupovi.push({ x, y });
  }
  return {
    zica: stupovi.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(" "),
    letva: stupovi.map((p) => `${Math.round(p.x)},${Math.round(p.y + 4)}`).join(" "),
    stupovi,
  };
}

export const PLOT = plotRanca();

export function kamenLokve() {
  if (!LOKVA) return [];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5;
    const x = LOKVA.x + Math.cos(a) * 28;
    const y = LOKVA.y + Math.sin(a) * 13;
    if (PARCELE.some((p) => uRomu(x, y, p))) continue;
    out.push({ x, y });
  }
  return out;
}

export const PRSTEN = kamenLokve();

export function krugRaskrizja() {
  const trag = tockeOd(STAZA.trag);
  const t = trag[Math.round((trag.length - 1) * 0.27)];
  if (!t) return null;
  if (PARCELE.some((p) => uRomu(t.x, t.y, p))) return null;
  return t;
}

export function drvoredFarma() {
  const farma = PARCELE.find((p) => p.id === "farma");
  const ord = PARCELE.find((p) => p.id === "ordinacija");
  const out: { x: number; y: number; tip: number; sc: number }[] = [];
  if (farma) {
    for (let i = 0; i < 3; i++) {
      const x = farma.x + (i - 1) * 48 + (i % 2 === 0 ? 7 : -9);
      const y = farma.y + 74 + (i % 2) * 6;
      if (PARCELE.some((p) => uRomu(x, y, p))) continue;
      out.push({ x, y, tip: i % 2, sc: 0.82 + (i % 2) * 0.16 });
    }
  }
  if (ord) {
    for (let i = 0; i < 3; i++) {
      const x = ord.x - 18 + i * 20;
      const y = ord.y + 34 + (i % 2) * 9;
      if (PARCELE.some((p) => uRomu(x, y, p))) continue;
      out.push({ x, y, tip: (i + 1) % 2, sc: 0.7 + (i % 2) * 0.12 });
    }
  }
  return out;
}

export const KRUG = krugRaskrizja();
export const DRVORED = drvoredFarma();

export function stablaUzCestu() {
  const trag = tockeOd(STAZA.trag);
  const out: { x: number; y: number; tip: number; sc: number }[] = [];
  for (let i = 2; i < trag.length - 2; i += 4) {
    const t = trag[i];
    const n = trag[i + 1];
    if (!t || !n) continue;
    if (Math.abs(i / Math.max(1, trag.length - 1) - 0.27) < 0.07) continue;
    if (i % 12 === 6) continue;
    const dx = n.x - t.x;
    const dy = n.y - t.y;
    const len = Math.hypot(dx, dy) || 1;
    const strana = i % 8 === 2 ? 1 : -1;
    const x = t.x + (-dy / len) * 28 * strana;
    const y = t.y + (dx / len) * 28 * strana;
    if (PARCELE.some((p) => uRomu(x, y, p))) continue;
    out.push({ x, y, tip: i % 2, sc: 0.72 + (i % 3) * 0.1 });
  }
  return out;
}

export const UZCESTU = stablaUzCestu();

export function rekviziti() {
  const plan: { id: string; tip: SitniTip; ox: number; oy: number }[] = [
    { id: "farma", tip: "sijeno", ox: 34, oy: 20 },
    { id: "mlin", tip: "sijeno", ox: -30, oy: 16 },
    { id: "staja", tip: "korito", ox: 32, oy: 14 },
    { id: "tor", tip: "korito", ox: -26, oy: 18 },
    { id: "salun", tip: "lampa", ox: 24, oy: 12 },
    { id: "kuca", tip: "lampa", ox: -28, oy: 16 },
    { id: "trgovina", tip: "bacva", ox: 46, oy: 22 },
    { id: "pekara", tip: "bacva", ox: -42, oy: 22 },
    { id: "rudnik", tip: "kamen", ox: 30, oy: 12 },
    { id: "kamenolom", tip: "kamen", ox: -24, oy: 14 },
  ];
  return plan.flatMap((r, i) => {
    const p = PARCELE.find((z) => z.id === r.id);
    if (!p) return [];
    const x = p.x + r.ox;
    const y = p.y + r.oy;
    if (PARCELE.some((q) => uRomu(x, y, q))) return [];
    return [{ ...r, x, y, okret: (i % 2 === 0 ? -8 : 7) }];
  });
}

export const REKVIZITI = rekviziti();

export function slobodno(x: number, y: number) {
  return PARCELE.every((p) => !uRomu(x, y, p));
}

export function uzVodu() {
  const pts = tockeOd(POTOK);
  const kamen: { x: number; y: number }[] = [];
  const trska: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const pjena: { x: number; y: number; rx: number }[] = [];
  const korito: { x: number; y: number }[] = [];
  for (let i = 1; i < pts.length - 1; i += 2) {
    const p = pts[i];
    const n = pts[i + 1];
    if (!p || !n) continue;
    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const strana = i % 4 === 1 ? 1 : -1;
    const x = p.x + (-dy / len) * 11 * strana;
    const y = p.y + (dx / len) * 11 * strana;
    if (i % 4 === 1) {
      if (slobodno(p.x, p.y)) kamen.push({ x: p.x, y: p.y });
    } else if (slobodno(x, y)) {
      trska.push({ x1: x, y1: y + 2, x2: x + strana * 1.6, y2: y - 7 });
    }
    if (i % 3 === 0) {
      const fx = p.x + (-dy / len) * 2.2;
      const fy = p.y + (dx / len) * 1.4;
      if (slobodno(fx, fy)) pjena.push({ x: fx, y: fy, rx: i % 6 === 0 ? 2.4 : 1.3 });
    }
    if (i % 5 === 2) {
      const kx = p.x + (-dy / len) * 3.2 * strana;
      const ky = p.y + (dx / len) * 2.2 * strana;
      if (slobodno(kx, ky)) korito.push({ x: kx, y: ky });
    }
  }
  return { kamen, trska, pjena, korito };
}

export const VODA = uzVodu();

export function josDetalja() {
  const na = (id: string, ox: number, oy: number) => {
    const p = PARCELE.find((z) => z.id === id);
    if (!p) return null;
    const x = p.x + ox;
    const y = p.y + oy;
    if (!slobodno(x, y)) return null;
    return { x, y };
  };
  const vrt = [0, 1, 2].flatMap((i) => {
    const t = na("travar", -8 + i * 9, 22);
    return t ? [t] : [];
  });
  return {
    strasilo: na("farma", 6, 46),
    vatra: na("lov", -18, 22),
    daske: na("pilana", 26, 16),
    vrt,
  };
}

export const JOS = josDetalja();
export const CVAT = (() => {
  const t = tockeOd(LIVADA);
  if (t.length < 3) return [];
  const x = t.reduce((s, p) => s + p.x, 0) / t.length;
  const y = t.reduce((s, p) => s + p.y, 0) / t.length;
  return [
    { x: x - 10, y: y - 2, tip: 2, sc: 0.45 },
    { x: x + 12, y: y + 4, tip: 3, sc: 0.4 },
  ].filter((p) => PARCELE.every((q) => !uRomu(p.x, p.y, q)));
})();

export const KVART = new Set(["staja", "tor", "korali", "farma", "mlin", "cisterna", "rudnik", "kamenolom", "banka"]);

export const SIPAK = (() => {
  const out: { x: number; y: number; tip: number; sc: number }[] = [];
  const od = [
    [-96, 42],
    [78, 54],
    [24, 72],
    [-48, 88],
    [120, 28],
    [-110, 70],
  ];
  for (const id of ["korali", "farma", "cisterna", "rudnik", "lov"]) {
    const p = PARCELE.find((z) => z.id === id);
    if (!p) continue;
    od.forEach(([ox, oy], i) => {
      const x = p.x + (ox ?? 0);
      const y = p.y + (oy ?? 0);
      if (PARCELE.some((q) => uRomu(x, y, q))) return;
      out.push({ x, y, tip: (out.length + i) % 4, sc: 0.5 + (i % 3) * 0.16 });
    });
  }
  return out;
})();

export function grana(od: string, ka: string) {
  const a = PARCELE.find((p) => p.id === od);
  const b = PARCELE.find((p) => p.id === ka);
  if (!a || !b) return "";
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const lijevo: string[] = [];
  const desno: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = 0.28 + (i / 6) * 0.44;
    const wob = Math.sin((i / 6) * Math.PI) * 14;
    const x = a.x + dx * t + nx * wob;
    const y = a.y + dy * t + ny * wob;
    if (PARCELE.some((p) => uRomu(x, y, p))) continue;
    const w = 5 + Math.sin((i / 6) * Math.PI) * 4;
    lijevo.push(`${Math.round(x + nx * w)},${Math.round(y + ny * w)}`);
    desno.push(`${Math.round(x - nx * w)},${Math.round(y - ny * w)}`);
  }
  if (lijevo.length < 3) return "";
  return [...lijevo, ...desno.reverse()].join(" ");
}

export const GRANE = [grana("korali", "farma"), grana("cisterna", "rudnik"), grana("salun", "pekara"), grana("salun", "lov")].filter(
  (g) => g.length > 0,
);

export const DRVECE = (
  [
    ["farma", -78, 46],
    ["mlin", 64, 36],
    ["rudnik", -86, 28],
    ["pekara", -58, 42],
    ["korali", 86, 52],
    ["staza", 48, 34],
    ["lov", -40, 60],
  ] as const
)
  .map(([id, ox, oy], i) => {
    const p = PARCELE.find((z) => z.id === id);
    if (!p) return null;
    const x = p.x + ox;
    const y = p.y + oy;
    if (PARCELE.some((q) => uRomu(x, y, q))) return null;
    return { x, y, tip: i % 2, sc: 1.05 + (i % 3) * 0.12 };
  })
  .filter((d) => d !== null);

export const NASELJA: { id: string; ime: string; rec: string; vrsta: "grad" | "naselje"; ids: string[] }[] = [
  { id: "trg", ime: "Grad", rec: "glavni", vrsta: "grad", ids: ["kuca", "ured", "blok", "bunar", "trgovina", "salun", "ordinacija"] },
  { id: "ranc", ime: "Ranč", rec: "šalje stoku", vrsta: "naselje", ids: ["pilana", "kovacnica", "tor", "barutana", "staja", "tvornica", "korali"] },
  { id: "selo", ime: "Selo", rec: "šalje ljude", vrsta: "naselje", ids: ["pekara", "karte", "mesnica", "banja", "travar", "staza"] },
  { id: "farma", ime: "Farma", rec: "šalje žito", vrsta: "naselje", ids: ["lov", "farma", "mlin", "cisterna"] },
  { id: "rudnik", ime: "Rudnik", rec: "šalje rudu", vrsta: "naselje", ids: ["kamenolom", "rudnik", "banka"] },
];

function praznineMedu() {
  const trag = tockeOd(STAZA.trag);
  const odCeste = (x: number, y: number) => {
    let d = Infinity;
    for (const t of trag) d = Math.min(d, Math.hypot(t.x - x, t.y - y));
    return d;
  };
  const sredis = NASELJA.flatMap((n) => {
    const pts = PARCELE.filter((p) => n.ids.includes(p.id));
    if (!pts.length) return [];
    return [
      {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      },
    ];
  });
  const livade: string[] = [];
  const busen: { x: number; y: number; tip: number; sc: number }[] = [];
  for (let i = 0; i < sredis.length; i++) {
    for (let j = i + 1; j < sredis.length; j++) {
      const a = sredis[i];
      const b = sredis[j];
      if (!a || !b) continue;
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      if (odCeste(x, y) < 90) continue;
      const pts = mrlja(x, y, 34, 13);
      if (!pts) continue;
      livade.push(pts);
      const pomaci = [
        [-18, 6, 2],
        [16, -4, 3],
        [2, 10, 0],
      ] as const;
      for (const [ox, oy, tip] of pomaci) {
        const bx = x + ox;
        const by = y + oy;
        if (!slobodno(bx, by) || odCeste(bx, by) < 48) continue;
        busen.push({ x: bx, y: by, tip, sc: 0.38 + (tip % 2) * 0.08 });
      }
    }
  }
  return { livade, busen };
}

export const PRAZNINE = praznineMedu();

export function obrubNaselja(ids: string[]) {
  const pts = PARCELE.filter((p) => ids.includes(p.id));
  if (pts.length < 3) return "";
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts
    .map((p) => ({ p, a: Math.atan2(p.y - cy, p.x - cx) }))
    .sort((a, b) => a.a - b.a)
    .map(({ p }) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      return `${Math.round(p.x + (dx / len) * 58)},${Math.round(p.y + (dy / len) * 34)}`;
    })
    .join(" ");
}

export function natpisNaselja(ids: string[]) {
  const pts = PARCELE.filter((p) => ids.includes(p.id));
  if (!pts.length) return null;
  let x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  let y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const trag = STAZA.trag.split(" ").map((p) => {
    const [tx, ty] = p.split(",");
    return { x: Number(tx) || 0, y: Number(ty) || 0 };
  });
  let naj = trag[0];
  let dMin = Infinity;
  for (const t of trag) {
    const d = Math.hypot(t.x - x, t.y - y);
    if (d < dMin) {
      dMin = d;
      naj = t;
    }
  }
  if (naj && dMin < 110) {
    const dx = x - naj.x;
    const dy = y - naj.y;
    const len = Math.hypot(dx, dy) || 1;
    x += (dx / len) * (110 - dMin);
    y += (dy / len) * (110 - dMin);
  }
  return { x: Math.round(x), y: Math.round(y) };
}

export function terenKarte() {
  const o = okvirNaselja();
  let s = 20260311;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const tocka = (id: string) => PARCELE.find((p) => p.id === id) ?? { x: o.cx, y: o.cy };
  const slobodno = (x: number, y: number) =>
    PARCELE.every((p) => Math.abs(p.x - x) / 72 + Math.abs(p.y - y) / 36 > 1);
  const komad = (cx: number, cy: number, rx: number, ry: number, kut: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = kut + (i / 6) * Math.PI * 2;
      const jx = cx + Math.cos(a) * rx * (0.82 + rnd() * 0.28);
      const jy = cy + Math.sin(a) * ry * (0.82 + rnd() * 0.28);
      if (!slobodno(jx, jy)) return "";
      pts.push(`${Math.round(jx)},${Math.round(jy)}`);
    }
    return pts.join(" ");
  };
  const njive: string[] = [];
  const brazde: string[] = [];
  const farma = tocka("farma");
  const mlin = tocka("mlin");
  for (let i = 0; i < 4; i++) {
    const x = farma.x + (i - 1.5) * 54 + (mlin.x - farma.x) * 0.15;
    const y = farma.y + 58 + (i % 2) * 18;
    const p = komad(x, y, 28, 12, 0.4 + i * 0.2);
    if (p) {
      njive.push(p);
      brazde.push(`${Math.round(x - 14)},${Math.round(y - 2)} ${Math.round(x + 14)},${Math.round(y + 3)}`);
    }
  }
  const kamenje: { pts: string; x: number; y: number; puk: string }[] = [];
  const rudnik = tocka("rudnik");
  const kamenolom = tocka("kamenolom");
  for (let i = 0; i < 7; i++) {
    const x = rudnik.x + (i - 3) * 22 + (kamenolom.x - rudnik.x) * 0.2;
    const y = rudnik.y + 24 + (i % 3) * 14;
    const p = komad(x, y, 12 + (i % 3) * 3, 7, i);
    if (p) {
      kamenje.push({
        pts: p,
        x,
        y,
        puk: `${Math.round(x - 4)},${Math.round(y)} ${Math.round(x + 5)},${Math.round(y + 2)}`,
      });
    }
  }
  const mrlje: { x: number; y: number; tip: string; rx: number; ry: number }[] = [];
  const kuca = tocka("kuca");
  const staja = tocka("staja");
  for (let i = 0; i < 28; i++) {
    const x = o.minX + 16 + rnd() * (o.w - 32);
    const y = o.minY + 16 + rnd() * (o.h - 32);
    if (!slobodno(x, y)) continue;
    const df = Math.hypot(x - farma.x, y - farma.y);
    const dr = Math.hypot(x - rudnik.x, y - rudnik.y);
    if (df < 90 || dr < 80) continue;
    const ds = Math.hypot(x - staja.x, y - staja.y);
    const dk = Math.hypot(x - kuca.x, y - kuca.y);
    const tip = ds < 150 || dk < 140 ? "pijesak" : "grm";
    if (tip === "grm" && rnd() > 0.35) continue;
    mrlje.push({ x, y, tip, rx: 7 + rnd() * 12, ry: 3 + rnd() * 5 });
  }
  return { njive, brazde, kamenje, mrlje };
}

export const TEREN = terenKarte();

export function tockeRekvizita() {
  const out: { x: number; y: number }[] = [];
  const dodaj = (x: number, y: number) => out.push({ x, y });
  for (const p of OBALA) dodaj(p.x, p.y);
  for (const p of SIKARA) dodaj(p.x, p.y);
  for (const p of GAZ) dodaj(p.x, p.y);
  if (LOKVA) dodaj(LOKVA.x, LOKVA.y);
  for (const p of DETALJ.kamen) dodaj(p.x, p.y);
  if (DETALJ.brv) dodaj(DETALJ.brv.x, DETALJ.brv.y);
  for (const p of PLOT.stupovi) dodaj(p.x, p.y);
  for (const p of PRSTEN) dodaj(p.x, p.y);
  if (KRUG) dodaj(KRUG.x, KRUG.y);
  for (const p of DRVORED) dodaj(p.x, p.y);
  for (const p of UZCESTU) dodaj(p.x, p.y);
  for (const p of REKVIZITI) dodaj(p.x, p.y);
  for (const p of VODA.kamen) dodaj(p.x, p.y);
  for (const p of VODA.pjena) dodaj(p.x, p.y);
  for (const p of VODA.korito) dodaj(p.x, p.y);
  for (const t of VODA.trska) {
    dodaj(t.x1, t.y1);
    dodaj(t.x2, t.y2);
  }
  if (JOS.strasilo) dodaj(JOS.strasilo.x, JOS.strasilo.y);
  if (JOS.vatra) dodaj(JOS.vatra.x, JOS.vatra.y);
  if (JOS.daske) dodaj(JOS.daske.x, JOS.daske.y);
  for (const p of JOS.vrt) dodaj(p.x, p.y);
  for (const p of CVAT) dodaj(p.x, p.y);
  for (const p of SIPAK) dodaj(p.x, p.y);
  for (const p of DRVECE) dodaj(p.x, p.y);
  for (const p of PRAZNINE.busen) dodaj(p.x, p.y);
  for (const p of TEREN.mrlje) dodaj(p.x, p.y);
  for (const p of TEREN.kamenje) dodaj(p.x, p.y);
  return out;
}
