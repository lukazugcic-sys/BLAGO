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

/** Jahanje nosi malo. Staza uči. Sijeno drži dah. Sreća ostaje gospodar. */
export function tvojUtrkaBonus(jahanje: number, sijeno: boolean, stazaLv: number) {
  const j = Math.min(4, Math.max(0, jahanje));
  const s = Math.min(6, Math.max(0, stazaLv));
  return j * 0.012 + (sijeno ? 0.02 : 0) + s * 0.006;
}

export function trciUtrku(opts: {
  jahanje: number;
  sijeno: boolean;
  stazaLv: number;
  rng?: () => number;
}): { red: UtrkaKonj[]; pobjednik: UtrkaKonj } {
  const rng = opts.rng ?? Math.random;
  const staza = Math.max(0, opts.stazaLv);
  const tvoj: UtrkaKonj = {
    id: "tvoj",
    ime: "Tvoj",
    tvoj: true,
    boja: "#c4783a",
    brzina: 0.7 + tvojUtrkaBonus(opts.jahanje, opts.sijeno, staza) + rng() * 0.24,
  };
  const npc: UtrkaKonj[] = UTRKA_NPC.map((k) => ({
    ...k,
    tvoj: false,
    brzina: 0.7 + Math.min(6, staza) * 0.004 + rng() * 0.24,
  }));
  const red = [tvoj, ...npc].sort((a, b) => b.brzina - a.brzina);
  return { red, pobjednik: red[0]! };
}

export function utrkaMjesto(red: UtrkaKonj[], id = "tvoj") {
  const i = red.findIndex((k) => k.id === id);
  return i < 0 ? red.length : i + 1;
}

/** Prvi duplo. Drugi vraća ulog. Ostali jedu prašinu. */
export function utrkaIsplata(ulog: number, mjesto: number) {
  const u = Math.max(0, Math.floor(ulog));
  if (mjesto === 1) return u * 2;
  if (mjesto === 2) return u;
  return 0;
}

export function utrkaTrajanje(brzina: number, pobjednikBrzina: number) {
  const p = Math.max(0.08, pobjednikBrzina);
  const b = Math.max(0.08, brzina);
  return Math.round(2200 * (p / b));
}
