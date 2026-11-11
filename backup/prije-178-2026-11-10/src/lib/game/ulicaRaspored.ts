import { ZGRADE } from "./constants";
import { POTREBE_META } from "./economy";

/** Ćelija pri zoomu 1. Kutije se ne sijeku: korak je veći od romba. */
export const CELIJA_W = 96;
export const CELIJA_H = 48;
export const KORAK_X = 104;
export const KORAK_Y = 56;
/** 112 / 96 ≈ 1.17, unutar 1–1.3 ćelije. Visina stane u ćeliju da ne prekrije susjeda. */
export const ZGRADA_W = 112;
export const ZGRADA_H = 96;
export const KOLAC_W = 72;
export const KOLAC_H = 64;

const ZOOM_POD = 0.24;
const ZOOM_STROP = 2;
/** Kadar drži ulicu u sredini, kuću uz nju. */
export const POGLED_Y = 0.5;

/** Uska prašnjava cesta. Kuće nisu u rešetki: grozdovi uz cestu, rupa između. */
export const POJAS_L = { colOd: 0, colDo: 2.05, redOd: 0, redDo: 6 };
export const POJAS_D = { colOd: 3.9, colDo: 6.2, redOd: 0, redDo: 6 };
export const ULICA = { colOd: 2.88, colDo: 3.12, redOd: -0.55, redDo: 8.7 };


export type Strana = "l" | "d";

export type Parcela = {
  id: string;
  naziv: string;
  col: number;
  row: number;
  strana: Strana;
  x: number;
  y: number;
};

export type DekorKom = {
  tip: "kaktus" | "bacva" | "ograda" | "kola";
  x: number;
  y: number;
  sc: number;
};

export type Kutija = { id: string; l: number; t: number; r: number; b: number };

type Tocka = { x: number; y: number };

function iso(col: number, row: number): Tocka {
  return { x: (col - row) * KORAK_X, y: (col + row) * KORAK_Y };
}

/** Četiri naselja s praznim tlom između: trg, ranč, farma, rudnik. */
const NASELJE: { id: string; col: number; row: number; strana: Strana }[] = [
  { id: "kuca", col: 2.05, row: 2, strana: "l" },
  { id: "ured", col: 1.55, row: 0.85, strana: "l" },
  { id: "blok", col: 0.45, row: 0.12, strana: "l" },
  { id: "bunar", col: 1.15, row: 1.5, strana: "l" },
  { id: "trgovina", col: 0.4, row: 2.2, strana: "l" },
  { id: "salun", col: 1.4, row: 2.9, strana: "l" },
  { id: "ordinacija", col: 0.75, row: 3.4, strana: "l" },
  { id: "pekara", col: 1.8, row: 5.1, strana: "l" },
  { id: "karte", col: 0.4, row: 5.5, strana: "l" },
  { id: "mesnica", col: 1.15, row: 5.9, strana: "l" },
  { id: "banja", col: 1.85, row: 6.7, strana: "l" },
  { id: "travar", col: 0.6, row: 6.9, strana: "l" },
  { id: "staza", col: 1.55, row: 7.7, strana: "l" },
  { id: "pilana", col: 4.3, row: 0.5, strana: "d" },
  { id: "kovacnica", col: 5.5, row: 0.25, strana: "d" },
  { id: "tor", col: 5.2, row: 1.2, strana: "d" },
  { id: "barutana", col: 6.2, row: 1.4, strana: "d" },
  { id: "staja", col: 4.05, row: 1.42, strana: "d" },
  { id: "tvornica", col: 5.9, row: 2.5, strana: "d" },
  { id: "korali", col: 4.95, row: 3.42, strana: "d" },
  { id: "lov", col: 6.1, row: 4.7, strana: "d" },
  { id: "farma", col: 4.25, row: 5, strana: "d" },
  { id: "mlin", col: 5.4, row: 5.6, strana: "d" },
  { id: "cisterna", col: 4.1, row: 6.2, strana: "d" },
  { id: "kamenolom", col: 6.55, row: 6.95, strana: "d" },
  { id: "rudnik", col: 6.05, row: 8.55, strana: "d" },
  { id: "banka", col: 4.2, row: 8, strana: "d" },
];

