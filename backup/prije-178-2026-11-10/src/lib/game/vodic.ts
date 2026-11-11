import { useSyncExternalStore } from "react";
import type { Nagrada, SimbolId } from "./types";
import type { TabId } from "./constants";
import { loadJSON, saveJSON, SAVE_KEYS } from "./persist";
import { idi, type IdiDetail } from "./tokMeni";
import { dogadaj } from "./analitika";

export const VODIC_NAGRADA = "blago:vodic-nagrada";

const RED = [
  "prica",
  "vrtnja1",
  "vrtnja2",
  "kuca",
  "proizvod",
  "nalog",
  "kauboj",
  "burza",
  "zgrada",
  "finale",
  "gotovo",
] as const;

export type VodicKorak = (typeof RED)[number];

const TAB_OD: Record<TabId, VodicKorak> = {
  automat: "prica",
  selo: "kuca",
  misije: "nalog",
  trznica: "burza",
  zid: "zgrada",
};

const LOKOT: Record<TabId, string> = {
  automat: "",
  selo: "Kauba se otvara nakon dvije vrtnje",
  misije: "Nalozi se otvaraju kad pokupiš drvo",
  trznica: "Burza se otvara kad zaposliš kauboja",
  zid: "Zid se otvara pred sljedeću zgradu",
};

const BUBBLE: Partial<Record<TabId, string>> = {
  selo: "Ovo je Kauba. Tu se diže prva kuća.",
  misije: "Nalozi su poslovi. Hvala kad su gotovi.",
  trznica: "Burza kupuje drvo, kamen i željezo.",
  zid: "Zid pamti što kauba još treba.",
};

const REC: Partial<Record<VodicKorak, string>> = {
  vrtnja1: "Zavrti prvo kolo",
  vrtnja2: "Zavrti još jednom",
  kuca: "Izgradi Kuću",
  proizvod: "Pokupi drvo s pilane",
  nalog: "Otvori prvi nalog",
  kauboj: "Zaposli kauboja na posao",
  burza: "Prodaj na burzi",
  zgrada: "Otvori bunar",
};

const DAR: Partial<Record<VodicKorak, Nagrada>> = {
  kuca: { zlato: 6 },
  proizvod: { drvo: 4 },
  nalog: { energija: 1 },
  kauboj: { zlato: 4 },
  burza: { energija: 1 },
  zgrada: { drvo: 4 },
};

/** Isti tekstovi kao uvod, samo za izbornik. Ne nose nagradu. */
const UPUTE_PRICE: { naslov: string; rec: string }[] = [
  { naslov: "Šerif na prašini", rec: "Boro te čeka na praznoj ulici. Kauba još nema krov." },
  { naslov: "Nema ni bunara", rec: "Prvo zavrti kolo. Zlato i drvo plaćaju prvu kuću. Pilana već reže." },
  { naslov: "Ostani do zore", rec: "Vrti, digni kuću, pokupi drvo, primi nalog. Čeka te dnevna nagrada." },
];

/** Četiri zlata na srednjoj liniji. Obračun ide kroz običnu ocjenu. */
const KOLO_LIJEPO: SimbolId[] = [
  "wood", "stone", "iron", "wood", "stone",
  "gold", "gold", "gold", "gold", "wood",
  "stone", "iron", "wood", "stone", "iron",
];

/** Tri drva na sredini, manji dobitak. */
const KOLO_MANJE: SimbolId[] = [
  "stone", "iron", "gold", "stone", "wood",
  "wood", "wood", "wood", "iron", "stone",
  "iron", "stone", "gold", "iron", "wood",
];

type Stanje = {
  korak: VodicKorak;
  staro: boolean;
  pocetak: number;
  drvoBaza: number;
  novi: TabId[];
  vidjeno: TabId[];
  bubble: TabId | "";
  najavljeno: VodicKorak | "";
  finaleVidjen: boolean;
  preskokDan: string;
};

const slusaci = new Set<() => void>();

function prazno(korak: VodicKorak, staro: boolean): Stanje {
  return {
    korak,
    staro,
    pocetak: Date.now(),
    drvoBaza: -1,
    novi: [],
    vidjeno: [],
    bubble: "",
    najavljeno: "",
    finaleVidjen: false,
    preskokDan: "",
  };
}

