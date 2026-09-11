import { WILD_BOOST_CHANCE_PER_LEVEL, ENERGY_PER_BATTERY, PROIZVODNJA } from "./tuning";
import { nalogOd, pocetniLjudi, tkoZaNalog, type Stanovnik } from "./ljudi";
import { rast } from "./economy";
import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Shield,
  Gem,
  TreePine,
  Mountain,
  Pickaxe,
  Skull,
  Coins,
  Star,
  BookOpen,
  Castle,
  Landmark,
  Rocket,
  Home,
  Building2,
  Droplets,
  CloudRain,
  Cog,
  Target,
  Drumstick,
  Wheat,
  Spade,
  Fence,
  Flag,
  Heart,
  Leaf,
  Bath,
  Store,
  Warehouse,
  LandPlot,
  Beef,
} from "lucide-react";
import type {
  Alat,
  Gradevine,
  KlanZadatak,
  Misija,
  Nagrada,
  SimbolId,
  Skin,
  Zgrada,
} from "./types";

export { WILD_BOOST_CHANCE_PER_LEVEL } from "./tuning";
export {
  LUCKY_SPIN_INTERVAL,
  MAX_WIN_STREAK,
  STREAK_BONUS_PER_WIN,
} from "./tuning";

export const BLAGO: Record<
  SimbolId,
  {
    Ikona: LucideIcon;
    boja: string;
    raritet: string;
    tip: string;
    baza: number;
  }
> = {
  skull: { Ikona: Skull, boja: "#ff6b73", raritet: "#3a100c", tip: "steta", baza: 0 },
  wood: { Ikona: TreePine, boja: "#f4a24a", raritet: "#3a2210", tip: "drvo", baza: 5 },
  stone: { Ikona: Mountain, boja: "#e0b070", raritet: "#3a2410", tip: "kamen", baza: 7 },
  iron: { Ikona: Pickaxe, boja: "#7aa0c8", raritet: "#182030", tip: "zeljezo", baza: 10 },
  gold: { Ikona: Coins, boja: "#ffd24a", raritet: "#3a2408", tip: "zlato", baza: 16 },
  energy: { Ikona: Zap, boja: "#ff6a18", raritet: "#3a1408", tip: "energija", baza: 1 },
  gem: { Ikona: Gem, boja: "#ff5ab4", raritet: "#3a1024", tip: "dijamanti", baza: 1 },
  shield: { Ikona: Shield, boja: "#5ec8ff", raritet: "#102838", tip: "stit", baza: 0 },
  wild: { Ikona: Star, boja: "#5ee06a", raritet: "#0e2a14", tip: "wild", baza: 0 },
  knjiga: { Ikona: BookOpen, boja: "#e8c36a", raritet: "#2a1a08", tip: "knjiga", baza: 0 },
};

export const SVO_BLAGO = Object.keys(BLAGO) as SimbolId[];

export const TEZINE_BLAGA: Record<SimbolId, number> = {
  skull: 1,
  wood: 4,
  stone: 2,
  iron: 2,
  gold: 2,
  energy: 2,
  gem: 1,
  shield: 1,
  wild: 1,
  knjiga: 0,
};

export const izgradiTezinskiPool = (mod?: Partial<Record<string, number>>): SimbolId[] => {
  const pool: SimbolId[] = [];
  (Object.keys(TEZINE_BLAGA) as SimbolId[]).forEach((sym) => {
    const w = Math.max(0, Math.round(TEZINE_BLAGA[sym] * (mod?.[sym] ?? 1) * 2));
    if (w <= 0) return;
    for (let i = 0; i < w; i++) pool.push(sym);
  });
  return pool;
};

export const BAZA_TECAJ = {
  drvo: { kupi: 3, prodaj: 2 },
  kamen: { kupi: 7, prodaj: 4 },
  zeljezo: { kupi: 16, prodaj: 11 },
  dijamant: { kupi: 45, prodaj: 30 },
};