function zgradeRedom() {
  return POTREBE_META.flatMap((h) => h.zgrade).flatMap((id) => {
    const z = ZGRADE.find((x) => x.id === id);
    return z ? [z] : [];
  });
}

type Sirova = Parcela;

function siroveParcele(): Sirova[] {
  const zgrade = zgradeRedom();
  const poId = new Map<string, (typeof zgrade)[number]>(zgrade.map((z) => [z.id, z]));
  return NASELJE.flatMap((s) => {
    const z = poId.get(s.id);
    if (!z) return [];
    const p = iso(s.col, s.row);
    return [{ id: z.id, naziv: z.naziv, col: s.col, row: s.row, strana: s.strana, x: p.x, y: p.y }];
  });
}

const DEKOR_MREZA: { tip: DekorKom["tip"]; col: number; row: number; sc: number }[] = [
  { tip: "kaktus", col: -0.7, row: 2.4, sc: 1 },
  { tip: "kaktus", col: -0.4, row: 8.2, sc: 0.9 },
  { tip: "kaktus", col: 7.4, row: 1.1, sc: 0.95 },
  { tip: "kaktus", col: 7.3, row: 7.6, sc: 0.85 },
  { tip: "bacva", col: 1.82, row: 0.38, sc: 0.7 },
  { tip: "bacva", col: 3.92, row: 4.9, sc: 0.7 },
  { tip: "bacva", col: 2.12, row: 7.7, sc: 0.7 },
  { tip: "ograda", col: 2.5, row: 0.1, sc: 0.9 },
  { tip: "ograda", col: 3.5, row: 3.55, sc: 0.9 },
  { tip: "ograda", col: 2.48, row: 8.35, sc: 0.85 },
  { tip: "ograda", col: 3.48, row: 6.7, sc: 0.88 },
  { tip: "kola", col: 3, row: -0.3, sc: 1 },
  { tip: "kola", col: 3, row: 8.4, sc: 0.95 },
];

const CESTA_KUT: [number, number][] = [
  [ULICA.colOd, ULICA.redOd],
  [ULICA.colDo, ULICA.redOd],
  [ULICA.colDo, ULICA.redDo],
  [ULICA.colOd, ULICA.redDo],
];

function sveSirovo() {
  const parcele = siroveParcele();
  const dekor = DEKOR_MREZA.map((d) => ({ ...d, ...iso(d.col, d.row) }));
  const cesta = CESTA_KUT.map(([c, r]) => iso(c, r));
  const pts: Tocka[] = [
    ...parcele.flatMap((p) => [
      { x: p.x - CELIJA_W / 2, y: p.y - CELIJA_H / 2 },
      { x: p.x + CELIJA_W / 2, y: p.y + CELIJA_H / 2 },
      { x: p.x, y: p.y - ZGRADA_H / 2 },
      { x: p.x, y: p.y + ZGRADA_H / 2 },
      { x: p.x, y: p.y + CELIJA_H / 2 + 22 },
    ]),
    ...dekor,
    ...cesta,
  ];
  const minX = Math.min(...pts.map((p) => p.x)) - 8;
  const minY = Math.min(...pts.map((p) => p.y)) - 8;
  const maxX = Math.max(...pts.map((p) => p.x)) + 8;
  const maxY = Math.max(...pts.map((p) => p.y)) + 8;
  const kuca = parcele.find((p) => p.id === "kuca");
  const ulicaKodKuce = kuca ? iso((ULICA.colOd + ULICA.colDo) / 2, kuca.row) : iso(3, 2);
  const pom = (p: Tocka) => ({ x: Math.round(p.x - minX), y: Math.round(p.y - minY) });
  const fk = kuca ? pom(kuca) : { x: 0, y: 0 };
  const fu = pom(ulicaKodKuce);
  return {
    parcele: parcele.map((p) => ({ ...p, ...pom(p) })),
    dekor: dekor.map((d) => ({ tip: d.tip, sc: d.sc, ...pom(d) })),
    cesta: cesta.map(pom),
    fokus: { x: Math.round((fk.x + fu.x) / 2), y: Math.round((fk.y + fu.y) / 2) },
    w: Math.ceil(maxX - minX),
    h: Math.ceil(maxY - minY),
  };
}

