import type { Gradevine } from "./types";
import { POKRICE, PROIZVODNJA } from "./tuning";
import {
  CELIJA_H,
  CELIJA_W,
  CESTA,
  PARCELE,
  putelji,
  uRomu,
  type Parcela,
} from "./ulicaRaspored";
import { SVIJET } from "./ulicaRaspored";
import { STAZA, tockeOd } from "./teren";
import { jeGlavni } from "./ljudi";

export type Detalj = "daleko" | "srednje" | "blizu";
export type Cetvrt = "srediste" | "ranc" | "rad";
export type Sloj = "voda" | "sreca" | "rad";

export type Tocka = { x: number; y: number };
export type Staza = { id: string; tocke: Tocka[]; duzina: number };

/** Unutar postojećeg zooma 0.6–2. Zadani kadar na 360 px ostaje srednji. */
export function detaljOdZooma(z: number): Detalj {
  if (z < 0.66) return "daleko";
  if (z < 1.15) return "srednje";
  return "blizu";
}

/** Histereza da prag ne treperi iz kadra u kadar. detaljOdZooma ostaje oštar. */
export function detaljStabilan(prev: Detalj, z: number): Detalj {
  if (prev === "daleko") {
    if (z < 0.74) return "daleko";
    if (z < 1.22) return "srednje";
    return "blizu";
  }
  if (prev === "blizu") {
    if (z >= 1.08) return "blizu";
    if (z >= 0.7) return "srednje";
    return "daleko";
  }
  if (z < 0.62) return "daleko";
  if (z >= 1.22) return "blizu";
  return "srednje";
}

const CETVRTI: Record<Cetvrt, { naziv: string; pasa: string; ids: string[] }> = {
  srediste: {
    naziv: "Središte",
    pasa: "Kuća, salun, bunar",
    ids: ["kuca", "blok", "salun", "karte", "bunar", "cisterna", "ured", "banka", "trgovina", "ordinacija", "banja"],
  },
  ranc: {
    naziv: "Ranč",
    pasa: "Farma, tor, staja",
    ids: ["farma", "tor", "staja", "korali", "staza", "lov", "mesnica", "pekara", "mlin", "travar"],
  },
  rad: {
    naziv: "Radionice",
    pasa: "Pilana, rudnik, kovačnica",
    ids: ["pilana", "kamenolom", "rudnik", "kovacnica", "barutana", "tvornica"],
  },
};

const CETVRT_ID = new Map<string, Cetvrt>();
(Object.keys(CETVRTI) as Cetvrt[]).forEach((k) => {
  for (const id of CETVRTI[k].ids) CETVRT_ID.set(id, k);
});

export function cetvrtZgrade(id: string): Cetvrt {
  return CETVRT_ID.get(id) ?? "srediste";
}

export function cetvrtNaziv(id: string) {
  return CETVRTI[cetvrtZgrade(id)].naziv;
}

export function cetvrtPasa(id: string) {
  return CETVRTI[cetvrtZgrade(id)].pasa;
}

/** Blagi rast unutar istog crteža. Novi crtež na 3 i 6 ne raste još jednom. */
export function rastSkala(lv: number) {
  if (lv <= 1) return 1;
  const u = lv >= 6 ? lv - 5 : lv >= 3 ? lv - 2 : lv - 1;
  return Math.min(1.08, 1 + u * 0.04);
}

export function sirinaPuta(lv: number, veza = false) {
  const baza = veza ? 5 : 6;
  const extra = Math.min(4, Math.max(0, Math.floor(lv) - 1)) * 0.8;
  return Math.round((baza + extra) * 10) / 10;
}

function izvor(id: string) {
  return PARCELE.find((p) => p.id === id);
}

function daljina(a: Parcela, b: Parcela) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function jacinaOd(p: Parcela, id: string, lv: number, baza: number, tezina = 1) {
  if (lv <= 0) return 0;
  const src = izvor(id);
  if (!src) return 0;
  const rad = baza + lv * 0.85;
  const d = daljina(p, src);
  return Math.max(0, 1 - d / rad) * tezina * Math.min(1, 0.55 + lv * 0.15);
}