export const ULOZI = [1, 2, 3, 5, 10, 15, 25] as const;

/** Više čistih uloga: sitni, srednji, max. */
const ULOG_LESTVICA = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500];

export function uloziZaMax(maxE: number): number[] {
  const cap = Math.max(1, Math.floor(maxE));
  if (cap <= 1) return [1];
  return [...new Set([...ULOG_LESTVICA.filter((n) => n < cap), cap])].sort((a, b) => a - b);
}

/** Šest množitelja oko trenutnog uloga, za red iznad ZAVRTi. */
export function sestUloga(ulozi: number[], ulog: number): number[] {
  if (ulozi.length <= 6) return ulozi;
  const i = Math.max(0, ulozi.indexOf(ulog));
  let start = Math.max(0, i - 2);
  if (start + 6 > ulozi.length) start = ulozi.length - 6;
  return ulozi.slice(start, start + 6);
}

export const ZGRADE: Zgrada[] = [
  {
    id: "pilana",
    naziv: "Pilana",
    maxLv: 10,
    ikona: TreePine,
    bazaBoja: "#d4a574",
    cijena: (lv) => ({
      zlato: rast(48, lv),
      drvo: 0,
      kamen: lv === 1 ? 0 : rast(8, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: PROIZVODNJA.pilana,
    tip: "resurs" as const,
  },
  {
    id: "kamenolom",
    naziv: "Kamenolom",
    maxLv: 10,
    ikona: Mountain,
    bazaBoja: "#b7b0a4",
    cijena: (lv) => ({
      zlato: rast(58, lv),
      drvo: rast(14, lv),
      kamen: 0,
      zeljezo: lv === 1 ? 0 : rast(5, lv - 1),
    }),
    bazaProizvodnja: PROIZVODNJA.kamenolom,
    tip: "resurs" as const,
  },
  {
    id: "rudnik",
    naziv: "Rudnik",
    maxLv: 10,
    ikona: Pickaxe,
    bazaBoja: "#cfc6b8",
    cijena: (lv) => ({
      zlato: rast(120, lv, 1.4),
      drvo: rast(36, lv),
      kamen: rast(28, lv),
      zeljezo: rast(4, lv),
    }),
    bazaProizvodnja: PROIZVODNJA.rudnik,
    tip: "resurs" as const,
  },
  {
    id: "kuca",
    naziv: "Kuća",
    maxLv: 8,
    ikona: Home,
    bazaBoja: "#e8b06a",
    tip: "kuca",
    cijena: (lv) => ({
      zlato: rast(28, lv),
      drvo: rast(10, lv),
      kamen: lv === 1 ? 0 : rast(6, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "blok",
    naziv: "Zgrada",
    maxLv: 6,
    ikona: Building2,
    bazaBoja: "#d8c8a8",
    tip: "blok",
    cijena: (lv) => ({
      zlato: rast(95, lv, 1.38),
      drvo: rast(20, lv),
      kamen: rast(24, lv),
      zeljezo: lv === 1 ? 0 : rast(8, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "salun",
    naziv: "Salun",
    maxLv: 6,
    ikona: Coins,
    bazaBoja: "#d4a04a",
    tip: "salun",
    cijena: (lv) => ({
      zlato: rast(62, lv),
      drvo: rast(14, lv),
      kamen: lv === 1 ? 0 : rast(10, lv - 1),
      zeljezo: lv < 3 ? 0 : rast(6, lv - 2),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "bunar",
    naziv: "Bunar",
    maxLv: 5,
    ikona: Droplets,
    bazaBoja: "#6ec8e8",
    tip: "bunar",
    cijena: (lv) => ({
      zlato: rast(32, lv),
      drvo: rast(8, lv),
      kamen: lv === 1 ? 0 : rast(12, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "cisterna",
    naziv: "Cisterna",
    maxLv: 6,
    ikona: CloudRain,
    bazaBoja: "#6a9aaa",
    tip: "cisterna",
    cijena: (lv) => ({
      zlato: rast(28, lv),
      drvo: rast(6, lv),
      kamen: rast(8, lv),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "mlin",
    naziv: "Mlin",
    maxLv: 5,
    ikona: Cog,
    bazaBoja: "#7eb8c8",
    tip: "mlin",
    cijena: (lv) => ({
      zlato: rast(50, lv),
      drvo: rast(12, lv),
      kamen: rast(16, lv),
      zeljezo: lv === 1 ? 0 : rast(5, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "lov",
    naziv: "Lov",
    maxLv: 6,
    ikona: Target,
    bazaBoja: "#c47848",
    tip: "lov",
    cijena: (lv) => ({
      zlato: rast(24, lv),
      drvo: rast(8, lv),
      kamen: 0,
      zeljezo: lv === 1 ? 0 : rast(4, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "mesnica",
    naziv: "Mesnica",
    maxLv: 5,
    ikona: Drumstick,
    bazaBoja: "#c45a48",
    tip: "mesnica",
    cijena: (lv) => ({
      zlato: rast(40, lv),
      drvo: rast(10, lv),
      kamen: lv === 1 ? 0 : rast(6, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "pekara",
    naziv: "Pekarna",
    maxLv: 5,
    ikona: Wheat,
    bazaBoja: "#e0b060",
    tip: "pekara",
    cijena: (lv) => ({
      zlato: rast(38, lv),
      drvo: rast(8, lv),
      kamen: lv === 1 ? 0 : rast(5, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "karte",
    naziv: "Asovi",
    maxLv: 5,
    ikona: Spade,
    bazaBoja: "#d4a04a",
    tip: "karte",
    cijena: (lv) => ({
      zlato: rast(55, lv),
      drvo: rast(8, lv),
      kamen: 0,
      zeljezo: lv === 1 ? 0 : rast(5, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "ured",
    naziv: "Šerifov ured",
    maxLv: 6,
    ikona: Shield,
    bazaBoja: "#5ec8ff",
    tip: "ured",
    cijena: (lv) => ({
      zlato: rast(52, lv),
      drvo: rast(10, lv),
      kamen: rast(12, lv),
      zeljezo: lv === 1 ? 0 : rast(6, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "staja",
    naziv: "Staja",
    maxLv: 6,
    ikona: Fence,
    bazaBoja: "#c4783a",
    tip: "staja",
    cijena: (lv) => ({
      zlato: rast(44, lv),
      drvo: rast(14, lv),
      kamen: lv === 1 ? 0 : rast(8, lv - 1),
      zeljezo: lv < 3 ? 0 : rast(5, lv - 2),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "korali",
    naziv: "Ispust",
    maxLv: 6,
    ikona: LandPlot,
    bazaBoja: "#c4783a",
    tip: "korali",
    cijena: (lv) => ({
      zlato: rast(28, lv),
      drvo: rast(10, lv),
      kamen: lv === 1 ? 0 : rast(4, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "staza",
    naziv: "Staza",
    maxLv: 6,
    ikona: Flag,
    bazaBoja: "#c4783a",
    tip: "staza",
    cijena: (lv) => ({
      zlato: rast(36, lv),
      drvo: rast(12, lv),
      kamen: lv === 1 ? 0 : rast(6, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "farma",
    naziv: "Farma",
    maxLv: 6,
    ikona: Warehouse,
    bazaBoja: "#c4a04a",
    tip: "farma",
    cijena: (lv) => ({
      zlato: rast(40, lv),
      drvo: rast(12, lv),
      kamen: lv === 1 ? 0 : rast(6, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "tor",
    naziv: "Tor",
    maxLv: 6,
    ikona: Beef,
    bazaBoja: "#8a5a28",
    tip: "tor",
    cijena: (lv) => ({
      zlato: rast(36, lv),
      drvo: rast(12, lv),
      kamen: lv === 1 ? 0 : rast(6, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "ordinacija",
    naziv: "Ordinacija",
    maxLv: 5,
    ikona: Heart,
    bazaBoja: "#e07070",
    tip: "ordinacija",
    cijena: (lv) => ({
      zlato: rast(48, lv),
      drvo: rast(10, lv),
      kamen: rast(8, lv),
      zeljezo: lv === 1 ? 0 : rast(4, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "travar",
    naziv: "Travar",
    maxLv: 6,
    ikona: Leaf,
    bazaBoja: "#6a8a38",
    tip: "travar",
    cijena: (lv) => ({
      zlato: rast(32, lv),
      drvo: rast(8, lv),
      kamen: lv === 1 ? 0 : rast(4, lv - 1),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "banja",
    naziv: "Banja",
    maxLv: 5,
    ikona: Bath,
    bazaBoja: "#7aa0a8",
    tip: "banja",
    cijena: (lv) => ({
      zlato: rast(40, lv),
      drvo: rast(8, lv),
      kamen: rast(10, lv),
      zeljezo: lv === 1 ? 0 : rast(4, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "trgovina",
    naziv: "Trgovina",
    maxLv: 5,
    ikona: Store,
    bazaBoja: "#d4a06a",
    tip: "trgovina",
    cijena: (lv) => ({
      zlato: rast(46, lv),
      drvo: rast(10, lv),
      kamen: rast(8, lv),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0,
  },
  {
    id: "banka",
    naziv: "Banka",
    maxLv: 5,
    ikona: Landmark,
    bazaBoja: "#e8c878",
    tip: "banka",
    cijena: (lv) => ({
      zlato: rast(58, lv),
      drvo: rast(8, lv),
      kamen: rast(14, lv),
      zeljezo: lv === 1 ? 0 : rast(6, lv - 1),
    }),
    bazaProizvodnja: 0,
  },
];

export function seloNaMaxu(g: Gradevine) {
  return ZGRADE.every((z) => (g[z.id] || 0) >= z.maxLv);
}

const BAZA_MISIJA: Array<Omit<Misija, "id" | "trenutno" | "zavrseno">> = [
  { opis: "Zavrti 10 puta", tip: "spin", cilj: 10, nagrada: { dijamanti: 2 } },
  { opis: "Zavrti 25 puta", tip: "spin", cilj: 25, nagrada: { dijamanti: 4, energija: 4 } },
  { opis: "Skupi 300 zlata", tip: "zlato", cilj: 300, nagrada: { energija: 4 } },
  { opis: "Skupi 1200 zlata", tip: "zlato", cilj: 1200, nagrada: { dijamanti: 3, energija: 6 } },
  { opis: "Izgradi kuću", tip: "kuca", cilj: 1, nagrada: { zlato: 16, drvo: 6 } },
  { opis: "Otvori bunar", tip: "bunar", cilj: 1, nagrada: { energija: 4, kamen: 6 } },
  { opis: "Otvori cisternu", tip: "cisterna", cilj: 1, nagrada: { energija: 3, kamen: 6 } },
  { opis: "Otvori mlin", tip: "mlin", cilj: 1, nagrada: { dijamanti: 2, energija: 5 } },
  { opis: "Otvori lov", tip: "lov", cilj: 1, nagrada: { drvo: 10, zlato: 16 } },
  { opis: "Otvori mesnicu", tip: "mesnica", cilj: 1, nagrada: { dijamanti: 2, zlato: 20 } },
  { opis: "Otvori pekarnu", tip: "pekara", cilj: 1, nagrada: { dijamanti: 2, zlato: 20 } },
  { opis: "Otvori salun", tip: "salun", cilj: 1, nagrada: { zlato: 24 } },
  { opis: "Stavi stol za asove", tip: "karte", cilj: 1, nagrada: { dijamanti: 3 } },
  { opis: "Otvori šerifov ured", tip: "ured", cilj: 1, nagrada: { stitovi: 1, dijamanti: 2 } },
  { opis: "Izgradi staju", tip: "staja", cilj: 1, nagrada: { zlato: 20, drvo: 8 } },
  { opis: "Ogradi ispust", tip: "korali", cilj: 1, nagrada: { zlato: 14, drvo: 6 } },
  { opis: "Otvori farmu", tip: "farma", cilj: 1, nagrada: { zlato: 16, drvo: 8 } },
  { opis: "Ogradi tor", tip: "tor", cilj: 1, nagrada: { zlato: 18, drvo: 8 } },
  { opis: "Otvori ordinaciju", tip: "ordinacija", cilj: 1, nagrada: { energija: 4, zlato: 16 } },
  { opis: "Otvori travara", tip: "travar", cilj: 1, nagrada: { energija: 3, zlato: 12 } },
  { opis: "Otvori banju", tip: "banja", cilj: 1, nagrada: { energija: 3, zlato: 14 } },
  { opis: "Otvori trgovinu", tip: "trgovina", cilj: 1, nagrada: { zlato: 20 } },
  { opis: "Otvori banku", tip: "banka", cilj: 1, nagrada: { dijamanti: 2, zlato: 20 } },
  { opis: "Otvori pilanu", tip: "pilana", cilj: 1, nagrada: { drvo: 10, zlato: 16 } },
  { opis: "Otvori kamenolom", tip: "kamenolom", cilj: 1, nagrada: { kamen: 8, zlato: 20 } },
  { opis: "Otvori rudnik", tip: "rudnik", cilj: 1, nagrada: { dijamanti: 2, zeljezo: 4 } },
  { opis: "Skupi 8 ljudi u kaubi", tip: "ljudi", cilj: 8, nagrada: { dijamanti: 3, energija: 4 } },
  { opis: "Nadogradi zgradu", tip: "zgrada", cilj: 1, nagrada: { dijamanti: 2, zlato: 20 } },
  { opis: "Kupi alat", tip: "oprema", cilj: 1, nagrada: { dijamanti: 2, energija: 5 } },
  { opis: "Ostvari 3 dobitka", tip: "dobitak", cilj: 3, nagrada: { drvo: 16, kamen: 12 } },
  { opis: "Uhvati sretnu vrtnju", tip: "luckySpin", cilj: 1, nagrada: { dijamanti: 3, energija: 5 } },
  { opis: "Otvori knjigu u prašini", tip: "knjiga", cilj: 1, nagrada: { dijamanti: 4, zlato: 24 } },
  { opis: "Uzmi govedo u tor", tip: "govedo", cilj: 1, nagrada: { zlato: 18, drvo: 8 } },
  { opis: "Skupi kišu s cisterne", tip: "kisa", cilj: 1, nagrada: { energija: 4, kamen: 6 } },
  { opis: "Sjedni na blackjack", tip: "dvadesetjedan", cilj: 1, nagrada: { zlato: 16 } },
  { opis: "Trči konja na stazi", tip: "utrka", cilj: 1, nagrada: { zlato: 16, drvo: 6 } },
];

const USKO_MISIJA_TIPOVI: Record<string, string[]> = {
  krov: ["kuca", "blok", "ljudi"],
  jelo: ["lov", "mesnica", "pekara", "farma", "tor", "govedo"],
  voda: ["bunar", "cisterna", "mlin", "kisa"],
  zabava: ["salun", "karte", "dvadesetjedan", "knjiga"],
  posao: ["pilana", "kamenolom", "rudnik", "trgovina", "zgrada"],
  red: ["ured", "banka"],
  konji: ["staja", "korali", "staza", "utrka"],
  zdravlje: ["ordinacija", "travar", "banja"],
};

export const generirajMisiju = (
  usko?: string | null,
  zauzeti: string[] = [],
  ljudi: Stanovnik[] = pocetniLjudi(),
  gradevine?: Gradevine,
  nedavni: string[] = [],
): Misija => {
  const prefer = usko && USKO_MISIJA_TIPOVI[usko] ? USKO_MISIJA_TIPOVI[usko] : [];
  const blok = new Set([...zauzeti, ...nedavni, "streak"]);
  const zgradaId = new Set(ZGRADE.map((z) => z.id as string));
  const moze = (s: (typeof BAZA_MISIJA)[number]) => {
    if (blok.has(s.tip)) return false;
    if (gradevine && zgradaId.has(s.tip) && s.cilj === 1 && (gradevine[s.tip as keyof Gradevine] || 0) > 0) {
      return false;
    }
    return true;
  };
  const slobodni = BAZA_MISIJA.filter(moze);
  const baza = slobodni.length ? slobodni : BAZA_MISIJA.filter((s) => !blok.has(s.tip) && !zgradaId.has(s.tip));
  const pad = baza.length ? baza : BAZA_MISIJA.filter((s) => s.tip === "spin" || s.tip === "zlato" || s.tip === "dobitak");
  const uski = pad.filter((s) => prefer.includes(s.tip));
  const pool = uski.length && Math.random() < 0.55 ? uski : pad;
  const sablon = pool[Math.floor(Math.random() * pool.length)] ?? BAZA_MISIJA[0]!;
  const tko = tkoZaNalog(ljudi, sablon.tip);
  return {
    id: Date.now() * 1000 + Math.floor(Math.random() * 100000),
    ...sablon,
    opis: tko ? nalogOd(tko, sablon.tip, sablon.cilj) : sablon.opis,
    likId: tko?.id,
    likIme: tko?.ime,
    trenutno: 0,
    zavrseno: false,
  };
};

export { DOSTIGNUCA } from "./dostignuca";

export const DNEVNE_NAGRADE: Array<{ dan: number; nagrada: Nagrada }> = [
  { dan: 1, nagrada: { zlato: 50 } },
  { dan: 2, nagrada: { energija: 4 } },
  { dan: 3, nagrada: { dijamanti: 4 } },
  { dan: 4, nagrada: { zlato: 70, drvo: 16 } },
  { dan: 5, nagrada: { zeljezo: 6, kamen: 16 } },
  { dan: 6, nagrada: { dijamanti: 6, energija: 5 } },
  { dan: 7, nagrada: { dijamanti: 14, zlato: 180, energija: 8 } },
];

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const TABOVI = [
  { id: "automat", label: "Igraj", boja: "volt" },
  { id: "selo", label: "Kauba", boja: "wood" },
  { id: "misije", label: "Zadaci", boja: "quest" },
  { id: "trznica", label: "Tržnica", boja: "gold" },
] as const;

export type TabId = (typeof TABOVI)[number]["id"];

export const ZGRADE_SKINOVI: Skin[] = [
  {
    id: "default",
    naziv: "Pustinjski",
    opis: "Topli pijesak i zalazak",
    ikona: Home,
    boja: "#e0a04a",
    nijansa: "sepia(0.32) saturate(1.18) brightness(1.05) contrast(1.04)",
    koprena: 0.22,
    cijenaDijamanti: 0,
    tema: {
      void: "#24140c",
      panel: "#5a321c",
      panel2: "#6e3d22",
      line: "rgb(255 210 100 / 0.45)",
      ink: "#fff8e8",
      dim: "#f0d4a8",
      gold: "#ffd24a",
      volt: "#ffbf3a",
      energy: "#ff6a18",
      xp: "#8cff5a",
      quest: "#ff9a3a",
      clan: "#5ec8ff",
      prestige: "#ffd24a",
      aurora: "#ff8a6a",
    },
  },
  {
    id: "medieval",
    naziv: "Banovina",
    opis: "Vino, mjed i stari kamen",
    ikona: Castle,
    boja: "#c45a78",
    nijansa: "sepia(0.5) hue-rotate(-26deg) saturate(0.95) contrast(1.08) brightness(0.97)",
    koprena: 0.34,
    cijenaDijamanti: 15,
    tema: {
      void: "#1a1014",
      panel: "#4a2834",
      panel2: "#5c3340",
      line: "rgb(232 196 140 / 0.42)",
      ink: "#fff4e8",
      dim: "#e8c8b0",
      gold: "#e8c070",
      volt: "#d4a05a",
      energy: "#d45a6c",
      xp: "#c8dc7a",
      quest: "#e09060",
      clan: "#8eb4c8",
      prestige: "#e8c070",
      aurora: "#c47888",
    },
  },
  {
    id: "japanese",
    naziv: "Daleki istok",
    opis: "Lak, cinober i žad",
    ikona: Landmark,
    boja: "#e84828",
    nijansa: "hue-rotate(8deg) saturate(1.42) contrast(1.08) brightness(1.03)",
    koprena: 0.3,
    cijenaDijamanti: 35,
    tema: {
      void: "#180c0a",
      panel: "#5a2418",
      panel2: "#6e2c1c",
      line: "rgb(255 196 80 / 0.42)",
      ink: "#fff6e8",
      dim: "#f0c8a0",
      gold: "#ffc44a",
      volt: "#ff9a3a",
      energy: "#ff3a28",
      xp: "#3edc82",
      quest: "#ff7040",
      clan: "#50c8a0",
      prestige: "#ffc44a",
      aurora: "#ff6a48",
    },
  },
  {
    id: "futuristic",
    naziv: "Kozmičko",
    opis: "Noćni pojas i polarna svjetlost",
    ikona: Rocket,
    boja: "#5aa8e8",
    nijansa: "hue-rotate(188deg) saturate(1.22) brightness(0.94) contrast(1.1)",
    koprena: 0.36,
    cijenaDijamanti: 70,
    tema: {
      void: "#0c1020",
      panel: "#1c2848",
      panel2: "#283860",
      line: "rgb(126 200 255 / 0.38)",
      ink: "#eef4ff",
      dim: "#b8c8e8",
      gold: "#ffd27a",
      volt: "#7ec8ff",
      energy: "#8a6cff",
      xp: "#4ef0c4",
      quest: "#c89aff",
      clan: "#5ec8ff",
      prestige: "#ffe08a",
      aurora: "#7a8cff",
    },
  },
];

export function primijeniSkinTemu(skin: Skin) {
  if (typeof document === "undefined") return;
  const t = skin.tema;
  const r = document.documentElement;
  r.style.setProperty("--color-void", t.void);
  r.style.setProperty("--color-panel", t.panel);
  r.style.setProperty("--color-panel-2", t.panel2);
  r.style.setProperty("--color-line", t.line);
  r.style.setProperty("--color-ink", t.ink);
  r.style.setProperty("--color-dim", t.dim);
  r.style.setProperty("--color-gold", t.gold);
  r.style.setProperty("--color-volt", t.volt);
  r.style.setProperty("--color-energy", t.energy);
  r.style.setProperty("--color-xp", t.xp);
  r.style.setProperty("--color-quest", t.quest);
  r.style.setProperty("--color-clan", t.clan);
  r.style.setProperty("--color-prestige", t.prestige);
  r.style.setProperty("--color-aurora", t.aurora);
  document.body.style.backgroundColor = t.void;
  postaviBojuPrikaza(t.void);
}

export function postaviBojuPrikaza(boja: string) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", boja);
  document.documentElement.style.backgroundColor = boja;
}

const KLAN_ZADACI_SABLONI: Array<
  Omit<KlanZadatak, "id" | "trenutno" | "zavrseno" | "preuzeto">
> = [
  {
    opis: "Zavrti 50 puta (klan)",
    tip: "spin",
    cilj: 50,
    nagrada: { dijamanti: 8, zlato: 80 },
  },
  {
    opis: "Skupi 1200 zlata (klan)",
    tip: "zlato",
    cilj: 1200,
    nagrada: { dijamanti: 6, energija: 6 },
  },
  {
    opis: "Izgradi ili nadogradi 3 zgrade (klan)",
    tip: "zgrada",
    cilj: 3,
    nagrada: { dijamanti: 8, drvo: 30 },
  },
  {
    opis: "Doniraj 200 zlata klanu",
    tip: "donacija",
    cilj: 200,
    nagrada: { dijamanti: 5, kamen: 20 },
  },
  {
    opis: "Ostvari 50 dobitnih linija (klan)",
    tip: "dobitak",
    cilj: 50,
    nagrada: { dijamanti: 12, energija: 8 },
  },
  {
    opis: "Otvori knjigu tri puta (klan)",
    tip: "knjiga",
    cilj: 3,
    nagrada: { dijamanti: 8, zlato: 40 },
  },
  {
    opis: "Uzmi 4 goveda u tor (klan)",
    tip: "govedo",
    cilj: 4,
    nagrada: { dijamanti: 6, drvo: 20 },
  },
];

export const generirajKlanZadatke = (): KlanZadatak[] =>
  KLAN_ZADACI_SABLONI.map((s, i) => ({
    id: i,
    ...s,
    trenutno: 0,
    zavrseno: false,
    preuzeto: false,
  }));

export const ALATI: Alat[] = [
  {
    id: "sreca",
    n: "Djetelina sreće",
    d: "Više šanse za dobitak i Wild.",
    art: "wild",
    cZlato: 80,
    cKamen: 0,
    cZeljezo: 6,
  },
  {
    id: "pojacalo",
    n: "Pojačalo plijena",
    d: "Više resursa iz dobitaka.",
    art: "gold",
    cZlato: 120,
    cKamen: 14,
    cZeljezo: 10,
  },
  {
    id: "baterija",
    n: "Volt-remen",
    d: `+${ENERGY_PER_BATTERY} max energije i brže punjenje.`,
    art: "energy",
    cZlato: 140,
    cKamen: 20,
    cZeljezo: 0,
  },
  {
    id: "oklop",
    n: "Čelični štit",
    d: "+1 mjesto za obranu kaube.",
    art: "shield",
    cZlato: 160,
    cKamen: 8,
    cZeljezo: 18,
  },
  {
    id: "wildBoost",
    n: "Divlji magnet",
    d: `+${Math.round(WILD_BOOST_CHANCE_PER_LEVEL * 100)}% šansa za Wild po razini.`,
    art: "wild",
    cZlato: 200,
    cKamen: 24,
    cZeljezo: 14,
  },
];

export const NPC_IMENA = [
  "Vuk Oklopnik",
  "Zora Kovač",
  "Mila Šuma",
  "Branimir Kamen",
  "Luka Željezo",
  "Iva Zlatara",
  "Goran Štit",
  "Tea Pilana",
  "Marko Rudar",
  "Nika Kruna",
];

export const LJESTVICA_GHOSTS = [
  {
    uid: "g1",
    imeIgraca: "Kralj Rudnika",
    igracRazina: 28,
    prestigeRazina: 3,
    ukupnoZlata: 82000,
    ukupnoVrtnji: 1840,
    klanNaziv: "Željezni Red",
  },
  {
    uid: "g2",
    imeIgraca: "Zlatna Sova",
    igracRazina: 22,
    prestigeRazina: 2,
    ukupnoZlata: 54000,
    ukupnoVrtnji: 1210,
    klanNaziv: "Noćna Straža",
  },
  {
    uid: "g3",
    imeIgraca: "Djetelina",
    igracRazina: 19,
    prestigeRazina: 2,
    ukupnoZlata: 41000,
    ukupnoVrtnji: 980,
    klanNaziv: null,
  },
  {
    uid: "g4",
    imeIgraca: "Gorski Vuk",
    igracRazina: 16,
    prestigeRazina: 1,
    ukupnoZlata: 27500,
    ukupnoVrtnji: 740,
    klanNaziv: "Velebit",
  },
  {
    uid: "g5",
    imeIgraca: "Baka Mara",
    igracRazina: 14,
    prestigeRazina: 1,
    ukupnoZlata: 19800,
    ukupnoVrtnji: 610,
    klanNaziv: "Kumice",
  },
];
