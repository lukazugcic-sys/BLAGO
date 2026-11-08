import { clamp } from "./helpers";
import { SUSJEDI } from "./susjedi";
import { tjedanSad } from "./tjedan";
import type { Resursi } from "./types";
import { POSTOTAK_KRADJE, RAID_ZLATO_BAZA, RAID_ZLATO_PO_LV } from "./tuning";

export { POSTOTAK_KRADJE };
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

export function izracunajPlijen(resursi: Resursi, razina = 1, radKonja = 0, jato = 0): Plijen {
  const k = 1 + Math.max(0, radKonja) * 0.06 + Math.max(0, Math.min(3, jato)) * 0.08;
  return {
    drvo: Math.floor(steal(resursi.drvo) * k),
    kamen: Math.floor(steal(resursi.kamen) * k),
    zeljezo: Math.floor(steal(resursi.zeljezo) * k),
    zlato: Math.floor(Math.max(10, RAID_ZLATO_BAZA + razina * RAID_ZLATO_PO_LV) * k),
  };
}

/** Jahanje tvojih konja. Ophodnja njihovih. Tko jaše prvi, bira hrpu. */
export function tkoIdePrvi(jahanje: number, ophodnja: number): "igrac" | "npc" {
  if ((jahanje || 0) > 0) return "igrac";
  if ((ophodnja || 0) > 0) return "npc";
  return "igrac";
}

export function noviPohodId() {
  return `p-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export type TrojacTko = "vodja" | "saveznik" | "serif";

/** Red: vođa, saveznik, šerif. Ako jato ostane samo, šerif ide odmah. */
export function sljedeciTrojac(tko: TrojacTko, saveznikTu = true): TrojacTko {
  if (tko === "vodja") return saveznikTu ? "saveznik" : "serif";
  if (tko === "saveznik") return "serif";
  return "vodja";
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

/** Koji je potez pretvorio prije → poslije. Za animaciju tuđeg uzimanja. */
export function potezIzDelte(prije: Hrpe, poslije: Hrpe): NimPotez | null {
  for (let i = 0; i < 3; i++) {
    const d = (prije[i] ?? 0) - (poslije[i] ?? 0);
    if (d > 0) return { hrpa: i as 0 | 1 | 2, skini: d };
  }
  return null;
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

function slucajniPotez(h: Hrpe): NimPotez | null {
  const opcije: NimPotez[] = [];
  for (let i = 0; i < 3; i++) {
    const n = h[i]!;
    for (let k = 1; k <= n; k++) opcije.push({ hrpa: i as 0 | 1 | 2, skini: k });
  }
  if (!opcije.length) return null;
  return opcije[Math.floor(Math.random() * opcije.length)]!;
}

/** 0.28–0.68: susjed nikad ne igra savršeno, pa pohod nije mrtav zid. Jato spušta vještinu. */
export function npcVjestina(igracLv: number, metaLv: number, jatoBonus = 0) {
  const baza = Math.max(0.28, Math.min(0.68, 0.42 + (metaLv - igracLv) * 0.03));
  return Math.max(0.08, Math.min(0.68, baza - Math.max(0, jatoBonus)));
}

export const POHOD_JATO_MAX = 3;

export type PohodJatoClan = {
  posao: string;
  hub: string;
  razina: number;
  glavni?: boolean;
};

export function jatoPohodBonus(clanovi: PohodJatoClan[]) {
  let n = 0;
  for (const p of clanovi.slice(0, POHOD_JATO_MAX)) {
    n += 0.1;
    if (p.glavni) n += 0.04;
    if (p.posao === "Šerif" || p.posao === "Zamjenik") n += 0.06;
    if (p.hub === "konji" || p.posao === "Šerif" || p.posao === "Zamjenik") n += 0.03;
    n += Math.min(0.04, Math.max(0, p.razina) * 0.008);
  }
  return Math.min(0.45, n);
}

export { ocistiPohodJato, okupiValter, pohodJato, postaviPohodJato, uPohodu } from "./pohodJato";

export function npcPotez(h: Hrpe, vjestina = 0.5): NimPotez | null {
  if (jeTerminal(h)) return null;
  const win = pobjednickiPotez(h);
  if (win && Math.random() < Math.max(0, Math.min(1, vjestina))) return win;
  return slucajniPotez(h);
}

/** Prvi na potezu ne sjeda na izgubljenu (xor 0) ploču. */
export function osigurajPobjednickiStart(h: Hrpe): Hrpe {
  let next: Hrpe = [h[0], h[1], h[2]];
  if (jeTerminal(next)) next = [2, 3, 1];
  if (nimZbroj(next) === 0) {
    let idx = 0;
    let naj = 99;
    for (let i = 0; i < 3; i++) {
      if (next[i]! <= naj && next[i]! < MAX_HRPA) {
        naj = next[i]!;
        idx = i;
      }
    }
    const copy: Hrpe = [next[0], next[1], next[2]];
    copy[idx] = Math.min(MAX_HRPA, copy[idx]! + 1);
    next = copy;
    if (nimZbroj(next) === 0 || jeTerminal(next)) next = [2, 3, 4];
  }
  return next;
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

export function dohvatiLokalneMete(n = 5, igracRazina = 1) {
  const t = tjedanSad();
  const red = [...SUSJEDI];
  if (t.susjed) {
    const i = red.findIndex((s) => s.uid === t.susjed!.uid);
    if (i > 0) {
      const [hit] = red.splice(i, 1);
      if (hit) red.unshift(hit);
    }
  }
  const susjedi = red.slice(0, Math.max(1, Math.min(n, red.length)));
  const utvrdjeni = Math.floor(Math.random() * Math.max(1, susjedi.length));
  return susjedi.map((s, i) => {
    const razina = Math.max(3, igracRazina + Math.floor(Math.random() * 8) - 2);
    const hrpe = slucajneHrpe(i === utvrdjeni);
    return {
      uid: s.uid,
      imeIgraca: s.kauba,
      igracRazina: razina,
      resursi: resursiIzHrpa(hrpe),
      kauba: s.kauba,
      serif: s.serif,
      rec: s.rec,
    };
  });
}