/** Pokrivenost bunarom, cisternom i mlinom. Samo boja, ne mijenja vodu. */
export function vodaJacina(p: Parcela, g: Gradevine) {
  return Math.min(
    1,
    jacinaOd(p, "bunar", g.bunar || 0, 2.4) +
      jacinaOd(p, "cisterna", g.cisterna || 0, 1.8, 0.75) +
      jacinaOd(p, "mlin", g.mlin || 0, 1.6, 0.55),
  );
}

/** Nema crkve: zona je salun, karte malo slabije. */
export function srecaJacina(p: Parcela, g: Gradevine) {
  return Math.min(1, jacinaOd(p, "salun", g.salun || 0, 2.2) + jacinaOd(p, "karte", g.karte || 0, 1.6, 0.65));
}

const RAD_BOJA: Record<string, string> = {
  pilana: "#c4a06a",
  kamenolom: "#b7b0a4",
  rudnik: "#d7c4a4",
  kovacnica: "#c45c38",
  barutana: "#a84828",
  tvornica: "#8a4030",
  kuca: "#e8b06a",
  blok: "#d8c8a8",
  salun: "#e2b15a",
  karte: "#e2b15a",
  bunar: "#5a9aaa",
  cisterna: "#5a9aaa",
  mlin: "#7eb8c8",
  farma: "#8aab54",
  tor: "#8aab54",
  lov: "#c47848",
  mesnica: "#c47848",
  pekara: "#d4a574",
  staja: "#b07848",
  korali: "#b07848",
  staza: "#b07848",
  ured: "#c9a35a",
  banka: "#c9a35a",
  trgovina: "#c4844a",
  ordinacija: "#7aaa72",
  travar: "#7aaa72",
  banja: "#7aaa72",
};

export function bojaSloja(sloj: Sloj, id: string, g: Gradevine, p: Parcela) {
  if (sloj === "voda") return `rgba(62, 110, 98, ${0.12 + vodaJacina(p, g) * 0.62})`;
  if (sloj === "sreca") return `rgba(226, 177, 90, ${0.1 + srecaJacina(p, g) * 0.6})`;
  const lv = g[id as keyof Gradevine] || 0;
  const hex = RAD_BOJA[id] ?? "#c4844a";
  const a = lv > 0 ? 0.42 : 0.12;
  return hex + Math.round(a * 255).toString(16).padStart(2, "0");
}

function stopa(id: string, lv: number) {
  if (id === "pilana") return `${(PROIZVODNJA.pilana * lv).toFixed(1)} drva`;
  if (id === "kamenolom") return `${(PROIZVODNJA.kamenolom * lv).toFixed(1)} kam.`;
  if (id === "rudnik") return `${(PROIZVODNJA.rudnik * lv).toFixed(1)} žel.`;
  return "";
}

/** Kratke brojke na dodir sloja. Ne računa novu ekonomiju. */
export function brojSloja(sloj: Sloj, id: string, lv: number, g: Gradevine) {
  const p = izvor(id);
  if (!p) return "—";
  if (lv <= 0) return "prazno";
  if (sloj === "voda") {
    if (id === "bunar" || id === "cisterna" || id === "mlin") {
      const k = POKRICE[id as keyof typeof POKRICE] ?? 0;
      return `+${k * lv}`;
    }
    const j = vodaJacina(p, g);
    return j >= 0.2 ? "voda" : "suho";
  }
  if (sloj === "sreca") {
    if (id === "salun" || id === "karte") {
      const k = POKRICE[id as keyof typeof POKRICE] ?? 0;
      return `+${k * lv}`;
    }
    return srecaJacina(p, g) >= 0.25 ? "blizu" : "tiho";
  }
  const pr = stopa(id, lv);
  if (pr) return pr;
  return cetvrtZgrade(id) === "rad" ? "radi" : "mir";
}

function duljina(tocke: Tocka[]) {
  let d = 0;
  for (let i = 1; i < tocke.length; i++) {
    d += Math.hypot(tocke[i]!.x - tocke[i - 1]!.x, tocke[i]!.y - tocke[i - 1]!.y);
  }
  return d;
}

function osUlice(): Tocka[] {
  const a = CESTA[0];
  const b = CESTA[1];
  const c = CESTA[2];
  const d = CESTA[3];
  if (!a || !b || !c || !d) return [];
  const n = 7;
  const out: Tocka[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const lx = a.x + (d.x - a.x) * t;
    const ly = a.y + (d.y - a.y) * t;
    const rx = b.x + (c.x - b.x) * t;
    const ry = b.y + (c.y - b.y) * t;
    out.push({ x: (lx + rx) / 2, y: (ly + ry) / 2 });
  }
  return out;
}

