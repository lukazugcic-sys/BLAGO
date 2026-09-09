import type { DebriefStav, KronikaZapis, SimbolId } from "./types";

export const MAX_KRONIKA = 28;

export type KronikaVrsta = NonNullable<KronikaZapis["vrsta"]>;

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
    ? `${ime} drži ravnotežu. Oni biraju prvi.`
    : `${ime}. Tri hrpe. Ti biraš.`;
}

export function recapOpsade(ime: string, pobjeda: boolean, utvrdjeno: boolean) {
  if (pobjeda && utvrdjeno) return `${ime}: utvrda pala. Pogriješili su hrpu.`;
  if (pobjeda) return `${ime}: zadnji žeton. Vreće jašu s tobom.`;
  if (utvrdjeno) return `${ime} drži ravnotežu. Utvrda stoji.`;
  return `${ime} je vratio žeton. Ideš prazan.`;
}

export function kronikaNaslov(z: Pick<KronikaZapis, "vrsta" | "pobjeda" | "metaIme">) {
  const vrsta = z.vrsta ?? (z.pobjeda ? "pohod" : "obrana");
  if (vrsta === "selidba") return "Ljudi";
  if (vrsta === "gradnja") return "Gradnja";
  if (vrsta === "dogadaj") return z.metaIme || "Ulica";
  if (vrsta === "dostignuce") return "Zvijezda";
  if (vrsta === "pohod") return "Pohod";
  return "Obrana";
}

export function kronikaArt(z: Pick<KronikaZapis, "vrsta" | "pobjeda" | "stav">): SimbolId {
  const vrsta = z.vrsta ?? (z.pobjeda ? "pohod" : "obrana");
  if (vrsta === "gradnja") return "wood";
  if (vrsta === "selidba") return z.pobjeda ? "wild" : "energy";
  if (vrsta === "dogadaj") return z.pobjeda ? "shield" : "skull";
  if (vrsta === "dostignuce") return "gold";
  const s = stavOd(z.stav);
  return s?.art ?? (z.pobjeda ? "skull" : "shield");
}

export function kadJe(t: number, sad = Date.now()) {
  if (!t) return "Na početku.";
  const d = sad - t;
  if (d < 45_000) return "Sad.";
  if (d < 3600_000) return `Prije ${Math.max(1, Math.floor(d / 60_000))} min.`;
  const a = new Date(t);
  const b = new Date(sad);
  const istiDan = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (istiDan) return d < 5 * 3600_000 ? "Prije par sati." : "Danas.";
  const jucer = new Date(sad);
  jucer.setDate(jucer.getDate() - 1);
  if (a.getFullYear() === jucer.getFullYear() && a.getMonth() === jucer.getMonth() && a.getDate() === jucer.getDate()) {
    return "Jučer.";
  }
  if (d < 7 * 86400_000) return "Ovaj tjedan.";
  return "Stariji zapis.";
}

function jeStav(v: unknown): v is DebriefStav {
  return v === "osvetnik" || v === "strateg" || v === "pljackas";
}

const VRSTE: KronikaVrsta[] = ["selidba", "gradnja", "pohod", "obrana", "dogadaj", "dostignuce"];

function jeVrsta(v: unknown): v is KronikaVrsta {
  return typeof v === "string" && (VRSTE as string[]).includes(v);
}

export function parsirajKroniku(raw: unknown): KronikaZapis[] {
  if (!Array.isArray(raw)) return [];
  const out: KronikaZapis[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.recap !== "string") continue;
    const stav = jeStav(r.stav) ? r.stav : null;
    const vrsta: KronikaVrsta = jeVrsta(r.vrsta)
      ? r.vrsta
      : stav
        ? r.pobjeda === true
          ? "pohod"
          : "obrana"
        : "selidba";
    out.push({
      id: typeof r.id === "string" ? r.id : `k-${out.length}`,
      t: typeof r.t === "number" && Number.isFinite(r.t) ? r.t : 0,
      metaIme: typeof r.metaIme === "string" ? r.metaIme.slice(0, 48) : "",
      pobjeda: r.pobjeda === true,
      stav,
      recap: r.recap.slice(0, 220),
      vrsta,
    });
    if (out.length >= MAX_KRONIKA) break;
  }
  return out;
}
