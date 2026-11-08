import { create } from "zustand";
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
  TrznicaId,
  ResursId,
  Zgrada,
  KaravanaPutId,
  SimbolId,
} from "@/lib/game/types";
import type { CloudPayload } from "@/lib/game/cloud";
import type {
  KonjDuznostId,
  KaubaDuznost,
  GovedoDuznost,
  GovedoDuznostId,
} from "@/lib/game/economy";
import type { Stanovnik, Segrt, Zamjenik, LikHub } from "@/lib/game/ljudi";
import type { KaubaDogadaj } from "@/lib/game/dogadaji";
import type { JutarnjiPosao, JutarnjiId } from "@/lib/game/jutro";
import type { Dnevna, Tecaj, Trend } from "./gameParse";
import { pocetnoStanje } from "./gameParse";
import { sliceSpremnik } from "./sliceSpremnik";
import { sliceSat } from "./sliceSat";
import { sliceZgrade } from "./sliceZgrade";
import { sliceLjudi } from "./sliceLjudi";
import { sliceStoka } from "./sliceStoka";
import { sliceDan } from "./sliceDan";
import { pokreniNoviPrijeHidracije } from "@/lib/game/noviPrije";

pokreniNoviPrijeHidracije();

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
  dnevnaPotvrda: boolean;
  dnevniDan: string;
  dnevniSat: number;
  dnevniSatLokal: number;
  dnevnaNagrada: Dnevna | null;
  tecaj: Tecaj;
  trend: Trend;
  luckySpinCounter: number;
  winStreak: number;
  winStreakDo: number;
  poruka: string;
  levelUpData: { razina: number; skok?: number } | null;
  aktivniSkin: string;
  skinovi: string[];
  klan: Klan;
  zadnjiResursTick: number;
  zadnjaEnergijaTick: number;
  zadnjiMetakTick: number;
  kronika: KronikaZapis[];
  stavSela: DebriefStav | null;
  kvalitetaSela: number;
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
  potkove: number;
  potkoveDo: number;
  kisaDo: number;
  travaDo: number;
  govedaBroj: number;
  govedaDuznost: GovedoDuznost;
  knjigaSkup: number;
  besplatneVrtnje: number;
  besplatneExpand: SimbolId | null;
  besplatneUlog: number;
  serifCin: number;
  celijaBroj: number;
  zadnjiNalozi: string[];
  metci: number;
  metakRed: number;
  metakBuffNa: number;
  metakVreca: Array<"zlato" | "energija" | "stit" | "sreca" | "drvo" | "zeljezo">;
  metakDogadaj: { id: "zlato" | "energija" | "stit" | "sreca" | "drvo" | "zeljezo"; naziv: string; rec: string; do: number; pulse: number; zadnji: number } | null;
  aiDogadaji: boolean;
  aiPosljednji: { tip: string; naziv: string }[];

  setPoruka: (poruka: string) => void;
  clearLevelUp: () => void;
  ucitaj: () => void;
  spremi: () => void;
  spremiDostignuca: () => void;
  primijeniCloudSave: (d: CloudPayload) => void;
  timerTick: () => void;
  osvjeziDnevnu: () => void;
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
  premjestiLika: (id: string, hub: LikHub) => void;
  dajCasu: (id: string) => void;
  rijesiDogadaj: (opcija: string) => void;
  strpajCeliju: () => void;
  pustiCeliju: () => void;
  lijeci: (odakle?: "ordinacija" | "travar" | "banja") => void;
  bankaSpremi: (n: number) => void;
  bankaUzmi: (n: number) => void;
  trgovinaKupi: (res: ResursId) => void;
  ispali: () => void;
  iskujMetke: () => void;
  napuniBarut: () => void;
  kupiMetke: () => void;
  tikMetka: () => void;
  ugasiMetak: () => void;
  postaviKrupija: (id: string | null) => void;
  kupiKonja: (n?: number) => void;
  prodajKonja: () => void;
  pomakniKonja: (od: KonjDuznostId, na: KonjDuznostId) => void;
  kupiSijeno: () => void;
  potkovaj: () => void;
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
  osvjeziProtok: () => void;
  testAlat: (sto: "zlato" | "energija" | "dijamanti" | "resursi" | "stitovi" | "popravi") => void;
  autoTest: () => { ok: number; ukupno: number };
};

export const useGameStore = create<GameState>((set, get) => ({
  ...pocetnoStanje,
  setPoruka: (poruka) => set({ poruka }),
  clearLevelUp: () => set({ levelUpData: null }),
  ...sliceSpremnik(set, get),
  ...sliceSat(set, get),
  ...sliceZgrade(set, get),
  ...sliceLjudi(set, get),
  ...sliceStoka(set, get),
  ...sliceDan(set, get),
}));

let persistBound = false;

export function startLocalPersist() {
  if (persistBound || typeof window === "undefined") return;
  persistBound = true;
  let saveT: number | null = null;
  let achT: number | null = null;
  let dirtyAt = 0;
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
      s.travaDo === prev.travaDo &&
      s.govedaBroj === prev.govedaBroj &&
      s.govedaDuznost === prev.govedaDuznost &&
      s.knjigaSkup === prev.knjigaSkup &&
      s.besplatneVrtnje === prev.besplatneVrtnje &&
      s.besplatneExpand === prev.besplatneExpand &&
      s.besplatneUlog === prev.besplatneUlog &&
      s.konjiBroj === prev.konjiBroj &&
      s.konjiDuznost === prev.konjiDuznost &&
      s.sijenoDo === prev.sijenoDo &&
      s.potkove === prev.potkove &&
      s.potkoveDo === prev.potkoveDo &&
      s.zadnjiResursTick === prev.zadnjiResursTick &&
      s.zadnjaEnergijaTick === prev.zadnjaEnergijaTick &&
      s.zadnjiMetakTick === prev.zadnjiMetakTick &&
      s.metci === prev.metci &&
      s.serifCin === prev.serifCin &&
      s.celijaBroj === prev.celijaBroj &&
      s.zadnjiNalozi === prev.zadnjiNalozi &&
      s.stavSela === prev.stavSela &&
      s.dostignucaDone === prev.dostignucaDone &&
      s.winStreak === prev.winStreak &&
      s.ukupnoZlata === prev.ukupnoZlata
    ) {
      return;
    }
    const sad = Date.now();
    if (!dirtyAt) dirtyAt = sad;
    if (saveT) window.clearTimeout(saveT);
    const proteklo = sad - dirtyAt;
    const cekaj = proteklo >= 2000 ? 0 : Math.min(800, 2000 - proteklo);
    saveT = window.setTimeout(() => {
      dirtyAt = 0;
      saveT = null;
      useGameStore.getState().spremi();
    }, cekaj);
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
