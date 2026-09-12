import type { Gradevine, KronikaZapis, Nagrada, SimbolId } from "./types";
import { albumBroj, POTJERNICE } from "./potjernice";

export type DostignuceTip =
  | "spin"
  | "ukupnoZlato"
  | "prestige"
  | "gradnja"
  | "pohod"
  | "zid"
  | "set"
  | "konj"
  | "ljudi";

export type Dostignuce = {
  id: string;
  naziv: string;
  opis: string;
  tip: DostignuceTip;
  cilj: number;
  nagrada: Nagrada;
  art: SimbolId;
};

export const DOSTIGNUCA: Dostignuce[] = [
  { id: "prvaSpin", naziv: "Prvo kolo", opis: "Zavrti jednom. Kolo krene.", tip: "spin", cilj: 1, nagrada: { zlato: 24 }, art: "gold" },
  { id: "spin10", naziv: "Deset kola", opis: "Zavrti deset puta.", tip: "spin", cilj: 10, nagrada: { dijamanti: 3 }, art: "gold" },
  { id: "spin100", naziv: "Sto kola", opis: "Ruka zna ručicu.", tip: "spin", cilj: 100, nagrada: { dijamanti: 10, energija: 6 }, art: "gold" },
  { id: "spin500", naziv: "Petsto kola", opis: "Prašina na ručici. Ti ostaješ.", tip: "spin", cilj: 500, nagrada: { dijamanti: 25 }, art: "gold" },
  { id: "zlato5000", naziv: "Puna torba", opis: "Pet tisuća zlata iz dobitaka.", tip: "ukupnoZlato", cilj: 5000, nagrada: { energija: 8 }, art: "gold" },
  { id: "zlato50000", naziv: "Sef diše", opis: "Pedeset tisuća iz kola.", tip: "ukupnoZlato", cilj: 50000, nagrada: { dijamanti: 20 }, art: "gem" },
  { id: "prestige1", naziv: "Prva kruna", opis: "Krunidba. Kauba kreće ispočetka.", tip: "prestige", cilj: 1, nagrada: { dijamanti: 25 }, art: "gem" },
  { id: "gradnja5", naziv: "Pet katova", opis: "Jedna zgrada na petom katu.", tip: "gradnja", cilj: 5, nagrada: { zlato: 80, kamen: 40 }, art: "wood" },
  { id: "pohod1", naziv: "Prvi pohod", opis: "Uzmi zadnji žeton. Ostava je tvoja.", tip: "pohod", cilj: 1, nagrada: { zlato: 40 }, art: "skull" },
  { id: "pohod5", naziv: "Pet noći", opis: "Pet pobjeda u prašini.", tip: "pohod", cilj: 5, nagrada: { zlato: 80, stitovi: 1 }, art: "skull" },
  { id: "zid6", naziv: "Pola zida", opis: "Šest plakata na dasci.", tip: "zid", cilj: 6, nagrada: { zlato: 30 }, art: "shield" },
  { id: "zidSve", naziv: "Pun zid", opis: "Svi plakati. Boro kima.", tip: "zid", cilj: POTJERNICE.length, nagrada: { dijamanti: 8, zlato: 80 }, art: "shield" },
  { id: "set1", naziv: "Jedan set", opis: "Skupi jednu družinu s zida.", tip: "set", cilj: 1, nagrada: { zlato: 40, dijamanti: 1 }, art: "wild" },
  { id: "konj1", naziv: "Prvi konj", opis: "Sedlo u staji.", tip: "konj", cilj: 1, nagrada: { drvo: 20, zlato: 16 }, art: "energy" },
  { id: "ljudi8", naziv: "Tabor stoji", opis: "Osam ljudi oko vatre.", tip: "ljudi", cilj: 8, nagrada: { zlato: 32 }, art: "wild" },
];

export type DostignuceUlaz = {
  ukupnoVrtnji: number;
  ukupnoZlata: number;
  prestigeRazina: number;
  maxKat: number;
  pohodPobjede: number;
  zid: number;
  setovi: number;
  konjiBroj: number;
  ljudi: number;
};

export type DostignuceIzvor = {
  ukupnoVrtnji: number;
  ukupnoZlata: number;
  prestigeRazina: number;
  gradevine: Gradevine;
  kronika: KronikaZapis[];
  potjernice: Record<string, number>;
  potjerniceSetovi: string[];
  konjiBroj: number;
  stanovnici: number;
};

export function pohodPobjede(kronika: KronikaZapis[]): number {
  let n = 0;
  for (const z of kronika) {
    if (!z.pobjeda) continue;
    if (z.vrsta === "pohod" || (!z.vrsta && z.stav)) n += 1;
  }
  return n;
}

export function snapshotDostignuca(s: DostignuceIzvor): DostignuceUlaz {
  return {
    ukupnoVrtnji: s.ukupnoVrtnji,
    ukupnoZlata: s.ukupnoZlata,
    prestigeRazina: s.prestigeRazina,
    maxKat: Math.max(0, ...Object.values(s.gradevine)),
    pohodPobjede: pohodPobjede(s.kronika),
    zid: albumBroj(s.potjernice),
    setovi: s.potjerniceSetovi.length,
    konjiBroj: s.konjiBroj,
    ljudi: Math.floor(s.stanovnici),
  };
}

export function napredakDostignuca(s: DostignuceUlaz, d: Dostignuce): { trenutno: number; cilj: number } {
  const cilj = d.cilj;
  switch (d.tip) {
    case "spin":
      return { trenutno: s.ukupnoVrtnji, cilj };
    case "ukupnoZlato":
      return { trenutno: s.ukupnoZlata, cilj };
    case "prestige":
      return { trenutno: s.prestigeRazina, cilj };
    case "gradnja":
      return { trenutno: s.maxKat, cilj };
    case "pohod":
      return { trenutno: s.pohodPobjede, cilj };
    case "zid":
      return { trenutno: s.zid, cilj };
    case "set":
      return { trenutno: s.setovi, cilj };
    case "konj":
      return { trenutno: s.konjiBroj, cilj };
    case "ljudi":
      return { trenutno: s.ljudi, cilj };
  }
}

export function dostignucePoId(id: string) {
  return DOSTIGNUCA.find((d) => d.id === id) ?? null;
}

export function sljedecaZvijezda(s: DostignuceUlaz, done: Record<string, boolean>) {
  for (const d of DOSTIGNUCA) {
    if (!done[d.id]) return d;
  }
  return null;
}
