import { useSyncExternalStore } from "react";
import {
  dohvatiSpawn,
  lokalniObjekt,
  odaberiPlocicu,
  resetLokalRed,
  resetOdsutnost,
  spremiObjekt,
  type AiSpreman,
  type AiTrag,
  type KaubaKontekst,
  type LokalUlaz,
} from "./aiDogadaj";
import { aiUStanci, resetAiPoziv, type AiDohvat, type AiSpremnik } from "./aiPoziv";
import { resetPrikaz } from "./aiPrikaz";

const MAX = 4;
const RAZMAK = 30_000;

let objekti: AiSpreman[] = [];
let sljedeci = 0;
let radi = false;
const slusaci = new Set<() => void>();

function obavijesti() {
  for (const fn of slusaci) fn();
}

export function bazenSnapshot() {
  return objekti;
}

export function pokupiPrvi(): AiSpreman | null {
  if (!objekti.length) return null;
  const [prvi, ...ost] = objekti;
  objekti = ost;
  obavijesti();
  return prvi ?? null;
}

export function isprazniBazen() {
  objekti = [];
  sljedeci = 0;
  radi = false;
  obavijesti();
}

export function resetAiTest() {
  isprazniBazen();
  resetAiPoziv();
  resetPrikaz();
  resetLokalRed();
  resetOdsutnost();
}

function pretplati(fn: () => void) {
  slusaci.add(fn);
  return () => slusaci.delete(fn);
}

export function useBazen() {
  return useSyncExternalStore(pretplati, bazenSnapshot, bazenSnapshot);
}

export type BazenUlaz = {
  ai: boolean;
  sad?: number;
  fetch?: AiDohvat;
  rokMs?: number;
  spremnik?: AiSpremnik;
  jos?: () => boolean;
  lokal: LokalUlaz;
  kontekst: KaubaKontekst;
  posljednji: AiTrag[];
  gradevine?: Record<string, number>;
  gradnje?: { zgrada: string }[];
};

function dodajLokale(u: BazenUlaz, koliko: number) {
  const izb: AiTrag[] = [...u.posljednji, ...objekti.map((o) => ({ tip: o.tip, naziv: o.naziv }))];
  let dodano = 0;
  while (dodano < koliko && objekti.length < MAX) {
    const sirov = lokalniObjekt({ ...u.lokal, posljednji: izb });
    izb.push({ tip: sirov.tip, naziv: sirov.naziv });
    const p = odaberiPlocicu(u.gradevine ?? {}, u.gradnje ?? [], `${sirov.id}-${objekti.length}`);
    objekti = [...objekti, spremiObjekt(sirov, p.x, p.y)];
    dodano += 1;
  }
  if (dodano) obavijesti();
}

export async function napuniBazen(u: BazenUlaz) {
  try {
    if (objekti.length >= MAX) return;
    const sad = u.sad ?? Date.now();
    const s = u.spremnik;
    if (!u.ai || aiUStanci(sad, s)) {
      dodajLokale(u, MAX);
      return;
    }
    if (radi) return;
    if (sad < sljedeci) {
      if (objekti.length === 0) dodajLokale(u, 1);
      return;
    }
    radi = true;
    sljedeci = sad + RAZMAK;
    try {
      const p = odaberiPlocicu(u.gradevine ?? {}, u.gradnje ?? [], `poziv-${objekti.length}-${sad}`);
      const o = await dohvatiSpawn({
        ai: true,
        kontekst: u.kontekst,
        x: p.x,
        y: p.y,
        lokal: u.lokal,
        posljednji: [...u.posljednji, ...objekti.map((x) => ({ tip: x.tip, naziv: x.naziv }))],
        fetch: u.fetch,
        sad,
        rokMs: u.rokMs,
        spremnik: s,
      });
      if (objekti.length >= MAX) return;
      if (objekti.some((x) => x.tip === o.tip && x.naziv === o.naziv)) return;
      objekti = [...objekti, o];
      obavijesti();
    } finally {
      radi = false;
    }
  } catch {
    radi = false;
  }
}
