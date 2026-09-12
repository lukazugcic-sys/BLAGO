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
  | "wild"
  | "knjiga";

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
  likId?: string;
  likIme?: string;
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

export type Gradevine = {
  pilana: number;
  kamenolom: number;
  rudnik: number;
  kuca: number;
  blok: number;
  salun: number;
  karte: number;
  bunar: number;
  cisterna: number;
  mlin: number;
  lov: number;
  mesnica: number;
  pekara: number;
  ured: number;
  staja: number;
  korali: number;
  staza: number;
  farma: number;
  tor: number;
  ordinacija: number;
  travar: number;
  banja: number;
  trgovina: number;
  banka: number;
};

export type KaravanaPutId = "staza" | "noc" | "rijeka";

export type KaravanaCin = {
  id: string;
  rec: string;
  opcije: Array<{ id: string; rec: string }>;
};

export type Karavana = {
  ciljUid: string;
  ciljIme: string;
  start: number;
  kraj: number;
  teret: Resursi;
  vozacId: string;
  vozacIme: string;
  put?: KaravanaPutId;
  cin?: KaravanaCin | null;
  cinRijesen?: boolean;
};

export type Gradnja = {
  zgrada: keyof Gradevine;
  ciljLv: number;
  start: number;
  kraj: number;
  majstorId: string;
  majstorIme: string;
};

export type Ostecenja = {
  [K in keyof Gradevine]: boolean;
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
  tip: "resurs" | "kuca" | "blok" | "salun" | "bunar" | "cisterna" | "mlin" | "lov" | "mesnica" | "pekara" | "karte" | "ured" | "staja" | "korali" | "staza" | "farma" | "tor" | "ordinacija" | "travar" | "banja" | "trgovina" | "banka";
  cijena: (lv: number) => {
    zlato: number;
    drvo: number;
    kamen: number;
    zeljezo: number;
  };
  bazaProizvodnja: number;
};

export type SkinTema = {
  void: string;
  panel: string;
  panel2: string;
  line: string;
  ink: string;
  dim: string;
  gold: string;
  volt: string;
  energy: string;
  xp: string;
  quest: string;
  clan: string;
  prestige: string;
  aurora: string;
};

export type Skin = {
  id: string;
  naziv: string;
  opis: string;
  ikona: LucideIcon;
  boja: string;
  nijansa: string;
  koprena: number;
  cijenaDijamanti: number;
  tema: SkinTema;
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
  kauba?: string;
  serif?: string;
  rec?: string;
};

export type DebriefStav = "osvetnik" | "strateg" | "pljackas";

export type KronikaZapis = {
  id: string;
  t: number;
  metaIme: string;
  pobjeda: boolean;
  stav: DebriefStav | null;
  recap: string;
  vrsta?: "pohod" | "obrana" | "selidba" | "gradnja" | "dogadaj" | "dostignuce";
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
