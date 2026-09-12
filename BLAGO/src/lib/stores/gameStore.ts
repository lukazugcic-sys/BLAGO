import { create } from "zustand";
import {
  BAZA_TECAJ,
  ZGRADE,
  LUCKY_SPIN_INTERVAL,
  generirajMisiju,
  generirajKlanZadatke,
  seloNaMaxu,
} from "@/lib/game/constants";
import { DOSTIGNUCA, napredakDostignuca, snapshotDostignuca } from "@/lib/game/dostignuca";
import {
  izracunajMaxEnergiju,
  capEnergija,
  dodajEnergiju,
  popravakCijena,
  izracunajMaxStitova,
  izracunajPasivniMnozitelj,
  izracunajPotrebniXp,
  izracunajPrestigeMnozitelj,
  izracunajTokMnozitelj,
  izracunajEnergijaRegenMs,
  izracunajSelidbu,
  izracunajSalunZlato,
  raspolozenjeKaube,
  zgradaUvjet,
  bankaKap,
  bankaKamata,
  PRAZNE_GRADEVINE,
  PRAZNA_OSTECENJA,
  RESOURCE_TICK_MS,
  MAX_OFFLINE_MS,
  konjaKap,
  govedaKap,
  normalizirajDuznost,
  normalizirajGovedo,
  praznaDuznost,
  praznaGovedoDuznost,
  KONJ_DUZNOSTI,
  GOVEDO_DUZNOSTI,
  type KonjDuznostId,
  type KaubaDuznost,
  type GovedoDuznost,
  type GovedoDuznostId,
} from "@/lib/game/economy";
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";
import { playSfx, vibrate } from "@/lib/game/audio";
import {
  localDayKey,
  nagradaZaStreak,
  resolveDaily,
  cycleDay,
  recDodjiSutra,
  type DailySave,
} from "@/lib/game/daily";
import type { CloudPayload } from "@/lib/game/cloud";
import type {
  Alat,
  DebriefStav,
  Gradevine,
  Gradnja,
  Karavana,
  Klan,
  KronikaZapis,
  Misija,
  Nagrada,
  Ostecenja,
  Razine,
  Resursi,
  Skin,
  TecajStavka,
  TrznicaId,
  ResursId,
  Zgrada,
  KaravanaPutId,
  SimbolId,
} from "@/lib/game/types";
import { MAX_KRONIKA, parsirajKroniku } from "@/lib/game/kronika";
import {
  pocetniLjudi,
  parsirajLjude,
  uskladiLjude,
  recapDolazak,
  recapOdlazak,
  imaBuff,
  jacina,
  recNoviBuff,
  recNovaMana,
  majstor,
  serif,
  vozar,
  vrijemeGradnjeMs,
  dodajXpLiku,
  razgovor,
  mozeDati,
  gdjeJe,
  zgradaAkuzativ,
  zgradaPopravakRec,
  slobodanGraditelj,
  uskladiSegrte,
  napraviSegrta,
  uskladiZamjenike,
  napraviZamjenika,
  tkoJaše,
  doktor,
  mozeKrupije,
  kaubaOd,
  SEGRT_SKOLA,
  type Stanovnik,
  type Segrt,
  type Zamjenik,
} from "@/lib/game/ljudi";
import { baciPotjernicu, imaSet, SETOVI } from "@/lib/game/potjernice";
import {
  napraviDogadaj,
  izaberiDogadajTip,
  smijeNoviDogadaj,
  rijesiIshod,
  type KaubaDogadaj,
} from "@/lib/game/dogadaji";
import { sajamCijena, tjedanKljuc, tjedanSad } from "@/lib/game/tjedan";
import { napraviJutarnji, parsirajJutro, jutroGotovo, jutroSveUzeto, type JutarnjiPosao, type JutarnjiId } from "@/lib/game/jutro";
import { alatCijena, alatLv, ALAT_MAX, parsirajKrunjenja, type AlatId, START, LEVEL_UP_GEMS, SHIELD_ROLL_P, TRGOVINA_CIJENA, TRGOVINA_BAZA, BUNAR_ENERGIJA, MLIN_ENERGIJA, KONJ_CIJENA_ZLATO, KONJ_CIJENA_DRVO, SIJENO_ZLATO, SIJENO_MS, GOVEDO_CIJENA_ZLATO, GOVEDO_CIJENA_DRVO, GOVEDO_TJERAJ, GOVEDO_KLANJE, GOVEDO_KLANJE_MESNICA, KISA_ZLATO, KISA_MS } from "@/lib/game/tuning";
import { susjedPoUid, vrijemeKaravanaMs, karavanaIsplata, izaberiKaravanaCin } from "@/lib/game/susjedi";
import { izgradiMrezu, kvSelaIzMreze, type MrezaUlaz } from "@/lib/game/mreza";
import { jeExpandZnak, KNJIGA_SKUP_CILJ } from "@/lib/game/knjiga";

const PRAZNI_KLAN: Klan = {
  naziv: null,
  razina: 0,
  xp: 0,
  zadaci: [],
  zadnjiRefresh: null,
};

type Dnevna = { dan: number; nagrada: Nagrada; streak: number };
type Tecaj = Record<TrznicaId, TecajStavka>;
type Trend = Record<TrznicaId, number>;

export type GameState = {
  ucitavam: boolean;
  uid: string | null;
  imeIgraca: string;
  igracRazina: number;
  prestigeRazina: number;
  krunjenja: number;
  xp: number;
  zadnjiXp: number;
  xpFlash: number;
  energija: number;
  zlato: number;
  dijamanti: number;
  resursi: Resursi;
  stitovi: number;
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  razine: Razine;
  misije: Misija[];
  ukupnoVrtnji: number;
  ukupnoZlata: number;
  dostignucaDone: Record<string, boolean>;
  novaZvijezda: string | null;
  dnevniStreak: number;
  prikazDnevneNagrade: boolean;
  preuzetoDanas: boolean;
  dnevnaNagrada: Dnevna | null;
  tecaj: Tecaj;
  trend: Trend;
  luckySpinCounter: number;
  winStreak: number;
  poruka: string;
  levelUpData: { razina: number; skok?: number } | null;
  aktivniSkin: string;
  skinovi: string[];
  klan: Klan;
  zadnjiResursTick: number;
  zadnjaEnergijaTick: number;
  kronika: KronikaZapis[];
  stavSela: DebriefStav | null;
  kvalitetaSela: number;
  protokPuls: { ids: string[]; t: number } | null;
  stanovnici: number;
  ljudi: Stanovnik[];
  segrti: Segrt[];
  gradnje: Gradnja[];
  karavana: Karavana | null;
  potjernice: Record<string, number>;
  potjerniceSetovi: string[];
  novaPotjernica: string | null;
  tjedanKljuc: string;
  tjedanCeker: boolean;
  tjedanPohod: boolean;
  jutroDan: string;
  jutro: JutarnjiPosao[];
  jutroList: boolean;
  zamjenici: Zamjenik[];
  dogadaj: KaubaDogadaj | null;
  zadnjiDogadaj: number;
  bankaZlato: number;
  faroKrupije: string | null;
  konjiBroj: number;
  konjiDuznost: KaubaDuznost;
  sijenoDo: number;
  kisaDo: number;
  govedaBroj: number;
  govedaDuznost: GovedoDuznost;
  knjigaSkup: number;
  besplatneVrtnje: number;
  besplatneExpand: SimbolId | null;
  besplatneUlog: number;
  serifCin: number;
  celijaBroj: number;
  zadnjiNalozi: string[];

  setPoruka: (poruka: string) => void;
  clearLevelUp: () => void;
  ucitaj: () => void;
  spremi: () => void;
  spremiDostignuca: () => void;
  primijeniCloudSave: (d: CloudPayload) => void;
  timerTick: () => void;
  timerMarket: () => void;
  provjeriLevelUp: () => void;
  dodajXp: (iznos: number) => void;
  primiNagradu: (nagrada: Nagrada) => void;
  provjeriDostignuca: () => void;
  skloniZvijezdu: () => void;
  preuzmiDnevniBonus: () => void;
  otvoriDnevnuNagradu: () => void;
  sakrijDnevnuNagradu: () => void;
  azurirajMisiju: (tip: string, kolicina?: number) => void;
  preuzmiNagraduMisije: (id: number, nagrada: Nagrada) => void;
  nadogradiZgradu: (zgrada: Zgrada) => void;
  zavrsiGradnju: () => void;
  posaljiKaravanu: (ciljUid: string, teret: Resursi, put?: KaravanaPutId) => void;
  zavrsiKaravanu: () => void;
  rijesiKaravanaCin: (opcija: string) => void;
  dajLiku: (id: string) => void;
  preimenujLika: (id: string, ime: string) => void;
  dajCasu: (id: string) => void;
  rijesiDogadaj: (opcija: string) => void;
  strpajCeliju: () => void;
  pustiCeliju: () => void;
  lijeci: (odakle?: "ordinacija" | "travar" | "banja") => void;
  bankaSpremi: (n: number) => void;
  bankaUzmi: (n: number) => void;
  trgovinaKupi: (res: ResursId) => void;
  postaviKrupija: (id: string | null) => void;
  kupiKonja: (n?: number) => void;
  prodajKonja: () => void;
  pomakniKonja: (od: KonjDuznostId, na: KonjDuznostId) => void;
  kupiSijeno: () => void;
  kupiGovedo: (n?: number) => void;
  prodajGovedo: () => void;
  pomakniGovedo: (od: GovedoDuznostId, na: GovedoDuznostId) => void;
  tjerajGovedo: () => void;
  koljiGovedo: () => void;
  skupiKisu: () => void;
  uhvatiPotjernicu: (opts: { lucky?: boolean; linije?: number; jackpot?: boolean }) => void;
  skloniPotjernicu: () => void;
  uzmiSajamCeker: () => void;
  osvjeziTjedan: () => void;
  osvjeziJutro: () => void;
  azurirajJutro: (tip: JutarnjiPosao["tip"], kolicina?: number) => void;
  dajIvuDrvo: () => void;
  posjetiKaubu: () => void;
  uzmiJutarnju: (id: JutarnjiId) => void;
  otvoriJutro: () => void;
  skloniJutro: () => void;
  popraviZgradu: (zgrada: Zgrada) => void;
  izvrsiPrestige: () => void;
  kupiAlat: (alat: Alat) => void;
  trgovina: (akcija: "kupi" | "prodaj", resurs: TrznicaId, iznos: number) => boolean;
  kupiSkin: (skin: Skin) => void;
  osnujiKlan: (naziv: string) => void;
  doniraiUKlan: (iznosZlato: number) => void;
  azurirajKlanZadatak: (tip: string, kolicina?: number) => void;
  preuzmiKlanNagradu: (zadatakId: number) => void;
  refreshKlanZadatke: () => void;
  postaviUid: (uid: string | null) => void;
  postaviIme: (imeIgraca: string) => void;
  primiResurse: (ukradeno: Partial<Resursi> & { zlato?: number }) => void;
  zapisiDebrief: (zapis: Omit<KronikaZapis, "id" | "t">) => void;
  osvjeziProtok: (pulsIds?: string[]) => void;
  testAlat: (sto: "zlato" | "energija" | "dijamanti" | "resursi" | "stitovi" | "popravi") => void;
  autoTest: () => { ok: number; ukupno: number };
};

const nowMs = () => Date.now();
let tickMemR = 0;
let tickMemE = 0;

const pocetnoStanje = {
  ucitavam: true,
  uid: null as string | null,
  imeIgraca: "Kauboj",
  igracRazina: 1,
  prestigeRazina: 0,
  krunjenja: 0,
  xp: 0,
  zadnjiXp: 0,
  xpFlash: 0,
  energija: START.energija,
  zlato: START.zlato,
  dijamanti: START.dijamanti,
  resursi: { drvo: START.drvo, kamen: START.kamen, zeljezo: START.zeljezo } as Resursi,
  stitovi: START.stitovi,
  gradevine: { ...PRAZNE_GRADEVINE, pilana: START.pilana } as Gradevine,
  ostecenja: { ...PRAZNA_OSTECENJA } as Ostecenja,
  razine: { sreca: 0, pojacalo: 0, baterija: 0, oklop: 0, wildBoost: 0 } as Razine,
  misije: (() => {
    const a = generirajMisiju("jelo");
    const b = generirajMisiju("jelo", [a.tip]);
    const c = generirajMisiju("voda", [a.tip, b.tip]);
    return [a, b, c];
  })() as Misija[],
  ukupnoVrtnji: 0,
  ukupnoZlata: 0,
  dostignucaDone: {} as Record<string, boolean>,
  novaZvijezda: null as string | null,
  dnevniStreak: 0,
  prikazDnevneNagrade: false,
  preuzetoDanas: false,
  dnevnaNagrada: null as Dnevna | null,
  tecaj: { ...BAZA_TECAJ } as Tecaj,
  trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0 } as Trend,
  luckySpinCounter: LUCKY_SPIN_INTERVAL,
  winStreak: 0,
  poruka: "SPREMAN",
  levelUpData: null as { razina: number; skok?: number } | null,
  aktivniSkin: "default",
  skinovi: ["default"],
  klan: { ...PRAZNI_KLAN } as Klan,
  zadnjiResursTick: nowMs(),
  zadnjaEnergijaTick: nowMs(),
  kronika: [
    {
      id: "k-start",
      t: 0,
      metaIme: "Ivo",
      pobjeda: true,
      stav: null,
      vrsta: "selidba",
      recap: "Boro je šerif. Ivo diže krov. Kata, Mile i Mara sjede oko vatre.",
    },
  ] as KronikaZapis[],
  stavSela: null as DebriefStav | null,
  kvalitetaSela: START.kvalitetaSela,
  protokPuls: null as { ids: string[]; t: number } | null,
  stanovnici: START.stanovnici,
  ljudi: pocetniLjudi(),
  segrti: [] as Segrt[],
  gradnje: [] as Gradnja[],
  karavana: null as Karavana | null,
  potjernice: {} as Record<string, number>,
  potjerniceSetovi: [] as string[],
  novaPotjernica: null as string | null,
  tjedanKljuc: "",
  tjedanCeker: false,
  tjedanPohod: false,
  jutroDan: "",
  jutro: napraviJutarnji() as JutarnjiPosao[],
  jutroList: true,
  zamjenici: [] as Zamjenik[],
  dogadaj: null as KaubaDogadaj | null,
  zadnjiDogadaj: 0,
  bankaZlato: 0,
  faroKrupije: null as string | null,
  konjiBroj: 0,
  konjiDuznost: praznaDuznost(),
  sijenoDo: 0,
  kisaDo: 0,
  govedaBroj: 0,
  govedaDuznost: praznaGovedoDuznost(),
  knjigaSkup: 0,
  besplatneVrtnje: 0,
  besplatneExpand: null as SimbolId | null,
  besplatneUlog: 1,
  serifCin: 0,
  celijaBroj: 0,
  zadnjiNalozi: [] as string[],
};

