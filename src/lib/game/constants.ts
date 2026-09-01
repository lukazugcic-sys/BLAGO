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
  Castle,
  Landmark,
  Rocket,
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  Alat,
  KlanZadatak,
  Misija,
  Nagrada,
  SimbolId,
  Skin,
  Zgrada,
} from "./types";
import { WILD_BOOST_CHANCE_PER_LEVEL } from "./tuning";

export { WILD_BOOST_CHANCE_PER_LEVEL } from "./tuning";

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
  skull: { Ikona: Skull, boja: "#e85d5d", raritet: "#4c0519", tip: "steta", baza: 0 },
  wood: { Ikona: TreePine, boja: "#d4a574", raritet: "#3f2a14", tip: "drvo", baza: 4 },
  stone: { Ikona: Mountain, boja: "#c4b59a", raritet: "#3a3228", tip: "kamen", baza: 8 },
  iron: { Ikona: Pickaxe, boja: "#d8ccb4", raritet: "#3a3228", tip: "zeljezo", baza: 12 },
  gold: { Ikona: Coins, boja: "#e8b04a", raritet: "#451a03", tip: "zlato", baza: 22 },
  energy: { Ikona: Zap, boja: "#d4e14a", raritet: "#2a3a08", tip: "energija", baza: 1 },
  gem: { Ikona: Gem, boja: "#e28aa0", raritet: "#4a2030", tip: "dijamanti", baza: 1 },
  shield: { Ikona: Shield, boja: "#6ec9b8", raritet: "#1a3a38", tip: "stit", baza: 0 },
  wild: { Ikona: Star, boja: "#f6efe4", raritet: "#3a3228", tip: "wild", baza: 0 },
};

export const SVO_BLAGO = Object.keys(BLAGO) as SimbolId[];

export const TEZINE_BLAGA: Record<SimbolId, number> = {
  skull: 1,
  wood: 3,
  stone: 3,
  iron: 2,
  gold: 2,
  energy: 2,
  gem: 1,
  shield: 1,
  wild: 1,
};

export const izgradiTezinskiPool = (mod?: Partial<Record<string, number>>): SimbolId[] => {
  const pool: SimbolId[] = [];
  (Object.keys(TEZINE_BLAGA) as SimbolId[]).forEach((sym) => {
    const w = Math.max(1, Math.round(TEZINE_BLAGA[sym] * (mod?.[sym] ?? 1) * 2));
    for (let i = 0; i < w; i++) pool.push(sym);
  });
  return pool;
};

export const BAZA_TECAJ = {
  drvo: { kupi: 8, prodaj: 2 },
  kamen: { kupi: 16, prodaj: 5 },
  zeljezo: { kupi: 32, prodaj: 10 },
  dijamant: { kupi: 400, prodaj: 160 },
};

export const ZGRADE: Zgrada[] = [
  {
    id: "pilana",
    naziv: "Pilana",
    maxLv: 10,
    ikona: TreePine,
    bazaBoja: "#d4a574",
    cijena: (lv) => ({
      zlato: Math.floor(120 * Math.pow(1.55, lv - 1)),
      drvo: 0,
      kamen: lv === 1 ? 0 : Math.floor(20 * Math.pow(1.45, lv - 1)),
      zeljezo: 0,
    }),
    bazaProizvodnja: 0.9,
  },
  {
    id: "kamenolom",
    naziv: "Kamenolom",
    maxLv: 10,
    ikona: Mountain,
    bazaBoja: "#b7b0a4",
    cijena: (lv) => ({
      zlato: Math.floor(200 * Math.pow(1.58, lv - 1)),
      drvo: Math.floor(80 * Math.pow(1.45, lv - 1)),
      kamen: 0,
      zeljezo: lv === 1 ? 0 : Math.floor(15 * Math.pow(1.45, lv - 1)),
    }),
    bazaProizvodnja: 0.5,
  },
  {
    id: "rudnik",
    naziv: "Rudnik",
    maxLv: 10,
    ikona: Pickaxe,
    bazaBoja: "#cfc6b8",
    cijena: (lv) => ({
      zlato: Math.floor(400 * Math.pow(1.62, lv - 1)),
      drvo: Math.floor(160 * Math.pow(1.45, lv - 1)),
      kamen: Math.floor(140 * Math.pow(1.45, lv - 1)),
      zeljezo: Math.floor(30 * Math.pow(1.4, lv - 1)),
    }),
    bazaProizvodnja: 0.25,
  },
];

