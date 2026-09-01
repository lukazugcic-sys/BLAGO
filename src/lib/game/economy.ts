export const RESOURCE_TICK_MS = 6000;
export const ENERGY_REGEN_MS = 2000;
export const MAX_OFFLINE_MS = 2 * 60 * 60 * 1000;
export const GAMBLE_MAX = 3;
export const GAMBLE_WIN_P = 0.48;

export const izracunajMaxEnergiju = (baterija: number) => 80 + baterija * 35;

/** 2s at rank 0, faster with Volt-remen, floor 0.8s. */
export const izracunajEnergijaRegenMs = (baterija: number) =>
  Math.max(800, ENERGY_REGEN_MS - Math.max(0, baterija) * 180);

export const izracunajMaxStitova = (oklop: number) => 1 + oklop;

export const izracunajSansuZaDobitak = (sreca: number) =>
  Math.min(0.28, 0.11 + sreca * 0.012);

/** Gentle early, stretching late. L1≈100, L5≈250, L10≈590, L20≈3000, L30≈17k */
export const izracunajPotrebniXp = (razina: number) =>
  Math.floor(85 * Math.pow(1.2, Math.max(0, razina - 1)) + 15 * Math.max(1, razina));

export const izracunajPrestigeMnozitelj = (prestige: number) =>
  1 + prestige * 0.5;

export const izracunajPasivniMnozitelj = (
  igracRazina: number,
  prestigeRazina: number,
) => (1 + igracRazina * 0.03) * izracunajPrestigeMnozitelj(prestigeRazina);

export const izracunajTokMnozitelj = (kvalitetaSela: number) => {
  const k = Math.max(0, Math.min(100, kvalitetaSela));
  return 0.88 + (0.24 * k) / 100;
};

export const LINE_MULT = { 3: 1, 4: 3, 5: 8 } as const;
export const JACKPOT_BONUS = 1.5;

/** Participation XP even on a miss, plus extra per winning cell. */
export const izracunajXpVrtnje = (ulog: number, dobitneCelije: number, sretna: boolean) => {
  const baza = Math.max(1, ulog) * 4;
  const linija = dobitneCelije * Math.max(1, ulog) * 5;
  const sreca = sretna ? 25 : 0;
  return baza + linija + sreca;
};
