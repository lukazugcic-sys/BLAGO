/**
 * Akuzativ jednine osobnog imena.
 * Boro → Boru, Mara → Maru, Jure → Juru, Ivan → Ivana.
 */
export function akuzativImena(ime: string): string {
  const t = ime.trim();
  if (!t) return "stranca";
  const zadnje = t.slice(-1).toLowerCase();
  if (zadnje === "o" || zadnje === "a" || zadnje === "e") return `${t.slice(0, -1)}u`;
  if (zadnje === "u" || zadnje === "i") return t;
  return `${t}a`;
}

export function natpisOtjeraj(ime: string): string {
  return `Otjeraj ${akuzativImena(ime)}`;
}
