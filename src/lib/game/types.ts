import type { LucideIcon } from "lucide-react";

export type ResursId = "drvo" | "kamen" | "zeljezo";
export type TrznicaId = ResursId | "dijamant";
export type SimbolId =
  | "skull"
  | "wood"
  | "stone"
  | "iron"
  | "gold"
  | "energy"
  | "gem"
  | "shield"
  | "wild";

export type Nagrada = {
  zlato?: number;
  dijamanti?: number;
  energija?: number;
  drvo?: number;
  kamen?: number;
  zeljezo?: number;
  stitovi?: number;
};

export type Dobitak = {
  zlato: number;
  dijamanti: number;
  energija: number;
  stitovi: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
  linije: number;
};

export type Misija = {
  id: number;
  opis: string;
  tip: string;
  cilj: number;
  nagrada: Nagrada;
  trenutno: number;
  zavrseno: boolean;
};

export type KlanZadatak = {
  id: number;
  opis: string;
  tip: string;
  cilj: number;
  nagrada: Nagrada;
  trenutno: number;
  zavrseno: boolean;
  preuzeto: boolean;
};

export type Klan = {
  naziv: string | null;
  razina: number;
  xp: number;
  zadaci: KlanZadatak[];
  zadnjiRefresh: string | null;
};

export type Resursi = { drvo: number; kamen: number; zeljezo: number };

export type Gradevine = { pilana: number; kamenolom: number; rudnik: number };

export type Ostecenja = {
  pilana: boolean;
  kamenolom: boolean;
  rudnik: boolean;
};

export type Razine = {
  sreca: number;
  pojacalo: number;
  baterija: number;
  oklop: number;
  wildBoost: number;
};

export type TecajStavka = { kupi: number; prodaj: number };

export type Zgrada = {
  id: keyof Gradevine;
  naziv: string;
  maxLv: number;
  ikona: LucideIcon;
  bazaBoja: string;
  cijena: (lv: number) => {
    zlato: number;
    drvo: number;
    kamen: number;
    zeljezo: number;
  };
  bazaProizvodnja: number;
};

export type Skin = {
  id: string;
  naziv: string;
  ikona: LucideIcon;
  boja: string;
  nijansa: string;
  koprena: number;
  cijenaDijamanti: number;
};

export type Alat = {
  id: keyof Razine;
  n: string;
  d: string;
  art: SimbolId;
  cZlato: number;
  cKamen: number;
  cZeljezo: number;
};

export type RaidMeta = {
  uid: string;
  imeIgraca: string;
  igracRazina: number;
  resursi: Resursi;
  uzivo?: boolean;
};

export type DebriefStav = "osvetnik" | "strateg" | "pljackas";

export type KronikaZapis = {
  id: string;
  t: number;
  metaIme: string;
  pobjeda: boolean;
  stav: DebriefStav;
  recap: string;
};

export type LjestvicaRed = {
  uid: string;
  imeIgraca: string;
  igracRazina: number;
  prestigeRazina: number;
  ukupnoZlata: number;
  ukupnoVrtnji: number;
  klanNaziv: string | null;
};
