import { ZGRADE, DNEVNE_NAGRADE } from "./constants";
import {
  PRAZNE_GRADEVINE,
  izracunajMaxEnergiju,
  izracunajMaxStitova,
  izracunajPotrebniXp,
} from "./economy";
import { odaberiKorak } from "./korak";
import { odaberiSljedeciCilj } from "./sljedeciCilj";
import { alatLv } from "./tuning";
import { DEKOR, PARCELE, kucaTocka } from "./ulicaRaspored";
import type { Gradevine, Gradnja, Misija, Nagrada, Resursi } from "./types";
import { aiPoziv, type AiDohvat, type AiSpremnik } from "./aiPoziv";

export const AI_TIPOVI = [
  "skrinja_s_blagom",
  "zakopano_zlato",
  "napusteni_kamp",
  "trag_bande",
  "stari_bunar",
  "logorska_vatra",
  "kovacnica",
] as const;

export type AiTip = (typeof AI_TIPOVI)[number];

export const POVRATAK_MIN_MS = 10 * 60 * 1000;

export const PRAGOVI = {
  zlato: [500, 5000],
  dijamanti: [10, 100],
  drvo: [200, 2000],
  kamen: [200, 2000],
  zeljezo: [100, 1000],
} as const;

export const ZABRANJENE_RIJECI = ["isplat", "dobit", "nagrad", "jackpot", "šans"] as const;

const STABLA = ["isplat", "dobit", "nagrad", "jackpot", "sans", "vjerojatn", "izgledi", "postot", "ulog", "kvot", "mnozitelj", "rtp"];

const ID_RE = /^[a-z0-9_]{1,40}$/;

export type AiTrag = { tip: string; naziv: string };

export type KaubaKontekst = {
  razinaIgraca: number;
  xp: { trenutno: number; prag: number };
  fazaPrice: "uvod" | "rani" | "srednji" | "kasni";
  aktivniZadatak: string | null;
  izgradeneZgrade: { naziv: string; razina: number }[];
  sljedecaZgrada: string | null;
  brojKauboja: number;
  srecaStatus: "osnovna" | "napredna" | "vrhunska";
  resursiRazina: { zlato: "malo" | "dosta" | "puno"; dijamanti: "malo" | "dosta" | "puno"; drvo: "malo" | "dosta" | "puno"; kamen: "malo" | "dosta" | "puno"; zeljezo: "malo" | "dosta" | "puno" };
  energija: { trenutno: number; max: number };
  stitovi: { trenutno: number; max: number };
  metci: number;
  osteceneZgrade: number;
  dobaDana: "jutro" | "podne" | "vecer" | "noc";
  vrijeme: "vedro" | "kisa" | "oluja" | "pjescana_oluja";
  vrijemeOdsutnosti: "nedavno" | "sati" | "dan_vise" | null;
  posljednjiObjekti: AiTrag[];
  zabranjeneRijeci: string[];
};

export type KontekstUlaz = {
  vodicIde: boolean;
  razina: number;
  xp: number;
  gradevine?: Partial<Gradevine>;
  ostecenja?: Record<string, boolean | undefined>;
  zlato?: number;
  dijamanti?: number;
  resursi?: Partial<Resursi>;
  energija?: number;
  baterija?: number;
  stitovi?: number;
  oklop?: number;
  metci?: number;
  sreca?: number;
  stanovnici?: number;
  misije?: Misija[];
  gradnje?: Gradnja[];
  doba?: "jutro" | "dan" | "suton" | "noc";
  kisa?: boolean;
  odsutnostMs?: number | null;
  posljednji?: AiTrag[];
};

export type AiSirovi = { id: string; tip: AiTip; naziv: string; opis: string };

export type AiSpreman = AiSirovi & { x: number; y: number; nagrada: Nagrada; metci: number };

export type LokalUlaz = {
  energija: number;
  maxEnergija: number;
  stitovi: number;
  metci: number;
  ostecene: number;
  posljednji?: AiTrag[];
  korak?: number;
};