let stanje: Stanje = prazno("gotovo", true);
let prikaz = false;

function indeks(k: VodicKorak) {
  return RED.indexOf(k);
}

function jeKorak(x: unknown): x is VodicKorak {
  return typeof x === "string" && (RED as readonly string[]).includes(x);
}

function normaliziraj(raw: Partial<Stanje> | null): Stanje {
  const korak = jeKorak(raw?.korak) ? raw.korak : "gotovo";
  const tab = (xs: unknown) =>
    Array.isArray(xs) ? xs.filter((x): x is TabId => x === "automat" || x === "zid" || x === "selo" || x === "misije" || x === "trznica") : [];
  return {
    korak,
    staro: !!raw?.staro || (korak === "gotovo" && !raw?.preskokDan),
    pocetak: typeof raw?.pocetak === "number" ? raw.pocetak : Date.now(),
    drvoBaza: typeof raw?.drvoBaza === "number" ? raw.drvoBaza : -1,
    novi: tab(raw?.novi),
    vidjeno: tab(raw?.vidjeno),
    bubble: "",
    najavljeno: "",
    finaleVidjen: !!raw?.finaleVidjen,
    preskokDan: typeof raw?.preskokDan === "string" ? raw.preskokDan : "",
  };
}

function spremi() {
  saveJSON(SAVE_KEYS.vodic, {
    korak: stanje.korak,
    staro: stanje.staro,
    pocetak: stanje.pocetak,
    drvoBaza: stanje.drvoBaza,
    novi: stanje.novi,
    vidjeno: stanje.vidjeno,
    finaleVidjen: stanje.finaleVidjen,
    preskokDan: stanje.preskokDan,
  });
}

type Prikaz = {
  korak: VodicKorak;
  staro: boolean;
  prikaz: boolean;
  rec: string;
  traka: boolean;
  finale: boolean;
  novi: TabId[];
  bubble: string;
  bubbleTab: TabId | "";
  oznaka: number;
  finaleVidjen: boolean;
  preskokDan: string;
};

let oznaka = 0;
let snap: Prikaz = izvedi();

function izvedi(): Prikaz {
  const k = stanje.korak;
  const ide = !stanje.staro && k !== "gotovo";
  return {
    korak: k,
    staro: stanje.staro,
    prikaz,
    rec: REC[k] ?? "",
    traka: ide && k !== "prica" && k !== "finale",
    finale: ide && k === "finale",
    novi: stanje.novi,
    bubble: stanje.bubble ? BUBBLE[stanje.bubble] ?? "" : "",
    bubbleTab: stanje.bubble,
    oznaka,
    finaleVidjen: stanje.finaleVidjen,
    preskokDan: stanje.preskokDan,
  };
}

function obavijesti() {
  snap = izvedi();
  spremi();
  slusaci.forEach((f) => f());
}

function najavi(k: VodicKorak) {
  if (stanje.staro || k === "gotovo" || stanje.najavljeno === k) return;
  stanje.najavljeno = k;
  dogadaj("tutorial_step", { broj: indeks(k), ms: Math.max(0, Date.now() - stanje.pocetak) });
}

function otkljucaji(k: VodicKorak) {
  (Object.keys(TAB_OD) as TabId[]).forEach((tab) => {
    if (TAB_OD[tab] !== k) return;
    if (stanje.vidjeno.includes(tab) || stanje.novi.includes(tab)) return;
    stanje.novi = [...stanje.novi, tab];
  });
}

function nagradaZa(k: VodicKorak) {
  const n = DAR[k];
  if (!n || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VODIC_NAGRADA, { detail: n }));
}

function danasLokal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

let brava: (tab: string) => boolean = () => true;

/** Tržnica ima i sporednu bravu (kuća). Vodič je ne smije otvoriti prije toga. */
export function vodicPostaviBravu(fn: (tab: string) => boolean) {
  brava = fn;
}

let rucnoIdi = false;

function usmjeri(k: VodicKorak) {
  const d = vodicOdrediste(k);
  if (!d) return;
  if (!rucnoIdi) return;
  if (d.tab && !brava(d.tab)) {
    if (k === "burza") idi({ tab: "selo", hub: "krov" });
    return;
  }
  idi(d);
}

