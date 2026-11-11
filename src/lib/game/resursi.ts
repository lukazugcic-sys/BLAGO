/**
 * 0.9.177 (t455u, t456u): jedan popis resursa i jedan zapis iznosa za cijelu aplikaciju.
 * Ikona = ista sličica kao u traci resursa (SYMBOL_ART), ime je hrvatsko, boja = ton ikone.
 * Zapis brojeva = isti kao traka resursa (formatHud): 950 · 1.2k · 12k · 1.2m. Bez kratica „g", „d"…
 * Samo prikaz: ništa ne mijenja ekonomiju ni save.
 */
import { SYMBOL_ART } from "./art";
import { formatHud } from "./helpers";

export type ResursId = "zlato" | "dijamanti" | "drvo" | "kamen" | "zeljezo" | "energija" | "stitovi" | "xp";

export type ResursOpis = {
  id: ResursId;
  /** ime u nominativu (aria/title) */
  ime: string;
  /** genitiv množine za rečenice („8 zlata") */
  gen: string;
  /** sličica iz trake resursa; XP nema sličicu nego oznaku „XP" */
  art: string | null;
  boja: string;
};

export const RESURSI: Record<ResursId, ResursOpis> = {
  zlato: { id: "zlato", ime: "zlato", gen: "zlata", art: SYMBOL_ART.gold, boja: "#ffd24a" },
  dijamanti: { id: "dijamanti", ime: "dijamanti", gen: "dijamanata", art: SYMBOL_ART.gem, boja: "#9b4dff" },
  drvo: { id: "drvo", ime: "drvo", gen: "drva", art: SYMBOL_ART.wood, boja: "#a35a22" },
  kamen: { id: "kamen", ime: "kamen", gen: "kamena", art: SYMBOL_ART.stone, boja: "#cfd3d8" },
  zeljezo: { id: "zeljezo", ime: "željezo", gen: "željeza", art: SYMBOL_ART.iron, boja: "#b56a42" },
  energija: { id: "energija", ime: "energija", gen: "energije", art: SYMBOL_ART.energy, boja: "#ff7a12" },
  stitovi: { id: "stitovi", ime: "štitovi", gen: "štitova", art: SYMBOL_ART.shield, boja: "#3d8bff" },
  xp: { id: "xp", ime: "iskustvo", gen: "XP", art: null, boja: "#4ef0c4" },
};

/** Jedan zapis iznosa (kao traka resursa). `predznak` dodaje + za pozitivne. */
export function formatIznos(n: number, predznak = false) {
  const v = Number.isFinite(n) ? n : 0;
  const s = formatHud(v);
  if (v < 0) return `−${s}`;
  return predznak && v > 0 ? `+${s}` : s;
}

/** Riječi koje u tekstu označavaju resurs iza broja („8 zlata", „+3 dijamanta", „12 XP"). */
const RIJEC: [RegExp, ResursId][] = [
  [/^zlat(a|o)$/i, "zlato"],
  [/^dijamant(a|i|ata)?$/i, "dijamanti"],
  [/^drv(a|o)$/i, "drvo"],
  [/^kamen(a)?$/i, "kamen"],
  [/^željez(a|o)$/i, "zeljezo"],
  [/^energij(a|e)$/i, "energija"],
  [/^XP$/, "xp"],
];

export function resursIzRijeci(rijec: string): ResursId | null {
  for (const [re, id] of RIJEC) if (re.test(rijec)) return id;
  return null;
}

/** „+8 zlata" / „−50 zlata" / „8 zlata" / „1.2k zlata" u tekstu — broj, razmak, riječ resursa. */
export const IZNOS_U_TEKSTU = /([+−-]?)(\d[\d.]*(?:k|m)?)\s(zlata|zlato|dijamanata|dijamanta|dijamanti|dijamant|drva|kamena|željeza|energije|XP)(?![a-zA-Zčćšžđ])/g;

export type DioTeksta = string | { znak: string; broj: string; resurs: ResursId };

/** Rastavi tekst na obične dijelove i iznose resursa (za ikonu umjesto riječi). */
export function rastaviTekst(t: string): DioTeksta[] {
  const out: DioTeksta[] = [];
  let zadnji = 0;
  for (const m of t.matchAll(IZNOS_U_TEKSTU)) {
    const r = resursIzRijeci(m[3]!);
    if (!r) continue;
    if (m.index! > zadnji) out.push(t.slice(zadnji, m.index));
    out.push({ znak: m[1] === "-" ? "−" : m[1]!, broj: m[2]!, resurs: r });
    zadnji = m.index! + m[0].length;
  }
  if (zadnji < t.length) out.push(t.slice(zadnji));
  return out;
}
