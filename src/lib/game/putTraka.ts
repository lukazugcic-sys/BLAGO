/**
 * 0.9.176 (19): puteljak se crta kao traka promjenjive širine (mekani rub, uži pred vratima,
 * malo širi gdje se spaja s cestom) umjesto jednolike crte. Samo prikaz; stalno po ključu.
 */
type Tocka = { x: number; y: number };

const cache = new Map<string, string>();

function hes(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Poligon trake oko linije `t` (širina `sir` px ± ~20 %). */
export function trakaPuta(t: readonly Tocka[], sir: number, kljuc: string, opcije: { vrata?: boolean; spoj?: boolean } = {}) {
  const k = `${kljuc}|${sir}|${t.length}|${opcije.vrata ? 1 : 0}${opcije.spoj ? 1 : 0}`;
  const c = cache.get(k);
  if (c !== undefined) return c;
  if (t.length < 2) {
    cache.set(k, "");
    return "";
  }
  const faza = ((hes(kljuc) & 0xffff) / 0xffff) * Math.PI * 2;
  const s: number[] = [0];
  for (let i = 1; i < t.length; i++) s.push(s[i - 1]! + Math.hypot(t[i]!.x - t[i - 1]!.x, t[i]!.y - t[i - 1]!.y));
  const L = s[s.length - 1] || 1;
  const lijevo: string[] = [];
  const desno: string[] = [];
  const f = (n: number) => String(Math.round(n * 10) / 10);
  for (let i = 0; i < t.length; i++) {
    const a = t[Math.max(0, i - 1)]!;
    const b = t[Math.min(t.length - 1, i + 1)]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    let hw = (sir / 2) * (0.86 + 0.18 * Math.sin(s[i]! / 21 + faza) + 0.08 * Math.sin(s[i]! / 7.3 + faza * 2));
    if (opcije.vrata) hw *= 0.68 + 0.32 * Math.min(1, s[i]! / 16);
    if (opcije.spoj) hw *= 1 + 0.4 * Math.max(0, 1 - (L - s[i]!) / 14);
    const nx = -dy / l;
    const ny = dx / l;
    lijevo.push(`${f(t[i]!.x + nx * hw)},${f(t[i]!.y + ny * hw)}`);
    desno.push(`${f(t[i]!.x - nx * hw)},${f(t[i]!.y - ny * hw)}`);
  }
  const out = [...lijevo, ...desno.reverse()].join(" ");
  cache.set(k, out);
  return out;
}