/** Kamo IDI smije. Tržnica i voda samo na svom koraku, nikad usput. */
export function vodicOdrediste(k: VodicKorak): IdiDetail | null {
  if (k === "vrtnja1" || k === "vrtnja2") return { tab: "automat" };
  if (k === "kuca") return { tab: "selo", hub: "krov" };
  if (k === "proizvod" || k === "nalog") return { tab: "selo", trg: true };
  if (k === "kauboj") return { tab: "selo", ruke: true };
  if (k === "burza") return { tab: "trznica", trznica: "burza" };
  if (k === "zgrada") return { tab: "selo", hub: "voda" };
  return null;
}

const DOK_KUCA_RASTE = new Set<VodicKorak>(["kuca", "proizvod", "nalog", "kauboj"]);

/** Dok se kuća diže, ovi koraci ne smiju skočiti na burzu ni bunar. */
export function vodicDrziDokKucaRaste(k: VodicKorak) {
  return DOK_KUCA_RASTE.has(k);
}

function na(k: VodicKorak) {
  const prije = stanje.korak;
  stanje.korak = k;
  if (k === "proizvod") stanje.drvoBaza = -1;
  otkljucaji(k);
  najavi(k);
  if (k === "finale") {
    dogadaj("tutorial_done", { ms: Math.max(0, Date.now() - stanje.pocetak) });
  }
  obavijesti();
  nagradaZa(prije);
  usmjeri(k);
}

export function pretplatiVodic(fn: () => void) {
  slusaci.add(fn);
  return () => slusaci.delete(fn);
}

export function vodicSnapshot() {
  return snap;
}

export function useVodic() {
  return useSyncExternalStore(pretplatiVodic, vodicSnapshot, vodicSnapshot);
}

export function vodicJosIde() {
  return !stanje.staro && stanje.korak !== "gotovo";
}

/** Tamni sloj i lokot samo ako igrač sam traži vođenje. Izbornik „Upute” ovo ne pali. */
export function vodicPrikazan() {
  return prikaz;
}

/** Postojeće rečenice vodiča. Ne mijenja korak, save ni nagradu. */
export function vodicUpute(): { naslov: string; rec: string }[] {
  const koraci = (Object.keys(REC) as VodicKorak[])
    .filter((k) => REC[k])
    .map((k) => ({ naslov: REC[k] as string, rec: "" }));
  return [...UPUTE_PRICE, ...koraci];
}

export function tabOtkljucan(tab: TabId) {
  if (!vodicJosIde()) return true;
  return indeks(stanje.korak) >= indeks(TAB_OD[tab]);
}

export function vodicLokot(tab: TabId) {
  return LOKOT[tab] || "Još nije vrijeme";
}

export function tabJeNov(tab: TabId) {
  return stanje.novi.includes(tab);
}

/** Novi igrač odmah igra. Stari save čuva korak i nagrade, ali se vodič ne otvara sam. */
export function vodicNaUcitavanju(imaIgru: boolean) {
  const raw = loadJSON<Partial<Stanje>>(SAVE_KEYS.vodic);
  prikaz = false;
  if (!raw) {
    stanje = prazno("gotovo", true);
  } else {
    stanje = normaliziraj(raw);
    if (!imaIgru) stanje.staro = false;
  }
  najavi(stanje.korak);
  obavijesti();
}

export function vodicKrajPrice() {
  if (stanje.korak !== "prica") return;
  na("vrtnja1");
}

export function vodicPreskoci() {
  if (!vodicJosIde()) return;
  dogadaj("tutorial_skip", { broj: indeks(stanje.korak), ms: Math.max(0, Date.now() - stanje.pocetak) });
  stanje.korak = "gotovo";
  stanje.staro = false;
  stanje.novi = [];
  stanje.bubble = "";
  if (!stanje.finaleVidjen) stanje.preskokDan = danasLokal();
  obavijesti();
}

