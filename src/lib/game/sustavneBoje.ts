/**
 * 0.9.178 (t459u): boje Android sustavnih traka = boje koje igra stvarno crta uz rub ekrana.
 * - nav: dno ekrana (donji kraj pozadine .game-shell = void 86 % + crna, ispod tamnog prijelaza
 *   donjeg izbornika rgba(0,0,0,0.36)); izmjereno u pregledniku, provjerava r178.test.mjs.
 * - status: vrh zaglavlja (zaglavlje 92 % preko pozadine).
 * Šalje se nativnoj strani preko BlagoFs.sustavneBoje (MainActivity). Na webu ne radi ništa.
 */
export const SUSTAVNE_BOJE: Record<string, { status: string; nav: string }> = {
  default: { status: "#26150D", nav: "#110905" },
  medieval: { status: "#1D1214", nav: "#0C0709" },
  japanese: { status: "#1B0E0B", nav: "#0B0503" },
  futuristic: { status: "#0F121F", nav: "#05070F" },
};

export function sustavneBojeZa(skinId: string | undefined) {
  return SUSTAVNE_BOJE[skinId ?? "default"] ?? SUSTAVNE_BOJE.default!;
}

type Most = { sustavneBoje?: (status: string, nav: string) => void };

export function postaviSustavneBoje(skinId: string | undefined) {
  if (typeof window === "undefined") return;
  const b = sustavneBojeZa(skinId);
  try {
    (window as Window & { BlagoFs?: Most }).BlagoFs?.sustavneBoje?.(b.status, b.nav);
  } catch {
    /* stari APK bez metode: ostaje boja iz styles.xml */
  }
}
