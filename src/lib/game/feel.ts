export function smanjenPokret() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** UI chip / nav: kratki hold. */
export const HOLD_UI_MS = 380;
/** Polukrug na kadru: teži čin, western masa. */
export const HOLD_KADAR_MS = 480;
/** Auto-spin / brza kupnja: namjera nije tap. */
export const HOLD_AUTO_MS = 480;
/** Oprost ranog pustanja — ne skraćuje vizual. */
export const HOLD_COYOTE_MS = 80;
export const FEEL_COYOTE_MS = HOLD_COYOTE_MS;
/** Palac smije treperiti. */
export const HOLD_PX = 18;
export const FEEL_EVENT = "blago:feel";

export type FeelRang =
  | "tap"
  | "hold"
  | "spin"
  | "collect"
  | "win"
  | "jackpot"
  | "skull"
  | "raid"
  | "build";

const SFX_RANG: Record<string, FeelRang> = {
  button: "tap",
  spin: "spin",
  collect: "collect",
  win: "win",
  jackpot: "jackpot",
  skull: "skull",
  attack: "raid",
  build: "build",
};

const VIB: Record<FeelRang, number | number[]> = {
  tap: 8,
  hold: 14,
  spin: 12,
  collect: 10,
  win: [16, 42, 22],
  jackpot: [24, 50, 22, 64, 36],
  skull: [32, 40, 48],
  raid: [16, 28, 20],
  build: [18, 32, 48],
};

const VIB_KLJUC = "blago-v1:vib";
let vibOn = true;

export function vibracijaJeUkljucena() {
  return vibOn;
}

export function ucitajVibraciju() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(VIB_KLJUC);
    vibOn = raw === null ? true : raw === "1";
  } catch {
    vibOn = true;
  }
}

export function postaviVibraciju(on: boolean) {
  vibOn = on;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIB_KLJUC, on ? "1" : "0");
  } catch {
    /* kvota */
  }
}

type CapHaptics = {
  impact?: (o: { style: string }) => Promise<void>;
  vibrate?: (o: { duration: number }) => Promise<void>;
  notification?: (o: { type: string }) => Promise<void>;
};

function capacitorHaptics(): CapHaptics | null {
  const cap = (globalThis as { Capacitor?: { Plugins?: { Haptics?: CapHaptics } } }).Capacitor;
  return cap?.Plugins?.Haptics ?? null;
}

function trajanje(ms: number | number[]) {
  if (!Array.isArray(ms)) return ms;
  let z = 0;
  for (let i = 0; i < ms.length; i += 2) z += ms[i] || 0;
  return z;
}

/** Plugin ako postoji, inače navigator.vibrate. Poštuje preklopnik. */
export function izvediHaptiku(ms: number | number[]) {
  if (!vibOn || typeof window === "undefined") return;
  const H = capacitorHaptics();
  const ukupno = trajanje(ms);
  if (H) {
    const stil = ukupno >= 28 ? "HEAVY" : ukupno >= 16 ? "MEDIUM" : "LIGHT";
    void (async () => {
      try {
        if (ukupno >= 40 && H.notification) {
          await H.notification({ type: "SUCCESS" });
          return;
        }
        if (H.impact) {
          await H.impact({ style: stil });
          return;
        }
        if (H.vibrate) {
          await H.vibrate({ duration: Math.min(400, ukupno) });
          return;
        }
      } catch {
        /* padni na web */
      }
      try {
        navigator.vibrate?.(ms);
      } catch {
        /* nema motora */
      }
    })();
    return;
  }
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* nema motora */
  }
}

export function haptika(vrsta: "kolut" | "dobitak" | "veliki" | "gradnja") {
  if (vrsta === "kolut") izvediHaptiku(12);
  else if (vrsta === "dobitak") izvediHaptiku(VIB.win);
  else if (vrsta === "veliki") izvediHaptiku(VIB.jackpot);
  else izvediHaptiku(VIB.build);
}

export function holdDosta(start: number, ms: number, coyote = HOLD_COYOTE_MS) {
  return Date.now() - start >= ms - coyote;
}

export type FeelCips = {
  zlato?: number;
  dijamanti?: number;
  drvo?: number;
  kamen?: number;
  zeljezo?: number;
  stitovi?: number;
  energija?: number;
};

export type FeelDetalj = { rang: FeelRang; x?: number; y?: number; cips?: FeelCips };

export function osjeti(rang: FeelRang, extra?: Omit<FeelDetalj, "rang">) {
  izvediHaptiku(VIB[rang]);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEEL_EVENT, { detail: { rang, ...extra } }));
}

export function prijaviFeel(sfx: string) {
  const rang = SFX_RANG[sfx];
  if (rang) osjeti(rang);
}
