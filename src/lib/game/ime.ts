const ZAMJENA =
  /^(kauba|kauboj|kauboju|igrač|igrac|astro-kauboj|dev user|stranac)$/i;

/** Ime nije upisano: prazno, same zagrade ili zadani nadimak. */
export function imeJePrazno(ime: string | null | undefined): boolean {
  const t = (ime ?? "").replace(/\s+/g, " ").trim();
  if (!t) return true;
  if (/^[\s()[\]{}.,'"`~!?:;\-–—]+$/.test(t)) return true;
  return ZAMJENA.test(t);
}

/** Natpis u traci. Nikad prazne zagrade. */
export function imeZaNatpis(ime: string | null | undefined): string {
  return imeJePrazno(ime) ? "Kauboju" : (ime ?? "").trim();
}

/** Manji font prije trotočke. Do deset znakova stane cijelo. */
export function velicinaImena(ime: string | null | undefined): number {
  const n = imeZaNatpis(ime).length;
  if (n <= 7) return 10;
  if (n <= 10) return 8;
  return 7;
}

/** Pozdrav u izborniku. */
export function pozdravIgraca(ime: string | null | undefined): string {
  return imeJePrazno(ime) ? "Bok, kauboju!" : `Bok, ${(ime ?? "").trim()}`;
}
