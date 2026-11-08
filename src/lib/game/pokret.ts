/** Meka: ulica, listovi, listanje. Ne prelazi 1. */
export const KRIVULJA_MEKA = [0.22, 1, 0.36, 1] as const;
/** Isti hod unatrag: izlaz kadra. */
export const KRIVULJA_IZLAZ = [0.64, 0, 0.78, 0] as const;
/** Skoro: zadnji stupac prođe crtu i sjedne. Samo bliski promašaj. */
export const KRIVULJA_SKORO = [0.18, 1.72, 0.46, 1] as const;
/** Udarac: dobitak, lubanja, slijetanje. Smije prijeći 1. */
export const KRIVULJA_UDARAC = [0.34, 1.36, 0.64, 1] as const;

function polinom(t: number, a: number, b: number) {
  const c = 3 * a;
  const d = 3 * (b - a) - c;
  const e = 1 - c - d;
  return ((e * t + d) * t + c) * t;
}

function nagib(t: number, a: number, b: number) {
  const c = 3 * a;
  const d = 3 * (b - a) - c;
  const e = 1 - c - d;
  return (3 * e * t + 2 * d) * t + c;
}

/** Isti hod kao CSS cubic-bezier. Ulaz je 0–1, izlaz je visina krivulje. */
export function uzorakKrivulje(x: number, x1: number, y1: number, x2: number, y2: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const dx = nagib(t, x1, x2);
    if (Math.abs(dx) < 1e-6) break;
    t = Math.min(1, Math.max(0, t - (polinom(t, x1, x2) - x) / dx));
  }
  return polinom(t, y1, y2);
}

export function uzorakMeka(t: number) {
  return uzorakKrivulje(t, ...KRIVULJA_MEKA);
}

export function uzorakUdarac(t: number) {
  return uzorakKrivulje(t, ...KRIVULJA_UDARAC);
}

export function uzorakSkoro(t: number) {
  return uzorakKrivulje(t, ...KRIVULJA_SKORO);
}

export function uzorakIzlaz(t: number) {
  return uzorakKrivulje(t, ...KRIVULJA_IZLAZ);
}

export function uzorakRavno(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/** Iste krivulje, jedno mjesto. Ravno je hod valjka dok se vrti. */
export const HOD = {
  meka: uzorakMeka,
  izlaz: uzorakIzlaz,
  udarac: uzorakUdarac,
  skoro: uzorakSkoro,
  ravno: uzorakRavno,
} as const;

type Posao = (now: number) => boolean;

const poslovi = new Set<Posao>();
let sat = 0;

function korak(now: number) {
  sat = 0;
  for (const posao of poslovi) {
    if (!posao(now)) poslovi.delete(posao);
  }
  if (poslovi.size > 0) sat = requestAnimationFrame(korak);
}

/** Jedan kadar za sve. Posao vrati false kad stane, sat se ugasi. */
export function zakaziHod(posao: Posao) {
  poslovi.add(posao);
  if (!sat) sat = requestAnimationFrame(korak);
  return () => {
    poslovi.delete(posao);
  };
}
