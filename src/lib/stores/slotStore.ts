import { create } from "zustand";
import type { Dobitak, SimbolId } from "@/lib/game/types";
import { prazanDobitak } from "@/lib/game/knjiga";
import type { DobitakRazina } from "@/lib/game/slotPrikaz";

export type SlotFx = null | "win" | "jackpot" | "skull";
export type KnjigaFaza = null | "uvod" | "igra" | "kraj";
/** Ephemeral win banner for the UI — never saved. */
export type PrikazDobitka = { razina: DobitakRazina; zlato: number; key: number } | null;

type SlotState = {
  simboli: SimbolId[];
  vrti: boolean;
  spinningCols: boolean[];
  ulog: number;
  dobitnaPolja: number[];
  dobitneLinije: number[][];
  dobitakNaCekanju: Dobitak | null;
  turboRezim: boolean;
  winCelebration: SlotFx;
  celebrationKey: number;
  raidAktivan: boolean;
  gambleCount: number;
  autoVrtnja: boolean;
  knjigaFaza: KnjigaFaza;
  expandPolja: number[];
  knjigaLonac: Dobitak;
  znackaFlash: string | null;
  znackaFlashKey: number;
  prikazDobitka: PrikazDobitka;
  setSimboli: (simboli: SimbolId[]) => void;
  setVrti: (vrti: boolean) => void;
  setSpinningCols: (spinningCols: boolean[]) => void;
  setUlog: (ulog: number) => void;
  setDobitnaPolja: (dobitnaPolja: number[]) => void;
  setDobitneLinije: (dobitneLinije: number[][]) => void;
  setDobitakNaCekanju: (dobitakNaCekanju: Dobitak | null) => void;
  setTurboRezim: (turboRezim: boolean) => void;
  setWinCelebration: (tip: SlotFx) => void;
  setRaidAktivan: (raidAktivan: boolean) => void;
  setGambleCount: (gambleCount: number) => void;
  setAutoVrtnja: (autoVrtnja: boolean) => void;
  setKnjigaFaza: (knjigaFaza: KnjigaFaza) => void;
  setExpandPolja: (expandPolja: number[]) => void;
  setKnjigaLonac: (knjigaLonac: Dobitak) => void;
  setZnackaFlash: (rec: string | null) => void;
  setPrikazDobitka: (p: PrikazDobitka) => void;
};

export const useSlotStore = create<SlotState>((set) => ({
  simboli: Array(15).fill("gold") as SimbolId[],
  vrti: false,
  spinningCols: [false, false, false, false, false],
  ulog: 1,
  dobitnaPolja: [],
  dobitneLinije: [],
  dobitakNaCekanju: null,
  turboRezim: false,
  winCelebration: null,
  celebrationKey: 0,
  raidAktivan: false,
  gambleCount: 0,
  autoVrtnja: false,
  knjigaFaza: null,
  expandPolja: [],
  knjigaLonac: prazanDobitak(),
  znackaFlash: null,
  znackaFlashKey: 0,
  prikazDobitka: null,

  setSimboli: (simboli) => set({ simboli }),
  setVrti: (vrti) => set({ vrti }),
  setSpinningCols: (spinningCols) => set({ spinningCols }),
  setUlog: (ulog) => set({ ulog }),
  setDobitnaPolja: (dobitnaPolja) => set({ dobitnaPolja }),
  setDobitneLinije: (dobitneLinije) => set({ dobitneLinije }),
  setDobitakNaCekanju: (dobitakNaCekanju) =>
    set({
      dobitakNaCekanju,
      ...(dobitakNaCekanju === null ? { gambleCount: 0 } : {}),
    }),
  setTurboRezim: (turboRezim) => set({ turboRezim }),
  setWinCelebration: (tip) =>
    set((s) => ({
      winCelebration: tip,
      celebrationKey: tip ? s.celebrationKey + 1 : s.celebrationKey,
    })),
  setRaidAktivan: (raidAktivan) =>
    set({ raidAktivan, ...(raidAktivan ? { autoVrtnja: false } : {}) }),
  setGambleCount: (gambleCount) => set({ gambleCount }),
  setAutoVrtnja: (autoVrtnja) => set({ autoVrtnja }),
  setKnjigaFaza: (knjigaFaza) => set({ knjigaFaza }),
  setExpandPolja: (expandPolja) => set({ expandPolja }),
  setKnjigaLonac: (knjigaLonac) => set({ knjigaLonac }),
  setZnackaFlash: (rec) =>
    set((s) => ({
      znackaFlash: rec,
      znackaFlashKey: rec ? s.znackaFlashKey + 1 : s.znackaFlashKey,
    })),
  setPrikazDobitka: (prikazDobitka) => set({ prikazDobitka }),
}));
