/**
 * 0.9.176 (t443u): uske pješačke staze unutar svakog naselja (Grad, Ranč, Selo, Farma, Rudnik).
 * Zgrade istog naselja spojene su stablom najkraćih veza (od vrata do vrata), staza se traži
 * na mreži (A*) oko zgrada, slika zgrada, ceste, obora, trga i stabala; potok prelazi samo
 * kad mora (tada dobije mostić). Linija se izgladi i blago vijuga kao puteljci (19).
 * Svaka staza dira i puteljak svoje zgrade, pa je mreža naselja spojena i s glavnom cestom.
 * Čista geometrija prikaza; ništa se ne sprema.
 */
import { uOboru } from "./obor";
import { OBZOR, RASUTE } from "./obzorTocke";
import { DEKOR, PARCELE, SVIJET, putelji, velicinaSpritea, vijugaj, type Puteljak } from "./ulicaRaspored";
import { KAMENOLOM_KAMENJE, MOSTOVI, NASELJA, POTOK, STAZA, UVALA, doPotoka, tockeOd, tockeRekvizita } from "./teren";
import { uTrgu } from "./trg";
import { MOSTOVI_PJESINA_PODACI, PJESINE_PODACI } from "./terenPodaci";

type Tocka = { x: number; y: number };

const CEL = 6;
/** Širina pješačke staze (px svijeta); puteljci 6–9.2, glavna cesta ~36+. */
export const SIRINA_PJESINE = 3.2;

function uPoly(p: Tocka, poly: readonly Tocka[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) c = !c;
  }
  return c;
}
function dSeg(p: Tocka, a: Tocka, b: Tocka) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}
function dLin(p: Tocka, l: readonly Tocka[]) {
  let d = Infinity;
  for (let i = 1; i < l.length; i++) d = Math.min(d, dSeg(p, l[i - 1]!, l[i]!));
  return d;
}

const CESTA_POLY = tockeOd(STAZA.tijelo);

/** Kutija vidljive slike zgrade (malo uvučena), staza ide oko nje. */
export function kutijaSlike(id: string) {
  const p = PARCELE.find((q) => q.id === id)!;
  const { w, h } = velicinaSpritea(id, true);
  const uvuci = id === "tor" ? w * 0.32 : 10;
  return { l: p.x - w / 2 + uvuci, r: p.x + w / 2 - uvuci, t: p.y - h * 0.55, b: p.y + h * 0.26 };
}

/** Pješačka staza ne smije ovdje (zgrade, slike, cesta, obor, trg, rub karte). */
export function zabranjenoZaPjesinu(p: Tocka) {
  if (p.x < 8 || p.y < 8 || p.x > SVIJET.w - 8 || p.y > SVIJET.h - 8) return true;
  for (const q of PARCELE) if (Math.abs(p.x - q.x) / 48 + Math.abs(p.y - q.y) / 24 < 1.04) return true;
  for (const q of PARCELE) {
    const k = kutijaSlike(q.id);
    if (p.x > k.l && p.x < k.r && p.y > k.t && p.y < k.b) return true;
  }
  if (uPoly(p, CESTA_POLY) || dLin(p, CESTA_POLY) < 5) return true;
  if (uOboru(p.x, p.y, 8)) return true;
  if (uTrgu(p.x, p.y, 8)) return true;
  return false;
}

/** Blaža provjera za izglađenu liniju (mreža je stroža, pa izglađena linija ima malo prostora). */
export function preprekaPjesini(p: Tocka) {
  if (p.x < 4 || p.y < 4 || p.x > SVIJET.w - 4 || p.y > SVIJET.h - 4) return true;
  for (const q of PARCELE) if (Math.abs(p.x - q.x) / 48 + Math.abs(p.y - q.y) / 24 < 0.96) return true;
  for (const q of PARCELE) {
    const k = kutijaSlike(q.id);
    if (p.x > k.l + 3 && p.x < k.r - 3 && p.y > k.t + 3 && p.y < k.b - 3) return true;
  }
  if (uPoly(p, CESTA_POLY)) return true;
  if (uOboru(p.x, p.y, 3)) return true;
  if (uTrgu(p.x, p.y, 3)) return true;
  return false;
}

/** Vrata zgrade = početak njezina puteljka (sirova linija). */
export function vrataZgrade(id: string): Tocka | null {
  const p = putelji([id]).find((s) => s.id === id && !s.veza);
  const k = p?.kosti ?? p?.tocke;
  return k && k[0] ? { x: k[0].x, y: k[0].y } : null;
}