function mrezaUlaz(s: {
  imeIgraca: string;
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  stitovi: number;
  razine: Razine;
  klan: Klan;
  stavSela: DebriefStav | null;
  kronika: KronikaZapis[];
  igracRazina: number;
  prestigeRazina: number;
}): MrezaUlaz {
  return {
    imeIgraca: s.imeIgraca,
    gradevine: s.gradevine,
    ostecenja: s.ostecenja,
    stitovi: s.stitovi,
    oklop: s.razine.oklop,
    klan: s.klan,
    stavSela: s.stavSela,
    kronika: s.kronika,
    igracRazina: s.igracRazina,
    prestigeRazina: s.prestigeRazina,
  };
}

type GameBlob = {
  igracRazina?: number;
  prestigeRazina?: number;
  krunjenja?: number;
  xp?: number;
  energija?: number;
  zlato?: number;
  dijamanti?: number;
  resursi?: Partial<Resursi>;
  gradevine?: Partial<Gradevine>;
  ostecenja?: Partial<Ostecenja>;
  razine?: Partial<Razine>;
  stitovi?: number;
  misije?: Misija[];
  zadnjiNalozi?: string[];
  tecaj?: Tecaj;
  trend?: Trend;
  luckySpinCounter?: number;
  winStreak?: number;
  aktivniSkin?: string;
  skinovi?: string[];
  klan?: Klan;
  imeIgraca?: string;
  zadnjiResursTick?: number;
  zadnjaEnergijaTick?: number;
  kronika?: KronikaZapis[];
  stavSela?: DebriefStav | null;
  stanovnici?: number;
  ljudi?: Stanovnik[];
  segrti?: Segrt[];
  gradnja?: Gradnja | null;
  gradnje?: Gradnja[];
  karavana?: Karavana | null;
  potjernice?: Record<string, number>;
  potjerniceSetovi?: string[];
  tjedanKljuc?: string;
  tjedanCeker?: boolean;
  tjedanPohod?: boolean;
  jutroDan?: string;
  jutro?: JutarnjiPosao[];
  zamjenici?: Zamjenik[];
  dogadaj?: KaubaDogadaj | null;
  zadnjiDogadaj?: number;
  bankaZlato?: number;
  faroKrupije?: string | null;
  konjiBroj?: number;
  konjiDuznost?: Partial<KaubaDuznost>;
  sijenoDo?: number;
  kisaDo?: number;
  govedaBroj?: number;
  govedaDuznost?: Partial<GovedoDuznost>;
  knjigaSkup?: number;
  besplatneVrtnje?: number;
  besplatneExpand?: string | null;
  besplatneUlog?: number;
  serifCin?: number;
  celijaBroj?: number;
};

function spojSkinove(aktivni: string, spremljeni?: string[]) {
  const set = new Set<string>(["default"]);
  for (const id of spremljeni ?? []) if (id) set.add(id);
  if (aktivni) set.add(aktivni);
  return [...set];
}

function parsirajGradnju(raw: unknown): Gradnja | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.zgrada !== "string" || typeof r.ciljLv !== "number") return null;
  if (typeof r.start !== "number" || typeof r.kraj !== "number") return null;
  return {
    zgrada: r.zgrada as Gradnja["zgrada"],
    ciljLv: Math.max(1, Math.floor(r.ciljLv)),
    start: r.start,
    kraj: r.kraj,
    majstorId: typeof r.majstorId === "string" ? r.majstorId : "",
    majstorIme: typeof r.majstorIme === "string" ? r.majstorIme.slice(0, 18) : "Ivo",
  };
}

function parsirajGradnje(raw: unknown, stara?: unknown): Gradnja[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => parsirajGradnju(x)).filter((g): g is Gradnja => !!g);
  }
  const one = parsirajGradnju(stara ?? raw);
  return one ? [one] : [];
}

function parsirajSegrte(raw: unknown): Segrt[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x, i) => {
      const baza = napraviSegrta(i, false);
      return {
        ...baza,
        id: typeof x.id === "string" ? x.id : baza.id,
        ime: typeof x.ime === "string" ? x.ime.slice(0, 18) : baza.ime,
        xp: typeof x.xp === "number" ? x.xp : 0,
        razina: typeof x.razina === "number" ? x.razina : 1,
        skola: Math.max(0, Math.floor(Number(x.skola) || 0)),
        spreman: !!x.spreman || (Number(x.skola) || 0) >= SEGRT_SKOLA,
        rec: typeof x.rec === "string" ? x.rec : baza.rec,
      };
    })
    .slice(0, 3);
}

function parsirajZamjenike(raw: unknown): Zamjenik[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x, i) => {
      const baza = napraviZamjenika(i);
      return {
        ...baza,
        id: typeof x.id === "string" ? x.id : baza.id,
        ime: typeof x.ime === "string" ? x.ime.slice(0, 18) : baza.ime,
        xp: typeof x.xp === "number" ? x.xp : 0,
        razina: typeof x.razina === "number" ? x.razina : 1,
        rec: typeof x.rec === "string" ? x.rec : baza.rec,
        spreman: true,
      };
    })
    .slice(0, 2);
}

function parsirajDogadaj(raw: unknown): KaubaDogadaj | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const tipovi = ["stranac", "dvoboj", "salun", "krdo", "konj", "kisa", "trgovac", "svadba", "posta", "cirkus"] as const;
  if (!tipovi.includes(r.tip as (typeof tipovi)[number])) return null;
  if (typeof r.rec !== "string" || typeof r.t !== "number") return null;
  const opcije = Array.isArray(r.opcije)
    ? r.opcije
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({ id: String(x.id ?? ""), rec: String(x.rec ?? "") }))
        .filter((x) => x.id && x.rec)
    : [];
  if (!opcije.length) return null;
  return {
    id: typeof r.id === "string" ? r.id : `d-${r.t}`,
    tip: r.tip as KaubaDogadaj["tip"],
    rec: r.rec.slice(0, 120),
    t: r.t,
    naslov: typeof r.naslov === "string" ? r.naslov.slice(0, 32) : undefined,
    serifIme: typeof r.serifIme === "string" ? r.serifIme.slice(0, 18) : undefined,
    opcije,
  };
}

function parsirajKaravanu(raw: unknown): Karavana | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.ciljUid !== "string" || typeof r.ciljIme !== "string") return null;
  if (typeof r.start !== "number" || typeof r.kraj !== "number") return null;
  const t = (r.teret && typeof r.teret === "object" ? r.teret : {}) as Record<string, unknown>;
  return {
    ciljUid: r.ciljUid,
    ciljIme: r.ciljIme.slice(0, 24),
    start: r.start,
    kraj: r.kraj,
    teret: {
      drvo: Math.max(0, Math.floor(Number(t.drvo) || 0)),
      kamen: Math.max(0, Math.floor(Number(t.kamen) || 0)),
      zeljezo: Math.max(0, Math.floor(Number(t.zeljezo) || 0)),
    },
    vozacId: typeof r.vozacId === "string" ? r.vozacId : "",
    vozacIme: typeof r.vozacIme === "string" ? r.vozacIme.slice(0, 18) : "Mile",
    put: r.put === "noc" || r.put === "rijeka" || r.put === "staza" ? r.put : undefined,
    cin: parsirajKaravanaCin(r.cin),
    cinRijesen: !!r.cinRijesen,
  };
}

function parsirajKaravanaCin(raw: unknown): Karavana["cin"] {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.rec !== "string") return null;
  const opcije = Array.isArray(r.opcije)
    ? r.opcije
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({ id: String(x.id ?? ""), rec: String(x.rec ?? "") }))
        .filter((x) => x.id && x.rec)
    : [];
  if (!opcije.length) return null;
  return { id: r.id, rec: r.rec.slice(0, 80), opcije };
}

function capRazine(r: Razine): Razine {
  return {
    sreca: alatLv("sreca", r.sreca),
    pojacalo: alatLv("pojacalo", r.pojacalo),
    baterija: alatLv("baterija", r.baterija),
    oklop: alatLv("oklop", r.oklop),
    wildBoost: alatLv("wildBoost", r.wildBoost),
  };
}

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function parsirajKonje(d: { konjiBroj?: number }, g: Gradevine) {
  const kap = konjaKap(g);
  if (typeof d.konjiBroj === "number" && Number.isFinite(d.konjiBroj)) {
    return Math.max(0, Math.min(kap, Math.floor(d.konjiBroj)));
  }
  return kap;
}

function parsirajDuznost(raw: unknown, broj: number): KaubaDuznost {
  if (!raw || typeof raw !== "object") return normalizirajDuznost(broj);
  return normalizirajDuznost(broj, raw as Partial<KaubaDuznost>);
}

function parsirajGoveda(d: { govedaBroj?: number }, g: Gradevine) {
  const kap = govedaKap(g);
  if (typeof d.govedaBroj === "number" && Number.isFinite(d.govedaBroj)) {
    return Math.max(0, Math.min(kap, Math.floor(d.govedaBroj)));
  }
  return 0;
}

function parsirajGovedoDuznost(raw: unknown, broj: number): GovedoDuznost {
  if (!raw || typeof raw !== "object") return normalizirajGovedo(broj);
  return normalizirajGovedo(broj, raw as Partial<GovedoDuznost>);
}