const BAZA_MISIJA: Array<Omit<Misija, "id" | "trenutno" | "zavrseno">> = [
  { opis: "Zavrti 20 puta", tip: "spin", cilj: 20, nagrada: { dijamanti: 2 } },
  { opis: "Zavrti 50 puta", tip: "spin", cilj: 50, nagrada: { dijamanti: 5 } },
  {
    opis: "Zavrti 100 puta",
    tip: "spin",
    cilj: 100,
    nagrada: { dijamanti: 12, zlato: 500 },
  },
  { opis: "Skupi 1000 zlata", tip: "zlato", cilj: 1000, nagrada: { energija: 30 } },
  { opis: "Skupi 2500 zlata", tip: "zlato", cilj: 2500, nagrada: { energija: 80 } },
  {
    opis: "Skupi 10 000 zlata",
    tip: "zlato",
    cilj: 10000,
    nagrada: { dijamanti: 10, energija: 120 },
  },
  {
    opis: "Izgradi ili nadogradi zgradu",
    tip: "zgrada",
    cilj: 1,
    nagrada: { dijamanti: 3, zlato: 500 },
  },
  {
    opis: "Kupi ili nadogradi alat",
    tip: "oprema",
    cilj: 1,
    nagrada: { dijamanti: 3, energija: 50 },
  },
  {
    opis: "Ostvari 5 dobitaka",
    tip: "dobitak",
    cilj: 5,
    nagrada: { drvo: 100, kamen: 100 },
  },
  {
    opis: "Ostvari 15 dobitaka",
    tip: "dobitak",
    cilj: 15,
    nagrada: { dijamanti: 5, kamen: 300 },
  },
  {
    opis: "Dobij sretnu vrtnju",
    tip: "luckySpin",
    cilj: 1,
    nagrada: { dijamanti: 4, energija: 40 },
  },
  {
    opis: "Dobij sretnu vrtnju 3 puta",
    tip: "luckySpin",
    cilj: 3,
    nagrada: { dijamanti: 10, zlato: 1000 },
  },
  {
    opis: "Ostvari niz od 3 dobitka",
    tip: "streak",
    cilj: 3,
    nagrada: { dijamanti: 6, energija: 60 },
  },
];

export const generirajMisiju = (): Misija => {
  const sablon = BAZA_MISIJA[Math.floor(Math.random() * BAZA_MISIJA.length)]!;
  return {
    id: Date.now() * 1000 + Math.floor(Math.random() * 100000),
    ...sablon,
    trenutno: 0,
    zavrseno: false,
  };
};

export const DOSTIGNUCA: Array<{
  id: string;
  naziv: string;
  opis: string;
  tip: string;
  cilj: number;
  nagrada: Nagrada;
}> = [
  {
    id: "prvaSpin",
    naziv: "Prva vrtnja",
    opis: "Zavrti po prvi put",
    tip: "spin",
    cilj: 1,
    nagrada: { zlato: 100 },
  },
  {
    id: "spin10",
    naziv: "Kolo sreće",
    opis: "Zavrti 10 puta",
    tip: "spin",
    cilj: 10,
    nagrada: { dijamanti: 3 },
  },
  {
    id: "spin100",
    naziv: "Veteran",
    opis: "Zavrti 100 puta",
    tip: "spin",
    cilj: 100,
    nagrada: { dijamanti: 10, energija: 50 },
  },
  {
    id: "spin500",
    naziv: "Majstor",
    opis: "Zavrti 500 puta",
    tip: "spin",
    cilj: 500,
    nagrada: { dijamanti: 30 },
  },
  {
    id: "zlato5000",
    naziv: "Bogataš",
    opis: "Skupi 5000 zlata iz dobitaka",
    tip: "ukupnoZlato",
    cilj: 5000,
    nagrada: { energija: 80 },
  },
  {
    id: "zlato50000",
    naziv: "Tajkun",
    opis: "Skupi 50 000 zlata iz dobitaka",
    tip: "ukupnoZlato",
    cilj: 50000,
    nagrada: { dijamanti: 20 },
  },
  {
    id: "prestige1",
    naziv: "Nova kruna",
    opis: "Napravi krunidbu po prvi put",
    tip: "prestige",
    cilj: 1,
    nagrada: { dijamanti: 25 },
  },
  {
    id: "gradnja5",
    naziv: "Graditelj",
    opis: "Nadogradi bilo koju zgradu na razinu 5",
    tip: "gradnja",
    cilj: 5,
    nagrada: { zlato: 500, kamen: 200 },
  },
];