const S = sveSirovo();

export const PARCELE: Parcela[] = S.parcele;
export const DEKOR: DekorKom[] = S.dekor;
export const CESTA: Tocka[] = S.cesta;
export const SVIJET = { w: S.w, h: S.h };
const FOKUS = S.fokus;

export function kucaTocka() {
  const k = PARCELE.find((p) => p.id === "kuca");
  return k ? { x: k.x, y: k.y } : { x: SVIJET.w / 2, y: SVIJET.h / 2 };
}

/** Sredina romba. Skela, zgrada i kolci dijele istu točku. */
export function centarRomba(p: Parcela) {
  return { x: p.x, y: p.y };
}

export function centarSpritea(p: Parcela, _vrsta: "skela" | "zgrada" | "kolci" = "zgrada") {
  return centarRomba(p);
}

/** Točka između kuće i ulice: ulica kroz sredinu, kuća uz nju u kadru. */
export function fokusPogleda() {
  return { x: FOKUS.x, y: FOKUS.y };
}

export function parcelaKutija(p: Parcela): Kutija {
  return {
    id: p.id,
    l: p.x - CELIJA_W / 2,
    t: p.y - CELIJA_H / 2,
    r: p.x + CELIJA_W / 2,
    b: p.y + CELIJA_H / 2,
  };
}

export function kutijeSeSijeku(a: Kutija, b: Kutija) {
  return a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
}

export function zgradaNaParceli(p: Parcela) {
  const c = centarSpritea(p, "zgrada");
  return { id: p.id, anchorX: c.x, anchorY: c.y, w: ZGRADA_W, h: ZGRADA_H };
}

/** Donja sredina stoji na centru romba, širina ostaje u 1–1.3 ćelije. */
export function zgradaJeNaParceli(p: Parcela) {
  const z = zgradaNaParceli(p);
  const k = parcelaKutija(p);
  const omjer = z.w / CELIJA_W;
  return (
    z.anchorX === p.x &&
    z.anchorY === p.y &&
    z.anchorX > k.l &&
    z.anchorX < k.r &&
    z.anchorY > k.t &&
    z.anchorY < k.b &&
    omjer >= 1 &&
    omjer <= 1.3
  );
}

export function uRomu(x: number, y: number, p: Parcela) {
  return Math.abs(x - p.x) / (CELIJA_W / 2) + Math.abs(y - p.y) / (CELIJA_H / 2) < 0.92;
}

export function daske() {
  const a = CESTA[0];
  const b = CESTA[1];
  const c = CESTA[2];
  const d = CESTA[3];
  if (!a || !b || !c || !d) return [] as { x1: number; y1: number; x2: number; y2: number }[];
  const linije = [];
  for (let i = 1; i <= 15; i++) {
    const t = i / 16;
    linije.push({
      x1: a.x + (d.x - a.x) * t,
      y1: a.y + (d.y - a.y) * t,
      x2: b.x + (c.x - b.x) * t,
      y2: b.y + (c.y - b.y) * t,
    });
  }
  return linije;
}

const TRAKE_RED = [0.35, 1.2, 2.05, 2.9, 3.7];

function trakaSirova(row: number) {
  const col = (ULICA.colOd + ULICA.colDo) / 2;
  const a = iso(col, row);
  const b = iso(col, row + 0.85);
  return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
}

const TR_SIROVE = TRAKE_RED.map(trakaSirova);
const TR_POM = (() => {
  const raw = siroveParcele()[0];
  const got = PARCELE[0];
  if (!raw || !got) return { x: 0, y: 0 };
  return { x: got.x - raw.x, y: got.y - raw.y };
})();

export const TRAKE = TR_SIROVE.map((t) => {
  const x = Math.round(t.ax + TR_POM.x);
  const y = Math.round(t.ay + TR_POM.y);
  const bx = Math.round(t.bx + TR_POM.x);
  const by = Math.round(t.by + TR_POM.y);
  return { x, y, hodx: bx - x, hody: by - y };
});