type Mreza = { W: number; H: number; stanje: Uint8Array; cijena: Float32Array; celija: (k: number) => void };
let mreza: Mreza | null = null;
/** Mreža se računa lijeno: samo ćelije koje A* stvarno posjeti (brzo i na telefonu). */
function dajMrezu(): Mreza {
  if (mreza) return mreza;
  const W = Math.ceil(SVIJET.w / CEL);
  const H = Math.ceil(SVIJET.h / CEL);
  /** 0 = neizračunato, 1 = slobodno, 2 = zabranjeno */
  const stanje = new Uint8Array(W * H);
  const cijena = new Float32Array(W * H).fill(1);
  const putevi = putelji(PARCELE.map((p) => p.id)).filter((p) => !p.veza).map((p) => p.tocke);
  const prepreke: { x: number; y: number; r: number }[] = [
    ...tockeRekvizita().map((p) => ({ ...p, r: 9 })),
    ...OBZOR.stabla.map((p) => ({ ...p, r: 16 })),
    ...OBZOR.grmlje.map((p) => ({ ...p, r: 12 })),
    ...OBZOR.kaktusi.map((p) => ({ ...p, r: 14 })),
    ...RASUTE.map((p) => ({ ...p, r: 10 })),
    ...DEKOR.map((p) => ({ ...p, r: 14 })),
    ...KAMENOLOM_KAMENJE.map((p) => ({ ...p, r: p.r + 4 })),
  ];
  // kante 48 px za prepreke
  const KB = 48;
  const kante = new Map<number, { x: number; y: number; r: number }[]>();
  for (const q of prepreke) {
    const key = Math.floor(q.y / KB) * 1000 + Math.floor(q.x / KB);
    const l = kante.get(key) ?? [];
    l.push(q);
    kante.set(key, l);
  }
  const celija = (k: number) => {
    if (stanje[k]) return;
    const p = { x: (k % W) * CEL + CEL / 2, y: Math.floor(k / W) * CEL + CEL / 2 };
    if (zabranjenoZaPjesinu(p)) {
      stanje[k] = 2;
      return;
    }
    let c = 1;
    if (doPotoka(p.x, p.y) < 14) c += 22;
    const bx = Math.floor(p.x / KB);
    const by = Math.floor(p.y / KB);
    for (let j = by - 1; j <= by + 1; j++)
      for (let i = bx - 1; i <= bx + 1; i++)
        for (const q of kante.get(j * 1000 + i) ?? []) if (Math.hypot(q.x - p.x, q.y - p.y) < q.r) c += 6;
    // uz postojeći puteljak je jeftinije (staze se spajaju, ne idu paralelno)
    if (putevi.some((l) => dLin(p, l) < 5)) c *= 0.55;
    cijena[k] = c;
    stanje[k] = 1;
  };
  mreza = { W, H, stanje, cijena, celija };
  return mreza;
}

/** A* na mreži od a do b (8 smjerova). Oko početka i cilja (r 16) zabrana ne vrijedi. */
function trazi(a: Tocka, b: Tocka): Tocka[] | null {
  const { W, H, stanje, cijena, celija } = dajMrezu();
  const ci = (p: Tocka) => Math.max(0, Math.min(W - 1, Math.floor(p.x / CEL)));
  const cj = (p: Tocka) => Math.max(0, Math.min(H - 1, Math.floor(p.y / CEL)));
  const s = cj(a) * W + ci(a);
  const g = cj(b) * W + ci(b);
  const blizuKraja = (i: number, j: number) => {
    const x = i * CEL + CEL / 2;
    const y = j * CEL + CEL / 2;
    return Math.hypot(x - a.x, y - a.y) < 16 || Math.hypot(x - b.x, y - b.y) < 16;
  };
  const gx = g % W;
  const gy = Math.floor(g / W);
  const hcost = (k: number) => Math.hypot((k % W) - gx, Math.floor(k / W) - gy) * 0.55;
  const dist = new Float64Array(W * H).fill(Infinity);
  const od = new Int32Array(W * H).fill(-1);
  const zatv = new Uint8Array(W * H);
  // binarna gomila
  const heap: number[] = [];
  const f = new Float64Array(W * H).fill(Infinity);
  const push = (k: number) => {
    heap.push(k);
    let i = heap.length - 1;
    while (i > 0) {
      const r = (i - 1) >> 1;
      if (f[heap[r]!]! <= f[heap[i]!]!) break;
      [heap[r], heap[i]] = [heap[i]!, heap[r]!];
      i = r;
    }
  };
  const pop = () => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && f[heap[l]!]! < f[heap[m]!]!) m = l;
        if (r < heap.length && f[heap[r]!]! < f[heap[m]!]!) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i]!, heap[m]!];
        i = m;
      }
    }
    return top;
  };
  dist[s] = 0;
  f[s] = hcost(s);
  push(s);
  while (heap.length) {
    const k = pop();
    if (zatv[k]) continue;
    zatv[k] = 1;
    if (k === g) break;
    const x = k % W;
    const y = Math.floor(k / W);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (zatv[n]) continue;
        celija(n);
        const zab = stanje[n] === 2;
        if (zab && !blizuKraja(nx, ny)) continue;
        const korak = (dx && dy ? Math.SQRT2 : 1) * (zab ? 1 : cijena[n]!);
        const nd = dist[k]! + korak;
        if (nd < dist[n]!) {
          dist[n] = nd;
          od[n] = k;
          f[n] = nd + hcost(n);
          push(n);
        }
      }
    }
  }
  if (!Number.isFinite(dist[g]!)) return null;
  const put: Tocka[] = [];
  for (let k = g; k !== -1; k = od[k]!) put.push({ x: (k % W) * CEL + CEL / 2, y: Math.floor(k / W) * CEL + CEL / 2 });
  put.reverse();
  put[0] = { ...a };
  put[put.length - 1] = { ...b };
  return put;
}

