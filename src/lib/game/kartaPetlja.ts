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
