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
  dodajEnergiju,
  popravakCijena,
  cijenaZgrade,
  cijenaUzKrunu,
  skalaCijene,
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
  recDodjiZoru,
  zoraDanKey,
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
  Dobitak,
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
  recPremjesti,
  type Stanovnik,
  type Segrt,
  type Zamjenik,
  type LikHub,
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
import { alatCijena, alatLv, ALAT_MAX, parsirajKrunjenja, type AlatId, START, LEVEL_UP_GEMS, SHIELD_ROLL_P, TRGOVINA_CIJENA, TRGOVINA_BAZA, BUNAR_ENERGIJA, MLIN_ENERGIJA, KONJ_CIJENA_ZLATO, KONJ_CIJENA_DRVO, SIJENO_ZLATO, SIJENO_MS, GOVEDO_CIJENA_ZLATO, GOVEDO_CIJENA_DRVO, GOVEDO_TJERAJ, GOVEDO_KLANJE, GOVEDO_KLANJE_MESNICA, KISA_ZLATO, KISA_MS, TRAVA_MS } from "@/lib/game/tuning";
import { susjedPoUid, vrijemeKaravanaMs, karavanaIsplata, izaberiKaravanaCin } from "@/lib/game/susjedi";
import { izgradiMrezu, kvSelaIzMreze, type MrezaUlaz } from "@/lib/game/mreza";
import { jeExpandZnak, KNJIGA_SKUP_CILJ } from "@/lib/game/knjiga";
export const nowMs = () => Date.now();
/** Dijeljeno stanje sata — moduli ne smiju pisati tuđe let veze. */
export const tickClock = { r: 0, e: 0, dan: "" };

export const PRAZNI_KLAN: Klan = {
  naziv: null,
  razina: 0,
  xp: 0,
  zadaci: [],
  zadnjiRefresh: null,
};
export type Dnevna = { dan: number; nagrada: Nagrada; streak: number };
export type Tecaj = Record<TrznicaId, TecajStavka>;
export type Trend = Record<TrznicaId, number>;

export const pocetnoStanje = {
  ucitavam: true,
  uid: null as string | null,
  imeIgraca: "Kauba",
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
  dnevnaPotvrda: false,
  dnevniDan: "",
  dnevniSat: 0,
  dnevniSatLokal: 0,
  dnevnaNagrada: null as Dnevna | null,
  tecaj: { ...BAZA_TECAJ } as Tecaj,
  trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0 } as Trend,
  luckySpinCounter: LUCKY_SPIN_INTERVAL,
  winStreak: 0,
  winStreakDo: 0,
  poruka: "SPREMAN",
  levelUpData: null as { razina: number; skok?: number } | null,
  aktivniSkin: "default",
  skinovi: ["default"],
  klan: { ...PRAZNI_KLAN } as Klan,
  zadnjiResursTick: nowMs(),
  zadnjaEnergijaTick: nowMs(),
  zadnjiMetakTick: nowMs(),
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
  jutroList: false,
  zamjenici: [] as Zamjenik[],
  dogadaj: null as KaubaDogadaj | null,
  zadnjiDogadaj: 0,
  bankaZlato: 0,
  faroKrupije: null as string | null,
  konjiBroj: 0,
  konjiDuznost: praznaDuznost(),
  sijenoDo: 0,
  potkove: 0,
  potkoveDo: 0,
  kisaDo: 0,
  travaDo: 0,
  govedaBroj: 0,
  govedaDuznost: praznaGovedoDuznost(),
  knjigaSkup: 0,
  besplatneVrtnje: 0,
  besplatneExpand: null as SimbolId | null,
  besplatneUlog: 1,
  serifCin: 0,
  celijaBroj: 0,
  zadnjiNalozi: [] as string[],
  metci: 6,
  metakRed: 0,
  metakBuffNa: -1,
  metakVreca: [] as Array<"zlato" | "energija" | "stit" | "sreca" | "drvo" | "zeljezo">,
  metakDogadaj: null,
  aiDogadaji: true,
  aiPosljednji: [] as { tip: string; naziv: string }[],
};