/** Ulica i puteljci do aktivnih zgrada. Kola ostaju na ulici. */
export function stazeKretanja(aktivni: readonly string[]): Staza[] {
  const os = osUlice();
  const out: Staza[] = [];
  if (os.length > 1) out.push({ id: "ulica", tocke: os, duzina: duljina(os) });
  for (const p of putelji(aktivni)) {
    if (p.veza || p.tocke.length < 2) continue;
    const natrag = [...p.tocke].reverse().slice(1);
    const tocke = [...p.tocke, ...natrag];
    out.push({ id: p.id, tocke, duzina: duljina(tocke) });
  }
  return out;
}

/** Rub karte koji kola još prelaze (kotači ostaju na karti, kola se vide na ulazu i izlazu). */
const KOLA_RUB = 16;

/**
 * 0.9.175: kola voze CIJELU glavnu cestu (STAZA.trag): od ulaza na sjeveroistočnom
 * rubu karte kroz cijelo naselje do izlaza na jugozapadnom rubu. Os ceste odrezana na
 * rub karte (presjek s rubom, bez skoka).
 */
export function putKaravane(): Tocka[] {
  const trag = tockeOd(STAZA.trag);
  const unutra = (p: Tocka) => p.x >= KOLA_RUB && p.y >= KOLA_RUB && p.x <= SVIJET.w - KOLA_RUB && p.y <= SVIJET.h - KOLA_RUB;
  const rez = (a: Tocka, b: Tocka): Tocka => {
    // točka na a→b gdje ulazi u pravokutnik (a vani, b unutra): binarno
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 24; k++) {
      const m = (lo + hi) / 2;
      if (unutra({ x: a.x + (b.x - a.x) * m, y: a.y + (b.y - a.y) * m })) hi = m;
      else lo = m;
    }
    return { x: Math.round((a.x + (b.x - a.x) * hi) * 10) / 10, y: Math.round((a.y + (b.y - a.y) * hi) * 10) / 10 };
  };
  const out: Tocka[] = [];
  for (let i = 0; i < trag.length; i++) {
    const p = trag[i]!;
    if (!unutra(p)) continue;
    const prije = trag[i - 1];
    if (out.length === 0 && prije && !unutra(prije)) out.push(rez(prije, p));
    out.push(p);
    const iza = trag[i + 1];
    if (iza && !unutra(iza)) {
      out.push(rez(iza, p));
      break;
    }
  }
  return out;
}

/** Ruta kola tamo-natrag po cijeloj cesti (na kraju se okrenu, smjer slike prati kretanje). */
export function rutaKaravane(): Staza {
  const put = putKaravane();
  const tocke = [...put, ...[...put].reverse().slice(1)];
  return { id: "karavana", tocke, duzina: duljina(tocke) };
}

/** Početna faza (0–1 rute tamo-natrag) za k-ta kola od n: razmaknuta po cijeloj cesti. */
export function fazaKola(k: number, n: number) {
  return (0.12 + k / Math.max(1, n)) % 1;
}

export function tockaNaPutu(tocke: readonly Tocka[], u: number): Tocka {
  if (tocke.length === 0) return { x: 0, y: 0 };
  if (tocke.length === 1) return tocke[0]!;
  const lens = [0];
  for (let i = 1; i < tocke.length; i++) {
    lens.push(lens[i - 1]! + Math.hypot(tocke[i]!.x - tocke[i - 1]!.x, tocke[i]!.y - tocke[i - 1]!.y));
  }
  const ukupno = lens[lens.length - 1] || 1;
  let d = (((u % 1) + 1) % 1) * ukupno;
  for (let i = 1; i < tocke.length; i++) {
    if (d <= lens[i]!) {
      const span = lens[i]! - lens[i - 1]! || 1;
      const t = (d - lens[i - 1]!) / span;
      return {
        x: tocke[i - 1]!.x + (tocke[i]!.x - tocke[i - 1]!.x) * t,
        y: tocke[i - 1]!.y + (tocke[i]!.y - tocke[i - 1]!.y) * t,
      };
    }
  }
  return tocke[tocke.length - 1]!;
}

