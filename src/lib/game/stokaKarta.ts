/**
 * Svaki konj i svako govedo na karti: jedna sličica po grlu, statično.
 * Stanje ima samo zbirne brojeve (konjiBroj, govedaBroj); ID-ovi i mjesta su
 * izvedeni (vrsta + redni broj) i ništa se ne sprema. Grlo k uvijek dobije
 * k-to mjesto u svom nizu, pa kupnja dodaje na kraj, a prodaja miče zadnjeg.
 */
import { POKRICE } from "./tuning";
import type { Gradevine } from "./types";
import {
  CVAT,
  DRVECE,
  DRVORED,
  JOS,
  KAMENOLOM_KAMENJE,
  LOKVA,
  MOSTOVI,
  OBALA,
  PLOT,
  POTOK,
  PRAZNINE,
  REKVIZITI,
  SIKARA,
  SIPAK,
  STAZA,
  UZCESTU,
  doPotoka,
  tockeOd,
} from "./teren";
import { OBZOR, RASUTE, izvanObora } from "./obzorTocke";
import { PARCELE, SVIJET, putelji, uRomu, velicinaSpritea } from "./ulicaRaspored";
import { OBOR, oborPoligon } from "./obor";
import { DV_R, dvorista } from "./dvorista";
import { mostoviPjesina, svePjesine } from "./pjesine";
import { TRG, TRG_STVARI } from "./trg";

export { OBOR, oborPoligon };

export type Vrsta = "konj" | "govedo";
/** smjer: 1 = gleda desno, -1 = gleda lijevo (stalno po ID-u, samo prikaz). */
export type Grlo = { id: string; vrsta: Vrsta; x: number; y: number; kod: string; smjer: 1 | -1 };

/**
 * Otisak sličice (lokalne koordinate oko točke x,y = kopita na tlu).
 * 0.9.174: veće sličice s glavom (konj ~20×17, govedo ~20×13). Glava konja smije
 * viriti do 5 px iznad otiska jer se crta po dubini (y), preko grla iza sebe.
 */
export const OTISAK = { x0: -10, x1: 10, y0: -11, y1: 3 };
/** Korak mreže ≥ otisak + 2× trzaj, pa se grla nikad ne preklapaju. */
const KORAK_X = 23;
const KORAK_Y = 16;
const TRZAJ_X = 1.4;
const TRZAJ_Y = 0.9;
const RUB = 12;
const RAZMAK_PUT = 6;
const RAZMAK_PJESINA = 3.5;
const RAZMAK_VODA = 13;

const KONJ_ZGRADE = ["staja", "korali", "staza"] as const;
const GOVEDO_ZGRADE = ["tor"] as const;
/** Konji pasu između staje, ispusta i farme (trokut njihovih središta). */
const KONJ_PODRUCJE = ["staja", "korali", "farma"] as const;

/** Unutarnji razmak grla od ograde. */
const OBOR_UNUTRA = 7;

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
    out.push({
      a,
      b,
      x0: Math.min(a.x, b.x),
      x1: Math.max(a.x, b.x),
      y0: Math.min(a.y, b.y),
      y1: Math.max(a.y, b.y),
    });
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