export const useGameStore = create<GameState>((set, get) => ({
  ...pocetnoStanje,

  setPoruka: (poruka) => set({ poruka }),
  clearLevelUp: () => set({ levelUpData: null }),

  ucitaj: () => {
    try {
      const d = loadJSON<GameBlob>(SAVE_KEYS.game);
      if (d) {
        const ticksNow = nowMs();
        set({
          igracRazina: num(d.igracRazina, get().igracRazina),
          prestigeRazina: num(d.prestigeRazina, get().prestigeRazina),
          krunjenja: parsirajKrunjenja(d.krunjenja, num(d.prestigeRazina, 0)),
          xp: num(d.xp, get().xp),
          energija: capEnergija(num(d.energija, 10), num(d.razine?.baterija, get().razine.baterija || 0)),
          zlato: num(d.zlato, get().zlato),
          dijamanti: num(d.dijamanti, get().dijamanti),
          resursi: { ...get().resursi, ...(d.resursi ?? {}) },
          gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
          ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
          stanovnici: num(d.stanovnici, get().stanovnici),
          ljudi: parsirajLjude(d.ljudi, num(d.stanovnici, get().stanovnici)),
          segrti: uskladiSegrte(parsirajSegrte(d.segrti), num(d.igracRazina, get().igracRazina)),
          zamjenici: uskladiZamjenike(
            parsirajZamjenike(d.zamjenici),
            num(d.igracRazina, get().igracRazina),
            num(d.gradevine?.ured, get().gradevine.ured || 0),
          ),
          dogadaj: parsirajDogadaj(d.dogadaj),
          zadnjiDogadaj: num(d.zadnjiDogadaj, 0),
          bankaZlato: Math.max(0, num(d.bankaZlato, 0)),
          faroKrupije: typeof d.faroKrupije === "string" ? d.faroKrupije : null,
          konjiBroj: parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
          konjiDuznost: parsirajDuznost(d.konjiDuznost, parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
          sijenoDo: num(d.sijenoDo, 0),
          kisaDo: num(d.kisaDo, 0),
          govedaBroj: parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
          govedaDuznost: parsirajGovedoDuznost(d.govedaDuznost, parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
          knjigaSkup: Math.max(0, Math.min(KNJIGA_SKUP_CILJ - 1, Math.floor(num(d.knjigaSkup, 0)))),
          besplatneVrtnje: Math.max(0, Math.floor(num(d.besplatneVrtnje, 0))),
          besplatneExpand: jeExpandZnak(d.besplatneExpand) ? d.besplatneExpand : null,
          besplatneUlog: Math.max(1, Math.floor(num(d.besplatneUlog, 1))),
          serifCin: Math.max(0, Math.floor(num(d.serifCin, 0))),
          celijaBroj: Math.max(0, Math.min(3, Math.floor(num(d.celijaBroj, 0)))),
          gradnje: parsirajGradnje(d.gradnje, d.gradnja),
          karavana: parsirajKaravanu(d.karavana),
          potjernice: d.potjernice && typeof d.potjernice === "object" ? d.potjernice : get().potjernice,
          potjerniceSetovi: Array.isArray(d.potjerniceSetovi) ? d.potjerniceSetovi : get().potjerniceSetovi,
          tjedanKljuc: typeof d.tjedanKljuc === "string" ? d.tjedanKljuc : "",
          tjedanCeker: !!d.tjedanCeker,
          tjedanPohod: !!d.tjedanPohod,
          jutroDan: typeof d.jutroDan === "string" ? d.jutroDan : "",
          jutro: parsirajJutro(d.jutro, typeof d.jutroDan === "string" ? d.jutroDan : ""),
          razine: capRazine({ ...get().razine, ...(d.razine ?? {}) }),
          stitovi: num(d.stitovi, get().stitovi),
          misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
          zadnjiNalozi: Array.isArray(d.zadnjiNalozi) ? d.zadnjiNalozi.filter((x): x is string => typeof x === "string").slice(0, 8) : get().zadnjiNalozi,
          tecaj: { ...BAZA_TECAJ, ...(d.tecaj ?? {}) },
          trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...(d.trend as Partial<Trend> | undefined) },
          luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
          winStreak: num(d.winStreak, get().winStreak),
          aktivniSkin: d.aktivniSkin || get().aktivniSkin,
          skinovi: spojSkinove(d.aktivniSkin || get().aktivniSkin, d.skinovi),
          klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
          imeIgraca: d.imeIgraca || get().imeIgraca,
          zadnjiResursTick: num(d.zadnjiResursTick, ticksNow),
          zadnjaEnergijaTick: num(d.zadnjaEnergijaTick, ticksNow),
          kronika: parsirajKroniku(d.kronika),
          stavSela: d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
            ? d.stavSela
            : null,
        });
      }

      const da = loadJSON<{
        dostignucaDone?: Record<string, boolean>;
        ukupnoVrtnji?: number;
        ukupnoZlata?: number;
      }>(SAVE_KEYS.ach);
      if (da) {
        set({
          dostignucaDone: da.dostignucaDone ?? get().dostignucaDone,
          ukupnoVrtnji: num(da.ukupnoVrtnji, get().ukupnoVrtnji),
          ukupnoZlata: num(da.ukupnoZlata, get().ukupnoZlata),
        });
      }

      const pd = loadJSON<DailySave>(SAVE_KEYS.daily);
      const resolved = resolveDaily(pd);
      if (resolved.claimedToday) {
        set({
          dnevniStreak: resolved.streak,
          preuzetoDanas: true,
          prikazDnevneNagrade: false,
          dnevnaNagrada: null,
        });
      } else {
        const pack = nagradaZaStreak(resolved.streak);
        set({
          dnevniStreak: resolved.streak,
          preuzetoDanas: false,
          dnevnaNagrada: { ...pack, streak: resolved.streak },
          prikazDnevneNagrade: true,
        });
      }
    } catch (e) {
      console.error("Failed to load game state:", e);
    } finally {
      tickMemR = nowMs();
      tickMemE = nowMs();
      set({ ucitavam: false });
      get().osvjeziProtok();
      get().osvjeziTjedan();
      get().osvjeziJutro();
    }
  },

  spremi: () => {
    const s = get();
    const payload: GameBlob = {
      igracRazina: s.igracRazina,
      prestigeRazina: s.prestigeRazina,
      krunjenja: s.krunjenja,
      xp: s.xp,
      energija: s.energija,
      zlato: s.zlato,
      dijamanti: s.dijamanti,
      resursi: s.resursi,
      gradevine: s.gradevine,
      ostecenja: s.ostecenja,
      razine: s.razine,
      stitovi: s.stitovi,
      misije: s.misije,
      zadnjiNalozi: s.zadnjiNalozi,
      tecaj: s.tecaj,
      trend: s.trend,
      luckySpinCounter: s.luckySpinCounter,
      winStreak: s.winStreak,
      aktivniSkin: s.aktivniSkin,
      skinovi: s.skinovi,
      klan: s.klan,
      imeIgraca: s.imeIgraca,
      zadnjiResursTick: s.zadnjiResursTick,
      zadnjaEnergijaTick: s.zadnjaEnergijaTick,
      kronika: s.kronika,
      stavSela: s.stavSela,
      stanovnici: s.stanovnici,
      ljudi: s.ljudi,
      segrti: s.segrti,
      gradnje: s.gradnje,
      karavana: s.karavana,
      potjernice: s.potjernice,
      potjerniceSetovi: s.potjerniceSetovi,
      tjedanKljuc: s.tjedanKljuc,
      tjedanCeker: s.tjedanCeker,
      tjedanPohod: s.tjedanPohod,
      jutroDan: s.jutroDan,
      jutro: s.jutro,
      zamjenici: s.zamjenici,
      dogadaj: s.dogadaj,
      zadnjiDogadaj: s.zadnjiDogadaj,
      bankaZlato: s.bankaZlato,
      faroKrupije: s.faroKrupije,
      konjiBroj: s.konjiBroj,
      konjiDuznost: s.konjiDuznost,
      sijenoDo: s.sijenoDo,
      kisaDo: s.kisaDo,
      govedaBroj: s.govedaBroj,
      govedaDuznost: s.govedaDuznost,
      knjigaSkup: s.knjigaSkup,
      besplatneVrtnje: s.besplatneVrtnje,
      besplatneExpand: s.besplatneExpand,
      besplatneUlog: s.besplatneUlog,
      serifCin: s.serifCin,
      celijaBroj: s.celijaBroj,
    };
    saveJSON(SAVE_KEYS.game, payload);
  },

  spremiDostignuca: () => {
    const s = get();
    saveJSON(SAVE_KEYS.ach, {
      dostignucaDone: s.dostignucaDone,
      ukupnoVrtnji: s.ukupnoVrtnji,
      ukupnoZlata: s.ukupnoZlata,
    });
  },

  primijeniCloudSave: (d) => {
    const ticksNow = nowMs();
    set({
      imeIgraca: d.imeIgraca || get().imeIgraca,
      igracRazina: num(d.igracRazina, get().igracRazina),
      prestigeRazina: num(d.prestigeRazina, get().prestigeRazina),
      krunjenja: parsirajKrunjenja(d.krunjenja, num(d.prestigeRazina, get().prestigeRazina)),
      xp: num(d.xp, get().xp),
      energija: capEnergija(
        num(d.energija, get().energija),
        num(d.razine?.baterija, get().razine.baterija || 0),
      ),
      zlato: num(d.zlato, get().zlato),
      dijamanti: num(d.dijamanti, get().dijamanti),
      resursi: { ...get().resursi, ...(d.resursi ?? {}) },
      stitovi: num(d.stitovi, get().stitovi),
      gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
      ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
      razine: { ...get().razine, ...(d.razine ?? {}) },
      misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
      zadnjiNalozi: Array.isArray(d.zadnjiNalozi) ? d.zadnjiNalozi.filter((x): x is string => typeof x === "string").slice(0, 8) : get().zadnjiNalozi,
      tecaj: { ...BAZA_TECAJ, ...((d.tecaj as Tecaj | undefined) ?? {}) },
      trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...((d.trend as Partial<Trend> | undefined) ?? {}) },
      luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
      winStreak: num(d.winStreak, get().winStreak),
      aktivniSkin: d.aktivniSkin || get().aktivniSkin,
      skinovi: spojSkinove(d.aktivniSkin || get().aktivniSkin, d.skinovi),
      klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
      ukupnoVrtnji: num(d.ukupnoVrtnji, get().ukupnoVrtnji),
      ukupnoZlata: num(d.ukupnoZlata, get().ukupnoZlata),
      dostignucaDone: d.dostignucaDone ?? get().dostignucaDone,
      stanovnici: num(d.stanovnici, get().stanovnici),
      ljudi: parsirajLjude((d as { ljudi?: unknown }).ljudi, num(d.stanovnici, get().stanovnici)),
      segrti: uskladiSegrte(parsirajSegrte((d as { segrti?: unknown }).segrti), num(d.igracRazina, get().igracRazina)),
      zamjenici: uskladiZamjenike(
        parsirajZamjenike((d as { zamjenici?: unknown }).zamjenici),
        num(d.igracRazina, get().igracRazina),
        num((d.gradevine as { ured?: number } | undefined)?.ured, get().gradevine.ured || 0),
      ),
      gradnje: parsirajGradnje((d as { gradnje?: unknown }).gradnje, (d as { gradnja?: unknown }).gradnja),
      karavana: "karavana" in d ? parsirajKaravanu((d as { karavana?: unknown }).karavana) : get().karavana,
      potjernice: (d as { potjernice?: Record<string, number> }).potjernice ?? get().potjernice,
      potjerniceSetovi: (d as { potjerniceSetovi?: string[] }).potjerniceSetovi ?? get().potjerniceSetovi,
      tjedanKljuc: typeof (d as { tjedanKljuc?: unknown }).tjedanKljuc === "string" ? (d as { tjedanKljuc: string }).tjedanKljuc : get().tjedanKljuc,
      tjedanCeker: typeof (d as { tjedanCeker?: unknown }).tjedanCeker === "boolean" ? (d as { tjedanCeker: boolean }).tjedanCeker : get().tjedanCeker,
      tjedanPohod: typeof (d as { tjedanPohod?: unknown }).tjedanPohod === "boolean" ? (d as { tjedanPohod: boolean }).tjedanPohod : get().tjedanPohod,
      dogadaj: parsirajDogadaj((d as { dogadaj?: unknown }).dogadaj),
      zadnjiDogadaj: num((d as { zadnjiDogadaj?: unknown }).zadnjiDogadaj, get().zadnjiDogadaj),
      bankaZlato: Math.max(0, num((d as { bankaZlato?: unknown }).bankaZlato, get().bankaZlato)),
      faroKrupije: typeof (d as { faroKrupije?: unknown }).faroKrupije === "string" ? (d as { faroKrupije: string }).faroKrupije : get().faroKrupije,
      konjiBroj: parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
      konjiDuznost: parsirajDuznost((d as { konjiDuznost?: unknown }).konjiDuznost, parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
      sijenoDo: num((d as { sijenoDo?: unknown }).sijenoDo, get().sijenoDo),
      kisaDo: num((d as { kisaDo?: unknown }).kisaDo, get().kisaDo),
      govedaBroj: parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
      govedaDuznost: parsirajGovedoDuznost((d as { govedaDuznost?: unknown }).govedaDuznost, parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
      knjigaSkup: Math.max(0, Math.min(KNJIGA_SKUP_CILJ - 1, Math.floor(num((d as { knjigaSkup?: unknown }).knjigaSkup, get().knjigaSkup)))),
      besplatneVrtnje: Math.max(0, Math.floor(num((d as { besplatneVrtnje?: unknown }).besplatneVrtnje, get().besplatneVrtnje))),
      besplatneExpand: jeExpandZnak((d as { besplatneExpand?: unknown }).besplatneExpand) ? (d as { besplatneExpand: SimbolId }).besplatneExpand : get().besplatneExpand,
      besplatneUlog: Math.max(1, Math.floor(num((d as { besplatneUlog?: unknown }).besplatneUlog, get().besplatneUlog))),
      serifCin: Math.max(0, Math.floor(num((d as { serifCin?: unknown }).serifCin, get().serifCin))),
      celijaBroj: Math.max(0, Math.min(3, Math.floor(num((d as { celijaBroj?: unknown }).celijaBroj, get().celijaBroj)))),
      zadnjiResursTick: get().zadnjiResursTick || ticksNow,
      zadnjaEnergijaTick: get().zadnjaEnergijaTick || ticksNow,
      kronika: d.kronika ? parsirajKroniku(d.kronika) : get().kronika,
      stavSela:
        d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
          ? d.stavSela
          : get().stavSela,
    });
    get().osvjeziProtok();
  },

  timerTick: () => {
    get().osvjeziTjedan();
    get().osvjeziJutro();
    if (get().gradnje.some((g) => nowMs() >= g.kraj)) get().zavrsiGradnju();
    if (get().karavana && nowMs() >= get().karavana!.kraj) get().zavrsiKaravanu();
    {
      const k = get().karavana;
      const r = nowMs();
      if (k && !k.cin && !k.cinRijesen && k.kraj > k.start && (r - k.start) / (k.kraj - k.start) >= 0.42) {
        set({ karavana: { ...k, cin: izaberiKaravanaCin() } });
      }
    }
    const s = get();
    const now = nowMs();
    let lastR = tickMemR || s.zadnjiResursTick || now;
    let lastE = tickMemE || s.zadnjaEnergijaTick || now;
    if (now - lastR > MAX_OFFLINE_MS) lastR = now - MAX_OFFLINE_MS;
    if (now - lastE > MAX_OFFLINE_MS) lastE = now - MAX_OFFLINE_MS;
    const regenMs = izracunajEnergijaRegenMs(s.razine.baterija || 0);
    const rTicks = Math.floor((now - lastR) / RESOURCE_TICK_MS);
    const eTicks = Math.floor((now - lastE) / regenMs);
    if (rTicks <= 0 && eTicks <= 0) {
      const capped = capEnergija(s.energija, s.razine.baterija || 0);
      if (capped !== s.energija) set({ energija: capped });
      const k = get().karavana;
      const r = nowMs();
      if (k && !k.cin && !k.cinRijesen && k.kraj > k.start && (r - k.start) / Math.max(1, k.kraj - k.start) >= 0.42) {
        set({ karavana: { ...k, cin: izaberiKaravanaCin() } });
      }
      return;
    }

    if (rTicks <= 0) {
      const nextEnergy = capEnergija(s.energija + eTicks, s.razine.baterija || 0);
      const nextEnergyTick = lastE + eTicks * regenMs;
      tickMemE = nextEnergyTick;
      set({ energija: nextEnergy, zadnjaEnergijaTick: nextEnergyTick });
      return;
    }

    const maxStitova = izracunajMaxStitova(s.razine.oklop || 0);
    const pasivniMnozitelj =
      izracunajPasivniMnozitelj(s.igracRazina, s.prestigeRazina) *
      izracunajTokMnozitelj(kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s))));
    const zamjenici = uskladiZamjenike(s.zamjenici, s.igracRazina, s.gradevine.ured || 0);
    const kauba = kaubaOd({ ...s, zamjenici });
    const radE = kauba.rad * kauba.efikasnost * (1 + jacina(s.ljudi, "rad") * 0.06) * kauba.radKonja;
    const drvoGain =
      rTicks > 0 && !s.ostecenja.pilana
        ? (s.gradevine.pilana || 0) * ZGRADE[0]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const kamenGain =
      rTicks > 0 && !s.ostecenja.kamenolom
        ? (s.gradevine.kamenolom || 0) * ZGRADE[1]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const zeljezoGain =
      rTicks > 0 && !s.ostecenja.rudnik
        ? (s.gradevine.rudnik || 0) * ZGRADE[2]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const zlatoGain =
      rTicks > 0 && !s.ostecenja.salun
        ? izracunajSalunZlato(s.gradevine, kauba.ljudi) *
          (1 + kauba.duznost.rodeo * 0.07) *
          pasivniMnozitelj *
          rTicks
        : 0;
    const bunarGain =
      rTicks > 0
        ? (((s.ostecenja.bunar ? 0 : s.gradevine.bunar || 0) * BUNAR_ENERGIJA +
            (s.ostecenja.mlin ? 0 : s.gradevine.mlin || 0) * MLIN_ENERGIJA) *
            rTicks)
        : 0;
    const nextLjudi = rTicks > 0 ? izracunajSelidbu(kauba, rTicks) : s.stanovnici;
    const kamata =
      rTicks > 0 && !s.ostecenja.banka
        ? bankaKamata(s.bankaZlato, s.gradevine.banka || 0, rTicks) * (0.55 + 0.45 * kauba.potrebe.red)
        : 0;
    const nextBanka = Math.min(bankaKap(s.gradevine.banka || 0), s.bankaZlato + kamata);

    const nextEnergy = capEnergija(
      s.energija + (eTicks > 0 ? eTicks : 0) + bunarGain,
      s.razine.baterija || 0,
    );
    const serifLik = serif(s.ljudi);
    const redBoost =
      1 +
      (s.gradevine.ured || 0) * 0.18 +
      (serifLik?.razina ?? 0) * 0.05 +
      jacina(s.ljudi, "red") * 0.08;
    const shieldRoll =
      rTicks > 0 && s.stitovi < maxStitova && Math.random() < Math.min(1, SHIELD_ROLL_P * rTicks * redBoost);
    const nextResursTick = rTicks > 0 ? lastR + rTicks * RESOURCE_TICK_MS : s.zadnjiResursTick;
    const nextEnergyTick = eTicks > 0 ? lastE + eTicks * regenMs : s.zadnjaEnergijaTick;
    const resChanged = drvoGain !== 0 || kamenGain !== 0 || zeljezoGain !== 0 || zlatoGain !== 0;
    tickMemR = nextResursTick;
    tickMemE = nextEnergyTick;

    const floorPrije = Math.floor(s.stanovnici + 1e-6);
    const floorPoslije = Math.floor(nextLjudi + 1e-6);
    const doslo = floorPoslije - floorPrije;
    const uskl = uskladiLjude(s.ljudi, floorPoslije);
    const selidba: KronikaZapis[] = [];
    if (uskl.dosli.length === 1 && uskl.otisli.length === 0) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.dosli[0]!.ime,
        pobjeda: true,
        stav: null,
        vrsta: "selidba",
        recap: recapDolazak(uskl.dosli[0]!),
      });
    } else if (uskl.otisli.length === 1 && uskl.dosli.length === 0) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.otisli[0]!.ime,
        pobjeda: false,
        stav: null,
        vrsta: "selidba",
        recap: recapOdlazak(uskl.otisli[0]!, kauba.usko ?? undefined),
      });
    } else if (uskl.dosli.length > 1) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.dosli[0]!.ime,
        pobjeda: true,
        stav: null,
        vrsta: "selidba",
        recap: `${uskl.dosli[0]!.ime} i još ${uskl.dosli.length - 1} došli u kaubu.`,
      });
    } else if (uskl.otisli.length > 1) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.otisli[0]!.ime,
        pobjeda: false,
        stav: null,
        vrsta: "selidba",
        recap: `${uskl.otisli[0]!.ime} i još ${uskl.otisli.length - 1} otišli iz kaube.`,
      });
    }
    if (doslo > 0) playSfx("collect");

    const puls: string[] = [];
    if (drvoGain > 0) puls.push("z:pilana>selo");
    if (kamenGain > 0) puls.push("z:kamenolom>selo");
    if (zeljezoGain > 0) puls.push("z:rudnik>selo");
    if (zlatoGain > 0) puls.push("z:salun>selo");
    if (bunarGain > 0) {
      if (!s.ostecenja.bunar && (s.gradevine.bunar || 0) > 0) puls.push("z:bunar>selo");
      if (!s.ostecenja.mlin && (s.gradevine.mlin || 0) > 0) puls.push("z:mlin>selo");
    }
    if (shieldRoll) puls.push("oklop>selo");

    let buffPoruka: string | null = null;
    set((state) => ({
      energija: nextEnergy,
      zlato: zlatoGain > 0 ? state.zlato + zlatoGain : state.zlato,
      resursi: resChanged
        ? {
            drvo: state.resursi.drvo + drvoGain,
            kamen: state.resursi.kamen + kamenGain,
            zeljezo: state.resursi.zeljezo + zeljezoGain,
          }
        : state.resursi,
      stitovi: shieldRoll ? state.stitovi + 1 : state.stitovi,
      stanovnici: nextLjudi,
      zamjenici: zamjenici.map((z) => {
        if (rTicks <= 0) return z;
        const n = Math.min(6, rTicks);
        const radi = (s.gradevine.ured || 0) + (s.gradevine.banka || 0) > 0;
        let next = radi ? dodajXpLiku(z, n) : z;
        if (shieldRoll) next = dodajXpLiku(next, 3);
        return { ...next, spreman: z.spreman };
      }),
      bankaZlato: nextBanka,
      ljudi: uskl.ljudi.map((p) => {
        if (rTicks <= 0) return p;
        const n = Math.min(6, rTicks);
        const g = s.gradevine;
        const radi =
          (p.hub === "posao" && (g.pilana || 0) + (g.kamenolom || 0) + (g.rudnik || 0) + (g.trgovina || 0) > 0) ||
          (p.hub === "jelo" && (g.lov || 0) + (g.mesnica || 0) + (g.pekara || 0) + (g.farma || 0) + (g.tor || 0) > 0) ||
          (p.hub === "voda" && (g.bunar || 0) + (g.mlin || 0) + (g.cisterna || 0) > 0) ||
          (p.hub === "zabava" && (g.salun || 0) + (g.karte || 0) > 0) ||
          (p.hub === "krov" && (g.kuca || 0) + (g.blok || 0) > 0) ||
          (p.hub === "red" && (g.ured || 0) + (g.banka || 0) > 0) ||
          (p.hub === "konji" && (g.staja || 0) + (g.korali || 0) + (g.staza || 0) > 0) ||
          (p.hub === "zdravlje" && (g.ordinacija || 0) + (g.travar || 0) + (g.banja || 0) > 0);
        let next = radi ? dodajXpLiku(p, n) : p;
        if (shieldRoll && (p.posao === "Šerif" || p.posao === "Zamjenik")) next = dodajXpLiku(next, 3);
        const rec = recNoviBuff(p, next);
        const mana = recNovaMana(p, next);
        if (rec) buffPoruka = `${next.ime}: ${rec}.`;
        else if (mana) buffPoruka = `${next.ime}: ${mana}.`;
        return next;
      }),
      zadnjiResursTick: nextResursTick,
      zadnjaEnergijaTick: nextEnergyTick,
      poruka:
        buffPoruka ??
        selidba[0]?.recap ??
        (doslo > 0
          ? doslo === 1
            ? "Novi čovjek u kaubi."
            : `Došlo +${doslo} ljudi.`
          : doslo < 0
            ? "Netko je otišao iz kaube."
            : state.poruka),
      kronika: selidba.length ? [...selidba, ...state.kronika].slice(0, MAX_KRONIKA) : state.kronika,
      misije:
        doslo === 0
          ? state.misije
          : state.misije.map((m) => {
              if (m.tip !== "ljudi" || m.zavrseno) return m;
              const trenutno = Math.min(m.cilj, floorPoslije);
              return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
            }),
    }));
    get().osvjeziProtok(puls);
    if (selidba.length) get().provjeriDostignuca();
    const after = get();
    if (
      rTicks > 0 &&
      smijeNoviDogadaj(after.zadnjiDogadaj, nowMs(), !!after.dogadaj) &&
      Math.random() < Math.min(0.07, 0.03 * rTicks)
    ) {
      const tko = serif(after.ljudi);
      const tip = izaberiDogadajTip(after.gradevine, kauba.sreca, nowMs());
      const cin = (after.gradevine.ured || 0) > 0 ? after.serifCin : -1;
      set({ dogadaj: napraviDogadaj(tip, tko?.ime ?? "Boro", nowMs(), cin) });
    }
  },

  timerMarket: () => {
    set((state) => {
      const noviTecaj = { ...BAZA_TECAJ, ...state.tecaj };
      const noviTrend: Trend = { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...(state.trend as Partial<Trend>) };
      (["drvo", "kamen", "zeljezo", "dijamant"] as TrznicaId[]).forEach((res) => {
        const swing = 0.9 + Math.random() * 0.22;
        const baza = BAZA_TECAJ[res];
        const stari = state.tecaj[res] ?? baza;
        const novaKupi = Math.max(2, Math.round(baza.kupi * swing));
        const novaProdaj = Math.max(
          1,
          Math.min(Math.floor(novaKupi * 0.78), Math.round(baza.prodaj * swing)),
        );
        noviTrend[res] = novaKupi > stari.kupi ? 1 : novaKupi < stari.kupi ? -1 : 0;
        noviTecaj[res] = { kupi: novaKupi, prodaj: novaProdaj };
      });
      return { tecaj: noviTecaj, trend: noviTrend };
    });
  },

  provjeriLevelUp: () => {
    const s = get();
    let xp = s.xp;
    let razina = s.igracRazina;
    let dijamanti = s.dijamanti;
    let skok = 0;
    while (xp >= izracunajPotrebniXp(razina)) {
      xp -= izracunajPotrebniXp(razina);
      razina += 1;
      dijamanti += LEVEL_UP_GEMS;
      skok += 1;
      if (skok > 20) break;
    }
    if (skok === 0) return;
    const maxEnergija = izracunajMaxEnergiju(s.razine.baterija || 0);
    const segrti = uskladiSegrte(s.segrti, razina);
    const zamjenici = uskladiZamjenike(s.zamjenici, razina, s.gradevine.ured || 0);
    const novi = segrti.filter((x) => !s.segrti.some((y) => y.id === x.id));
    const noviZam = zamjenici.filter((x) => !s.zamjenici.some((y) => y.id === x.id));
    set({
      xp,
      igracRazina: razina,
      dijamanti,
      energija: maxEnergija,
      segrti,
      zamjenici,
      poruka: noviZam.length
        ? `LEVEL UP! ${noviZam.map((n) => n.ime).join(" i ")} ${noviZam.length > 1 ? "su" : "je"} zamjenik.`
        : novi.length
          ? `LEVEL UP! ${novi.map((n) => n.ime).join(" i ")} ${novi.length > 1 ? "uče" : "uči"} od Ive.`
          : `LEVEL UP! RAZINA ${razina}`,
      levelUpData: { razina, skok: skok > 1 ? skok : undefined },
    });
  },

  dodajXp: (iznos) => {
    if (iznos <= 0) return;
    set((state) => ({
      xp: state.xp + iznos,
      zadnjiXp: iznos,
      xpFlash: state.xpFlash + 1,
    }));
    get().provjeriLevelUp();
  },

  primiNagradu: (nagrada) => {
    set((state) => {
      const maxS = izracunajMaxStitova(state.razine.oklop || 0);
      return {
        zlato: state.zlato + (nagrada.zlato || 0),
        dijamanti: state.dijamanti + (nagrada.dijamanti || 0),
        energija: capEnergija(state.energija + (nagrada.energija || 0), state.razine.baterija || 0),
        stitovi: Math.min(maxS, state.stitovi + (nagrada.stitovi || 0)),
        resursi: {
          drvo: state.resursi.drvo + (nagrada.drvo || 0),
          kamen: state.resursi.kamen + (nagrada.kamen || 0),
          zeljezo: state.resursi.zeljezo + (nagrada.zeljezo || 0),
        },
      };
    });
  },

  provjeriDostignuca: () => {
    const s = get();
    const novaDostignuca = { ...s.dostignucaDone };
    const nagrade: Nagrada[] = [];
    let zadnja: (typeof DOSTIGNUCA)[number] | null = null;
    const ulaz = snapshotDostignuca(s);
    for (const d of DOSTIGNUCA) {
      if (novaDostignuca[d.id]) continue;
      const n = napredakDostignuca(ulaz, d);
      if (n.trenutno < d.cilj) continue;
      novaDostignuca[d.id] = true;
      nagrade.push(d.nagrada);
      zadnja = d;
    }
    if (!zadnja) return;
    set((state) => ({
      dostignucaDone: novaDostignuca,
      novaZvijezda: zadnja!.id,
      poruka: `Zvijezda: ${zadnja!.naziv}.`,
      kronika: [
        {
          id: `k-z-${Date.now()}`,
          t: Date.now(),
          metaIme: zadnja!.naziv,
          pobjeda: true,
          stav: null,
          vrsta: "dostignuce" as const,
          recap: `Zvijezda: ${zadnja!.naziv}. ${zadnja!.opis}`,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    nagrade.forEach((n) => get().primiNagradu(n));
  },

  skloniZvijezdu: () => set({ novaZvijezda: null }),

  preuzmiDnevniBonus: () => {
    const s = get();
    if (s.preuzetoDanas || !s.dnevnaNagrada) return;
    playSfx("collect");
    get().primiNagradu(s.dnevnaNagrada.nagrada);
    saveJSON(SAVE_KEYS.daily, { streak: s.dnevniStreak, zadnjaDnevna: localDayKey() });
    set({
      preuzetoDanas: true,
      prikazDnevneNagrade: false,
      poruka: `DNEVNA NAGRADA DAN ${cycleDay(s.dnevniStreak)} PREUZETA!`,
    });
  },

  otvoriDnevnuNagradu: () => {
    if (get().preuzetoDanas) return;
    set({ prikazDnevneNagrade: true });
  },

  sakrijDnevnuNagradu: () => set({ prikazDnevneNagrade: false }),

  azurirajMisiju: (tip, kolicina = 1) => {
    if (tip === "spin") get().azurirajJutro("spin", kolicina);
    set((state) => ({
      misije: state.misije.map((m) => {
        if (m.tip === tip && !m.zavrseno && m.trenutno < m.cilj) {
          const trenutno = Math.min(m.cilj, m.trenutno + kolicina);
          return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
        }
        return m;
      }),
    }));
  },

  preuzmiNagraduMisije: (id, nagrada) => {
    playSfx("collect");
    set((state) => {
      const kauba = kaubaOd(state);
      const zauzeti = state.misije.filter((m) => m.id !== id).map((m) => m.tip);
      const stara = state.misije.find((m) => m.id === id);
      const nalozi = stara?.tip
        ? [stara.tip, ...state.zadnjiNalozi.filter((t) => t !== stara.tip)].slice(0, 8)
        : state.zadnjiNalozi;
      return {
        zadnjiNalozi: nalozi,
        misije: state.misije.map((m) =>
          m.id === id ? generirajMisiju(kauba.usko, zauzeti, state.ljudi, state.gradevine, nalozi) : m,
        ),
        ljudi: state.ljudi.map((p) => {
          return stara?.likId === p.id ? dodajXpLiku(p, 8) : p;
        }),
        poruka: stara?.likIme ? `${stara.likIme}: hvala. Nalog je gotov.` : "Nalog je gotov.",
      };
    });
    get().primiNagradu(nagrada);
  },

  nadogradiZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id] || 0;
    if (lv >= zgrada.maxLv) return;
    const uvjet = zgradaUvjet(zgrada.id, s.gradevine);
    if (uvjet) {
      set({ poruka: uvjet.toUpperCase() });
      return;
    }
    if (s.gradnje.some((g) => g.zgrada === zgrada.id)) {
      set({ poruka: "Već se diže." });
      return;
    }
    const maj = slobodanGraditelj(s.ljudi, s.segrti, s.gradnje);
    if (!maj) {
      const učenik = s.segrti.find((x) => !x.spreman);
      set({
        poruka: učenik
          ? `${učenik.ime} još uči kod Ive. Još ${Math.max(1, SEGRT_SKOLA - učenik.skola)} posla.`
          : "Nema tko da diže.",
      });
      return;
    }
    const c = zgrada.cijena(lv + 1);
    if (
      s.zlato < c.zlato ||
      s.resursi.drvo < (c.drvo || 0) ||
      s.resursi.kamen < (c.kamen || 0) ||
      s.resursi.zeljezo < (c.zeljezo || 0)
    ) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("build");
    const naKonju = tkoJaše(s.ljudi, s.gradevine, s.ostecenja, s.konjiDuznost).has(maj.id);
    const traje = vrijemeGradnjeMs(lv + 1, maj.razina, imaBuff(maj, "brzina"), naKonju);
    const recap = `${maj.ime} diže ${zgradaAkuzativ(zgrada.id)}.`;
    set((state) => ({
      zlato: state.zlato - c.zlato,
      resursi: {
        drvo: state.resursi.drvo - (c.drvo || 0),
        kamen: state.resursi.kamen - (c.kamen || 0),
        zeljezo: state.resursi.zeljezo - (c.zeljezo || 0),
      },
      gradnje: [
        ...state.gradnje,
        {
          zgrada: zgrada.id,
          ciljLv: lv + 1,
          start: nowMs(),
          kraj: nowMs() + traje,
          majstorId: maj.id,
          majstorIme: maj.ime,
        },
      ],
      poruka: recap,
    }));
  },

  zavrsiGradnju: () => {
    const s = get();
    const gotove = s.gradnje.filter((g) => nowMs() >= g.kraj);
    if (!gotove.length) return;
    const ivo = majstor(s.ljudi);
    playSfx("collect");
    vibrate(32);
    set((state) => {
      const gradevine = { ...state.gradevine };
      let ljudi = state.ljudi;
      let segrti = state.segrti;
      let poruka = state.poruka;
      const zapisi = [...state.kronika];
      for (const g of gotove) {
        gradevine[g.zgrada] = g.ciljLv;
        const tko = [...ljudi, ...segrti].find((p) => p.id === g.majstorId);
        const glagol = tko?.spol === "z" ? "podigla" : "podigao";
        const recap = tko
          ? `${tko.ime} je ${glagol} ${zgradaAkuzativ(g.zgrada)}.`
          : "Zgrada je gotova.";
        poruka = recap;
        ljudi = ljudi.map((p) => {
          let next = p.id === g.majstorId ? dodajXpLiku(p, 14 + g.ciljLv * 4) : p;
          if (g.zgrada === "ured" && p.posao === "Šerif") next = dodajXpLiku(next, 12);
          if (g.zgrada === "staja" && p.hub === "konji") next = dodajXpLiku(next, 12);
          if (g.zgrada === "ordinacija" && p.hub === "zdravlje") next = dodajXpLiku(next, 12);
          if (g.zgrada === "farma" && p.posao === "Farmer") next = dodajXpLiku(next, 10);
          return next;
        });
        segrti = segrti.map((p) => {
          if (p.id === g.majstorId) {
            const next = dodajXpLiku(p, 14 + g.ciljLv * 4);
            return { ...p, ...next, skola: p.skola, spreman: p.spreman };
          }
          if (!p.spreman && ivo && g.majstorId === ivo.id) {
            const skola = p.skola + 1;
            const spreman = skola >= SEGRT_SKOLA;
            if (spreman) poruka = `${p.ime} je gotov sa školom. Može sam.`;
            return {
              ...p,
              skola,
              spreman,
              rec: spreman ? "Ivo ga pustio na drugu bauštelu." : p.rec,
            };
          }
          return p;
        });
        zapisi.unshift({
          id: `k-${Date.now()}-${g.zgrada}`,
          t: Date.now(),
          metaIme: tko?.ime ?? g.majstorIme,
          pobjeda: true,
          stav: null,
          vrsta: "gradnja" as const,
          recap,
        });
      }
      let konjiBroj = state.konjiBroj;
      let konjiDuznost = state.konjiDuznost;
      const kap = konjaKap(gradevine);
      for (const g of gotove) {
        if (g.zgrada === "staja" || g.zgrada === "korali" || g.zgrada === "staza") {
          konjiBroj = Math.min(kap, konjiBroj + 1);
        }
      }
      konjiBroj = Math.min(kap, konjiBroj);
      konjiDuznost = normalizirajDuznost(konjiBroj, konjiDuznost);
      return {
        gradevine,
        gradnje: state.gradnje.filter((g) => nowMs() < g.kraj),
        ljudi,
        segrti,
        zamjenici: uskladiZamjenike(state.zamjenici, state.igracRazina, gradevine.ured || 0),
        poruka,
        kronika: zapisi.slice(0, MAX_KRONIKA),
        konjiBroj,
        konjiDuznost,
      };
    });
    for (const g of gotove) {
      get().dodajXp(6 + g.ciljLv * 3);
      get().azurirajMisiju("zgrada");
      get().azurirajMisiju(g.zgrada);
    }
    const ljudiN = Math.floor(get().stanovnici);
    set((state) => ({
      misije: state.misije.map((m) => {
        if (m.tip !== "ljudi" || m.zavrseno) return m;
        const trenutno = Math.min(m.cilj, ljudiN);
        return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
      }),
    }));
    get().azurirajKlanZadatak("zgrada");
    get().provjeriDostignuca();
    get().osvjeziProtok(gotove.map((g) => `z:${g.zgrada}>selo`));
  },

  posaljiKaravanu: (ciljUid, teret, put) => {
    const s = get();
    if (s.karavana) {
      set({ poruka: `${s.karavana.vozacIme} je već na putu.` });
      return;
    }
    const susjed = susjedPoUid(ciljUid);
    if (!susjed) {
      set({ poruka: "Nema te kaube." });
      return;
    }
    const kolicina = Math.max(0, Math.floor(teret.drvo) + Math.floor(teret.kamen) + Math.floor(teret.zeljezo));
    if (kolicina < 5) {
      set({ poruka: "Natovari barem 5." });
      return;
    }
    if (s.resursi.drvo < teret.drvo || s.resursi.kamen < teret.kamen || s.resursi.zeljezo < teret.zeljezo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    const vozacLik = vozar(
      s.ljudi.filter((p) => !s.gradnje.some((g) => g.majstorId === p.id)),
    );
    if (!vozacLik) {
      set({ poruka: "Nema tko da vozi." });
      return;
    }
    const putId: KaravanaPutId = put === "noc" || put === "rijeka" ? put : "staza";
    const traje = vrijemeKaravanaMs(
      kolicina,
      vozacLik.razina,
      susjed.uid,
      imaBuff(vozacLik, "brzina"),
      tkoJaše(s.ljudi, s.gradevine, s.ostecenja, s.konjiDuznost).has(vozacLik.id),
      putId,
    );
    playSfx("build");
    set({
      resursi: {
        drvo: s.resursi.drvo - teret.drvo,
        kamen: s.resursi.kamen - teret.kamen,
        zeljezo: s.resursi.zeljezo - teret.zeljezo,
      },
      karavana: {
        ciljUid: susjed.uid,
        ciljIme: susjed.kauba,
        start: nowMs(),
        kraj: nowMs() + traje,
        teret: {
          drvo: Math.floor(teret.drvo),
          kamen: Math.floor(teret.kamen),
          zeljezo: Math.floor(teret.zeljezo),
        },
        vozacId: vozacLik.id,
        vozacIme: vozacLik.ime,
        put: putId,
        cin: null,
        cinRijesen: false,
      },
      poruka: `${vozacLik.ime} ide u ${susjed.kauba}.`,
    });
  },

  zavrsiKaravanu: () => {
    const s = get();
    const k = s.karavana;
    if (!k) return;
    const t = tjedanSad();
    const sajam = t.vrsta === "sajam";
    const meta = t.vrsta === "pljacka" && t.susjed?.uid === k.ciljUid;
    const serifLik = serif(s.ljudi);
    const zastita = 0.28 / (1 + (s.gradevine.ured || 0) * 0.2 + (serifLik?.razina ?? 0) * 0.08);
    const ukradeno = meta && Math.random() < zastita;
    const isplata = ukradeno ? { zlato: 0, drvo: 0, kamen: 0, zeljezo: 0 } : karavanaIsplata(k.teret, sajam, k.ciljUid);
    playSfx(ukradeno ? "skull" : "collect");
    set((state) => ({
      karavana: null,
      zlato: state.zlato + isplata.zlato,
      resursi: {
        drvo: state.resursi.drvo + isplata.drvo,
        kamen: state.resursi.kamen + isplata.kamen,
        zeljezo: state.resursi.zeljezo + isplata.zeljezo,
      },
      ljudi: state.ljudi.map((p) => (p.id === k.vozacId ? dodajXpLiku(p, ukradeno ? 4 : 12) : p)),
      poruka: ukradeno
        ? `${k.vozacIme} se vratio prazan. ${k.ciljIme} je uzeo teret.`
        : `${k.vozacIme} se vratio iz ${k.ciljIme}. +${isplata.zlato} zlata${isplata.drvo || isplata.kamen || isplata.zeljezo ? " i roba" : ""}.`,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: k.vozacIme,
          pobjeda: !ukradeno,
          stav: null,
          vrsta: "selidba" as const,
          recap: ukradeno
            ? `${k.vozacIme} izgubio karavanu za ${k.ciljIme}.`
            : `${k.vozacIme} prodao teret u ${k.ciljIme}. +${isplata.zlato} zlata.`,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    if (!ukradeno && Math.random() < (sajam ? 0.06 : 0.03)) {
      get().uhvatiPotjernicu({ lucky: sajam, linije: 2 });
    }
    get().dodajXp(ukradeno ? 2 : 5);
  },

  dajLiku: (id) => {
    const s = get();
    const p =
      s.ljudi.find((l) => l.id === id) ??
      s.zamjenici.find((l) => l.id === id) ??
      s.segrti.find((l) => l.id === id);
    if (!p) return;
    const kauba = kaubaOd(s);
    const m = raspolozenjeKaube(kauba);
    const svi = s.ljudi.concat(s.segrti).concat(s.zamjenici);
    const gdje = gdjeJe(p, s.gradevine, s.gradnje, s.ostecenja, undefined, s.karavana, svi);
    if (gdje.mjesto === "put") {
      set({ poruka: `${p.ime} je na putu.` });
      return;
    }
    const govor = razgovor(p, m.id, gdje.mjesto === "zgrada", gdje.zgrada);
    if (!govor.dar || !mozeDati(govor.dar, s.zlato, s.resursi)) {
      set({ poruka: `${p.ime} čeka. Nemaš što dati.` });
      return;
    }
    const d = govor.dar;
    playSfx("collect");
    set((state) => ({
      zlato: state.zlato - (d.zlato || 0),
      resursi: {
        drvo: state.resursi.drvo - (d.drvo || 0),
        kamen: state.resursi.kamen - (d.kamen || 0),
        zeljezo: state.resursi.zeljezo - (d.zeljezo || 0),
      },
      ljudi: state.ljudi.map((l) => (l.id === id ? dodajXpLiku(l, 10) : l)),
      zamjenici: state.zamjenici.map((l) => (l.id === id ? { ...dodajXpLiku(l, 10), spreman: l.spreman } : l)),
      segrti: state.segrti.map((l) => (l.id === id ? { ...dodajXpLiku(l, 10), skola: l.skola, spreman: l.spreman } : l)),
      poruka: `${p.ime}: Hvala. Idem dalje.`,
    }));
    get().dodajXp(2);
  },

  rijesiDogadaj: (opcija) => {
    const s = get();
    const d = s.dogadaj;
    if (!d) return;
    const imaRed = !!(serif(s.ljudi) && (s.gradevine.ured || 0) > 0) || s.zamjenici.some((z) => z.spreman);
    const ishod = rijesiIshod(d, opcija, { imaRed, zlato: s.zlato, seed: Date.now() });
    if ((ishod.zlato ?? 0) < 0 && s.zlato < Math.abs(ishod.zlato ?? 0)) {
      set({ poruka: "Nema zlata za to." });
      return;
    }
    playSfx((ishod.zlato ?? 0) >= 0 ? "collect" : "skull");
    const dok = doktor(s.ljudi);
    let ljudi = s.ljudi;
    const liječiSe =
      (s.gradevine.ordinacija || 0) + (s.gradevine.travar || 0) + (s.gradevine.banja || 0) > 0;
    if (ishod.ozljeda && dok && liječiSe) {
      ljudi = ljudi.map((p) => (p.id === dok.id ? dodajXpLiku(p, 6) : p));
    }
    if (ishod.serifXp) {
      const tko = serif(ljudi);
      if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 8) : p));
    }
    const ostecenja = { ...s.ostecenja };
    if (ishod.ostecenje && (s.gradevine[ishod.ostecenje] || 0) > 0) {
      ostecenja[ishod.ostecenje] = true;
    }
    if (ishod.popravi) ostecenja[ishod.popravi] = false;
    const celijaBroj = Math.max(0, Math.min(3, s.celijaBroj + (ishod.celija ?? 0)));
    const kisaDo = ishod.kisa ? Math.max(s.kisaDo, Date.now()) + KISA_MS : s.kisaDo;
    const kvalitetaSela = Math.max(0, Math.min(100, s.kvalitetaSela + (ishod.kvaliteta ?? 0)));
    set({
      dogadaj: null,
      zadnjiDogadaj: nowMs(),
      serifCin: (s.gradevine.ured || 0) > 0 ? s.serifCin + 1 : s.serifCin,
      zlato: s.zlato + (ishod.zlato ?? 0),
      energija: dodajEnergiju(s.energija, ishod.energija ?? 0, s.razine.baterija || 0),
      stitovi: Math.min(izracunajMaxStitova(s.razine.oklop || 0), s.stitovi + (ishod.stitovi ?? 0)),
      ljudi,
      ostecenja,
      celijaBroj,
      kisaDo,
      kvalitetaSela,
      poruka: ishod.rec,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: d.naslov ?? (d.tip === "stranac" ? "Stranac" : d.tip === "dvoboj" ? "Dvoboj" : "Šerif"),
          pobjeda: (ishod.zlato ?? 0) >= 0 && !ishod.ozljeda,
          stav: null,
          vrsta: "dogadaj" as const,
          recap: ishod.rec,
        },
        ...s.kronika,
      ].slice(0, MAX_KRONIKA),
    });
    get().dodajXp(3);
  },

  lijeci: (odakle = "ordinacija") => {
    const s = get();
    const mjesto = odakle === "travar" || odakle === "banja" ? odakle : "ordinacija";
    const cijena = mjesto === "travar" ? 5 : mjesto === "banja" ? 6 : 8;
    const energija = mjesto === "ordinacija" ? 3 : 2;
    const sansa = mjesto === "ordinacija" ? 0.45 : mjesto === "travar" ? 0.28 : 0.22;
    if ((s.gradevine[mjesto] || 0) < 1 || s.ostecenja[mjesto]) {
      set({
        poruka: mjesto === "travar" ? "Nema travara." : mjesto === "banja" ? "Nema banje." : "Nema ordinacije.",
      });
      return;
    }
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    const tko =
      mjesto === "travar"
        ? s.ljudi.find((p) => p.posao === "Travarica") ?? doktor(s.ljudi)
        : doktor(s.ljudi);
    const glagol = tko?.spol === "m" ? "ubrao" : "ubrala";
    playSfx("collect");
    let ljudi = s.ljudi;
    const bolesni = [...ljudi].filter((p) => (p.mane ?? []).length > 0);
    if (bolesni.length && Math.random() < sansa) {
      const meta = bolesni[Math.floor(Math.random() * bolesni.length)]!;
      ljudi = ljudi.map((p) => (p.id === meta.id ? { ...p, mane: p.mane.slice(0, -1) } : p));
      if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 8) : p));
      const rec =
        mjesto === "travar"
          ? `${tko?.ime ?? "Zora"} je ${glagol} travu. ${meta.ime} diše lakše.`
          : mjesto === "banja"
            ? `Prašina sišla s ${meta.ime}.`
            : `${tko?.ime ?? "Doktor"} je skinuo tegobu s ${meta.ime}.`;
      set({
        zlato: s.zlato - cijena,
        energija: dodajEnergiju(s.energija, energija, s.razine.baterija || 0),
        ljudi,
        poruka: rec,
      });
      return;
    }
    if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 5) : p));
    const rec =
      mjesto === "travar"
        ? `${tko?.ime ?? "Zora"} je ${glagol} travu. Kauba diše lakše.`
        : mjesto === "banja"
          ? "Topla voda. Prašina sišla s kože."
          : `${tko?.ime ?? "Doktor"} je zavio ruku. Kauba diše lakše.`;
    set({
      zlato: s.zlato - cijena,
      energija: dodajEnergiju(s.energija, energija, s.razine.baterija || 0),
      ljudi,
      poruka: rec,
    });
  },

  bankaSpremi: (n) => {
    const s = get();
    const kap = bankaKap(s.gradevine.banka || 0);
    if (kap <= 0 || s.ostecenja.banka) {
      set({ poruka: "Nema banke." });
      return;
    }
    const iznos = Math.max(0, Math.min(Math.floor(n), Math.floor(s.zlato), kap - s.bankaZlato));
    if (iznos < 1) {
      set({ poruka: "Nema što spremiti." });
      return;
    }
    playSfx("collect");
    set({
      zlato: s.zlato - iznos,
      bankaZlato: s.bankaZlato + iznos,
      poruka: `U seifu ${s.bankaZlato + iznos} zlata.`,
    });
  },

  bankaUzmi: (n) => {
    const s = get();
    const iznos = Math.max(0, Math.min(Math.floor(n), s.bankaZlato));
    if (iznos < 1) {
      set({ poruka: "Seif je prazan." });
      return;
    }
    playSfx("collect");
    set({
      zlato: s.zlato + iznos,
      bankaZlato: s.bankaZlato - iznos,
      poruka: `Uzeo ${iznos} iz seifa.`,
    });
  },

  postaviKrupija: (id) => {
    const s = get();
    if (id && !s.ljudi.some((p) => p.id === id && mozeKrupije(p))) {
      set({ poruka: "On ne miješa faro." });
      return;
    }
    const tko = id ? s.ljudi.find((p) => p.id === id) : null;
    playSfx("button");
    set({
      faroKrupije: id,
      poruka: tko ? `${tko.ime} miješa faro.` : "Faro bez krupijea.",
    });
  },

  kupiKonja: (n = 1) => {
    const s = get();
    const kap = konjaKap(s.gradevine);
    const koliko = Math.max(1, Math.floor(n));
    if (s.ostecenja.staja) {
      set({ poruka: "Staja gori. Konj ne ulazi." });
      return;
    }
    if (kap < 1) {
      set({ poruka: "Prvo staju." });
      return;
    }
    if (s.konjiBroj >= kap) {
      set({ poruka: "Staja puna. Diži korale ili stazu." });
      return;
    }
    const moze = Math.min(koliko, kap - s.konjiBroj);
    const zl = KONJ_CIJENA_ZLATO * moze;
    const dr = KONJ_CIJENA_DRVO * moze;
    if (s.zlato < zl || s.resursi.drvo < dr) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("collect");
    const broj = s.konjiBroj + moze;
    const duznost = { ...s.konjiDuznost, jahanje: s.konjiDuznost.jahanje + moze };
    set({
      zlato: s.zlato - zl,
      resursi: { ...s.resursi, drvo: s.resursi.drvo - dr },
      konjiBroj: broj,
      konjiDuznost: normalizirajDuznost(broj, duznost),
      poruka: moze === 1 ? `Konj ušao. ${broj}/${kap} pod uzdom.` : `${moze} konja ušlo. ${broj}/${kap} pod uzdom.`,
    });
    get().provjeriDostignuca();
  },

  prodajKonja: () => {
    const s = get();
    if (s.konjiBroj < 1) {
      set({ poruka: "Nema konja." });
      return;
    }
    playSfx("collect");
    const broj = s.konjiBroj - 1;
    set({
      zlato: s.zlato + Math.floor(KONJ_CIJENA_ZLATO / 2),
      konjiBroj: broj,
      konjiDuznost: normalizirajDuznost(broj, s.konjiDuznost),
      poruka: broj < 1 ? "Staja prazna." : `Konj otišao. Ostalo ${broj}.`,
    });
  },

  pomakniKonja: (od, na) => {
    const s = get();
    if (od === na) return;
    if (s.konjiDuznost[od] < 1) return;
    playSfx("button");
    const next = { ...s.konjiDuznost, [od]: s.konjiDuznost[od] - 1, [na]: s.konjiDuznost[na] + 1 };
    set({
      konjiDuznost: normalizirajDuznost(s.konjiBroj, next),
      poruka: KONJ_DUZNOSTI.find((x) => x.id === na)?.poruka ?? "Konji",
    });
  },

  kupiSijeno: () => {
    const s = get();
    if (s.konjiBroj < 1) {
      set({ poruka: "Nema konja." });
      return;
    }
    if (s.zlato < SIJENO_ZLATO) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    playSfx("collect");
    const doKad = Math.max(s.sijenoDo, Date.now()) + SIJENO_MS;
    set({
      zlato: s.zlato - SIJENO_ZLATO,
      sijenoDo: doKad,
      poruka: "Sijeno u jaslama.",
    });
  },

  rijesiKaravanaCin: (opcija) => {
    const s = get();
    const k = s.karavana;
    if (!k?.cin) return;
    let zlato = 0;
    let kasni = 0;
    let rec = "Put ide dalje.";
    if (k.cin.id === "zasjeda") {
      if (opcija === "plati") {
        if (s.zlato < 8) {
          set({ poruka: "Nema 8g." });
          return;
        }
        zlato = -8;
        rec = "Baciše vreću. Put je čist.";
      } else if (opcija === "pucaj") {
        if (Math.random() < 0.45) rec = "Pucanj. Gusari bježe.";
        else {
          kasni = 8000;
          rec = "Pucanj. Točak puca. Sporije.";
        }
      } else if (Math.random() < 0.4) rec = "Konj prođe. Prašina u očima.";
      else {
        zlato = -6;
        rec = "Uhvatili. Uzeše 6g.";
      }
    } else if (k.cin.id === "most") {
      if (opcija === "obidji") {
        kasni = 10000;
        rec = "Obišli. Duže, suho.";
      } else if (Math.random() < 0.7) rec = "Most drži. Ide dalje.";
      else {
        kasni = 14000;
        rec = "Daska puca. Vuku kola.";
      }
    } else if (k.cin.id === "sajam") {
      if (opcija === "trguj") {
        if (s.zlato < 6) {
          set({ poruka: "Nema 6g." });
          return;
        }
        zlato = 4 + Math.floor(Math.random() * 8);
        rec = `Trgovac kima. +${zlato + 6}g.`;
      } else rec = "Mašu i idu. Sajam ostaje.";
    }
    if (zlato < 0 && s.zlato < Math.abs(zlato)) {
      set({ poruka: "Nema zlata." });
      return;
    }
    playSfx(zlato >= 0 ? "collect" : "button");
    set({
      zlato: s.zlato + zlato,
      karavana: {
        ...k,
        cin: null,
        cinRijesen: true,
        kraj: k.kraj + Math.max(0, kasni),
      },
      poruka: rec,
    });
  },

  preimenujLika: (id, ime) => {
    const novo = ime.replace(/\s+/g, " ").trim().slice(0, 14);
    if (novo.length < 2) {
      set({ poruka: "Ime je kratko." });
      return;
    }
    const s = get();
    const tko = s.ljudi.find((p) => p.id === id) ?? s.segrti.find((p) => p.id === id) ?? s.zamjenici.find((p) => p.id === id);
    if (!tko) return;
    playSfx("button");
    set({
      ljudi: s.ljudi.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      segrti: s.segrti.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      zamjenici: s.zamjenici.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      poruka: `${tko.ime} sad je ${novo}.`,
    });
  },

  dajCasu: (id) => {
    const s = get();
    if (s.zlato < 2) {
      set({ poruka: "Nema zlata za kocku." });
      return;
    }
    const tko = s.ljudi.find((p) => p.id === id) ?? s.segrti.find((p) => p.id === id) ?? s.zamjenici.find((p) => p.id === id);
    if (!tko) return;
    const kocka = 1 + Math.floor(Math.random() * 6);
    const dobit = kocka >= 5 ? 4 : kocka >= 3 ? 2 : 0;
    const rec =
      kocka >= 5
        ? `${tko.ime} baci ${kocka}. Tvoje. +4g.`
        : kocka >= 3
          ? `${tko.ime} baci ${kocka}. Stoji.`
          : `${tko.ime} baci ${kocka}. Prašina u oku.`;
    playSfx(dobit >= 4 ? "collect" : "button");
    set({
      zlato: s.zlato - 2 + dobit,
      ljudi: s.ljudi.map((p) => (p.id === id ? dodajXpLiku(p, 5) : p)),
      segrti: s.segrti.map((p) => (p.id === id ? { ...dodajXpLiku(p, 5), skola: p.skola, spreman: p.spreman } : p)),
      zamjenici: s.zamjenici.map((p) => (p.id === id ? { ...dodajXpLiku(p, 5), spreman: p.spreman } : p)),
      poruka: rec,
    });
    get().dodajXp(1);
  },

  strpajCeliju: () => {
    const s = get();
    if ((s.gradevine.ured || 0) < 1 || s.ostecenja.ured) {
      set({ poruka: "Nema ureda." });
      return;
    }
    if (s.celijaBroj >= 3) {
      set({ poruka: "Ćelija puna." });
      return;
    }
    playSfx("button");
    const n = s.celijaBroj + 1;
    set({
      celijaBroj: n,
      poruka: n === 1 ? "Jedan iza rešetaka." : `${n} iza rešetaka. Zakon diše.`,
    });
  },

  pustiCeliju: () => {
    const s = get();
    if (s.celijaBroj < 1) {
      set({ poruka: "Ćelija prazna." });
      return;
    }
    const kazna = s.celijaBroj * 8;
    playSfx("collect");
    set({
      zlato: s.zlato + kazna,
      celijaBroj: 0,
      poruka: `Pustili. Kazna +${kazna} zlata.`,
    });
  },

  kupiGovedo: (n = 1) => {
    const s = get();
    const kap = govedaKap(s.gradevine);
    const kolicina = Math.max(1, Math.floor(n));
    if (s.ostecenja.tor) {
      set({ poruka: "Tor gori. Krdo ne ulazi." });
      return;
    }
    if (kap < 1) {
      set({ poruka: "Prvo tor." });
      return;
    }
    if (s.govedaBroj >= kap) {
      set({ poruka: "Tor pun. Koža je tijesna." });
      return;
    }
    const uzmi = Math.min(kolicina, kap - s.govedaBroj);
    const zlato = GOVEDO_CIJENA_ZLATO * uzmi;
    const drvo = GOVEDO_CIJENA_DRVO * uzmi;
    if (s.zlato < zlato || s.resursi.drvo < drvo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("collect");
    const broj = s.govedaBroj + uzmi;
    const duznost = { ...s.govedaDuznost, pasa: s.govedaDuznost.pasa + uzmi };
    set({
      zlato: s.zlato - zlato,
      resursi: { ...s.resursi, drvo: s.resursi.drvo - drvo },
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, duznost),
      poruka: uzmi === 1 ? `Govedo ušlo. ${broj}/${kap} u toru.` : `${uzmi} grla ušlo. ${broj}/${kap} u toru.`,
    });
    get().azurirajMisiju("govedo", uzmi);
    get().azurirajKlanZadatak("govedo", uzmi);
  },

  prodajGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    playSfx("collect");
    const broj = s.govedaBroj - 1;
    set({
      zlato: s.zlato + 6,
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      poruka: broj < 1 ? "Tor prazan." : `Govedo otišlo. Ostalo ${broj}.`,
    });
  },

  pomakniGovedo: (od, na) => {
    const s = get();
    if (od === na || s.govedaDuznost[od] < 1) return;
    playSfx("button");
    const duznost = {
      ...s.govedaDuznost,
      [od]: s.govedaDuznost[od] - 1,
      [na]: s.govedaDuznost[na] + 1,
    };
    set({
      govedaDuznost: normalizirajGovedo(s.govedaBroj, duznost),
      poruka: GOVEDO_DUZNOSTI.find((x) => x.id === na)?.poruka ?? "Krdo",
    });
  },

  tjerajGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    if (s.konjiDuznost.jahanje < 1) {
      set({ poruka: "Bez konja krdo ne ide." });
      return;
    }
    const n = Math.min(Math.max(1, s.govedaDuznost.tjeranje || 1), s.govedaBroj);
    const plata = n * GOVEDO_TJERAJ;
    const broj = s.govedaBroj - n;
    playSfx("collect");
    const gazda = s.ljudi.find((p) => p.posao === "Gazda") ?? s.ljudi.find((p) => p.posao === "Referent" || p.posao === "Gonič");
    let ljudi = s.ljudi;
    if (gazda) ljudi = ljudi.map((p) => (p.id === gazda.id ? dodajXpLiku(p, 6) : p));
    set({
      zlato: s.zlato + plata,
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      ljudi,
      poruka: `${gazda?.ime ?? "Gazda"} otjerao ${n}. +${plata} zlata. Firma diše.`,
    });
    get().azurirajMisiju("zlato", plata);
  },

  koljiGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    const broj = s.govedaBroj - 1;
    const extra = (s.gradevine.mesnica || 0) > 0 && !s.ostecenja.mesnica ? GOVEDO_KLANJE_MESNICA : 0;
    const plata = GOVEDO_KLANJE + extra;
    playSfx("collect");
    const mesar = s.ljudi.find((p) => p.posao === "Mesarica") ?? s.ljudi.find((p) => p.posao === "Gazda");
    let ljudi = s.ljudi;
    if (mesar) ljudi = ljudi.map((p) => (p.id === mesar.id ? dodajXpLiku(p, 5) : p));
    set({
      zlato: s.zlato + plata,
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      ljudi,
      poruka: extra
        ? `Mesnica reže. +${plata} zlata. Kotao pun.`
        : `Klanje. +${plata} zlata. Bez mesnice meso je tanko.`,
    });
  },

  skupiKisu: () => {
    const s = get();
    if ((s.gradevine.cisterna || 0) < 1 || s.ostecenja.cisterna) {
      set({ poruka: "Nema cisterne." });
      return;
    }
    if (s.zlato < KISA_ZLATO) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    playSfx("collect");
    const tko = s.ljudi.find((p) => p.posao === "Cisternar") ?? s.ljudi.find((p) => p.hub === "voda");
    const doKad = Math.max(s.kisaDo, Date.now()) + KISA_MS;
    let ljudi = s.ljudi;
    if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 4) : p));
    const glagol = tko?.spol === "z" ? "skupila" : "skupio";
    set({
      zlato: s.zlato - KISA_ZLATO,
      kisaDo: doKad,
      ljudi,
      poruka: `${tko?.ime ?? "Karlo"} je ${glagol} kišu. Cisterna diše.`,
    });
    get().azurirajMisiju("kisa");
  },

  trgovinaKupi: (res) => {
    const s = get();
    const lv = s.gradevine.trgovina || 0;
    if (lv < 1 || s.ostecenja.trgovina) {
      set({ poruka: "Nema trgovine." });
      return;
    }
    const cijena = TRGOVINA_CIJENA;
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    const kolicina = TRGOVINA_BAZA + lv;
    playSfx("collect");
    set({
      zlato: s.zlato - cijena,
      resursi: { ...s.resursi, [res]: s.resursi[res] + kolicina },
      poruka: `Šime: +${kolicina} ${res}.`,
    });
  },

  uhvatiPotjernicu: (opts) => {
    const s = get();
    const p = baciPotjernicu(s.potjernice, opts);
    if (!p) return;
    const bilo = s.potjernice[p.id] ?? 0;
    const album = { ...s.potjernice, [p.id]: bilo + 1 };
    const noviSetovi = [...s.potjerniceSetovi];
    let extraZlato = 0;
    let extraGem = 0;
    let setRec = "";
    for (const set of SETOVI) {
      if (!noviSetovi.includes(set.id) && imaSet(album, set.id)) {
        noviSetovi.push(set.id);
        extraZlato += set.nagrada.zlato;
        extraGem += set.nagrada.dijamanti;
        setRec = ` ${set.naziv} skupljeni.`;
      }
    }
    const duplikat = bilo > 0;
    playSfx("collect");
    set({
      potjernice: album,
      potjerniceSetovi: noviSetovi,
      novaPotjernica: duplikat ? s.novaPotjernica : p.id,
      zlato: s.zlato + (duplikat ? 4 : 0) + extraZlato,
      dijamanti: s.dijamanti + extraGem,
      poruka: duplikat
        ? `Plakat već visi. +4 zlata.${setRec}`
        : `Šerif: plakat. ${p.ime}. Traži se.${setRec}`,
    });
    get().provjeriDostignuca();
  },

  skloniPotjernicu: () => set({ novaPotjernica: null }),

  osvjeziTjedan: () => {
    const sad = tjedanKljuc();
    const s = get();
    if (s.tjedanKljuc === sad) return;
    set({
      tjedanKljuc: sad,
      tjedanCeker: false,
      tjedanPohod: false,
      poruka: tjedanSad().naziv,
    });
  },

  osvjeziJutro: () => {
    const dan = localDayKey();
    const s = get();
    if (s.jutroDan === dan && s.jutro.length === 3) return;
    set({
      jutroDan: dan,
      jutro: napraviJutarnji(dan),
      jutroList: true,
    });
  },

  azurirajJutro: (tip, kolicina = 1) => {
    const s = get();
    if (!s.jutro.some((p) => p.tip === tip && !p.uzeto && p.trenutno < p.cilj)) return;
    set((state) => ({
      jutro: state.jutro.map((p) => {
        if (p.tip !== tip || p.uzeto || p.trenutno >= p.cilj) return p;
        const trenutno = Math.min(p.cilj, p.trenutno + kolicina);
        return { ...p, trenutno };
      }),
      poruka: (() => {
        const p = state.jutro.find((x) => x.tip === tip && !x.uzeto);
        if (!p) return state.poruka;
        const next = Math.min(p.cilj, p.trenutno + kolicina);
        return next >= p.cilj ? `${p.likIme}: to je to.` : state.poruka;
      })(),
    }));
  },

  dajIvuDrvo: () => {
    const s = get();
    const p = s.jutro.find((x) => x.id === "ivo");
    if (!p || p.uzeto || p.trenutno >= p.cilj) return;
    if (s.resursi.drvo < p.cilj) {
      set({ poruka: `${p.likIme}: treba mi još drva.` });
      return;
    }
    playSfx("build");
    set((state) => ({
      resursi: { ...state.resursi, drvo: state.resursi.drvo - p.cilj },
      jutro: state.jutro.map((x) => (x.id === "ivo" ? { ...x, trenutno: x.cilj } : x)),
      poruka: "Ivo: ovo sjeda. Hvala.",
    }));
  },

  posjetiKaubu: () => get().azurirajJutro("selo"),

  uzmiJutarnju: (id) => {
    const s = get();
    const p = s.jutro.find((x) => x.id === id);
    if (!p || p.uzeto || !jutroGotovo(p)) return;
    playSfx("collect");
    set((state) => ({
      jutro: state.jutro.map((x) => (x.id === id ? { ...x, uzeto: true } : x)),
      ljudi: state.ljudi.map((l) => (l.id === p.likId ? dodajXpLiku(l, 6) : l)),
      poruka: `${p.likIme}: hvala. Idem dalje.`,
    }));
    get().primiNagradu(p.nagrada);
    get().dodajXp(4);
    const after = get().jutro;
    if (jutroSveUzeto(after)) {
      get().primiNagradu({ zlato: 12 });
      // Keep sheet open so completion shows “Dođi sutra” + midnight countdown.
      set({
        poruka: `Jutro je gotovo. Kauba je mirna. ${recDodjiSutra()}.`,
        jutroList: true,
      });
    }
  },

  otvoriJutro: () => set({ jutroList: true }),
  skloniJutro: () => set({ jutroList: false }),

  uzmiSajamCeker: () => {
    get().osvjeziTjedan();
    const s = get();
    const t = tjedanSad();
    if (t.vrsta !== "sajam" || s.tjedanCeker) {
      set({ poruka: s.tjedanCeker ? "Ceker je već uzet." : "Sajam nije ovaj tjedan." });
      return;
    }
    playSfx("collect");
    set({
      tjedanCeker: true,
      energija: capEnergija(s.energija + 6, s.razine.baterija || 0),
      zlato: s.zlato + 8,
      resursi: { ...s.resursi, drvo: s.resursi.drvo + 4 },
      poruka: "Sajamski ceker: +6 vrtnji · +8 zlata · +4 drva",
    });
  },

  popraviZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id] || 0;
    if (lv <= 0) return;
    const c = popravakCijena(lv);
    if (s.zlato < c.zlato || s.resursi.drvo < c.drvo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("build");
    set((state) => ({
      zlato: state.zlato - c.zlato,
      resursi: { ...state.resursi, drvo: state.resursi.drvo - c.drvo },
      ostecenja: { ...state.ostecenja, [zgrada.id]: false },
      poruka: zgradaPopravakRec(zgrada.id, zgrada.naziv),
    }));
    get().osvjeziProtok([`z:${zgrada.id}>selo`]);
  },

  izvrsiPrestige: () => {
    const s = get();
    if (!seloNaMaxu(s.gradevine)) {
      set({ poruka: "Selo još nije puno." });
      return;
    }
    const noviPrestige = s.prestigeRazina + 1;
    playSfx("jackpot");
    set({
      prestigeRazina: noviPrestige,
      krunjenja: s.krunjenja + 1,
      igracRazina: 1,
      xp: 0,
      gradevine: {
        ...PRAZNE_GRADEVINE,
        pilana: START.pilana,
        kuca: Math.min(s.gradevine.kuca || 0, 2),
      },
      ostecenja: { ...PRAZNA_OSTECENJA },
      resursi: { drvo: START.drvo, kamen: START.kamen, zeljezo: START.zeljezo },
      zlato: START.zlato,
      energija: izracunajMaxEnergiju(s.razine.baterija || 0),
      stanovnici: START.stanovnici,
      ljudi: pocetniLjudi(),
      segrti: s.segrti,
      zamjenici: [],
      dogadaj: null,
      zadnjiDogadaj: 0,
      bankaZlato: 0,
      faroKrupije: null,
      serifCin: 0,
      celijaBroj: 0,
      gradnje: [],
      karavana: null,
      konjiBroj: 0,
      konjiDuznost: praznaDuznost(),
      sijenoDo: 0,
      kisaDo: 0,
      govedaBroj: 0,
      govedaDuznost: praznaGovedoDuznost(),
      knjigaSkup: 0,
      besplatneVrtnje: 0,
      besplatneExpand: null,
      besplatneUlog: 1,
      zadnjiNalozi: [],
      winStreak: 0,
      luckySpinCounter: LUCKY_SPIN_INTERVAL,
      poruka: `KRUNIDBA! +1 krunjenje. Množitelj ×${izracunajPrestigeMnozitelj(noviPrestige).toFixed(2)}`,
    });
    get().provjeriDostignuca();
    get().osvjeziProtok();
  },

  kupiAlat: (alat) => {
    const s = get();
    const id = alat.id as AlatId;
    const lv = alatLv(id, s.razine[alat.id] || 0);
    if (lv >= ALAT_MAX[id]) {
      set({ poruka: "To je to." });
      return;
    }
    const zl = alatCijena(alat.cZlato, lv);
    const ka = alatCijena(alat.cKamen, lv);
    const ze = alatCijena(alat.cZeljezo, lv);
    if (s.krunjenja < 1) {
      set({ poruka: "Treba krunjenje." });
      return;
    }
    if (
      s.zlato < zl ||
      s.resursi.kamen < ka ||
      s.resursi.zeljezo < ze
    ) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    const noviLv = alatLv(id, lv + 1);
    const maxStitova = izracunajMaxStitova(noviLv);
    playSfx("collect");
    set((state) => ({
      krunjenja: Math.max(0, state.krunjenja - 1),
      zlato: state.zlato - zl,
      resursi: {
        ...state.resursi,
        kamen: state.resursi.kamen - ka,
        zeljezo: state.resursi.zeljezo - ze,
      },
      razine: capRazine({ ...state.razine, [alat.id]: noviLv }),
      ...(alat.id === "oklop" ? { stitovi: maxStitova } : {}),
      poruka: "Alat diže.",
    }));
    get().azurirajMisiju("oprema");
    get().azurirajKlanZadatak("oprema");
    get().osvjeziProtok(alat.id === "oklop" ? ["oklop>selo"] : undefined);
  },

  trgovina: (akcija, resurs, iznos) => {
    const s = get();
    const stavka = s.tecaj[resurs] ?? BAZA_TECAJ[resurs];
    const jeSajam = tjedanSad().vrsta === "sajam";
    const cijenaPoKomadu = sajamCijena(akcija, stavka[akcija], jeSajam);
    const ukupnaCijena = cijenaPoKomadu * iznos;

    if (akcija === "kupi") {
      if (s.zlato < ukupnaCijena) {
        set({ poruka: "NEDOVOLJNO ZLATA" });
        return false;
      }
      playSfx("collect");
      set((state) => {
        if (resurs === "dijamant") {
          return {
            zlato: state.zlato - ukupnaCijena,
            dijamanti: state.dijamanti + iznos,
            poruka: `KUPLJENO ${iznos} DIJAMANT`,
          };
        }
        return {
          zlato: state.zlato - ukupnaCijena,
          resursi: {
            ...state.resursi,
            [resurs]: state.resursi[resurs] + iznos,
          },
          poruka: `KUPLJENO ${iznos} ${resurs.toUpperCase()}`,
        };
      });
      return true;
    }
    const trenutnaKolicina = resurs === "dijamant" ? s.dijamanti : s.resursi[resurs];
    if (trenutnaKolicina < iznos) {
      set({ poruka: "NEDOVOLJNO RESURSA" });
      return false;
    }
    playSfx("collect");
    set((state) => {
      if (resurs === "dijamant") {
        return {
          zlato: state.zlato + ukupnaCijena,
          dijamanti: state.dijamanti - iznos,
          poruka: `PRODANO ZA ${ukupnaCijena} ZLATA`,
        };
      }
      return {
        zlato: state.zlato + ukupnaCijena,
        resursi: {
          ...state.resursi,
          [resurs]: state.resursi[resurs] - iznos,
        },
        poruka: `PRODANO ZA ${ukupnaCijena} ZLATA`,
      };
    });
    get().azurirajMisiju("zlato", ukupnaCijena);
    return true;
  },

  kupiSkin: (skin) => {
    const s = get();
    const ima = s.skinovi.includes(skin.id);
    if (s.aktivniSkin === skin.id) return;
    if (!ima && skin.cijenaDijamanti > 0 && s.dijamanti < skin.cijenaDijamanti) {
      set({ poruka: "NEDOVOLJNO DIJAMANATA" });
      return;
    }
    playSfx("collect");
    set({
      dijamanti: ima || skin.cijenaDijamanti === 0 ? s.dijamanti : s.dijamanti - skin.cijenaDijamanti,
      aktivniSkin: skin.id,
      skinovi: ima ? s.skinovi : [...s.skinovi, skin.id],
      poruka: ima ? `IZGLED "${skin.naziv.toUpperCase()}"` : `NOVI IZGLED "${skin.naziv.toUpperCase()}"`,
    });
  },

  osnujiKlan: (naziv) => {
    const trimmed = naziv.trim();
    if (trimmed.length < 2) return;
    set({
      klan: {
        naziv: trimmed,
        razina: 1,
        xp: 0,
        zadaci: generirajKlanZadatke(),
        zadnjiRefresh: new Date().toISOString(),
      },
      poruka: `KLAN "${trimmed.toUpperCase()}" OSNOVAN!`,
    });
  },

  doniraiUKlan: (iznosZlato) => {
    const s = get();
    if (!s.klan.naziv) return;
    if (s.zlato < iznosZlato) {
      set({ poruka: "NEDOVOLJNO ZLATA ZA DONACIJU" });
      return;
    }
    const xpGain = Math.floor(iznosZlato / 10);
    const noviXp = s.klan.xp + xpGain;
    const xpZaRazinu = s.klan.razina * 1000;
    const novaRazina = noviXp >= xpZaRazinu ? s.klan.razina + 1 : s.klan.razina;
    const noviZadaci = s.klan.zadaci
      .map((z) =>
        z.tip === "donacija" && !z.zavrseno
          ? { ...z, trenutno: Math.min(z.cilj, z.trenutno + iznosZlato) }
          : z,
      )
      .map((z) => (!z.zavrseno && z.trenutno >= z.cilj ? { ...z, zavrseno: true } : z));
    playSfx("collect");
    set((state) => ({
      zlato: state.zlato - iznosZlato,
      klan: {
        ...state.klan,
        xp: noviXp >= xpZaRazinu ? 0 : noviXp,
        razina: novaRazina,
        zadaci: noviZadaci,
      },
      poruka: `DONIRANO ${iznosZlato} ZLATA KLANU (+${xpGain} XP)`,
    }));
    get().azurirajMisiju("donacija", iznosZlato);
  },

  azurirajKlanZadatak: (tip, kolicina = 1) => {
    const s = get();
    if (!s.klan.naziv) return;
    const noviZadaci = s.klan.zadaci.map((z) => {
      if (z.tip === tip && !z.zavrseno) {
        const novoTrenutno = Math.min(z.cilj, z.trenutno + kolicina);
        return { ...z, trenutno: novoTrenutno, zavrseno: novoTrenutno >= z.cilj };
      }
      return z;
    });
    set((state) => ({ klan: { ...state.klan, zadaci: noviZadaci } }));
  },

  preuzmiKlanNagradu: (zadatakId) => {
    const s = get();
    const zadatak = s.klan.zadaci.find((z) => z.id === zadatakId);
    if (!zadatak || !zadatak.zavrseno || zadatak.preuzeto) return;
    const { dijamanti = 0, zlato = 0, energija = 0, drvo = 0, kamen = 0, zeljezo = 0 } =
      zadatak.nagrada;
    const noviZadaci = s.klan.zadaci.map((z) =>
      z.id === zadatakId ? { ...z, preuzeto: true } : z,
    );
    const xpGain = 200;
    const noviXp = s.klan.xp + xpGain;
    const xpZaRazinu = s.klan.razina * 1000;
    const novaRazina = noviXp >= xpZaRazinu ? s.klan.razina + 1 : s.klan.razina;
    playSfx("collect");
    set((state) => ({
      dijamanti: state.dijamanti + dijamanti,
      zlato: state.zlato + zlato,
      energija: state.energija + energija,
      resursi: {
        drvo: state.resursi.drvo + drvo,
        kamen: state.resursi.kamen + kamen,
        zeljezo: state.resursi.zeljezo + zeljezo,
      },
      klan: {
        ...state.klan,
        xp: noviXp >= xpZaRazinu ? 0 : noviXp,
        razina: novaRazina,
        zadaci: noviZadaci,
      },
      poruka: "KLANSKI ZADATAK PREUZET!",
    }));
  },

  refreshKlanZadatke: () => {
    const s = get();
    if (!s.klan.naziv) return;
    const zadnjiRefresh = s.klan.zadnjiRefresh ? new Date(s.klan.zadnjiRefresh) : null;
    const tjedno = 7 * 24 * 60 * 60 * 1000;
    if (zadnjiRefresh && Date.now() - zadnjiRefresh.getTime() < tjedno) return;
    set((state) => ({
      klan: {
        ...state.klan,
        zadaci: generirajKlanZadatke(),
        zadnjiRefresh: new Date().toISOString(),
      },
    }));
  },

  postaviUid: (uid) => set({ uid }),
  postaviIme: (imeIgraca) => set({ imeIgraca }),

  primiResurse: (ukradeno) => {
    set((state) => ({
      zlato: state.zlato + Math.max(0, Math.floor(ukradeno.zlato ?? 0)),
      resursi: {
        drvo: state.resursi.drvo + (ukradeno.drvo ?? 0),
        kamen: state.resursi.kamen + (ukradeno.kamen ?? 0),
        zeljezo: state.resursi.zeljezo + (ukradeno.zeljezo ?? 0),
      },
      poruka: `PLJAČKA: +${Math.floor(ukradeno.zlato ?? 0)} zlata · +${Math.floor(ukradeno.drvo ?? 0)} drvo · +${Math.floor(ukradeno.kamen ?? 0)} kamen · +${Math.floor(ukradeno.zeljezo ?? 0)} željezo`,
    }));
    get().osvjeziProtok(
      [
        ukradeno.drvo ? "z:pilana>selo" : "",
        ukradeno.kamen ? "z:kamenolom>selo" : "",
        ukradeno.zeljezo ? "z:rudnik>selo" : "",
      ].filter(Boolean),
    );
  },

  zapisiDebrief: (zapis) => {
    const t = tjedanSad();
    const prije = get().tjedanPohod;
    const meta = (zapis.metaIme ?? "").toLowerCase();
    const metaTjedna =
      t.vrsta === "pljacka" &&
      zapis.pobjeda &&
      !!t.susjed &&
      (meta.includes(t.susjed.kauba.toLowerCase()) || meta.includes(t.susjed.serif.toLowerCase()));
    const bonus = metaTjedna && !prije;
    set((state) => ({
      stavSela: zapis.stav ?? state.stavSela,
      tjedanPohod: metaTjedna ? true : state.tjedanPohod,
      zlato: state.zlato + (bonus ? 24 : 0),
      dijamanti: state.dijamanti + (bonus ? 1 : 0),
      poruka: bonus ? `Pljačka tjedna. +24 zlata · +1 dijamant.` : state.poruka,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: zapis.metaIme,
          pobjeda: zapis.pobjeda,
          stav: zapis.stav,
          recap: zapis.recap,
          vrsta: zapis.vrsta,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    get().osvjeziProtok([`m:${zapis.metaIme}>selo`, "stav>selo"]);
    get().provjeriDostignuca();
  },

  osvjeziProtok: (pulsIds) => {
    const s = get();
    const kv = kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s)));
    set({
      kvalitetaSela: kv,
      protokPuls:
        pulsIds && pulsIds.length > 0 ? { ids: pulsIds, t: Date.now() } : s.protokPuls,
    });
  },

  testAlat: (sto) => {
    const s = get();
    playSfx("collect");
    if (sto === "zlato") {
      set({ zlato: s.zlato + 5000, poruka: "TEST +5000 ZLATA" });
      return;
    }
    if (sto === "energija") {
      const max = izracunajMaxEnergiju(s.razine.baterija || 0);
      set({ energija: max, poruka: "TEST ENERGIJA PUNA" });
      return;
    }
    if (sto === "dijamanti") {
      set({ dijamanti: s.dijamanti + 50, poruka: "TEST +50 DIJAMANT" });
      return;
    }
    if (sto === "resursi") {
      set({
        resursi: {
          drvo: s.resursi.drvo + 200,
          kamen: s.resursi.kamen + 200,
          zeljezo: s.resursi.zeljezo + 100,
        },
        poruka: "TEST +RESURSI",
      });
      return;
    }
    if (sto === "stitovi") {
      const max = izracunajMaxStitova(s.razine.oklop || 0);
      set({ stitovi: max, poruka: "TEST ŠTITOVI PUNI" });
      return;
    }
    set({
      ostecenja: { ...PRAZNA_OSTECENJA },
      poruka: "TEST ZGRADE POPRAVLJENE",
    });
  },

  autoTest: () => {
    const prije = get();
    get().testAlat("zlato");
    get().testAlat("energija");
    get().testAlat("dijamanti");
    get().testAlat("resursi");
    get().testAlat("stitovi");
    get().testAlat("popravi");
    const poslije = get();
    const maxE = izracunajMaxEnergiju(poslije.razine.baterija || 0);
    const maxS = izracunajMaxStitova(poslije.razine.oklop || 0);
    const checks = [
      poslije.zlato >= prije.zlato + 5000,
      poslije.energija === maxE,
      poslije.dijamanti >= prije.dijamanti + 50,
      poslije.resursi.drvo >= prije.resursi.drvo + 200,
      poslije.resursi.kamen >= prije.resursi.kamen + 200,
      poslije.resursi.zeljezo >= prije.resursi.zeljezo + 100,
      poslije.stitovi === maxS,
      !poslije.ostecenja.pilana && !poslije.ostecenja.kamenolom && !poslije.ostecenja.rudnik,
    ];
    const ok = checks.filter(Boolean).length;
    set({ poruka: ok === checks.length ? `AUTO-TEST ${ok}/${checks.length} OK` : `AUTO-TEST ${ok}/${checks.length}` });
    return { ok, ukupno: checks.length };
  },
}));