export function mrezaUlaz(s: {
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

export type GameBlob = {
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
  winStreakDo?: number;
  aktivniSkin?: string;
  skinovi?: string[];
  klan?: Klan;
  imeIgraca?: string;
  zadnjiResursTick?: number;
  zadnjaEnergijaTick?: number;
  zadnjiMetakTick?: number;
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
  potkove?: number;
  potkoveDo?: number;
  kisaDo?: number;
  travaDo?: number;
  govedaBroj?: number;
  govedaDuznost?: Partial<GovedoDuznost>;
  knjigaSkup?: number;
  besplatneVrtnje?: number;
  besplatneExpand?: string | null;
  besplatneUlog?: number;
  serifCin?: number;
  celijaBroj?: number;
  metci?: number;
  metakRed?: number;
  metakBuffNa?: number;
  metakVreca?: string[];
  aiDogadaji?: boolean;
  aiPosljednji?: { tip: string; naziv: string }[];
  savedAt?: number;
  dobitakNaCekanju?: Dobitak | null;
  gambleCount?: number;
  slotSimboli?: SimbolId[];
};

export function spojSkinove(aktivni: string, spremljeni?: string[]) {
  const set = new Set<string>(["default"]);
  for (const id of spremljeni ?? []) if (id) set.add(id);
  if (aktivni) set.add(aktivni);
  return [...set];
}

export function parsirajGradnju(raw: unknown): Gradnja | null {
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

export function parsirajGradnje(raw: unknown, stara?: unknown): Gradnja[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => parsirajGradnju(x)).filter((g): g is Gradnja => !!g);
  }
  const one = parsirajGradnju(stara ?? raw);
  return one ? [one] : [];
}

export function parsirajSegrte(raw: unknown): Segrt[] {
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

export function parsirajZamjenike(raw: unknown): Zamjenik[] {
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

export function parsirajDogadaj(raw: unknown): KaubaDogadaj | null {
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

export function parsirajKaravanu(raw: unknown): Karavana | null {
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

export function parsirajKaravanaCin(raw: unknown): Karavana["cin"] {
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

export function capRazine(r: Razine): Razine {
  return {
    sreca: alatLv("sreca", r.sreca),
    pojacalo: alatLv("pojacalo", r.pojacalo),
    baterija: alatLv("baterija", r.baterija),
    oklop: alatLv("oklop", r.oklop),
    wildBoost: alatLv("wildBoost", r.wildBoost),
  };
}

export function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Konačan broj, nikad ispod nule. Inače fallback (također ≥ 0). */
export function neneg(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  const fb = Number.isFinite(fallback) ? Math.max(0, fallback) : 0;
  if (!Number.isFinite(n) || n < 0) return fb;
  return n;
}

export function resursiNeneg(raw: Partial<Resursi> | undefined, fallback: Resursi): Resursi {
  return {
    drvo: neneg(raw?.drvo, fallback.drvo),
    kamen: neneg(raw?.kamen, fallback.kamen),
    zeljezo: neneg(raw?.zeljezo, fallback.zeljezo),
  };
}

export function energijaIzSave(v: unknown, baterija: number, fallback: number) {
  void baterija;
  return neneg(v, fallback);
}

const SIMBOLI_OK = new Set<SimbolId>(["skull", "wood", "stone", "iron", "gold", "energy", "gem", "shield", "wild", "knjiga"]);

export function parsirajSimbole(raw: unknown): SimbolId[] | null {
  if (!Array.isArray(raw) || raw.length !== 15) return null;
  if (!raw.every((x) => typeof x === "string" && SIMBOLI_OK.has(x as SimbolId))) return null;
  return raw as SimbolId[];
}

export function parsirajDobitak(raw: unknown): Dobitak | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const linije = neneg(r.linije, 0);
  if (!Number.isFinite(Number(r.zlato ?? 0))) return null;
  return {
    zlato: neneg(r.zlato, 0),
    dijamanti: neneg(r.dijamanti, 0),
    energija: neneg(r.energija, 0),
    stitovi: neneg(r.stitovi, 0),
    drvo: neneg(r.drvo, 0),
    kamen: neneg(r.kamen, 0),
    zeljezo: neneg(r.zeljezo, 0),
    linije,
  };
}

export function parsirajKonje(d: { konjiBroj?: number }, g: Gradevine) {
  const kap = konjaKap(g);
  if (typeof d.konjiBroj === "number" && Number.isFinite(d.konjiBroj)) {
    return Math.max(0, Math.min(kap, Math.floor(d.konjiBroj)));
  }
  return 0;
}

export function parsirajDuznost(raw: unknown, broj: number): KaubaDuznost {
  if (!raw || typeof raw !== "object") return normalizirajDuznost(broj);
  return normalizirajDuznost(broj, raw as Partial<KaubaDuznost>);
}

export function parsirajGoveda(d: { govedaBroj?: number }, g: Gradevine) {
  const kap = govedaKap(g);
  if (typeof d.govedaBroj === "number" && Number.isFinite(d.govedaBroj)) {
    return Math.max(0, Math.min(kap, Math.floor(d.govedaBroj)));
  }
  return 0;
}

export function parsirajGovedoDuznost(raw: unknown, broj: number): GovedoDuznost {
  if (!raw || typeof raw !== "object") return normalizirajGovedo(broj);
  return normalizirajGovedo(broj, raw as Partial<GovedoDuznost>);
}