/** Parcele i kapija. Zum se računa iz ovog okvira, ne iz cijelog svijeta. */
export function okvirNaselja() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of PARCELE) {
    minX = Math.min(minX, p.x - CELIJA_W / 2);
    maxX = Math.max(maxX, p.x + CELIJA_W / 2);
    minY = Math.min(minY, p.y - ZGRADA_H * 0.62);
    maxY = Math.max(maxY, p.y + CELIJA_H / 2);
  }
  const a = CESTA[0];
  const b = CESTA[1];
  const c = CESTA[2];
  const d = CESTA[3];
  if (a && b && c && d) {
    const sx = (a.x + b.x) / 2;
    const sy = (a.y + b.y) / 2;
    const jx = (c.x + d.x) / 2;
    const jy = (c.y + d.y) / 2;
    const gx = jx + (sx - jx) * 0.3;
    const gy = jy + (sy - jy) * 0.3;
    minX = Math.min(minX, gx - 44);
    maxX = Math.max(maxX, gx + 44);
    minY = Math.min(minY, gy - 48);
    maxY = Math.max(maxY, gy + 20);
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  return { minX, minY, maxX, maxY, w, h, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** Početni zum: naselje puni ~90% širine i visine kadra. Nikad sitnije od 85% širine. */
export function zoomPogleda(vw: number, vh: number) {
  if (vw < 2 || vh < 2) return 1;
  const o = okvirNaselja();
  const zSirina = (vw * 0.85) / o.w;
  const zPuni = Math.max((vw * 0.9) / o.w, (vh * 0.9) / o.h);
  const z = Math.max(zSirina, zPuni);
  return Math.min(ZOOM_STROP, Math.max(ZOOM_POD, z));
}

export function kameraPogleda(vw: number, vh: number) {
  const o = okvirNaselja();
  const z = zoomPogleda(vw, vh);
  return {
    z,
    x: vw / (2 * z) - o.cx,
    y: vh / (2 * z) - o.cy,
  };
}

export function pogledOkoKuce(vw: number, vh: number) {
  const cam = kameraPogleda(vw, vh);
  const x0 = -cam.x;
  const x1 = vw / cam.z - cam.x;
  const y0 = -cam.y;
  const y1 = vh / cam.z - cam.y;
  const ids = PARCELE.filter((p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1).map((p) => p.id);
  const dekor = DEKOR.filter((d) => d.x >= x0 - 20 && d.x <= x1 + 20 && d.y >= y0 - 20 && d.y <= y1 + 20).length;
  return { z: cam.z, n: ids.length, ids, dekor };
}

export type Puteljak = { id: string; tocke: Tocka[]; veza: boolean };

export type SitniTip = "ograda" | "bacva" | "sijeno" | "lampa" | "kaktus" | "kamen" | "kola" | "korito";

export type Sitni = { tip: SitniTip; x: number; y: number; okret: number };

const SITNI_REDOSLIJED: SitniTip[] = ["ograda", "bacva", "sijeno", "lampa", "kaktus", "kamen", "kola", "korito"];

const VEZE: [string, string][] = [
  ["kuca", "bunar"],
  ["pilana", "trgovina"],
  ["staja", "tor"],
  ["farma", "mlin"],
  ["rudnik", "kamenolom"],
];

function pxOdMreze(col: number, row: number): Tocka {
  const a = PARCELE[0];
  if (!a) return { x: 0, y: 0 };
  const raw = iso(a.col, a.row);
  const p = iso(col, row);
  return { x: Math.round(p.x - (raw.x - a.x)), y: Math.round(p.y - (raw.y - a.y)) };
}

function slobodno(col: number, row: number) {
  const p = pxOdMreze(col, row);
  return !PARCELE.some((q) => uRomu(p.x, p.y, q));
}

/** Puteljak obilazi tuđe rombove, ne reže ravno kroz susjeda. */
function hodDoUlice(p: Parcela): Tocka[] {
  const lijevo = p.strana === "l";
  const znak = lijevo ? 1 : -1;
  const cilj = lijevo ? ULICA.colOd : ULICA.colDo;
  let col = p.col + znak * 0.66;
  let row = p.row;
  for (let k = 0; k < 10 && !slobodno(col, row); k++) row += k % 2 === 0 ? 0.2 : -0.2;
  const tocke: Tocka[] = [pxOdMreze(col, row)];
  let guard = 0;
  while ((lijevo ? col < cilj - 0.01 : col > cilj + 0.01) && guard++ < 48) {
    const next = lijevo ? Math.min(col + 0.16, cilj) : Math.max(col - 0.16, cilj);
    if (slobodno(next, row)) {
      col = next;
      tocke.push(pxOdMreze(col, row));
      continue;
    }
    let skrenuo = false;
    for (const d of [0.28, -0.28, 0.48, -0.48, 0.7, -0.7, 0.92, -0.92]) {
      if (slobodno(col, row + d) && slobodno(next, row + d)) {
        row += d;
        tocke.push(pxOdMreze(col, row));
        col = next;
        tocke.push(pxOdMreze(col, row));
        skrenuo = true;
        break;
      }
    }
    if (!skrenuo) {
      col = next;
      tocke.push(pxOdMreze(col, row));
    }
  }
  if (tocke.length < 3 && tocke[0] && tocke.length > 1) {
    const a = tocke[0];
    const b = tocke[tocke.length - 1]!;
    tocke.splice(1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
  return tocke;
}

function vezaTocke(a: Parcela, b: Parcela): Tocka[] {
  const pa = hodDoUlice(a);
  const pb = hodDoUlice(b);
  const krajB = pb[pb.length - 1];
  if (!krajB) return pa;
  return [...pa, krajB, ...pb.slice().reverse()];
}

/** Uski puteljak od ulice do svake aktivne parcele, plus veza susjeda. */
export function putelji(aktivni: readonly string[]): Puteljak[] {
  const set = new Set(aktivni);
  const out: Puteljak[] = [];
  for (const p of PARCELE) {
    if (!set.has(p.id)) continue;
    out.push({ id: p.id, tocke: hodDoUlice(p), veza: false });
  }
  for (const [ia, ib] of VEZE) {
    if (!set.has(ia) || !set.has(ib)) continue;
    const a = PARCELE.find((p) => p.id === ia);
    const b = PARCELE.find((p) => p.id === ib);
    if (!a || !b) continue;
    out.push({ id: `${ia}-${ib}`, tocke: vezaTocke(a, b), veza: true });
  }
  return out;
}

/** Uzorak duž puta. Vraća id parcele ako put siječe njezin romb. */
export function putSijeceRomb(tocke: readonly Tocka[]): string | null {
  for (let i = 0; i < tocke.length - 1; i++) {
    const a = tocke[i]!;
    const b = tocke[i + 1]!;
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      for (const p of PARCELE) {
        if (uRomu(x, y, p)) return p.id;
      }
    }
  }
  return null;
}

function uUlici(col: number, row: number) {
  return col >= ULICA.colOd && col <= ULICA.colDo && row >= ULICA.redOd && row <= ULICA.redDo;
}

/** Deterministički sitni dekor uz rub ulice, izvan parcela. */
export function sitniDekor(): Sitni[] {
  const out: Sitni[] = [];
  for (let i = 0; i < 16; i++) {
    const row = ULICA.redOd + 0.55 + (i % 8) * 0.55;
    const strana: Strana = i < 8 ? "l" : "d";
    const odmak = 0.18 + (i % 3) * 0.06;
    const col = strana === "l" ? ULICA.colOd - odmak : ULICA.colDo + odmak;
    if (uUlici(col, row)) continue;
    if (row < ULICA.redOd || row > ULICA.redDo) continue;
    const p = pxOdMreze(col, row);
    if (PARCELE.some((q) => uRomu(p.x, p.y, q))) continue;
    out.push({
      tip: SITNI_REDOSLIJED[i % SITNI_REDOSLIJED.length]!,
      x: p.x,
      y: p.y,
      okret: (i * 17) % 40 - 20,
    });
  }
  return out;
}