let persistBound = false;

export function startLocalPersist() {
  if (persistBound || typeof window === "undefined") return;
  persistBound = true;
  let saveT: number | null = null;
  let achT: number | null = null;
  useGameStore.subscribe((s, prev) => {
    if (s.ucitavam) return;
    if (
      s.zlato === prev.zlato &&
      s.energija === prev.energija &&
      s.dijamanti === prev.dijamanti &&
      s.resursi === prev.resursi &&
      s.gradevine === prev.gradevine &&
      s.ostecenja === prev.ostecenja &&
      s.razine === prev.razine &&
      s.stitovi === prev.stitovi &&
      s.xp === prev.xp &&
      s.igracRazina === prev.igracRazina &&
      s.aktivniSkin === prev.aktivniSkin &&
      s.skinovi === prev.skinovi &&
      s.klan === prev.klan &&
      s.misije === prev.misije &&
      s.imeIgraca === prev.imeIgraca &&
      s.ukupnoVrtnji === prev.ukupnoVrtnji &&
      s.tecaj === prev.tecaj &&
      s.trend === prev.trend &&
      s.luckySpinCounter === prev.luckySpinCounter &&
      s.prestigeRazina === prev.prestigeRazina &&
      s.krunjenja === prev.krunjenja &&
      s.dnevniStreak === prev.dnevniStreak &&
      s.stanovnici === prev.stanovnici &&
      s.ljudi === prev.ljudi &&
      s.gradnje === prev.gradnje &&
      s.segrti === prev.segrti &&
      s.karavana === prev.karavana &&
      s.potjernice === prev.potjernice &&
      s.potjerniceSetovi === prev.potjerniceSetovi &&
      s.tjedanKljuc === prev.tjedanKljuc &&
      s.tjedanCeker === prev.tjedanCeker &&
      s.tjedanPohod === prev.tjedanPohod &&
      s.jutro === prev.jutro &&
      s.jutroDan === prev.jutroDan &&
      s.kronika === prev.kronika &&
      s.zamjenici === prev.zamjenici &&
      s.dogadaj === prev.dogadaj &&
      s.zadnjiDogadaj === prev.zadnjiDogadaj &&
      s.bankaZlato === prev.bankaZlato &&
      s.faroKrupije === prev.faroKrupije &&
      s.kisaDo === prev.kisaDo &&
      s.govedaBroj === prev.govedaBroj &&
      s.govedaDuznost === prev.govedaDuznost &&
      s.knjigaSkup === prev.knjigaSkup &&
      s.besplatneVrtnje === prev.besplatneVrtnje &&
      s.serifCin === prev.serifCin &&
      s.celijaBroj === prev.celijaBroj &&
      s.zadnjiNalozi === prev.zadnjiNalozi
    ) {
      return;
    }
    if (saveT) window.clearTimeout(saveT);
    saveT = window.setTimeout(() => {
      useGameStore.getState().spremi();
    }, 500);
    if (
      s.dostignucaDone !== prev.dostignucaDone ||
      s.ukupnoVrtnji !== prev.ukupnoVrtnji ||
      s.ukupnoZlata !== prev.ukupnoZlata
    ) {
      if (achT) window.clearTimeout(achT);
      achT = window.setTimeout(() => {
        useGameStore.getState().spremiDostignuca();
      }, 400);
    }
  });
  const flush = () => {
    if (useGameStore.getState().ucitavam) return;
    useGameStore.getState().spremi();
    useGameStore.getState().spremiDostignuca();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}