let prepreke: { putevi: Seg[]; pjesine: Seg[]; potok: Seg[]; cesta: Tocka[] } | null = null;
function zapreke() {
  if (!prepreke) {
    prepreke = {
      putevi: putelji(PARCELE.map((p) => p.id)).flatMap((p) => segmenti(p.tocke)),
      // 0.9.176 (t443u): uske pješačke staze naselja – grlo ne stoji na njima (manji razmak, staza je uska)
      pjesine: svePjesine().flatMap((p) => segmenti(p.tocke)),
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

/** Kutije vidljivih slika zgrada (najveći rast 1.08): grlo iza ili ispod slike se ne bi vidjelo. */
type Kut = { l: number; t: number; r: number; b: number };
let kutije: Kut[] | null = null;
function kutijeZgrada(): Kut[] {
  if (!kutije) {
    kutije = PARCELE.map((p) => {
      const { w, h } = velicinaSpritea(p.id, true);
      const W = w * 1.08;
      const H = h * 1.08;
      // stražarnica tora je uska (~40 px od 116 px slike)
      const uvuci = p.id === "tor" ? W * 0.32 : 8;
      return {
        l: p.x - W / 2 + uvuci,
        r: p.x + W / 2 - uvuci,
        t: p.y - H * 0.52 + 10,
        b: p.y + H * 0.4,
      };
    });
  }
  return kutije;
}

/**
 * 0.9.175: kutije ukrasa (stabla, kaktusi, grmlje, rekviziti, kamenje, mostići):
 * grlo ne stoji pod krošnjom ni na ukrasu. Raslina (sc=1) zauzima ~x −20..22, y −26..24.
 */
let ukrasi: Kut[] | null = null;
export function kutijeUkrasa(): Kut[] {
  if (ukrasi) return ukrasi;
  const out: Kut[] = [];
  const biljka = (p: { x: number; y: number }, sc: number) =>
    out.push({ l: p.x - 18 * sc, r: p.x + 20 * sc, t: p.y - 26 * sc, b: p.y + 14 * sc });
  const sitno = (p: { x: number; y: number }, r: number) => out.push({ l: p.x - r, r: p.x + r, t: p.y - r, b: p.y + r * 0.6 });
  for (const l of [SIKARA, DRVORED, UZCESTU, SIPAK, DRVECE, CVAT, OBALA, PRAZNINE.busen, RASUTE]) for (const p of l) biljka(p, p.sc);
  OBZOR.stabla.forEach((p, i) => izvanObora(p) && biljka(p, 0.9 + (i % 5) * 0.12));
  OBZOR.grmlje.forEach((p, i) => izvanObora(p) && biljka(p, 0.8 + (i % 4) * 0.12));
  for (const p of OBZOR.kaktusi) if (izvanObora(p)) biljka(p, 1.3);
  for (const p of REKVIZITI) sitno(p, 14);
  for (const p of KAMENOLOM_KAMENJE) sitno(p, 6 + p.r);
  for (const p of PLOT.stupovi) sitno(p, 8);
  for (const p of MOSTOVI) sitno(p, 20);
  // 0.9.176: mostići pješačkih staza, ukrasi dvorišta i vrt travara, trg (cijeli) – konj ne stoji na njima
  for (const p of mostoviPjesina()) sitno(p, 20);
  for (const u of dvorista().ukrasi) sitno(u, DV_R[u.tip] + 1);
  for (const s of TRG_STVARI) sitno(s, 8);
  if (TRG) out.push({ l: TRG.x - TRG.rx - 6, r: TRG.x + TRG.rx + 6, t: TRG.y - TRG.ry - 6, b: TRG.y + TRG.ry + 6 });
  for (const p of JOS.vrt) sitno(p, 7);
  for (const p of [JOS.strasilo, JOS.vatra, JOS.daske]) if (p) sitno(p, 12);
  ukrasi = out;
  return out;
}

/** Slobodno za grlo: u karti, izvan svake parcele i slike zgrade, ceste, puteljka, potoka i lokve. */
export function slobodnoZaGrlo(x: number, y: number) {
  if (x + OTISAK.x0 < RUB || x + OTISAK.x1 > SVIJET.w - RUB || y + OTISAK.y0 < RUB || y + OTISAK.y1 > SVIJET.h - RUB) return false;
  const z = zapreke();
  for (const k of kutijeZgrada()) if (x + OTISAK.x1 > k.l && x + OTISAK.x0 < k.r && y + OTISAK.y1 > k.t && y + OTISAK.y0 - 5 < k.b) return false;
  for (const k of kutijeUkrasa()) if (x + OTISAK.x1 > k.l && x + OTISAK.x0 < k.r && y + OTISAK.y1 > k.t && y + OTISAK.y0 < k.b) return false;
  for (const t of tockeOtiska(x, y)) {
    for (const p of PARCELE) if (Math.abs(t.x - p.x) < 48 && Math.abs(t.y - p.y) < 24 && uRomu(t.x, t.y, p)) return false;
    if (uPoligonu(t, z.cesta)) return false;
    if (blizuSeg(t, z.putevi, RAZMAK_PUT)) return false;
    if (blizuSeg(t, z.pjesine, RAZMAK_PJESINA)) return false;
    if (blizuSeg(t, z.potok, RAZMAK_VODA)) return false;
    // 0.9.181: puna uvala (ne samo os potoka) — grlo ne stoji u zaljevu
    if (doPotoka(t.x, t.y) < RAZMAK_VODA) return false;
    if (LOKVA && ((t.x - LOKVA.x) / (28 + 6)) ** 2 + ((t.y - LOKVA.y) / (12 + 5)) ** 2 < 1) return false;
  }
  return true;
}

/** FNV-1a, za stalni smjer i trzaj (bez Math.random, ništa se ne sprema). */
function hes(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}

/** Smjer grla po stalnom ID-u: ~pola lijevo, pola desno. */
export function smjerGrla(id: string): 1 | -1 {
  return (hes(id) & 1) === 0 ? 1 : -1;
}

function dPoligon(p: Tocka, poly: readonly Tocka[]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, dSeg(p, poly[i]!, poly[(i + 1) % poly.length]!));
  return d;
}

/** Udaljenost do poligona (0 unutra). */
function doPoligona(p: Tocka, poly: readonly Tocka[]) {
  return poly.length >= 3 && uPoligonu(p, poly) ? 0 : dPoligon(p, poly);
}

function konjTrokut(): Tocka[] {
  return KONJ_PODRUCJE.map((id) => PARCELE.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ x: p.x, y: p.y }));
}

