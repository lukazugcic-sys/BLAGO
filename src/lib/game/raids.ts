import { NPC_IMENA } from "./constants";
import { clamp } from "./helpers";
import type { Resursi } from "./types";

export const POSTOTAK_KRADJE = 0.15;
export const MAX_HRPA = 6;

export type Plijen = Resursi & { zlato: number };
export type Hrpe = [number, number, number];
export type NimPotez = { hrpa: 0 | 1 | 2; skini: number };

export function jeNpcUid(uid: string) {
  return uid.startsWith("npc-");
}

function steal(n: number) {
  const x = Math.max(0, Math.floor(Number(n) || 0));
  if (x <= 0) return 0;
  return Math.max(1, Math.floor(x * POSTOTAK_KRADJE));
}

export function izracunajPlijen(resursi: Resursi, razina = 1): Plijen {
  return {
    drvo: steal(resursi.drvo),
    kamen: steal(resursi.kamen),
    zeljezo: steal(resursi.zeljezo),
    zlato: Math.max(10, 10 + razina * 2),
  };
}

export function plijenUkupno(p: Partial<Plijen> | Resursi) {
  const g = "zlato" in p ? (p.zlato ?? 0) : 0;
  return (p.drvo ?? 0) + (p.kamen ?? 0) + (p.zeljezo ?? 0) + g;
}

const CHUNK = 48;

export function velicinaHrpe(n: number): number {
  if (n <= 0) return 0;
  return clamp(Math.round(n / CHUNK), 1, MAX_HRPA);
}

export function hrpeIzResursa(r: Resursi): Hrpe {
  return [velicinaHrpe(r.drvo), velicinaHrpe(r.kamen), velicinaHrpe(r.zeljezo)];
}

export function resursiIzHrpa(h: Hrpe): Resursi {
  return {
    drvo: h[0] * CHUNK,
    kamen: h[1] * CHUNK,
    zeljezo: h[2] * CHUNK,
  };
}

export function nimZbroj(h: Hrpe): number {
  return h[0] ^ h[1] ^ h[2];
}

export function jeTerminal(h: Hrpe): boolean {
  return h[0] + h[1] + h[2] === 0;
}

export function jeUtvrdjeno(h: Hrpe): boolean {
  return nimZbroj(h) === 0 && !jeTerminal(h);
}

export function primijeniPotez(h: Hrpe, p: NimPotez): Hrpe {
  const next: Hrpe = [h[0], h[1], h[2]];
  const i = p.hrpa;
  next[i] = Math.max(0, next[i] - Math.max(1, Math.floor(p.skini)));
  return next;
}

export function jeLegalniPotez(h: Hrpe, p: NimPotez): boolean {
  if (p.hrpa !== 0 && p.hrpa !== 1 && p.hrpa !== 2) return false;
  const skini = Math.floor(p.skini);
  return skini >= 1 && skini <= h[p.hrpa];
}

export function pobjednickiPotez(h: Hrpe): NimPotez | null {
  const s = nimZbroj(h);
  if (s === 0) return null;
  for (let i = 0; i < 3; i++) {
    const cilj = h[i]! ^ s;
    if (cilj < h[i]!) {
      return { hrpa: i as 0 | 1 | 2, skini: h[i]! - cilj };
    }
  }
  return null;
}

export function npcPotez(h: Hrpe): NimPotez | null {
  const win = pobjednickiPotez(h);
  if (win) return win;
  let naj = -1;
  let idx: 0 | 1 | 2 = 0;
  for (let i = 0; i < 3; i++) {
    if (h[i]! > naj) {
      naj = h[i]!;
      idx = i as 0 | 1 | 2;
    }
  }
  if (naj <= 0) return null;
  return { hrpa: idx, skini: 1 };
}

function slucajneHrpe(utvrdjeno: boolean): Hrpe {
  const rnd = () => 2 + Math.floor(Math.random() * 5);
  let h: Hrpe = [rnd(), rnd(), rnd()];
  if (utvrdjeno) {
    const p = pobjednickiPotez(h);
    if (p) h = primijeniPotez(h, p);
    if (jeTerminal(h) || nimZbroj(h) !== 0) h = [1, 2, 3];
    if (h[0] + h[1] + h[2] < 3) h = [1, 2, 3];
  } else if (nimZbroj(h) === 0) {
    h = [h[0], h[1], Math.min(MAX_HRPA, h[2] + 1)];
    if (nimZbroj(h) === 0) h = [2, 3, 4];
  }
  return h;
}

function izmijesaj<T>(izvor: readonly T[]): T[] {
  const a = [...izvor];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function dohvatiLokalneMete(n = 5, igracRazina = 1) {
  const imena = izmijesaj(NPC_IMENA).slice(0, n);
  const utvrdjeni = Math.floor(Math.random() * Math.max(1, imena.length));
  return imena.map((ime, i) => {
    const razina = Math.max(3, igracRazina + Math.floor(Math.random() * 10) - 2);
    const hrpe = slucajneHrpe(i === utvrdjeni);
    return {
      uid: `npc-${i}-${ime}`,
      imeIgraca: ime,
      igracRazina: razina,
      resursi: resursiIzHrpa(hrpe),
    };
  });
}
