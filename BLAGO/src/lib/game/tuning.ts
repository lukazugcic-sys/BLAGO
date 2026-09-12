/** Sva ekonomija na jednom mjestu, redom: start → energija → slot → xp → selo → zgrade → alati → meta. */

import type { SimbolId } from "./types";

export const START = {
  zlato: 90,
  dijamanti: 2,
  energija: 20,
  drvo: 28,
  kamen: 6,
  zeljezo: 0,
  stitovi: 1,
  stanovnici: 5,
  kvalitetaSela: 20,
  pilana: 1,
} as const;

export const ENERGY_BASE_MAX = 20;
export const ENERGY_PER_BATTERY = 6;
export const ENERGY_REGEN_MS = 4500;
export const ENERGY_REGEN_PER_LV = 380;
export const ENERGY_REGEN_FLOOR_MS = 2000;
export const BUNAR_ENERGIJA = 0.12;
export const MLIN_ENERGIJA = 0.18;

export const WIN_CHANCE_BASE = 0.09;
export const WIN_CHANCE_PER_LUCK = 0.015;
export const WIN_CHANCE_CAP = 0.18;
export const LINE_MULT = { 3: 1, 4: 3, 5: 6 } as const;
export const JACKPOT_BONUS = 1.4;
export const STREAK_BONUS_PER_WIN = 0.1;
export const MAX_WIN_STREAK = 5;
export const LUCKY_SPIN_INTERVAL = 40;
export const GAMBLE_MAX = 3;
export const GAMBLE_WIN_P = 0.46;
export const POJACALO_PER_LV = 0.06;
export const WILD_BOOST_CHANCE_PER_LEVEL = 0.022;
export const SKULL_GOLD_LOSS = 0.04;
export const LUCKY_WILD_P = 0.28;
export const FORCED_P5 = 0.08;
export const FORCED_P4 = 0.22;

/** Linije na kolu: od 3. Energija od 4. Bonus knjige ima svoje stupce. */
export const MIN_NIZ: Record<SimbolId, number> = {
  skull: 9,
  knjiga: 9,
  wood: 3,
  stone: 3,
  iron: 3,
  gold: 3,
  gem: 3,
  shield: 3,
  wild: 3,
  energy: 4,
};

export function minNiz(id: SimbolId): number {
  return MIN_NIZ[id] ?? 3;
}

export function linijaMnozitelj(n: number): number {
  if (n >= 5) return LINE_MULT[5];
  if (n === 4) return LINE_MULT[4];
  if (n === 3) return LINE_MULT[3];
  return 0;
}

/** Koliko ćelija u nizu posaditi na namještenoj liniji. */
export function rasponNiza(id: SimbolId, rng: () => number = Math.random): number[] {
  const min = Math.min(5, Math.max(3, minNiz(id)));
  const r = rng();
  let n = min;
  if (min <= 3) {
    n = r > 0.96 ? 5 : r > 0.88 ? 4 : 3;
  } else {
    n = r > 0.92 ? 5 : 4;
  }
  return Array.from({ length: n }, (_, i) => i);
}

export const XP_BAZA = 90;
export const XP_EXP = 1.33;
export const XP_LIN = 30;
export const LEVEL_UP_GEMS = 3;
export const PRESTIGE_PER_LV = 0.25;
export const PASIVNI_PO_RAZINI = 0.02;

export const RESOURCE_TICK_MS = 6000;
export const MAX_OFFLINE_MS = 2 * 60 * 60 * 1000;
export const CIJENA_RAST = 1.36;

export const POKRICE = {
  kuca: 5,
  blok: 10,
  bunar: 8,
  cisterna: 6,
  mlin: 10,
  lov: 6,
  mesnica: 7,
  pekara: 7,
  salun: 8,
  karte: 8,
  posao: 4,
  ured: 12,
  staja: 6,
  korali: 5,
  staza: 4,
  farma: 8,
  tor: 8,
  ordinacija: 10,
  travar: 6,
  banja: 7,
  banka: 6,
} as const;

export const BANJA_VODA = 1.4;
export const KONJ_HRANA = 0.5;
export const KONJ_VODA = 0.22;
export const KONJ_CIJENA_ZLATO = 16;
export const KONJ_CIJENA_DRVO = 4;
export const SIJENO_ZLATO = 6;
export const SIJENO_MS = 3 * 60 * 1000;
export const GOVEDO_CIJENA_ZLATO = 12;
export const GOVEDO_CIJENA_DRVO = 3;
export const GOVEDO_HRANA = 0.55;
export const GOVEDO_VODA = 0.28;
export const GOVEDO_TJERAJ = 10;
export const GOVEDO_KLANJE = 7;
export const GOVEDO_KLANJE_MESNICA = 5;
export const KISA_ZLATO = 5;
export const KISA_MS = 4 * 60 * 1000;

export const SELIDBA_PRAG_DOCI = 45;
export const SELIDBA_PRAG_ICI = 30;
export const SELIDBA_DOCI = 0.028;
export const SELIDBA_DOCI_SRECA = 2500;
export const SELIDBA_ICI = 0.04;
export const SALUN_ZLATO_PO_GOSTU = 0.055;
export const BANKA_KAP_PO_LV = 500;
export const BANKA_KAMATA = 0.0008;
export const POPRAVAK_ZLATO = 12;
export const POPRAVAK_DRVO = 5;
export const SHIELD_ROLL_P = 0.07;
export const TOK_BAZA = 0.88;
export const TOK_SPAN = 0.24;

export const PROIZVODNJA = {
  pilana: 0.36,
  kamenolom: 0.18,
  rudnik: 0.08,
} as const;

export const ALAT_MAX = {
  sreca: 6,
  pojacalo: 6,
  baterija: 6,
  oklop: 4,
  wildBoost: 6,
} as const;

export const ALAT_CIJENA_MNOZ = 1.48;

export type AlatId = keyof typeof ALAT_MAX;

export function alatLv(id: AlatId, n: number) {
  return Math.max(0, Math.min(ALAT_MAX[id], Math.floor(Number(n) || 0)));
}

export function alatCijena(baza: number, lv: number) {
  return Math.floor(baza * Math.pow(ALAT_CIJENA_MNOZ, Math.max(0, lv)));
}

/** Jedno krunjenje = jedan skill point za nadogradnju alata. */
export function parsirajKrunjenja(raw: unknown, prestige: number) {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  return Math.max(0, Math.floor(prestige));
}

export const POSTOTAK_KRADJE = 0.12;
export const RAID_ZLATO_BAZA = 14;
export const RAID_ZLATO_PO_LV = 3;

export const FARO_ULOG = 10;
export const FARO_MIN = 1;

export function faroDobitak(ulog: number, karteLv: number) {
  const u = Math.max(0, Math.floor(ulog));
  return Math.floor(u * (karteLv > 0 ? 2.5 : 2));
}

export function faroBankaDobit(ulog: number) {
  return Math.floor(Math.max(0, Math.floor(ulog)) * 0.5);
}

export function faroKrupijeBonus(ulog: number) {
  return Math.max(2, Math.floor(Math.max(0, ulog) * 0.08));
}
export const TRGOVINA_CIJENA = 8;
export const TRGOVINA_BAZA = 3;
