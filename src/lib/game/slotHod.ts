import { HOD } from "./pokret";
import { hodSlijetanje } from "./hodJezgra";
import type { SimbolId } from "./types";

export const SIMBOLI_GL: SimbolId[] = [
  "skull",
  "wood",
  "stone",
  "iron",
  "gold",
  "energy",
  "gem",
  "shield",
  "wild",
  "knjiga",
];

const INDEKS: Record<SimbolId, number> = {
  skull: 0,
  wood: 1,
  stone: 2,
  iron: 3,
  gold: 4,
  energy: 5,
  gem: 6,
  shield: 7,
  wild: 8,
  knjiga: 9,
};

export function indeksSimbola(id: SimbolId) {
  return INDEKS[id] ?? 4;
}

/** Ćelija u sekundi. Isti tempo kao stari CSS hod. */
export function brzinaStupca(col: number) {
  return 3 / (0.24 + col * 0.055);
}

export type HodStupca = {
  mode: "idle" | "spin" | "land";
  offset: number;
  spinT0: number;
  landFrom: number;
  landTo: number;
  landT0: number;
  landMs: number;
  strip: SimbolId[];
  brzina: number;
  bljesak: number;
  sidro: number;
  najava: number;
  skoro: boolean;
};

export function noviHod(): HodStupca {
  return {
    mode: "idle",
    offset: 0,
    spinT0: 0,
    landFrom: 0,
    landTo: 3,
    landT0: 0,
    landMs: 320,
    strip: [],
    brzina: 0,
    bljesak: 0,
    sidro: 0,
    najava: 180,
    skoro: false,
  };
}

export function kreniVrtnju(h: HodStupca, now: number, turbo = false) {
  h.mode = "spin";
  h.spinT0 = now;
  h.sidro = h.offset;
  h.najava = turbo ? 90 : 180;
  h.skoro = false;
}

export function kreniSlijetanje(
  h: HodStupca,
  ghosts: SimbolId[],
  ids: readonly SimbolId[],
  now: number,
  ms: number,
  tease?: SimbolId | null,
) {
  const n = ghosts.length || 1;
  const frac = ((h.offset % n) + n) % n;
  const rot = Math.floor(Math.abs(h.offset)) % n;
  const glava = [0, 1, 2].map((i) => ghosts[(rot + i) % n]!);
  if (tease) {
    h.strip = [...glava, tease, ids[0]!, ids[1]!, ids[2]!, ids[0]!];
    h.landTo = 4;
    h.skoro = true;
  } else {
    h.strip = [...glava, ids[0]!, ids[1]!, ids[2]!, ids[0]!];
    h.landTo = 3;
    h.skoro = false;
  }
  h.landFrom = frac;
  h.landT0 = now;
  h.landMs = ms;
  h.mode = "land";
  h.offset = frac;
}

/** Vrati true dok se stupac još miče. */
export function korakStupca(h: HodStupca, now: number, dt: number, col: number) {
  const prije = h.offset;
  if (h.mode === "spin") {
    const age = now - h.spinT0;
    if (age < h.najava) {
      const u = HOD.meka(age / Math.max(1, h.najava));
      h.offset = h.sidro - 0.2 * u;
      h.brzina = -0.2 / (h.najava / 1000);
      h.bljesak = 0;
      return true;
    }
    const u = HOD.izlaz(Math.min(1, (age - h.najava) / 140));
    h.offset += brzinaStupca(col) * (0.22 + 0.78 * u) * dt;
    h.bljesak = 0;
  } else if (h.mode === "land") {
    const t = (now - h.landT0) / Math.max(1, h.landMs);
    if (t >= 1) {
      h.mode = "idle";
      h.offset = 0;
      h.brzina = 0;
      h.bljesak = 0;
      return false;
    }
    h.offset = h.landFrom + (h.landTo - h.landFrom) * hodSlijetanje(t, h.skoro);
    const d = Math.abs(t - 0.78);
    h.bljesak = d < 0.22 ? 1 - d / 0.22 : 0;
  } else {
    h.brzina = 0;
    h.bljesak = 0;
    return false;
  }
  if (dt > 0) h.brzina = (h.offset - prije) / dt;
  return true;
}

export function simbolNa(h: HodStupca, ghosts: SimbolId[], ids: readonly SimbolId[], index: number) {
  const izvor = h.mode === "land" ? h.strip : h.mode === "spin" ? ghosts : ids;
  const n = izvor.length || 1;
  const i = ((index % n) + n) % n;
  return izvor[i]!;
}