export const DNEVNE_NAGRADE: Array<{ dan: number; nagrada: Nagrada }> = [
  { dan: 1, nagrada: { zlato: 120 } },
  { dan: 2, nagrada: { energija: 25 } },
  { dan: 3, nagrada: { dijamanti: 3 } },
  { dan: 4, nagrada: { zlato: 220, drvo: 80 } },
  { dan: 5, nagrada: { zeljezo: 40, kamen: 80 } },
  { dan: 6, nagrada: { dijamanti: 6, energija: 40 } },
  { dan: 7, nagrada: { dijamanti: 12, zlato: 600, energija: 60 } },
];

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const LUCKY_SPIN_INTERVAL = 25;
export const MAX_WIN_STREAK = 5;
export const STREAK_BONUS_PER_WIN = 0.12;

export const TABOVI = [
  { id: "automat", label: "Igraj", boja: "volt" },
  { id: "selo", label: "Kauba", boja: "wood" },
  { id: "misije", label: "Zadaci", boja: "quest" },
  { id: "trznica", label: "Tržnica", boja: "gold" },
  { id: "ceh", label: "Družina", boja: "clan" },
] as const;

export type TabId = (typeof TABOVI)[number]["id"];

export const ZGRADE_SKINOVI: Skin[] = [
  {
    id: "default",
    naziv: "Pustinjski",
    ikona: Home,
    boja: "#e0a04a",
    nijansa: "sepia(0.48) saturate(1.22) brightness(1.06) contrast(1.04)",
    koprena: 0.28,
    cijenaDijamanti: 0,
  },
  {
    id: "medieval",
    naziv: "Banovina",
    ikona: Castle,
    boja: "#7a3048",
    nijansa: "sepia(0.72) hue-rotate(-42deg) saturate(0.92) contrast(1.1) brightness(0.96)",
    koprena: 0.44,
    cijenaDijamanti: 50,
  },
  {
    id: "japanese",
    naziv: "Daleki istok",
    ikona: Landmark,
    boja: "#e85a32",
    nijansa: "hue-rotate(12deg) saturate(1.62) contrast(1.12) brightness(1.05)",
    koprena: 0.36,
    cijenaDijamanti: 100,
  },
  {
    id: "futuristic",
    naziv: "Kozmičko",
    ikona: Rocket,
    boja: "#3aa0c8",
    nijansa: "hue-rotate(176deg) saturate(1.4) brightness(0.94) contrast(1.1)",
    koprena: 0.46,
    cijenaDijamanti: 200,
  },
];

const KLAN_ZADACI_SABLONI: Array<
  Omit<KlanZadatak, "id" | "trenutno" | "zavrseno" | "preuzeto">
> = [
  {
    opis: "Ukupno zavrti 200 puta (klan)",
    tip: "spin",
    cilj: 200,
    nagrada: { dijamanti: 15, zlato: 800 },
  },
  {
    opis: "Ukupno skupi 5000 zlata (klan)",
    tip: "zlato",
    cilj: 5000,
    nagrada: { dijamanti: 10, energija: 100 },
  },
  {
    opis: "Izgradi ili nadogradi 5 zgrada (klan)",
    tip: "zgrada",
    cilj: 5,
    nagrada: { dijamanti: 20, drvo: 500 },
  },
  {
    opis: "Doniraj 1000 zlata klanu",
    tip: "donacija",
    cilj: 1000,
    nagrada: { dijamanti: 8, kamen: 300 },
  },
  {
    opis: "Ostvari 50 dobitnih linija (klan)",
    tip: "dobitak",
    cilj: 50,
    nagrada: { dijamanti: 12, energija: 80 },
  },
  {
    opis: "Kupi ili nadogradi 3 komada opreme (klan)",
    tip: "oprema",
    cilj: 3,
    nagrada: { dijamanti: 10, zeljezo: 200 },
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
    cZlato: 500,
    cKamen: 0,
    cZeljezo: 50,
  },
  {
    id: "pojacalo",
    n: "Pojačalo plijena",
    d: "Više resursa iz dobitaka.",
    art: "gold",
    cZlato: 800,
    cKamen: 100,
    cZeljezo: 100,
  },
  {
    id: "baterija",
    n: "Volt-remen",
    d: "+35 max energije i brže punjenje.",
    art: "energy",
    cZlato: 1000,
    cKamen: 200,
    cZeljezo: 0,
  },
  {
    id: "oklop",
    n: "Čelični štit",
    d: "+1 mjesto za obranu kaube.",
    art: "shield",
    cZlato: 1200,
    cKamen: 50,
    cZeljezo: 200,
  },
  {
    id: "wildBoost",
    n: "Divlji magnet",
    d: `+${Math.round(WILD_BOOST_CHANCE_PER_LEVEL * 100)}% šansa za Wild po razini.`,
    art: "wild",
    cZlato: 1500,
    cKamen: 300,
    cZeljezo: 150,
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