const KATALOG: AiSirovi[] = [
  { id: "stari_kovceg", tip: "skrinja_s_blagom", naziv: "Stari kovčeg", opis: "Običan drveni kovčeg." },
  { id: "grumen_zlata", tip: "zakopano_zlato", naziv: "Grumen zlata", opis: "Viri iz pijeska. Uzmi ga brzo." },
  { id: "tragovi_konja", tip: "trag_bande", naziv: "Tragovi konja", opis: "Banda je prošla ovuda. Budi oprezan, stranče." },
  { id: "logorska_vatra", tip: "logorska_vatra", naziv: "Logorska vatra", opis: "Topla vatra i kava. Odmori se, stranče." },
  { id: "pojilo_u_hladu", tip: "logorska_vatra", naziv: "Pojilo u hladu", opis: "Hladna voda i hlad. Vrati snagu." },
  { id: "stara_kovacnica", tip: "kovacnica", naziv: "Stara kovačnica", opis: "Nakovanj je još topao. Popravi svoj štit." },
  { id: "kovac_lutalica", tip: "kovacnica", naziv: "Kovač lutalica", opis: "Stari kovač ima alat. Pokrpa svaki štit." },
  { id: "kutija_metaka", tip: "napusteni_kamp", naziv: "Kutija metaka", opis: "Banda je pobjegla. Ostavila je kutiju metaka." },
  { id: "hrpa_dasaka", tip: "napusteni_kamp", naziv: "Hrpa dasaka", opis: "Suhe daske i čavli. Dobro za popravak zgrada." },
  { id: "kameni_bunar", tip: "stari_bunar", naziv: "Kameni bunar", opis: "Kameni bunar u prašini. Voda je još tu." },
];

let lokalRed = 0;
let zapamceno: number | null = null;

export function resetLokalRed() {
  lokalRed = 0;
}

export function zapamtiOdsutnost(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return;
  if (zapamceno == null) zapamceno = ms;
}

export function citajOdsutnost() {
  return zapamceno;
}

export function resetOdsutnost() {
  zapamceno = null;
}

export function resursRazina(kljuc: keyof typeof PRAGOVI, n: number): "malo" | "dosta" | "puno" {
  const [dosta, puno] = PRAGOVI[kljuc];
  const v = Number.isFinite(n) ? n : 0;
  if (v >= puno) return "puno";
  if (v >= dosta) return "dosta";
  return "malo";
}

export function srecaStatus(sreca: number): "osnovna" | "napredna" | "vrhunska" {
  const lv = alatLv("sreca", sreca);
  if (lv <= 2) return "osnovna";
  if (lv <= 4) return "napredna";
  return "vrhunska";
}

export function fazaPrice(vodicIde: boolean, razina: number, brojZgrada: number): KaubaKontekst["fazaPrice"] {
  if (vodicIde) return "uvod";
  if (razina <= 2 || brojZgrada <= 4) return "rani";
  if (razina <= 8 || brojZgrada <= 12) return "srednji";
  return "kasni";
}

export function vrijemeOdsutnosti(ms: number | null | undefined): KaubaKontekst["vrijemeOdsutnosti"] {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  if (ms < 60 * 60 * 1000) return "nedavno";
  if (ms < 24 * 60 * 60 * 1000) return "sati";
  return "dan_vise";
}

export function odsutnostPovratka(ms: number): "kratko" | "nekoliko sati" | "cijeli dan" | "dugo" {
  const h = ms / (60 * 60 * 1000);
  if (h < 3) return "kratko";
  if (h < 10) return "nekoliko sati";
  if (h < 24) return "cijeli dan";
  return "dugo";
}

export function smijePovratak(ms: number) {
  return Number.isFinite(ms) && ms >= POVRATAK_MIN_MS;
}

export function dobaDana(doba: KontekstUlaz["doba"]): KaubaKontekst["dobaDana"] {
  if (doba === "dan") return "podne";
  if (doba === "suton") return "vecer";
  if (doba === "noc") return "noc";
  return "jutro";
}

