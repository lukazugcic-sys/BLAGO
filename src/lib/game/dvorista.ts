/**
 * 0.9.176 (23 + t436u + t439u): sitni detalji u dvorištu SVAKE zgrade (kamenčići, grmlje, bačve,
 * sanduci, privezi, posude s cvijećem, utabano tlo...), po temi zgrade, i vrt pun bilja oko travara.
 * Stalno (sjeme po id-u zgrade), ništa se ne sprema. Ništa ne stoji na cesti, puteljku, pješačkoj
 * stazi, vodi, tuđoj parceli ili slici zgrade, u oboru, na trgu ni na mjestu imena zgrade;
 * konji (stokaKarta.kutijeUkrasa) zaobilaze sve ove ukrase.
 */
import { konjiSaluna, ogradeRanca, stokaTocke } from "./kartaPogled";
import { uOboru } from "./obor";
import { OBZOR, RASUTE } from "./obzorTocke";
import { kutijaSlike, mostoviPjesina, svePjesine } from "./pjesine";
import { DVORISTA_PODACI } from "./terenPodaci";
import { LOKVA, MOSTOVI, STAZA, doPotoka, tockeOd, tockeRekvizita } from "./teren";
import { TRG_STVARI, uTrgu } from "./trg";
import { DEKOR, PARCELE, SVIJET, putelji, sitniDekor, uRomu, velicinaSpritea } from "./ulicaRaspored";
import { ZGRADE } from "./constants";

type Tocka = { x: number; y: number };

export type DvTip =
  | "kamencici"
  | "grm"
  | "cvijece"
  | "bilje"
  | "lonac"
  | "bacva"
  | "sanduk"
  | "privez"
  | "sijeno"
  | "nakovanj"
  | "ugljen"
  | "trupci"
  | "drva"
  | "klupa"
  | "vreca"
  | "kanta"
  | "kolo"
  | "gredica";

/** Mjerilo sličica ukrasa (crtaju se 1.35× veće od simbola). */
export const DV_MJERILO = 1.35;
/** Polumjer otiska na tlu (px svijeta, već s mjerilom). */
export const DV_R: Record<DvTip, number> = {
  kamencici: 5.4,
  grm: 8.1,
  cvijece: 5.4,
  bilje: 5.4,
  lonac: 4.7,
  bacva: 6.1,
  sanduk: 6.8,
  privez: 10.8,
  sijeno: 8.8,
  nakovanj: 6.8,
  ugljen: 6.8,
  trupci: 10.8,
  drva: 8.8,
  klupa: 9.5,
  vreca: 5.4,
  kanta: 4.1,
  kolo: 6.8,
  gredica: 14.9,
};

export type Ukras = { id: string; tip: DvTip; x: number; y: number; zrcalo: boolean; sc: number; zgrada: string };
export type Gazeno = { x: number; y: number; rx: number; ry: number; kut: number };

/** Teme dvorišta: glavni predmeti zgrade (redom važnosti). */
const TEMA: Record<string, DvTip[]> = {
  kuca: ["lonac", "klupa", "cvijece", "bacva", "privez", "lonac"],
  ured: ["privez", "bacva", "klupa", "sanduk"],
  blok: ["klupa", "lonac", "bacva", "sanduk", "lonac"],
  bunar: ["kanta", "kanta", "cvijece", "kamencici"],
  trgovina: ["sanduk", "bacva", "vreca", "privez", "sanduk"],
  salun: ["bacva", "bacva", "privez", "sanduk", "klupa"],
  ordinacija: ["klupa", "lonac", "kanta", "cvijece", "lonac"],
  pekara: ["vreca", "drva", "vreca", "sanduk", "bacva"],
  karte: ["bacva", "klupa", "sanduk", "lonac"],
  mesnica: ["bacva", "kanta", "sanduk", "drva"],
  banja: ["kanta", "bacva", "lonac", "drva", "kanta"],
  travar: ["gredica", "gredica", "gredica", "lonac", "kanta"],
  staza: ["privez", "sijeno", "kanta", "sanduk"],
  pilana: ["trupci", "trupci", "drva", "sanduk"],
  kovacnica: ["nakovanj", "ugljen", "bacva", "kolo", "kanta"],
  tor: ["sijeno", "kanta", "sijeno"],
  barutana: ["bacva", "bacva", "sanduk", "vreca"],
  staja: ["sijeno", "privez", "kanta", "kolo", "sijeno"],
  tvornica: ["sanduk", "sanduk", "bacva", "kolo", "trupci"],
  korali: ["sijeno", "kanta", "privez"],
  lov: ["trupci", "drva", "sanduk", "kanta"],
  farma: ["sijeno", "vreca", "kanta", "kolo", "sijeno"],
  mlin: ["vreca", "vreca", "sijeno", "sanduk"],
  cisterna: ["bacva", "kanta", "kamencici", "bacva"],
  kamenolom: ["kamencici", "sanduk", "kolo", "kamencici"],
  rudnik: ["ugljen", "sanduk", "kolo", "kamencici"],
  banka: ["lonac", "klupa", "sanduk", "lonac"],
};
export const BILJKE: ReadonlySet<DvTip> = new Set(["bilje", "cvijece", "grm", "gredica", "lonac"]);
const PUNILO: DvTip[] = ["kamencici", "grm", "cvijece", "kamencici", "grm"];

