import { POTREBE_META, type KaubaUsko, type KaubaUtjecaj } from "./economy";
import type { Gradevine, Klan, Ostecenja } from "./types";
import { BAZA_SELO, izgradiMrezu, type MrezaCvor, type MrezaUlaz, type MrezaVeza } from "./mreza";

export const SELO_XY = { x: 50, y: 50 };

export const HUB_TOCKE: Array<{ id: KaubaUsko; x: number; y: number }> = [
  { id: "red", x: 50, y: 16 },
  { id: "krov", x: 22, y: 32 },
  { id: "voda", x: 78, y: 32 },
  { id: "jelo", x: 22, y: 58 },
  { id: "posao", x: 78, y: 58 },
  { id: "zdravlje", x: 22, y: 82 },
  { id: "zabava", x: 50, y: 82 },
  { id: "konji", x: 78, y: 82 },
];

export const OBRUC: Array<[KaubaUsko, KaubaUsko]> = [
  ["red", "krov"],
  ["red", "voda"],
  ["krov", "jelo"],
  ["voda", "posao"],
  ["jelo", "zdravlje"],
  ["posao", "konji"],
  ["zdravlje", "zabava"],
  ["zabava", "konji"],
  ["krov", "voda"],
  ["jelo", "posao"],
  ["red", "zabava"],
];

const NULA_G: Gradevine = {
  pilana: 0, kamenolom: 0, rudnik: 0, kuca: 0, blok: 0, salun: 0, karte: 0,
  bunar: 0, cisterna: 0, mlin: 0, lov: 0, mesnica: 0, pekara: 0, ured: 0,
  staja: 0, korali: 0, staza: 0, farma: 0, tor: 0, ordinacija: 0, travar: 0,
  banja: 0, trgovina: 0, banka: 0, kovacnica: 0, barutana: 0, tvornica: 0,
};

const NULA_O: Ostecenja = {
  pilana: false, kamenolom: false, rudnik: false, kuca: false, blok: false, salun: false, karte: false,
  bunar: false, cisterna: false, mlin: false, lov: false, mesnica: false, pekara: false, ured: false,
  staja: false, korali: false, staza: false, farma: false, tor: false, ordinacija: false, travar: false,
  banja: false, trgovina: false, banka: false, kovacnica: false, barutana: false, tvornica: false,
};

const NULA_KLAN: Klan = { naziv: null, razina: 0, xp: 0, zadaci: [], zadnjiRefresh: null };

export function siguranUlaz(s: Partial<MrezaUlaz> | null | undefined): MrezaUlaz {
  const g = s?.gradevine;
  const o = s?.ostecenja;
  return {
    imeIgraca: s?.imeIgraca || "Selo",
    gradevine: { ...NULA_G, ...(g ?? {}) },
    ostecenja: { ...NULA_O, ...(o ?? {}) },
    stitovi: Number(s?.stitovi) || 0,
    oklop: Number(s?.oklop) || 0,
    klan: s?.klan ?? NULA_KLAN,
    stavSela: s?.stavSela ?? null,
    kronika: Array.isArray(s?.kronika) ? s!.kronika : [],
    igracRazina: Number(s?.igracRazina) || 0,
    prestigeRazina: Number(s?.prestigeRazina) || 0,
  };
}

export type HubZgrada = {
  id: keyof Gradevine;
  naziv: string;
  kvaliteta: number;
  doprinos: number;
  opis: string;
};

export type HubPrikaz = {
  id: KaubaUsko;
  naziv: string;
  x: number;
  y: number;
  kvaliteta: number;
  doprinos: number;
  mutan: boolean;
  zgrade: HubZgrada[];
};

export function brojZgrada(n: number) {
  const k = Math.abs(Math.trunc(n));
  const a = k % 100;
  const b = k % 10;
  const rijec = a >= 11 && a <= 14 ? "zgrada" : b === 1 ? "zgrada" : b >= 2 && b <= 4 ? "zgrade" : "zgrada";
  return `${k} ${rijec}`;
}

