export const POHOD_JATO_MAX = 3;

let pohodJatoIds: string[] = [];

export function postaviPohodJato(ids: string[]) {
  const vidjeno = new Set<string>();
  pohodJatoIds = [];
  for (const id of ids) {
    if (!id || vidjeno.has(id)) continue;
    vidjeno.add(id);
    pohodJatoIds.push(id);
    if (pohodJatoIds.length >= POHOD_JATO_MAX) break;
  }
}

export function pohodJato() {
  return pohodJatoIds;
}

export function uPohodu(id: string) {
  return pohodJatoIds.includes(id);
}

export function ocistiPohodJato() {
  pohodJatoIds = [];
}

/** Valter: šerif, zamjenik, zakon, pa ostatak kaube — do kapaciteta jata. */
export function okupiValter(
  kandidati: Array<{ id: string; posao: string; hub?: string | null; razina?: number }>,
  max = POHOD_JATO_MAX,
): string[] {
  const rang = (p: { posao: string; hub?: string | null }) => {
    if (p.posao === "Šerif") return 0;
    if (p.posao === "Zamjenik") return 1;
    if (p.hub === "red") return 2;
    return 3;
  };
  const vidjeno = new Set<string>();
  const ids: string[] = [];
  const poredani = [...kandidati].sort(
    (a, b) => rang(a) - rang(b) || (b.razina ?? 0) - (a.razina ?? 0),
  );
  for (const p of poredani) {
    if (!p.id || vidjeno.has(p.id)) continue;
    vidjeno.add(p.id);
    ids.push(p.id);
    if (ids.length >= max) break;
  }
  return ids;
}