function bezDiak(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function imaIsplatu(s: string) {
  if (s.includes("%")) return true;
  const n = bezDiak(s);
  return STABLA.some((st) => n.includes(st));
}

function recenice(s: string) {
  return s.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
}

function rijeci(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

export function parsirajAiPosljednje(raw: unknown): AiTrag[] {
  if (!Array.isArray(raw)) return [];
  const out: AiTrag[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const tip = (x as { tip?: unknown }).tip;
    const naziv = (x as { naziv?: unknown }).naziv;
    if (typeof tip !== "string" || !(AI_TIPOVI as readonly string[]).includes(tip)) continue;
    if (typeof naziv !== "string") continue;
    const n = naziv.trim().slice(0, 28);
    if (n.length < 2) continue;
    out.push({ tip, naziv: n });
  }
  return out.slice(-5);
}

function vidjen(o: { tip: string; naziv: string }, izb: AiTrag[]) {
  const n = o.naziv.trim().toLowerCase();
  return izb.some((p) => p.tip === o.tip && p.naziv.trim().toLowerCase() === n);
}

export function lokalniObjekt(s: LokalUlaz): AiSirovi {
  const izb = s.posljednji ?? [];
  const korak = s.korak ?? lokalRed++;
  const maxE = s.maxEnergija > 0 ? s.maxEnergija : 1;
  let kandidati: AiSirovi[] = [];
  if (s.energija < maxE * 0.25) kandidati = KATALOG.filter((o) => o.tip === "logorska_vatra");
  else if (s.stitovi <= 0) kandidati = KATALOG.filter((o) => o.tip === "kovacnica");
  else if (s.metci <= 2) kandidati = KATALOG.filter((o) => o.id === "kutija_metaka");
  else if (s.ostecene > 0) {
    kandidati = ["hrpa_dasaka", "grumen_zlata"].flatMap((id) => {
      const o = KATALOG.find((x) => x.id === id);
      return o ? [o] : [];
    });
  } else kandidati = KATALOG;
  const slobodni = kandidati.filter((o) => !vidjen(o, izb));
  const izvor = slobodni.length ? slobodni : KATALOG.filter((o) => !vidjen(o, izb));
  const baza = izvor.length ? izvor : KATALOG;
  const o = baza[Math.abs(Math.floor(korak)) % baza.length]!;
  return { ...o };
}

function danNagrada(dan: number) {
  return DNEVNE_NAGRADE.find((d) => d.dan === dan)?.nagrada ?? {};
}

function dio(n: Nagrada, kljucevi: (keyof Nagrada)[]): Nagrada {
  const o: Nagrada = {};
  for (const k of kljucevi) {
    const v = n[k];
    if (typeof v === "number" && v > 0) o[k] = v;
  }
  return o;
}

/** Nagrada je iz postojećih tablica, nikad iz odgovora. */
export function nagradaZaAiTip(tip: AiTip): { nagrada: Nagrada; metci: number } {
  if (tip === "skrinja_s_blagom") return { nagrada: dio(danNagrada(3), ["dijamanti"]), metci: 0 };
  if (tip === "zakopano_zlato") return { nagrada: dio(danNagrada(1), ["zlato"]), metci: 0 };
  if (tip === "logorska_vatra") return { nagrada: dio(danNagrada(2), ["energija"]), metci: 0 };
  if (tip === "napusteni_kamp") return { nagrada: dio(danNagrada(4), ["drvo"]), metci: 6 };
  if (tip === "trag_bande") return { nagrada: { zlato: 16 }, metci: 0 };
  if (tip === "stari_bunar") return { nagrada: { energija: 4, kamen: 6 }, metci: 0 };
  return { nagrada: { stitovi: 1 }, metci: 0 };
}

export function spremiObjekt(o: AiSirovi, x: number, y: number): AiSpreman {
  const n = nagradaZaAiTip(o.tip);
  return {
    id: o.id,
    tip: o.tip,
    naziv: o.naziv,
    opis: o.opis,
    x: Math.round(x),
    y: Math.round(y),
    nagrada: n.nagrada,
    metci: n.metci,
  };
}

export function validirajObjekt(o: unknown, posljednji: AiTrag[]): o is AiSirovi {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  if (typeof r.tip !== "string" || !(AI_TIPOVI as readonly string[]).includes(r.tip)) return false;
  if (typeof r.id !== "string" || !ID_RE.test(r.id)) return false;
  if (typeof r.naziv !== "string") return false;
  if (typeof r.opis !== "string") return false;
  const naziv = r.naziv.trim();
  const opis = r.opis.trim();
  if (naziv.length < 2 || naziv.length > 28) return false;
  if (opis.length < 4 || opis.length > 120) return false;
  if (/[0-9]/.test(naziv) || /[0-9]/.test(opis)) return false;
  if (imaIsplatu(naziv) || imaIsplatu(opis)) return false;
  if (recenice(opis).some((rec) => rijeci(rec) > 10)) return false;
  if (vidjen({ tip: r.tip, naziv }, posljednji)) return false;
  return true;
}

export function objektIzOdg(raw: unknown, posljednji: AiTrag[]): AiSirovi | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { ok?: unknown; object?: unknown };
  if (r.ok !== true) return null;
  if (!validirajObjekt(r.object, posljednji)) return null;
  const o = r.object;
  return { id: o.id, tip: o.tip, naziv: o.naziv.trim(), opis: o.opis.trim() };
}

export function validirajPovratak(raw: unknown, stavke: string[]): string | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { ok?: unknown; model?: unknown; object?: { tekst?: unknown } };
  if (r.ok !== true) return null;
  if (r.model === "pravilo") return null;
  const tekst = r.object?.tekst;
  if (typeof tekst !== "string") return null;
  const t = tekst.trim();
  if (t.length < 10 || t.length > 240) return null;
  if (/[{}<>[\]`]/.test(t)) return null;
  if (/https?:|www\./i.test(t)) return null;
  if (imaIsplatu(t)) return null;
  const rec = recenice(t);
  if (rec.length < 1 || rec.length > 2) return null;
  const dozvoljeni = new Set<string>();
  for (const s of stavke) {
    for (const m of s.matchAll(/[0-9]+/g)) dozvoljeni.add(m[0]);
  }
  for (const m of t.matchAll(/[0-9]+/g)) {
    if (!dozvoljeni.has(m[0])) return null;
  }
  return t;
}

export function sloziKontekst(ulaz: KontekstUlaz): KaubaKontekst {
  const g = { ...PRAZNE_GRADEVINE, ...(ulaz.gradevine ?? {}) };
  const zlato = ulaz.zlato ?? 0;
  const resursi = {
    drvo: ulaz.resursi?.drvo ?? 0,
    kamen: ulaz.resursi?.kamen ?? 0,
    zeljezo: ulaz.resursi?.zeljezo ?? 0,
  };
  const razina = Math.max(1, Math.floor(ulaz.razina || 1));
  const brojZgrada = Object.values(g).filter((n) => (n || 0) > 0).length;
  const izgradeneZgrade: { naziv: string; razina: number }[] = [];
  for (const z of ZGRADE) {
    const lv = Math.floor(g[z.id] || 0);
    if (lv <= 0) continue;
    izgradeneZgrade.push({ naziv: z.naziv, razina: lv });
    if (izgradeneZgrade.length >= 8) break;
  }
  const cilj = odaberiSljedeciCilj({
    gradevine: g,
    zlato,
    resursi,
    gradnje: ulaz.gradnje ?? [],
    prestigeRazina: 0,
  });
  const korak = odaberiKorak({
    misije: ulaz.misije ?? [],
    gradevine: g,
    zlato,
    resursi,
    gradnje: ulaz.gradnje ?? [],
    stanovnici: ulaz.stanovnici ?? 0,
  });
  const zadatak = korak?.rec ? korak.rec.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  let ostecene = 0;
  for (const v of Object.values(ulaz.ostecenja ?? {})) if (v) ostecene += 1;
  const odsutnost = ulaz.odsutnostMs !== undefined ? ulaz.odsutnostMs : citajOdsutnost();
  const posljednji = (ulaz.posljednji ?? []).slice(-5).map((p) => ({ tip: p.tip, naziv: p.naziv }));
  return {
    razinaIgraca: razina,
    xp: { trenutno: Math.max(0, Math.floor(ulaz.xp || 0)), prag: izracunajPotrebniXp(razina) },
    fazaPrice: fazaPrice(ulaz.vodicIde, razina, brojZgrada),
    aktivniZadatak: zadatak || null,
    izgradeneZgrade,
    sljedecaZgrada: cilj?.zgrada.naziv ?? null,
    brojKauboja: Math.max(0, Math.floor(ulaz.stanovnici ?? 0)),
    srecaStatus: srecaStatus(ulaz.sreca ?? 0),
    resursiRazina: {
      zlato: resursRazina("zlato", zlato),
      dijamanti: resursRazina("dijamanti", ulaz.dijamanti ?? 0),
      drvo: resursRazina("drvo", resursi.drvo),
      kamen: resursRazina("kamen", resursi.kamen),
      zeljezo: resursRazina("zeljezo", resursi.zeljezo),
    },
    energija: {
      trenutno: Math.max(0, Math.floor(ulaz.energija ?? 0)),
      max: izracunajMaxEnergiju(ulaz.baterija ?? 0),
    },
    stitovi: {
      trenutno: Math.max(0, Math.floor(ulaz.stitovi ?? 0)),
      max: izracunajMaxStitova(ulaz.oklop ?? 0),
    },
    metci: Math.max(0, Math.floor(ulaz.metci ?? 0)),
    osteceneZgrade: Math.max(0, Math.min(27, ostecene)),
    dobaDana: dobaDana(ulaz.doba),
    vrijeme: ulaz.kisa ? "kisa" : "vedro",
    vrijemeOdsutnosti: vrijemeOdsutnosti(odsutnost),
    posljednjiObjekti: posljednji,
    zabranjeneRijeci: [...ZABRANJENE_RIJECI],
  };
}

export function tijeloSpawna(context: KaubaKontekst, x: number, y: number) {
  return {
    v: 1 as const,
    chapter: "blago1-kauba" as const,
    zadatak: "spawn_puni" as const,
    player: { x: Math.round(x), y: Math.round(y) },
    context,
  };
}

export function tijeloPovratka(ms: number, stavke: string[]) {
  return {
    v: 1 as const,
    chapter: "blago1-kauba" as const,
    zadatak: "povratak" as const,
    player: { x: 0, y: 0 },
    povratak: { odsutnost: odsutnostPovratka(ms), stavke },
  };
}

export async function dohvatiSpawn(u: {
  ai: boolean;
  kontekst: KaubaKontekst;
  x: number;
  y: number;
  lokal: LokalUlaz;
  posljednji: AiTrag[];
  fetch?: AiDohvat;
  sad?: number;
  rokMs?: number;
  spremnik?: AiSpremnik;
}): Promise<AiSpreman> {
  const lok = () => spremiObjekt(lokalniObjekt({ ...u.lokal, posljednji: u.posljednji }), u.x, u.y);
  if (!u.ai) return lok();
  const raw = await aiPoziv(tijeloSpawna(u.kontekst, u.x, u.y), u);
  const obj = objektIzOdg(raw, u.posljednji);
  if (!obj) return lok();
  return spremiObjekt(obj, u.x, u.y);
}

export function odaberiPlocicu(
  gradevine: Record<string, number>,
  gradnje: { zgrada: string }[],
  kljuc: string,
) {
  const zauzeto = new Set(gradnje.map((g) => g.zgrada));
  const slobodne = PARCELE.filter((p) => (gradevine[p.id] || 0) <= 0 && !zauzeto.has(p.id));
  const izvor = slobodne.length ? slobodne : DEKOR.map((d, i) => ({ id: `d${i}`, x: d.x, y: d.y }));
  if (!izvor.length) return { x: 120, y: 160 };
  const fokus = kucaTocka();
  const blizu = [...izvor].sort((a, b) => {
    const d = (p: { x: number; y: number }) => (p.x - fokus.x) ** 2 + (p.y - fokus.y) ** 2;
    return d(a) - d(b);
  }).slice(0, 6);
  let h = 0;
  for (let i = 0; i < kljuc.length; i++) h = (h * 33 + kljuc.charCodeAt(i)) >>> 0;
  const p = blizu[h % blizu.length]!;
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

export function redakPravila(stavke: string[]) {
  const s = stavke.filter((x) => typeof x === "string" && x.trim()).slice(0, 3);
  if (s.length === 0) return "Dok te nije bilo, sve je bilo mirno.";
  if (s.length === 1) return `Dok te nije bilo: ${s[0]}.`;
  if (s.length === 2) return `Dok te nije bilo: ${s[0]} i ${s[1]}.`;
  return `Dok te nije bilo: ${s[0]}, ${s[1]} i ${s[2]}.`;
}

export function ocistiStavku(s: string): string | null {
  if (typeof s !== "string") return null;
  const t = s.replace(/[^\p{L}\p{N} %]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!t) return null;
  if (imaIsplatu(t)) return null;
  return t;
}