/** Brzina pješaka na karti (px/s) i jahača (0.9.175: 1.5× pješaka). */
export const BRZINA_HODA = 32;
export const BRZINA_JAHACA = BRZINA_HODA * 1.5;

/**
 * 0.9.175: tko hoda kartom. Svaki heroj (★, GLAVNI_ID) koji je u kaubi uvijek je na karti,
 * bez obzira na granicu hodača; obični kauboji popune ostatak do `n`. Redoslijed ulaza ostaje
 * (heroji prvi, po GLAVNI_ID); nema duplikata (po id-u).
 */
export function odaberiHodace<T extends { id: string }>(tu: readonly T[], n: number): T[] {
  const vidjeni = new Set<string>();
  const jedinstveni = tu.filter((p) => (vidjeni.has(p.id) ? false : (vidjeni.add(p.id), true)));
  const heroji = jedinstveni.filter((p) => jeGlavni(p.id));
  const ostali = jedinstveni.filter((p) => !jeGlavni(p.id)).slice(0, Math.max(0, Math.floor(n) - heroji.length));
  return [...heroji, ...ostali];
}

export function brojAgenata(kauboji: number, zgrada: number) {
  const hodaci = Math.max(0, Math.min(4, Math.floor(kauboji) > 0 ? Math.min(4, Math.ceil(Math.floor(kauboji) / 2)) : 0));
  const kola = zgrada >= 8 ? 2 : zgrada >= 2 ? 1 : 0;
  return { hodaci, kola };
}

/** Konji privezani uz vrata saluna, izvan romba. */
export function konjiSaluna(): Tocka[] {
  const p = putelji(["salun"]).find((s) => s.id === "salun");
  // 0.9.176: sidra po sirovoj liniji (prikazana linija je vijugava i gušća)
  const k = p?.kosti ?? p?.tocke;
  if (!k || k.length < 3) return [];
  const traka = k[1]!;
  const vrata = k[2]!;
  return [
    { x: traka.x * 0.45 + vrata.x * 0.55, y: traka.y * 0.45 + vrata.y * 0.55 },
    { x: traka.x * 0.7 + vrata.x * 0.3 + 10, y: traka.y * 0.7 + vrata.y * 0.3 + 6 },
  ];
}

/** Ograde na vanjskom rubu ranča. Točka mora biti izvan svakog romba. */
/** 0.9.177 (t453u): svaki komadić ograde nosi zgradu kojoj pripada — crta se tek kad je ona izgrađena. */
export function ogradeRanca(): (Tocka & { zgrada: string })[] {
  // 0.9.174: tor ima vlastitu punu ogradu obora (stokaKarta.ogradaTora), bez ovog komadića.
  const ids = ["farma", "staja", "lov"];
  const out: (Tocka & { zgrada: string })[] = [];
  for (const id of ids) {
    const p = izvor(id);
    if (!p) continue;
    const znak = p.strana === "l" ? -1 : 1;
    const t = { x: p.x + znak * (CELIJA_W / 2 + 10), y: p.y - 4 };
    if (PARCELE.some((q) => uRomu(t.x, t.y, q))) continue;
    out.push({ ...t, zgrada: id });
  }
  return out;
}

export function stokaTocke(samo?: readonly string[]): Tocka[] {
  const ids = ["tor", "farma", "staja"].filter((id) => !samo || samo.includes(id));
  const out: Tocka[] = [];
  for (const id of ids) {
    const p = putelji([id]).find((s) => s.id === id);
    const k = p?.kosti ?? p?.tocke;
    if (!k || k.length < 2) continue;
    const a = k[0]!;
    const b = k[1]!;
    const t = { x: a.x * 0.35 + b.x * 0.65, y: a.y * 0.35 + b.y * 0.65 };
    if (PARCELE.some((q) => uRomu(t.x, t.y, q))) continue;
    out.push(t);
    if (out.length >= 3) break;
  }
  return out;
}

export function rombTocke(p: Parcela) {
  const hw = CELIJA_W / 2;
  const hh = CELIJA_H / 2;
  return `${p.x},${p.y - hh} ${p.x + hw},${p.y} ${p.x},${p.y + hh} ${p.x - hw},${p.y}`;
}
