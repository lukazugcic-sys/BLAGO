/**
 * Svaki konj i svako govedo na karti: jedna sličica po grlu, statično.
 * Stanje ima samo zbirne brojeve (konjiBroj, govedaBroj); ID-ovi i mjesta su
 * izvedeni (vrsta + redni broj) i ništa se ne sprema. Grlo k uvijek dobije
 * k-to mjesto u svom nizu, pa kupnja dodaje na kraj, a prodaja miče zadnjeg.
 */
import { POKRICE } from "./tuning";
import type { Gradevine } from "./types";
import { LOKVA, POTOK, STAZA, tockeOd } from "./teren";
import { PARCELE, SVIJET, putelji, uRomu } from "./ulicaRaspored";

export type Vrsta = "konj" | "govedo";
export type Grlo = { id: string; vrsta: Vrsta; x: number; y: number; kod: string };

/** Otisak sličice (lokalne koordinate oko točke x,y). */
export const OTISAK = { x0: -8, x1: 8, y0: -7, y1: 3 };
const KORAK_X = 18;
const KORAK_Y = 12;
const RUB = 12;
const RAZMAK_PUT = 6;
const RAZMAK_VODA = 13;

const KONJ_ZGRADE = ["staja", "korali", "staza"] as const;
const GOVEDO_ZGRADE = ["tor"] as const;
const SIDRA = [...KONJ_ZGRADE, ...GOVEDO_ZGRADE];

type Tocka = { x: number; y: number };

function dSeg(p: Tocka, a: Tocka, b: Tocka) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

type Seg = { a: Tocka; b: Tocka; x0: number; x1: number; y0: number; y1: number };
function segmenti(t: readonly Tocka[]): Seg[] {
  const out: Seg[] = [];
  for (let i = 1; i < t.length; i++) {
    const a = t[i - 1]!;
    const b = t[i]!;
    out.push({ a, b, x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
  }
  return out;
}
/** true ako je točka bliže od r nekom segmentu (bbox odbacuje daleke). */
function blizuSeg(p: Tocka, segs: readonly Seg[], r: number) {
  for (const s of segs) {
    if (p.x < s.x0 - r || p.x > s.x1 + r || p.y < s.y0 - r || p.y > s.y1 + r) continue;
    if (dSeg(p, s.a, s.b) < r) return true;
  }
  return false;
}

function uPoligonu(p: Tocka, poly: readonly Tocka[]) {
  let in_ = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) in_ = !in_;
  }
  return in_;
}

let prepreke: { putevi: Seg[]; potok: Seg[]; cesta: Tocka[] } | null = null;
function zapreke() {
  if (!prepreke) {
    prepreke = {
      putevi: putelji(PARCELE.map((p) => p.id)).flatMap((p) => segmenti(p.tocke)),
      potok: segmenti(tockeOd(POTOK)),
      cesta: tockeOd(STAZA.tijelo),
    };
  }
  return prepreke;
}

/** Točke otiska: kutovi, sredine rubova i središte. */
export function tockeOtiska(x: number, y: number): Tocka[] {
  const { x0, x1, y0, y1 } = OTISAK;
  const xm = (x0 + x1) / 2;
  const ym = (y0 + y1) / 2;
  const out: Tocka[] = [];
  for (const dx of [x0, xm, x1]) for (const dy of [y0, ym, y1]) out.push({ x: x + dx, y: y + dy });
  return out;
}

/** Slobodno za grlo: u karti, izvan svake parcele, ceste, puteljka, potoka i lokve. */
export function slobodnoZaGrlo(x: number, y: number) {
  if (x + OTISAK.x0 < RUB || x + OTISAK.x1 > SVIJET.w - RUB || y + OTISAK.y0 < RUB || y + OTISAK.y1 > SVIJET.h - RUB) return false;
  const z = zapreke();
  for (const t of tockeOtiska(x, y)) {
    for (const p of PARCELE) if (Math.abs(t.x - p.x) < 48 && Math.abs(t.y - p.y) < 24 && uRomu(t.x, t.y, p)) return false;
    if (uPoligonu(t, z.cesta)) return false;
    if (blizuSeg(t, z.putevi, RAZMAK_PUT)) return false;
    if (blizuSeg(t, z.potok, RAZMAK_VODA)) return false;
    if (LOKVA && ((t.x - LOKVA.x) / (28 + 6)) ** 2 + ((t.y - LOKVA.y) / (12 + 5)) ** 2 < 1) return false;
  }
  return true;
}

