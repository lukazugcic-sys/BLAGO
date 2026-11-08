/**
 * Kamo hodač ide: čisto, bez stanja i bez spremanja.
 * Cilj dolazi iz gdjeJe() (zadatak, gradilište, doba dana). Ruta ide samo
 * postojećim putevima: puteljak zgrade -> poprijeko na os ulice -> os ulice ->
 * puteljak cilja do vrata. Nikad ravna crta preko tuđe parcele.
 */
import { stazeKretanja, type Tocka } from "./kartaPogled";
import { PARCELE, putelji } from "./ulicaRaspored";

export type CiljHoda = { tip: "ulica" } | { tip: "zgrada"; zgrada: string } | { tip: "put" };

/** gdjeJe() -> cilj na karti. "put" = izvan karte (pohod/karavana), hodač se ne crta. */
export function ciljIzGdje(g: { mjesto: "ulica" | "zgrada" | "put"; zgrada?: string }): CiljHoda {
  if (g.mjesto === "put") return { tip: "put" };
  if (g.mjesto === "zgrada" && g.zgrada && PARCELE.some((p) => p.id === g.zgrada)) return { tip: "zgrada", zgrada: g.zgrada };
  return { tip: "ulica" };
}

export function kljucCilja(c: CiljHoda) {
  return c.tip === "zgrada" ? `z:${c.zgrada}` : c.tip;
}

export type PlanHoda = {
  tocke: Tocka[];
  /** Udaljenost na kojoj ruta stiže na os ulice. */
  ulazD: number;
  /** Udaljenost na kojoj ruta napušta os ulice prema cilju. */
  izlazD: number;
  /** Ukupna duljina. */
  duzina: number;
  /** true: ide do kraja i čeka. false: petlja ulicom tamo-natrag. */
  jednom: boolean;
  cilj: string;
};

let osCache: Tocka[] | null = null;
export function osUlice(): Tocka[] {
  if (!osCache) osCache = stazeKretanja([])[0]?.tocke ?? [];
  return osCache;
}

const spurCache = new Map<string, Tocka[] | null>();
/** Puteljak od vrata (prva točka) do ruba ulice (zadnja točka). */
export function puteljakZgrade(id: string): Tocka[] | null {
  if (!spurCache.has(id)) {
    const p = putelji([id]).find((x) => x.id === id && !x.veza);
    spurCache.set(id, p && p.tocke.length >= 1 ? p.tocke : null);
  }
  return spurCache.get(id) ?? null;
}

function dist(a: Tocka, b: Tocka) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function duljina(t: readonly Tocka[]) {
  let d = 0;
  for (let i = 1; i < t.length; i++) d += dist(t[i - 1]!, t[i]!);
  return d;
}

