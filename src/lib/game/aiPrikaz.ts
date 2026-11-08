import { useSyncExternalStore } from "react";
import { ocistiStavku, redakPravila, smijePovratak, tijeloPovratka, validirajPovratak } from "./aiDogadaj";
import { aiPoziv, type AiDohvat, type AiSpremnik } from "./aiPoziv";

type Linija = { tekst: string; kljuc: number };

let linija: Linija | null = null;
let kljuc = 0;
const slusaci = new Set<() => void>();

function obavijesti() {
  for (const fn of slusaci) fn();
}

export function snapshotPovratka() {
  return linija;
}

export function zatvoriPovratak() {
  if (!linija) return;
  linija = null;
  obavijesti();
}

export function resetPrikaz() {
  linija = null;
  kljuc = 0;
  obavijesti();
}

function pretplati(fn: () => void) {
  slusaci.add(fn);
  return () => slusaci.delete(fn);
}

export function usePovratak() {
  return useSyncExternalStore(pretplati, snapshotPovratka, snapshotPovratka);
}

export async function najaviPovratak(
  ms: number,
  stavke: string[],
  ai: boolean,
  opts?: { fetch?: AiDohvat; sad?: number; rokMs?: number; spremnik?: AiSpremnik },
) {
  if (!smijePovratak(ms)) return;
  const ciste: string[] = [];
  for (const s of stavke) {
    if (ciste.length >= 8) break;
    const t = ocistiStavku(s);
    if (t) ciste.push(t);
  }
  kljuc += 1;
  const moj = kljuc;
  linija = { tekst: redakPravila(ciste), kljuc: moj };
  obavijesti();
  if (!ai) return;
  try {
    const raw = await aiPoziv(tijeloPovratka(ms, ciste), opts);
    if (!linija || linija.kljuc !== moj) return;
    const tekst = validirajPovratak(raw, ciste);
    if (!tekst) return;
    linija = { tekst, kljuc: moj };
    obavijesti();
  } catch {
    /* pravilo ostaje */
  }
}