export function spojiUtjecaje(lista: KaubaUtjecaj[]) {
  const mapa = new Map<string, KaubaUtjecaj>();
  for (const u of lista ?? []) {
    if (!u?.od || !u?.do) continue;
    const pred = u.predznak < 0 ? -1 : 1;
    const kljuc = `${u.od}>${u.do}:${pred}`;
    const stari = mapa.get(kljuc);
    const jacina = Math.max(0, Number(u.jacina) || 0);
    if (!stari || jacina > stari.jacina) mapa.set(kljuc, { ...u, predznak: pred, jacina });
  }
  return [...mapa.values()];
}

export function krivulja(a: { x: number; y: number }, b: { x: number; y: number }, k: number, strana: 1 | -1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 + (-dy / len) * len * k * strana;
  const cy = (a.y + b.y) / 2 + (dx / len) * len * k * strana;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function debljinaDoprinos(doprinos: number) {
  return 0.7 + Math.min(1.4, Math.abs(doprinos) / 28);
}

export function debljinaJacine(jacina: number) {
  return 0.55 + Math.min(1.1, Math.max(0, jacina));
}

export function stisniPomak(zum: number, x: number, y: number) {
  if (!(zum > 1)) return { x: 0, y: 0 };
  const m = (zum - 1) * 28;
  return {
    x: Math.max(-m, Math.min(m, x)),
    y: Math.max(-m, Math.min(m, y)),
  };
}

export function stisniZum(z: number) {
  if (!Number.isFinite(z)) return 1;
  return Math.max(1, Math.min(2.4, z));
}

function cvorZgrade(cvorovi: MrezaCvor[], id: keyof Gradevine) {
  return cvorovi.find((c) => c.zgradaId === id);
}

export function huboviIz(cvorovi: MrezaCvor[], veze: MrezaVeza[]): HubPrikaz[] {
  return HUB_TOCKE.map((t) => {
    const meta = POTREBE_META.find((p) => p.id === t.id);
    const zgrade: HubZgrada[] = (meta?.zgrade ?? []).map((id) => {
      const c = cvorZgrade(cvorovi, id);
      const veza = veze.find((v) => v.od === `z:${id}` && v.do === "selo");
      return {
        id,
        naziv: c?.naziv ?? id,
        kvaliteta: c?.kvaliteta ?? 0,
        doprinos: veza?.doprinos ?? 0,
        opis: veza?.opis ?? "",
      };
    });
    const kvaliteta = zgrade.length ? Math.round(zgrade.reduce((a, z) => a + z.kvaliteta, 0) / zgrade.length) : 0;
    return {
      id: t.id,
      naziv: meta?.naziv ?? t.id,
      x: t.x,
      y: t.y,
      kvaliteta,
      doprinos: zgrade.reduce((a, z) => a + z.doprinos, 0),
      mutan: zgrade.every((z) => z.kvaliteta <= 0),
      zgrade,
    };
  });
}

export function imaUtjecaj(lista: KaubaUtjecaj[], a: KaubaUsko, b: KaubaUsko) {
  return lista.some((u) => (u.od === a && u.do === b) || (u.od === b && u.do === a));
}

export function najjaciUtjecaji(lista: KaubaUtjecaj[], n = 5) {
  return [...(lista ?? [])].sort((a, b) => Math.abs(b.jacina) - Math.abs(a.jacina)).slice(0, n);
}

export function bojaKvalitete(n: number) {
  if (n >= 50) return "#3d8f4a";
  if (n >= 25) return "var(--color-gold)";
  return "#c44848";
}

export function sloziTok(ulaz: Partial<MrezaUlaz> | null | undefined) {
  const siguran = siguranUlaz(ulaz);
  const mreza = izgradiMrezu(siguran);
  const selo = mreza.cvorovi.find((c) => c.id === "selo");
  const dodaci = mreza.cvorovi.filter((c) => c.vrsta !== "selo" && c.vrsta !== "zgrada");
  return {
    baza: BAZA_SELO,
    selo: {
      id: "selo",
      naziv: selo?.naziv || siguran.imeIgraca || "Selo",
      kvaliteta: selo?.kvaliteta ?? BAZA_SELO,
      x: SELO_XY.x,
      y: SELO_XY.y,
    },
    hubovi: huboviIz(mreza.cvorovi, mreza.veze),
    dodaci,
    veze: mreza.veze,
    cvorovi: mreza.cvorovi,
  };
}
