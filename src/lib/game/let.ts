import type { Nagrada } from "./types";

export const LET_EVENT = "blago:let";

export type LetCips = {
  zlato?: number;
  dijamanti?: number;
  drvo?: number;
  kamen?: number;
  zeljezo?: number;
  energija?: number;
  stitovi?: number;
};

const dozvola = new Map<string, number>();

const KLJUC: Record<keyof LetCips, string> = {
  zlato: "zlato",
  dijamanti: "dijamanti",
  drvo: "drvo",
  kamen: "kamen",
  zeljezo: "željezo",
  energija: "energija",
  stitovi: "štitovi",
};

export function letZaChip(chip: string) {
  return (dozvola.get(chip) ?? 0) > performance.now();
}

function oznaci(cips: LetCips) {
  const doKad = performance.now() + 800;
  (Object.keys(KLJUC) as Array<keyof LetCips>).forEach((k) => {
    if ((cips[k] || 0) > 0) dozvola.set(KLJUC[k], doKad);
  });
}

function sredina(sel?: string) {
  if (typeof document === "undefined") return { x: 0, y: 0 };
  const aktiv = document.activeElement as HTMLElement | null;
  const izAktivnog = () => {
    if (!aktiv || aktiv === document.body || aktiv === document.documentElement) return null;
    const r = aktiv.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const iz = izAktivnog();
  if (iz) return iz;
  const el = document.querySelector(sel || "[data-testid=zavrti]");
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.62 };
}

export function pustiLet(cips: LetCips, sel?: string) {
  if (typeof window === "undefined") return;
  const ima = (Object.keys(cips) as Array<keyof LetCips>).some((k) => (cips[k] || 0) > 0);
  if (!ima) return;
  oznaci(cips);
  const od = sredina(sel);
  window.dispatchEvent(new CustomEvent(LET_EVENT, { detail: { cips, x: od.x, y: od.y } }));
}

export function pustiLetNagrade(n: Nagrada, sel?: string) {
  pustiLet(
    {
      zlato: n.zlato,
      dijamanti: n.dijamanti,
      drvo: n.drvo,
      kamen: n.kamen,
      zeljezo: n.zeljezo,
      energija: n.energija,
      stitovi: n.stitovi,
    },
    sel,
  );
}