/** Stablo najkraćih veza (Prim) po vratima zgrada naselja. */
function vezeNaselja(ids: readonly string[]): [string, string][] {
  const vrata = ids.flatMap((id) => {
    const v = vrataZgrade(id);
    return v ? [{ id, ...v }] : [];
  });
  if (vrata.length < 2) return [];
  const u = new Set([vrata[0]!.id]);
  const out: [string, string][] = [];
  while (u.size < vrata.length) {
    let best: [string, string] | null = null;
    let bd = Infinity;
    for (const a of vrata) {
      if (!u.has(a.id)) continue;
      for (const b of vrata) {
        if (u.has(b.id)) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < bd) {
          bd = d;
          best = [a.id, b.id];
        }
      }
    }
    if (!best) break;
    u.add(best[1]);
    out.push(best);
  }
  return out;
}

export type Pjesina = Puteljak & { naselje: string; a: string; b: string };

/**
 * Sve pješačke staze (kao da je sve izgrađeno). Računanje (A* + izglađivanje) traje ~0.2–0.5 s,
 * pa se rezultat peče u terenPodaci.ts (scripts/gen-teren-podaci.mjs); test teren-176 provjerava
 * da je pečeno jednako svježe izračunatom.
 */
export function svePjesine(): Pjesina[] {
  return PJESINE_PODACI as Pjesina[];
}

/** Svježi izračun pješačkih staza (generator i test). */
export function izracunajPjesine(): Pjesina[] {
  const out: Pjesina[] = [];
  for (const n of NASELJA) {
    for (const [a, b] of vezeNaselja(n.ids)) {
      const va = vrataZgrade(a);
      const vb = vrataZgrade(b);
      if (!va || !vb) continue;
      const kosti = trazi(va, vb);
      if (!kosti || kosti.length < 2) continue;
      const kraj = (p: Tocka) => Math.hypot(p.x - va.x, p.y - va.y) < 24 || Math.hypot(p.x - vb.x, p.y - vb.y) < 24;
      const tocke = vijugaj(`pj:${a}-${b}`, kosti, (p) => !kraj(p) && preprekaPjesini(p), 4);
      out.push({ id: `${a}-${b}`, tocke, veza: true, pjesina: true, naselje: n.id, a, b });
    }
  }
  return out;
}

/** Pješačke staze između aktivnih (izgrađenih) zgrada. */
export function pjesine(aktivni: readonly string[]): Pjesina[] {
  const set = new Set(aktivni);
  return svePjesine().filter((p) => set.has(p.a) && set.has(p.b));
}

/** Mostić gdje pješačka staza prelazi potok (ako tamo već nema mostića); pečeno. */
export function mostoviPjesina(): { x: number; y: number; kut: number }[] {
  return MOSTOVI_PJESINA_PODACI;
}

export function izracunajMostovePjesina(staze: readonly Pjesina[] = svePjesine()) {
  const vode = [tockeOd(POTOK), tockeOd(UVALA)].filter((v) => v.length > 1);
  const out: { x: number; y: number; kut: number }[] = [];
  for (const p of staze) {
    const l = p.tocke;
    for (let i = 1; i < l.length; i++) {
      const a = l[i - 1]!;
      const b = l[i]!;
      for (const voda of vode) {
        for (let j = 1; j < voda.length; j++) {
          const c = voda[j - 1]!;
          const d = voda[j]!;
        const r = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (!r) continue;
        const s1 = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / r;
        const s2 = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / r;
        if (s1 < 0 || s1 > 1 || s2 < 0 || s2 > 1) continue;
        const x = Math.round((a.x + (b.x - a.x) * s1) * 10) / 10;
        const y = Math.round((a.y + (b.y - a.y) * s1) * 10) / 10;
        if ([...MOSTOVI, ...out].some((m) => Math.hypot(m.x - x, m.y - y) < 24)) continue;
        out.push({ x, y, kut: Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI) });
        }
      }
    }
  }
  return out;
}
