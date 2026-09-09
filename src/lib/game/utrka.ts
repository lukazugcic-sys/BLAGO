export type UtrkaKonj = {
  id: string;
  ime: string;
  tvoj: boolean;
  boja: string;
  brzina: number;
};

export const UTRKA_NPC: Array<Pick<UtrkaKonj, "id" | "ime" | "boja">> = [
  { id: "crni", ime: "Crni", boja: "#1c1410" },
  { id: "ridi", ime: "Riđi", boja: "#8a3a14" },
  { id: "sivi", ime: "Sivi", boja: "#6a5a48" },
];

export function tvojUtrkaBonus(jahanje: number, sijeno: boolean, stazaLv: number) {
  return Math.max(0, jahanje) * 0.045 + (sijeno ? 0.08 : 0) + Math.max(0, stazaLv) * 0.028;
}

export function trciUtrku(opts: {
  jahanje: number;
  sijeno: boolean;
  stazaLv: number;
  rng?: () => number;
}): { red: UtrkaKonj[]; pobjednik: UtrkaKonj } {
  const rng = opts.rng ?? Math.random;
  const tvoj: UtrkaKonj = {
    id: "tvoj",
    ime: "Tvoj",
    tvoj: true,
    boja: "#c4783a",
    brzina: 0.4 + tvojUtrkaBonus(opts.jahanje, opts.sijeno, opts.stazaLv) + rng() * 0.22,
  };
  const npc: UtrkaKonj[] = UTRKA_NPC.map((k) => ({
    ...k,
    tvoj: false,
    brzina: 0.42 + rng() * 0.28,
  }));
  const red = [tvoj, ...npc].sort((a, b) => b.brzina - a.brzina);
  return { red, pobjednik: red[0]! };
}

export function utrkaIsplata(ulog: number, pobjeda: boolean) {
  const u = Math.max(0, Math.floor(ulog));
  return pobjeda ? u * 3 : 0;
}

export function utrkaTrajanje(brzina: number, pobjednikBrzina: number) {
  const p = Math.max(0.08, pobjednikBrzina);
  const b = Math.max(0.08, brzina);
  return Math.round(2200 * (p / b));
}