export type Ograda = { poligon: Tocka[]; stupovi: Tocka[]; letve: [Tocka, Tocka][] };
let ograda: Ograda | null = null;
/**
 * Ograda obora: stup svakih ~13 px po rubu poligona. Gdje rub prelazi puteljak,
 * cestu, potok ili tuđu parcelu stup se izostavi (prolaz/vrata). Letve samo
 * između susjednih postojećih stupova istog ruba.
 */
export function ogradaTora(): Ograda {
  if (ograda) return ograda;
  const poligon = oborPoligon();
  const z = zapreke();
  const stupovi: Tocka[] = [];
  const letve: [Tocka, Tocka][] = [];
  // stupovi redom po cijelom obodu; letva samo između dva susjedna postojeća stupa
  const obod: (Tocka | null)[] = [];
  for (let i = 0; i < poligon.length; i++) {
    const a = poligon[i]!;
    const b = poligon[(i + 1) % poligon.length]!;
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 13));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const p = {
        x: Math.round((a.x + (b.x - a.x) * t) * 10) / 10,
        y: Math.round((a.y + (b.y - a.y) * t) * 10) / 10,
      };
      const ok =
        p.x > RUB &&
        p.x < SVIJET.w - RUB &&
        p.y > RUB &&
        p.y < SVIJET.h - RUB &&
        !PARCELE.some((q) => uRomu(p.x, p.y, q)) &&
        !uPoligonu(p, z.cesta) &&
        !blizuSeg(p, z.putevi, 9) &&
        !blizuSeg(p, z.pjesine, 6) &&
        !blizuSeg(p, z.potok, 16);
      obod.push(ok ? p : null);
      if (ok) stupovi.push(p);
    }
  }
  for (let i = 0; i < obod.length; i++) {
    const a = obod[i];
    const b = obod[(i + 1) % obod.length];
    if (a && b && Math.hypot(b.x - a.x, b.y - a.y) < 18) letve.push([a, b]);
  }
  ograda = { poligon, stupovi, letve };
  return ograda;
}

/** 0.9.175: konji pasu po cijelom ranču i farmi (zgrade tih naselja), južno od glavne ceste. */
const RANC_FARMA = ["pilana", "kovacnica", "barutana", "staja", "tvornica", "korali", "tor", "lov", "farma", "mlin", "cisterna"] as const;
/** 0.9.181: pašnjak dalje od zgrade, skupine rjeđe — konji ne stoje zbijeni. */
const DOSEG_PASE = 200;
/** Rub pašnjaka (dalje od zgrade) za velika stada, prije zadnje rezerve. */
const DOSEG_PASE_SIRE = 300;
/** Razmak središta skupina i konja unutar skupine / između svih konja. */
const RAZMAK_SKUPINA = 86;
const RAZMAK_U_SKUPINI = 28;
const RAZMAK_KONJA = 27;
const RAZMAK_VISKA = 38;
const MAX_SKUPINA = 30;

export type Skupina = { x: number; y: number; mjesta: Tocka[] };
let skupineKonja: Skupina[] = [];
/** Skupine konja (središte + mjesta), redom kako se pune; samo za testove/QA. */
export function skupine(): Skupina[] {
  bazeni();
  return skupineKonja;
}

/** Strana glavne ceste: <0 južno/istočno (ranč, farma), >0 sjeverno (grad). */
function stranaCeste(p: Tocka, trag: readonly Tocka[]) {
  let naj = Infinity;
  let st = 0;
  for (let i = 1; i < trag.length; i++) {
    const a = trag[i - 1]!;
    const b = trag[i]!;
    const d = dSeg(p, a, b);
    if (d < naj) {
      naj = d;
      st = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    }
  }
  return st;
}

