/** Jedna petlja crtanja karte. Drugi poziv ne otvara novu. Gašenje otkaže kadar prije novog. */
const poslovi = new Set<() => void>();
let sat = 0;

export function kartaPetljaBroj() {
  return sat ? 1 : 0;
}

function korak() {
  sat = 0;
  if (poslovi.size === 0) return;
  for (const fn of [...poslovi]) fn();
  if (poslovi.size === 0 || sat) return;
  sat = requestAnimationFrame(korak);
}

export function kartaPetljaPokreni(fn: () => void) {
  poslovi.add(fn);
  if (!sat) sat = requestAnimationFrame(korak);
  return () => {
    poslovi.delete(fn);
    if (poslovi.size === 0 && sat) {
      cancelAnimationFrame(sat);
      sat = 0;
    }
  };
}

/**
 * 0.9.177 (t448u): dok se karta vuče/zumira (i dok traje inercija), hodači miruju — kadar tada
 * pomiče samo kompozitirani sloj svijeta (bez paint/layerize zbog agenata). Kamera javlja pomak.
 */
let kameraU = -1e9;
export const KAMERA_MIRUJE_MS = 140;
export function kameraSeMakla(t = performance.now()) {
  kameraU = t;
}
export function kameraSeMice(t = performance.now()) {
  return t - kameraU < KAMERA_MIRUJE_MS;
}
