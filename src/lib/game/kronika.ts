import type { DebriefStav, KronikaZapis, SimbolId } from "./types";

export const MAX_KRONIKA = 8;

export const STAVOVI: Array<{
  id: DebriefStav;
  naziv: string;
  art: SimbolId;
  moto: string;
  hint: string;
}> = [
  {
    id: "osvetnik",
    naziv: "Šerif",
    art: "skull",
    moto: "Tko zapali kaubu, vraća dug.",
    hint: "Gorjeli smo. Uzeli smo svoje.",
  },
  {
    id: "strateg",
    naziv: "Tragač",
    art: "shield",
    moto: "Prati tragove, ne sreću.",
    hint: "Hrpe. Sljedeći put znam.",
  },
  {
    id: "pljackas",
    naziv: "Kauboj",
    art: "gold",
    moto: "Blago prvo. Priča poslije.",
    hint: "Ostava, pa priča.",
  },
];

export function stavOd(id: DebriefStav | null | undefined) {
  return STAVOVI.find((s) => s.id === id) ?? null;
}

export function gmUvod(ime: string, utvrdjeno: boolean) {
  return utvrdjeno
    ? `Noć pada na ${ime}. Tri vreće blaga. Tabor je utvrđen — oni već drže ravnotežu.`
    : `Noć pada na ${ime}. Tri vreće blaga. Ti biraš hrpu. Oni odgovaraju.`;
}

export function recapOpsade(ime: string, pobjeda: boolean, utvrdjeno: boolean) {
  if (pobjeda && utvrdjeno) return `Noć nad ${ime}: utvrda je pala jer su pogriješili.`;
  if (pobjeda) return `Noć nad ${ime}: tri ostave, zadnji žeton je tvoj.`;
  if (utvrdjeno) return `${ime} je držao ravnotežu od prvog poteza. Utvrda stoji.`;
  return `${ime} je vratio ravnotežu. Zadnji žeton nije tvoj.`;
}

function jeStav(v: unknown): v is DebriefStav {
  return v === "osvetnik" || v === "strateg" || v === "pljackas";
}

export function parsirajKroniku(raw: unknown): KronikaZapis[] {
  if (!Array.isArray(raw)) return [];
  const out: KronikaZapis[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (!jeStav(r.stav) || typeof r.metaIme !== "string" || typeof r.recap !== "string") continue;
    out.push({
      id: typeof r.id === "string" ? r.id : `k-${out.length}`,
      t: typeof r.t === "number" && Number.isFinite(r.t) ? r.t : 0,
      metaIme: r.metaIme.slice(0, 48),
      pobjeda: r.pobjeda === true,
      stav: r.stav,
      recap: r.recap.slice(0, 220),
    });
    if (out.length >= MAX_KRONIKA) break;
  }
  return out;
}