let bazen: Map<Vrsta, Tocka[]> | null = null;
/**
 * Fiksna saćasta mreža (KORAK_X × KORAK_Y ≥ otisak + trzaj, pa se grla ne
 * preklapaju) sa stalnim sitnim trzajem po ćeliji. Goveda: najprije ćelije
 * unutar obora tora (razbacano), zatim višak uz obor.
 * Konji (0.9.175): pašnjak = slobodne ćelije južno od ceste, najbliže nekoj zgradi
 * ranča ili farme (≤ DOSEG_PASE). Na njemu se jednom odrede razmaknuta središta
 * skupina (najudaljenija točka od već odabranih, stalno), svaka skupina dobije
 * 3–5 razmaknutih mjesta. Redoslijed punjenja: po 2 u svaku skupinu, pa 3. u svaku,
 * itd. — i malo stado je rašireno po cijelom ranču i farmi u skupinama 2–5.
 * Ne ovisi o broju grla ni o razinama.
 */
export function bazeni(): Map<Vrsta, Tocka[]> {
  if (bazen) return bazen;
  const obor = oborPoligon();
  const tro = konjTrokut();
  const tc = tro.length
    ? {
        x: tro.reduce((s, p) => s + p.x, 0) / tro.length,
        y: tro.reduce((s, p) => s + p.y, 0) / tro.length,
      }
    : { x: SVIJET.w / 2, y: SVIJET.h / 2 };
  const tor = PARCELE.find((p) => p.id === "tor");
  const oc = tor ? { x: tor.x + OBOR.dx, y: tor.y + OBOR.dy * 0.8 } : tc;
  const trag = tockeOd(STAZA.trag);
  const rf = new Set<string>(RANC_FARMA);
  const pasnjak: (Tocka & { h: number })[] = [];
  const rubPasnjaka: (Tocka & { d: number })[] = [];
  const dalje: (Tocka & { d: number })[] = [];
  const goveda: (Tocka & { d: number })[] = [];
  let j = 0;
  for (let y0 = RUB - OTISAK.y0 + TRZAJ_Y; y0 + OTISAK.y1 + TRZAJ_Y <= SVIJET.h - RUB; y0 += KORAK_Y, j++) {
    let i = 0;
    for (let x0 = RUB - OTISAK.x0 + TRZAJ_X + (j % 2 ? KORAK_X / 2 : 0); x0 + OTISAK.x1 + TRZAJ_X <= SVIJET.w - RUB; x0 += KORAK_X, i++) {
      const h = hes(`${i}:${j}`);
      const x = Math.round((x0 + (((h & 0xff) / 255) * 2 - 1) * TRZAJ_X) * 10) / 10;
      const y = Math.round((y0 + ((((h >>> 8) & 0xff) / 255) * 2 - 1) * TRZAJ_Y) * 10) / 10;
      if (!slobodnoZaGrlo(x, y)) continue;
      const ot = tockeOtiska(x, y);
      // obor: cijeli otisak unutra i barem OBOR_UNUTRA od ograde; uz ogradu (s obje strane) nitko
      const unutra = obor.length >= 3 && ot.every((t) => uPoligonu(t, obor) && dPoligon(t, obor) >= OBOR_UNUTRA);
      if (unutra) {
        // razbacano: udaljenost od prednjeg dijela obora + stalni šum
        goveda.push({ x, y, d: Math.hypot(x - oc.x, (y - oc.y) * 1.6) * 0.45 + ((h >>> 16) & 0xff) * 0.5 });
        continue;
      }
      if (obor.length >= 3 && ot.some((t) => doPoligona(t, obor) < OBOR_UNUTRA)) continue;
      const p = { x, y };
      let naj = Infinity;
      let najId = "";
      for (const q of PARCELE) {
        const d = Math.hypot(q.x - x, (q.y - y) * 1.4);
        if (d < naj) {
          naj = d;
          najId = q.id;
        }
      }
      const dO = obor.length >= 3 ? dPoligon(p, obor) : Infinity;
      const dT = Math.hypot(x - tc.x, y - tc.y);
      const juzno = rf.has(najId) && stranaCeste(p, trag) < 0 && dO > 10;
      if (juzno && naj <= DOSEG_PASE) pasnjak.push({ x, y, h });
      else if (juzno && naj <= DOSEG_PASE_SIRE) rubPasnjaka.push({ x, y, d: naj });
      else if (dO + 40 < dT) goveda.push({ x, y, d: 10000 + dO });
      else dalje.push({ x, y, d: dT });
    }
  }
  // 0.9.181: uvala je uzela južne ćelije. Višak goveda ide na suho daleko od konja,
  // ne u zaljev; prvih 90 konja i dalje puni pašnjak prije ovog repa.
  dalje.sort((a, b) => a.d - b.d);
  while (goveda.length < 220 && dalje.length > 80) {
    const q = dalje.pop()!;
    goveda.push({ x: q.x, y: q.y, d: 30000 + q.d });
  }
  // središta skupina: ćelija s barem 5 susjeda na pašnjaku; prva najbliža trokutu staja–ispust–farma,
  // svaka sljedeća najudaljenija od već odabranih (ravnomjerno po cijelom pašnjaku)
  const blizu = (c: Tocka, r: number) => pasnjak.filter((q) => Math.hypot(q.x - c.x, q.y - c.y) <= r);
  const kandidati = pasnjak.filter((c) => blizu(c, 36).length >= 5);
  const sredista: Tocka[] = [];
  if (kandidati.length) {
    let prvi = kandidati[0]!;
    for (const c of kandidati) if (Math.hypot(c.x - tc.x, c.y - tc.y) < Math.hypot(prvi.x - tc.x, prvi.y - tc.y)) prvi = c;
    sredista.push(prvi);
    const dmin = kandidati.map((c) => Math.hypot(c.x - prvi.x, c.y - prvi.y));
    while (sredista.length < MAX_SKUPINA) {
      let k = -1;
      for (let i = 0; i < kandidati.length; i++) if (k < 0 || dmin[i]! > dmin[k]! + 1e-6) k = i;
      if (k < 0 || dmin[k]! < RAZMAK_SKUPINA) break;
      const c = kandidati[k]!;
      sredista.push(c);
      for (let i = 0; i < kandidati.length; i++) dmin[i] = Math.min(dmin[i]!, Math.hypot(kandidati[i]!.x - c.x, kandidati[i]!.y - c.y));
    }
  }
  // mjesta u skupini: najbliže ćelije središtu, međusobno ≥ RAZMAK_U_SKUPINI, svi konji ≥ RAZMAK_KONJA
  const uzeto: Tocka[] = [];
  const slobodno = (q: Tocka, r: number, l: readonly Tocka[]) => l.every((u) => Math.hypot(u.x - q.x, u.y - q.y) >= r);
  skupineKonja = sredista.map((c) => {
    const vel = 3 + (hes(`skupina:${Math.round(c.x)}:${Math.round(c.y)}`) % 3);
    const mjesta: Tocka[] = [];
    // najbliže središtu, sa stalnim šumom po ćeliji: oblik skupine je svaki put drukčiji (ne red, ne blok)
    const kljuc = (q: Tocka & { h: number }) => Math.hypot(q.x - c.x, q.y - c.y) + ((q.h >>> 20) & 0xf);
    const red = blizu(c, 60).sort((a, b) => kljuc(a) - kljuc(b) || a.y - b.y || a.x - b.x);
    for (const q of red) {
      if (mjesta.length >= vel) break;
      if (!slobodno(q, RAZMAK_U_SKUPINI, mjesta) || !slobodno(q, RAZMAK_KONJA, uzeto)) continue;
      // treći konj ne stoji na pravcu prva dva (skupina, ne red)
      if (mjesta.length === 2) {
        const [m0, m1] = mjesta as [Tocka, Tocka];
        if (Math.abs((m1.x - m0.x) * (q.y - m0.y) - (m1.y - m0.y) * (q.x - m0.x)) < 120) continue;
      }
      const m = { x: q.x, y: q.y };
      mjesta.push(m);
      uzeto.push(m);
    }
    return { x: c.x, y: c.y, mjesta };
  });
  // redoslijed: po dva u svaku skupinu, pa treći u svaku, četvrti, peti
  const konji: Tocka[] = [];
  for (const g of skupineKonja) if (g.mjesta.length >= 2) konji.push(g.mjesta[0]!, g.mjesta[1]!);
  for (let k = 2; k < 5; k++) for (const g of skupineKonja) if (g.mjesta.length >= 2 && g.mjesta[k]) konji.push(g.mjesta[k]!);
  // višak: ostatak pašnjaka (najbliže nekoj skupini, razmaknuto), pa sve dalje
  const dSk = (q: Tocka) => sredista.reduce((m, c) => Math.min(m, Math.hypot(q.x - c.x, q.y - c.y)), Infinity);
  const ostatak = pasnjak
    .filter((q) => slobodno(q, RAZMAK_KONJA, uzeto))
    .map((q) => ({ x: q.x, y: q.y, d: dSk(q) }))
    .sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
  // višak ide rjeđe (≥ RAZMAK_VISKA), da se uz skupine ne slože u ravan red
  const zbijeno: Tocka[] = [...uzeto];
  for (const q of ostatak) {
    if (slobodno(q, RAZMAK_VISKA, zbijeno)) {
      konji.push({ x: q.x, y: q.y });
      zbijeno.push(q);
    }
  }
  // 0.9.176: prije zadnje rezerve još jedan prolaz pašnjakom s običnim razmakom konja (dvorišta i
  // pješačke staze smanjile su pašnjak, pa višak s razmakom ≥ RAZMAK_VISKA više ne primi 90 konja)
  for (const q of ostatak) {
    if (slobodno(q, RAZMAK_KONJA, zbijeno)) {
      konji.push({ x: q.x, y: q.y });
      zbijeno.push(q);
    }
  }
  for (const q of [...rubPasnjaka].sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x)) {
    if (slobodno(q, RAZMAK_KONJA, zbijeno)) {
      konji.push({ x: q.x, y: q.y });
      zbijeno.push(q);
    }
  }
  // zadnja rezerva (nerealno velika stada): preostale ćelije pašnjaka pa okolice, mreža se ne preklapa
  const iskoristeno = new Set(konji.map((q) => `${q.x},${q.y}`));
  for (const q of pasnjak) if (!iskoristeno.has(`${q.x},${q.y}`)) konji.push({ x: q.x, y: q.y });
  const redom = (l: (Tocka & { d: number })[]) => l.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x).map(({ x, y }) => ({ x, y }));
  for (const q of redom(dalje)) konji.push(q);
  bazen = new Map<Vrsta, Tocka[]>([
    ["konj", konji],
    ["govedo", redom(goveda)],
  ]);
  return bazen;
}