function rndOd(kljuc: string) {
  let h = 2166136261;
  for (let i = 0; i < kljuc.length; i++) {
    h ^= kljuc.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
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
function uPoly(p: Tocka, poly: readonly Tocka[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) c = !c;
  }
  return c;
}

/** Zadano mjesto imena zgrade (kad se pokaže dodirom): ukras ga ne prekriva. */
export function kutijaImena(id: string) {
  const p = PARCELE.find((q) => q.id === id)!;
  const naziv = ZGRADE.find((z) => z.id === id)?.naziv ?? id;
  const w = Math.min(150, 52 + naziv.length * 6);
  return { l: p.x - w / 2, r: p.x + w / 2, t: p.y + 18 - 18, b: p.y + 18 + 2 };
}

type Prep = {
  putevi: Tocka[][];
  pjesine: Tocka[][];
  cesta: Tocka[];
  tocke: { x: number; y: number; r: number }[];
};
let prep: Prep | null = null;
let prepIzvor: { pj: readonly { tocke: Tocka[] }[]; mo: readonly Tocka[] } | null = null;
function prepreke(): Prep {
  if (prep) return prep;
  const izvor = prepIzvor ?? { pj: svePjesine(), mo: mostoviPjesina() };
  const tocke: { x: number; y: number; r: number }[] = [
    ...tockeRekvizita().map((p) => ({ ...p, r: 8 })),
    ...OBZOR.stabla.map((p) => ({ ...p, r: 16 })),
    ...OBZOR.grmlje.map((p) => ({ ...p, r: 12 })),
    ...OBZOR.kaktusi.map((p) => ({ ...p, r: 14 })),
    ...RASUTE.map((p) => ({ ...p, r: 10 })),
    ...DEKOR.map((p) => ({ ...p, r: 16 })),
    ...sitniDekor().map((p) => ({ ...p, r: 9 })),
    ...[...MOSTOVI, ...izvor.mo].map((p) => ({ ...p, r: 20 })),
    ...ogradeRanca().map((p) => ({ ...p, r: 24 })),
    ...konjiSaluna().map((p) => ({ ...p, r: 12 })),
    ...stokaTocke().map((p) => ({ ...p, r: 12 })),
    ...TRG_STVARI.map((p) => ({ ...p, r: 8 })),
  ];
  prep = {
    putevi: putelji(PARCELE.map((p) => p.id)).map((p) => p.tocke),
    pjesine: izvor.pj.map((p) => p.tocke),
    cesta: tockeOd(STAZA.tijelo),
    tocke,
  };
  return prep;
}

/** Je li mjesto slobodno za ukras polumjera r (bez provjere drugih novih ukrasa). */
export function slobodnoZaUkras(x: number, y: number, r: number, vlastita?: string) {
  if (x - r < 10 || y - r < 10 || x + r > SVIJET.w - 10 || y + r > SVIJET.h - 10) return false;
  const P = prepreke();
  const p = { x, y };
  for (const [dx, dy] of [
    [0, 0],
    [r, 0],
    [-r, 0],
    [0, r * 0.6],
    [0, -r * 0.6],
  ] as const)
    for (const q of PARCELE) if (uRomu(x + dx, y + dy, q)) return false;
  for (const q of PARCELE) {
    const k = kutijaSlike(q.id);
    if (x + r > k.l && x - r < k.r && y + r * 0.6 > k.t && y - r * 0.6 < k.b) return false;
    const n = kutijaImena(q.id);
    if (x + r > n.l && x - r < n.r && y + r * 0.6 > n.t && y - r * 0.6 < n.b) return false;
  }
  if (uPoly(p, P.cesta) || dLin(p, P.cesta) < r + 4) return false;
  for (const l of P.putevi) if (dLin(p, l) < r + 7) return false;
  for (const l of P.pjesine) if (dLin(p, l) < r + 5) return false;
  if (doPotoka(x, y) < r + 12) return false;
  if (LOKVA && ((x - LOKVA.x) / (30 + r)) ** 2 + ((y - LOKVA.y) / (14 + r)) ** 2 < 1) return false;
  if (uOboru(x, y, r + 6)) return false;
  if (uTrgu(x, y, r + 8)) return false;
  for (const q of P.tocke) if (Math.abs(q.x - x) < q.r + r && Math.abs(q.y - y) < q.r + r && Math.hypot(q.x - x, q.y - y) < q.r + r) return false;
  void vlastita;
  return true;
}

function najblizaZgrada(x: number, y: number) {
  let naj = Infinity;
  let id = "";
  for (const q of PARCELE) {
    const d = Math.hypot(q.x - x, (q.y - y) * 1.5);
    if (d < naj) {
      naj = d;
      id = q.id;
    }
  }
  return id;
}

export type Dvorista = { ukrasi: Ukras[]; gazeno: Gazeno[]; gazenoZgrade: string[] };

/**
 * Svi ukrasi dvorišta (sve zgrade, kao da su izgrađene; prikaz filtrira po izgrađenim).
 * Pečeno u terenPodaci.ts (izračun ~0.5–1 s); test teren-176 provjerava jednakost sa svježim izračunom.
 */
export function dvorista(): Dvorista {
  return DVORISTA_PODACI as Dvorista;
}

/** Svježi izračun (generator i test); `izvor` = svježe pješačke staze i mostići (inače pečeni). */
export function izracunajDvorista(izvor?: { pj: readonly { tocke: Tocka[] }[]; mo: readonly Tocka[] }): Dvorista {
  prepIzvor = izvor ?? null;
  prep = null;
  const ukrasi: Ukras[] = [];
  const gazeno: Gazeno[] = [];
  const gazenoZgrade: string[] = [];
  const zauzeto = (x: number, y: number, r: number, gusto = false) =>
    ukrasi.some((u) => Math.hypot(u.x - x, u.y - y) < (DV_R[u.tip] + r) * (gusto ? 0.62 : 1) + (gusto ? 0.5 : 2.5));
  for (const p of PARCELE) {
    const rnd = rndOd(`dvoriste:${p.id}`);
    const { w, h } = velicinaSpritea(p.id, true);
    const travar = p.id === "travar";
    // utabano tlo pred vratima (početak puteljka), ispod svega
    const put = putelji([p.id]).find((s) => s.id === p.id && !s.veza);
    const vrata = put?.tocke[0];
    const dalje = put?.tocke[Math.min(2, (put?.tocke.length ?? 1) - 1)];
    if (vrata && dalje) {
      gazeno.push({
        x: Math.round(((vrata.x * 2 + dalje.x) / 3) * 10) / 10,
        y: Math.round(((vrata.y * 2 + dalje.y) / 3) * 10) / 10,
        rx: 15,
        ry: 6.5,
        kut: Math.round((Math.atan2(dalje.y - vrata.y, dalje.x - vrata.x) * 180) / Math.PI),
      });
      gazenoZgrade.push(p.id);
    }
    // kandidati: dvorište ispred i sa strane slike (elipsa oko donjeg dijela zgrade)
    const doseg = travar ? 118 : 40;
    const RX = w / 2 + doseg;
    const RY = travar ? 104 : 54;
    const cy = p.y + 14;
    const kand: Tocka[] = [];
    for (let i = 0; i < (travar ? 2200 : 240); i++) {
      const a = rnd() * Math.PI * 2;
      const f = Math.sqrt(0.18 + rnd() * 0.82);
      const x = p.x + Math.cos(a) * RX * f;
      const y = cy + Math.sin(a) * RY * f;
      if (y < p.y - h * 0.5) continue; // iza zgrade se ne vidi
      kand.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
    // bliže zgradi prvo (dvorište, ne livada)
    const blizina = (q: Tocka) => Math.hypot((q.x - p.x) / RX, (q.y - cy) / RY);
    kand.sort((a, b) => blizina(a) - blizina(b));
    const stavi = (tip: DvTip, max: number) => {
      let n = 0;
      const r = DV_R[tip];
      for (const q of kand) {
        if (n >= max) break;
        if (najblizaZgrada(q.x, q.y) !== p.id) continue;
        if (zauzeto(q.x, q.y, r, travar && BILJKE.has(tip))) continue;
        // provjera s najvećim mjerilom crteža (sc do 1.15×), da ni povećani ukras ne zadire u zapreke
        if (!slobodnoZaUkras(q.x, q.y, r * 1.15)) continue;
        ukrasi.push({ id: `${p.id}-${ukrasi.length}`, tip, x: q.x, y: q.y, zrcalo: rnd() < 0.5, sc: Math.round((0.9 + rnd() * 0.25) * DV_MJERILO * 100) / 100, zgrada: p.id });
        n++;
      }
      return n;
    };
    // predmeti teme su bliže zgradi; punilo (kamenčići, grmlje, cvijeće) oko njih
    for (const tip of TEMA[p.id] ?? ["bacva", "sanduk"]) stavi(tip, 1);
    for (const tip of PUNILO) stavi(tip, 1);
    if (travar) {
      // t439u: puno bilja – ljekovito bilje, cvijeće i grmlje oko vrta
      const vrt: DvTip[] = ["bilje", "cvijece", "bilje", "grm", "bilje", "cvijece", "lonac"];
      for (let k = 0; k < 11; k++) for (const tip of vrt) stavi(tip, 1);
    }
  }
  prep = null;
  prepIzvor = null;
  return { ukrasi, gazeno, gazenoZgrade };
}

/** Ukrasi (i utabano tlo) samo za izgrađene zgrade. */
export function dvoristaZa(izgradeno: (id: string) => boolean) {
  const d = dvorista();
  return d.ukrasi.filter((u) => izgradeno(u.zgrada));
}

