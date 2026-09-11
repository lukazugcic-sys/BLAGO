export type BjKarta = { r: number; s: number };

export const BJ_BOJE = ["♠", "♥", "♣", "♦"] as const;
export const BJ_RANG = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export function novaKarta(rng: () => number = Math.random): BjKarta {
  return { r: 1 + Math.floor(rng() * 13), s: Math.floor(rng() * 4) };
}

export function kartaBod(r: number) {
  if (r === 1) return 11;
  if (r >= 10) return 10;
  return r;
}

export function rukaBod(karte: BjKarta[]) {
  let t = 0;
  let asevi = 0;
  for (const k of karte) {
    t += kartaBod(k.r);
    if (k.r === 1) asevi += 1;
  }
  while (t > 21 && asevi > 0) {
    t -= 10;
    asevi -= 1;
  }
  return t;
}

export function jeBlackjack(karte: BjKarta[]) {
  return karte.length === 2 && rukaBod(karte) === 21;
}

export function kartaZnak(k: BjKarta) {
  return `${BJ_RANG[k.r - 1]!}${BJ_BOJE[k.s]!}`;
}

export function kartaCrvena(k: BjKarta) {
  return k.s === 1 || k.s === 3;
}

export function dealerVuče(ruka: BjKarta[], rng: () => number = Math.random) {
  const d = [...ruka];
  while (rukaBod(d) < 17) d.push(novaKarta(rng));
  return d;
}

export type BjIshod = "bj" | "pobjeda" | "push" | "poraz";

export function bjIshod(igrac: BjKarta[], dealer: BjKarta[]): BjIshod {
  const a = rukaBod(igrac);
  const b = rukaBod(dealer);
  const aBj = jeBlackjack(igrac);
  const bBj = jeBlackjack(dealer);
  if (a > 21) return "poraz";
  if (aBj && bBj) return "push";
  if (aBj) return "bj";
  if (bBj) return "poraz";
  if (b > 21) return "pobjeda";
  if (a > b) return "pobjeda";
  if (a < b) return "poraz";
  return "push";
}

export function bjIsplata(ulog: number, ishod: BjIshod, karteLv: number) {
  const u = Math.max(0, Math.floor(ulog));
  if (ishod === "poraz") return 0;
  if (ishod === "push") return u;
  if (ishod === "bj") return Math.floor(u * (karteLv > 0 ? 2.6 : 2.5));
  return Math.floor(u * 2);
}

export function bjRec(ishod: BjIshod, igrac: number, dealer: number) {
  if (ishod === "bj") return "Dvadesetjedan. Banka plaća.";
  if (ishod === "push") return `Isto ${igrac}. Ulog stoji.`;
  if (ishod === "pobjeda") {
    if (dealer > 21) return `Banka puca na ${dealer}. Tvoje.`;
    return `${igrac} bije ${dealer}.`;
  }
  if (igrac > 21) return `Pukao si na ${igrac}.`;
  return `Banka ${dealer}. Ti ${igrac}.`;
}