/** Sanira spremljeni broj: nenegativan cijeli, undefined/NaN = 0. Bez kapaciteta. */
export function brojGrla(n: unknown) {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, v);
}

/**
 * Mjesta za vrstu: k-to grlo uvijek dobije k-to mjesto zajedničkog niza (kupnja
 * dodaje na kraj, prodaja miče zadnjeg, razine ništa ne pomiču). Oznaka (kod)
 * kaže čiji je kapacitet: redom staja, ispust (korali), staza / tor, ostalo je višak.
 */
export function mjestaZa(vrsta: Vrsta, g: Partial<Gradevine>): (Tocka & { kod: string })[] {
  const l = bazeni().get(vrsta) ?? [];
  const ids = vrsta === "konj" ? KONJ_ZGRADE : GOVEDO_ZGRADE;
  const kodovi: string[] = [];
  for (const id of ids) {
    const lv = Math.max(0, Math.floor(Number(g[id as keyof Gradevine]) || 0));
    const kap = lv * (POKRICE as Record<string, number>)[id]!;
    for (let i = 0; i < kap && kodovi.length < l.length; i++) kodovi.push(id);
  }
  return l.map((p, k) => ({ ...p, kod: kodovi[k] ?? `${ids[0]}-visak` }));
}

export function stokaNaKarti(g: Partial<Gradevine>, konjiBroj: unknown, govedaBroj: unknown): { grla: Grlo[]; nema: { konj: number; govedo: number } } {
  const grla: Grlo[] = [];
  const nema = { konj: 0, govedo: 0 };
  for (const [vrsta, broj] of [
    ["konj", brojGrla(konjiBroj)],
    ["govedo", brojGrla(govedaBroj)],
  ] as const) {
    if (broj === 0) continue;
    const m = mjestaZa(vrsta, g);
    const n = Math.min(broj, m.length);
    for (let k = 0; k < n; k++) {
      const id = `${vrsta}-${k}`;
      grla.push({ id, vrsta, x: m[k]!.x, y: m[k]!.y, kod: m[k]!.kod, smjer: smjerGrla(id) });
    }
    nema[vrsta] = broj - n;
  }
  return { grla, nema };
}