let bazen: Map<string, Tocka[]> | null = null;
/**
 * Fiksna mreža ćelija (KORAK_X × KORAK_Y ≥ otisak, pa se grla ne preklapaju).
 * Svaka slobodna ćelija pripada najbližoj od staja/korali/staza/tor i
 * poredana je po udaljenosti od nje. Ne ovisi o broju grla ni o razinama.
 */
export function bazeni(): Map<string, Tocka[]> {
  if (bazen) return bazen;
  const sidra = SIDRA.map((id) => PARCELE.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const m = new Map<string, (Tocka & { d: number })[]>();
  for (const s of sidra) m.set(s.id, []);
  for (let y = RUB - OTISAK.y0; y + OTISAK.y1 <= SVIJET.h - RUB; y += KORAK_Y) {
    for (let x = RUB - OTISAK.x0; x + OTISAK.x1 <= SVIJET.w - RUB; x += KORAK_X) {
      let best = sidra[0];
      let bd = Infinity;
      for (const s of sidra) {
        const d = Math.hypot(x - s.x, y - s.y);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      if (!best || bd > 420) continue;
      if (!slobodnoZaGrlo(x, y)) continue;
      m.get(best.id)!.push({ x, y, d: bd });
    }
  }
  bazen = new Map();
  for (const [id, l] of m) {
    l.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    bazen.set(id, l.map(({ x, y }) => ({ x, y })));
  }
  return bazen;
}

/** Sanira spremljeni broj: nenegativan cijeli, undefined/NaN = 0. Bez kapaciteta. */
export function brojGrla(n: unknown) {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, v);
}

/**
 * Redoslijed mjesta za vrstu: najprije kapacitet sagrađenih zgrada (staja, korali,
 * staza / tor), zatim višak i grla bez zgrade u preostala mjesta tih istih područja
 * (najbliža prva). Ništa se ne odbacuje dok ima mjesta na karti.
 */
export function mjestaZa(vrsta: Vrsta, g: Partial<Gradevine>): (Tocka & { kod: string })[] {
  const b = bazeni();
  const ids = vrsta === "konj" ? KONJ_ZGRADE : GOVEDO_ZGRADE;
  const out: (Tocka & { kod: string })[] = [];
  const uzeto = new Map<string, number>();
  for (const id of ids) {
    const lv = Math.max(0, Math.floor(Number(g[id as keyof Gradevine]) || 0));
    const kap = lv * (POKRICE as Record<string, number>)[id]!;
    const l = b.get(id) ?? [];
    const n = Math.min(kap, l.length);
    for (let i = 0; i < n; i++) out.push({ ...l[i]!, kod: id });
    uzeto.set(id, n);
  }
  // višak: spoji ostatke po udaljenosti od vlastitog sidra (redom bazena)
  const ostaci = ids.map((id) => ({ id, l: b.get(id) ?? [], i: uzeto.get(id) ?? 0 }));
  for (;;) {
    let dodano = false;
    for (const o of ostaci) {
      if (o.i < o.l.length) {
        out.push({ ...o.l[o.i]!, kod: `${o.id}-visak` });
        o.i++;
        dodano = true;
      }
    }
    if (!dodano) break;
  }
  return out;
}

export function stokaNaKarti(g: Partial<Gradevine>, konjiBroj: unknown, govedaBroj: unknown): { grla: Grlo[]; nema: { konj: number; govedo: number } } {
  const grla: Grlo[] = [];
  const nema = { konj: 0, govedo: 0 };
  for (const [vrsta, broj] of [["konj", brojGrla(konjiBroj)], ["govedo", brojGrla(govedaBroj)]] as const) {
    if (broj === 0) continue;
    const m = mjestaZa(vrsta, g);
    const n = Math.min(broj, m.length);
    for (let k = 0; k < n; k++) grla.push({ id: `${vrsta}-${k}`, vrsta, x: m[k]!.x, y: m[k]!.y, kod: m[k]!.kod });
    nema[vrsta] = broj - n;
  }
  return { grla, nema };
}