/** Korak nema cilj na ekranu. Ide dalje, bez nagrade tog koraka. */
export function vodicPreskociKorak() {
  if (!vodicJosIde()) return;
  const sljedeci = RED[indeks(stanje.korak) + 1];
  if (!sljedeci || sljedeci === "gotovo") {
    vodicPreskoci();
    return;
  }
  stanje.korak = sljedeci;
  if (sljedeci === "proizvod") stanje.drvoBaza = -1;
  otkljucaji(sljedeci);
  najavi(sljedeci);
  if (sljedeci === "finale") {
    dogadaj("tutorial_done", { ms: Math.max(0, Date.now() - stanje.pocetak) });
  }
  obavijesti();
  usmjeri(sljedeci);
}

export function vodicDnevnaSmije(serverDan: string) {
  if (vodicJosIde()) return false;
  if (stanje.staro || stanje.finaleVidjen) return true;
  return !!stanje.preskokDan && !!serverDan && serverDan > stanje.preskokDan;
}

/** Vraća priču na početak. Ne dira zlato, zgrade ni nagrade. */
export function vodicPonovi() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("blago-zatvori-izbornik"));
  }
  oznaka += 1;
  prikaz = false;
  stanje = prazno("prica", false);
  najavi("prica");
  obavijesti();
  idi({ tab: "automat" });
}

export function vodicKolo(): SimbolId[] | null {
  if (stanje.korak === "vrtnja1") return KOLO_LIJEPO;
  if (stanje.korak === "vrtnja2") return KOLO_MANJE;
  return null;
}

export function vodicPlijen() {
  if (stanje.korak !== "vrtnja1" && stanje.korak !== "vrtnja2") return;
  na(stanje.korak === "vrtnja1" ? "vrtnja2" : "kuca");
}

export function vodicGradnja(id: string) {
  if (stanje.korak === "kuca" && id === "kuca") na("proizvod");
  else if (stanje.korak === "zgrada" && id === "bunar") na("finale");
}

export function vodicDrvo(drvo: number) {
  if (stanje.korak !== "proizvod") return;
  if (stanje.drvoBaza < 0) {
    stanje.drvoBaza = drvo;
    spremi();
    return;
  }
  if (drvo > stanje.drvoBaza) na("nalog");
}

export function vodicPokupi() {
  if (stanje.korak === "proizvod") na("nalog");
}

/** Samo kartica naloga u Kaubi (ili isti Stranac) smije završiti korak. */
export function vodicNalog(izKartice = false) {
  if (!izKartice) return;
  if (stanje.korak === "nalog") na("kauboj");
}

export function vodicZaposli() {
  if (stanje.korak === "kauboj") na("burza");
}

export function vodicProdaja() {
  if (stanje.korak === "burza") na("zgrada");
}

export function vodicZatvoriFinale() {
  if (stanje.korak !== "finale") return;
  stanje.korak = "gotovo";
  stanje.finaleVidjen = true;
  stanje.preskokDan = "";
  stanje.novi = [];
  stanje.bubble = "";
  obavijesti();
}

export function vodicTabOtvoren(tab: TabId) {
  if (!vodicJosIde()) return;
  if (!stanje.novi.includes(tab)) return;
  stanje.bubble = tab;
  obavijesti();
}

export function vodicBubbleGotov() {
  if (!stanje.bubble) return;
  const tab = stanje.bubble;
  stanje.novi = stanje.novi.filter((t) => t !== tab);
  if (!stanje.vidjeno.includes(tab)) stanje.vidjeno = [...stanje.vidjeno, tab];
  stanje.bubble = "";
  obavijesti();
}

export function vodicIdi() {
  rucnoIdi = true;
  usmjeri(stanje.korak);
  rucnoIdi = false;
}

const CILJ: Partial<Record<VodicKorak, string>> = {
  vrtnja1: "zavrti",
  vrtnja2: "zavrti",
  kuca: "kuca",
  proizvod: "drvo",
  nalog: "nalog-kauba",
  kauboj: "zaposli",
  burza: "burza",
  zgrada: "bunar",
};

export function vodicMeta(): string {
  return CILJ[stanje.korak] ?? "";
}

export function vodicCiljevi() {
  return RED.filter((k) => k !== "prica" && k !== "finale" && k !== "gotovo").map((k) => ({
    korak: k,
    cilj: CILJ[k] ?? "",
  }));
}