/** Najbliža točka na osi: { tocka, s = udaljenost duž osi }. */
export function naOs(p: Tocka): { tocka: Tocka; s: number } {
  const os = osUlice();
  let best = { tocka: os[0] ?? p, s: 0 };
  let bd = Infinity;
  let acc = 0;
  for (let i = 1; i < os.length; i++) {
    const a = os[i - 1]!;
    const b = os[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = dist(p, q);
    if (d < bd) {
      bd = d;
      best = { tocka: q, s: acc + Math.sqrt(l2) * t };
    }
    acc += Math.sqrt(l2);
  }
  return best;
}

/** Dio osi od s0 do s1 (bilo kojim smjerom), uključivo krajnje točke. */
export function dioOsi(s0: number, s1: number): Tocka[] {
  const os = osUlice();
  const cum = [0];
  for (let i = 1; i < os.length; i++) cum.push(cum[i - 1]! + dist(os[i - 1]!, os[i]!));
  const at = (s: number): Tocka => {
    for (let i = 1; i < os.length; i++) {
      if (s <= cum[i]! + 1e-6) {
        const span = cum[i]! - cum[i - 1]! || 1;
        const t = (s - cum[i - 1]!) / span;
        return { x: os[i - 1]!.x + (os[i]!.x - os[i - 1]!.x) * t, y: os[i - 1]!.y + (os[i]!.y - os[i - 1]!.y) * t };
      }
    }
    return os[os.length - 1]!;
  };
  const out: Tocka[] = [at(s0)];
  if (s1 >= s0) {
    for (let i = 0; i < os.length; i++) if (cum[i]! > s0 && cum[i]! < s1) out.push(os[i]!);
  } else {
    for (let i = os.length - 1; i >= 0; i--) if (cum[i]! < s0 && cum[i]! > s1) out.push(os[i]!);
  }
  out.push(at(s1));
  return out;
}

function tockaNaD(t: readonly Tocka[], d: number): { tocka: Tocka; seg: number } {
  let acc = 0;
  for (let i = 1; i < t.length; i++) {
    const l = dist(t[i - 1]!, t[i]!);
    if (d <= acc + l) {
      const u = l > 0 ? (d - acc) / l : 0;
      return { tocka: { x: t[i - 1]!.x + (t[i]!.x - t[i - 1]!.x) * u, y: t[i - 1]!.y + (t[i]!.y - t[i - 1]!.y) * u }, seg: i };
    }
    acc += l;
  }
  return { tocka: t[t.length - 1] ?? { x: 0, y: 0 }, seg: t.length };
}

function spoji(...dijelovi: Tocka[][]): Tocka[] {
  const out: Tocka[] = [];
  for (const d of dijelovi) {
    for (const p of d) {
      const z = out[out.length - 1];
      if (z && Math.abs(z.x - p.x) < 0.01 && Math.abs(z.y - p.y) < 0.01) continue;
      out.push({ x: p.x, y: p.y });
    }
  }
  return out;
}

function zavrsi(tocke: Tocka[], ulazD: number, izlazD: number, jednom: boolean, cilj: string): PlanHoda {
  const duzina = duljina(tocke);
  return { tocke, ulazD, izlazD, duzina, jednom, cilj };
}

/** Petlja ulicom tamo-natrag (bez skoka s kraja na početak). */
export function planUlice(): PlanHoda {
  const os = osUlice();
  const tocke = spoji(os, [...os].reverse());
  const d = duljina(tocke);
  return { tocke, ulazD: 0, izlazD: d, duzina: d, jednom: false, cilj: "ulica" };
}

/** Hodač stoji na cilju (početno stanje, ili smanjen pokret). */
export function planNaCilju(c: CiljHoda): PlanHoda {
  if (c.tip === "zgrada") {
    const spur = puteljakZgrade(c.zgrada);
    if (spur) return zavrsi([spur[0]!], 0, 0, true, kljucCilja(c));
  }
  return planUlice();
}

/** Početna točka plana na cilju. */
export function tockaCilja(c: CiljHoda): Tocka {
  return planNaCilju(c).tocke[0] ?? { x: 0, y: 0 };
}

/**
 * Nova ruta od TRENUTNE pozicije (plan + prijeđena udaljenost d) do cilja.
 * Natrag na ulicu ide istim putem kojim je došao; nema ravne crte.
 */
export function preusmjeri(stari: PlanHoda, d: number, c: CiljHoda): PlanHoda {
  const t = stari.tocke;
  let prefiks: Tocka[];
  let jS: number;
  if (t.length === 1) {
    // stoji na vratima: izlazi svojim puteljkom
    const id = stari.cilj.startsWith("z:") ? stari.cilj.slice(2) : "";
    const spur = id ? puteljakZgrade(id) : null;
    const rub = spur ? spur[spur.length - 1]! : t[0]!;
    const os = naOs(rub);
    prefiks = spoji(spur ?? [t[0]!], [os.tocka]);
    jS = os.s;
  } else if (!stari.jednom) {
    const dd = ((d % stari.duzina) + stari.duzina) % stari.duzina;
    const p = tockaNaD(t, dd).tocka;
    const os = naOs(p);
    prefiks = [p, os.tocka];
    jS = os.s;
  } else {
    const dd = Math.max(0, Math.min(stari.duzina, d));
    const { tocka: p, seg } = tockaNaD(t, dd);
    if (dd <= stari.ulazD) {
      const kraj = tockaNaD(t, stari.ulazD);
      prefiks = spoji([p], t.slice(seg, kraj.seg), [kraj.tocka]);
      jS = naOs(kraj.tocka).s;
    } else if (dd >= stari.izlazD) {
      const poc = tockaNaD(t, stari.izlazD);
      prefiks = spoji([p], t.slice(poc.seg, seg).reverse(), [poc.tocka]);
      jS = naOs(poc.tocka).s;
    } else {
      const os = naOs(p);
      prefiks = [p, os.tocka];
      jS = os.s;
    }
  }
  const ulazD = duljina(prefiks);
  if (c.tip !== "zgrada") {
    // na ulicu: do osi, pa petlja (komponenta prebacuje na planUlice s fazom jS)
    return zavrsi(prefiks, ulazD, ulazD, true, "ulica");
  }
  const spur = puteljakZgrade(c.zgrada);
  if (!spur) return zavrsi(prefiks, ulazD, ulazD, true, "ulica");
  const rub = spur[spur.length - 1]!;
  const ciljOs = naOs(rub);
  const ulica = dioOsi(jS, ciljOs.s);
  const doRuba = spoji(prefiks, ulica);
  const izlazD = duljina(doRuba);
  const tocke = spoji(doRuba, [rub], [...spur].reverse());
  return zavrsi(tocke, ulazD, izlazD, true, kljucCilja(c));
}

/** Faza (0–1) petlje ulice koja odgovara točki s na osi. */
export function fazaUlice(s: number) {
  const p = planUlice();
  return p.duzina > 0 ? s / p.duzina : 0;
}
