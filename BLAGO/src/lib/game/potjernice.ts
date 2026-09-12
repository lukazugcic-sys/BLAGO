export type Rijetkost = "obicna" | "rijetka" | "legenda";
export type PotjernicaSet = "odmetnici" | "zvijezde" | "relikvije" | "sjene";

export type Potjernica = {
  id: string;
  ime: string;
  set: PotjernicaSet;
  cijena: number;
  rijetkost: Rijetkost;
  rec: string;
  boja: string;
};

export const POTJERNICE: Potjernica[] = [
  { id: "crni-joso", ime: "Crni Joso", set: "odmetnici", cijena: 40, rijetkost: "obicna", rec: "Krao konje od Suheg Vira.", boja: "#3a2418" },
  { id: "ruka-grom", ime: "Ruka Grom", set: "odmetnici", cijena: 50, rijetkost: "obicna", rec: "Puca prije nego što pita.", boja: "#4a2010" },
  { id: "crveni-pero", ime: "Crveni Pero", set: "odmetnici", cijena: 55, rijetkost: "obicna", rec: "Pero je crveno od tuđe krvi.", boja: "#5a1810" },
  { id: "zuta-lida", ime: "Žuta Lida", set: "odmetnici", cijena: 80, rijetkost: "rijetka", rec: "Salun ostavi prazan.", boja: "#6a3a12" },
  { id: "slijepi-dujam", ime: "Slijepi Dujam", set: "odmetnici", cijena: 95, rijetkost: "rijetka", rec: "Ne vidi. Čuje korak.", boja: "#2a1814" },
  { id: "vuk-kostolom", ime: "Vuk Kostolom", set: "odmetnici", cijena: 120, rijetkost: "legenda", rec: "Kostolom ga zove ocem.", boja: "#1a1210" },
  { id: "serif-kara", ime: "Šerif Kara", set: "zvijezde", cijena: 45, rijetkost: "obicna", rec: "Zvijezda ne laže.", boja: "#2a3a48" },
  { id: "brzi-pero", ime: "Brzi Pero", set: "zvijezde", cijena: 55, rijetkost: "obicna", rec: "Pismo stigne prije prašine.", boja: "#3a4a28" },
  { id: "ika-trag", ime: "Ika Trag", set: "zvijezde", cijena: 60, rijetkost: "obicna", rec: "Puška je lakša od brige.", boja: "#3a2a18" },
  { id: "mara-salun", ime: "Mara od Saluna", set: "zvijezde", cijena: 90, rijetkost: "rijetka", rec: "Toči i pjeva. Oboje pogađa.", boja: "#5a2830" },
  { id: "sudac-toma", ime: "Sudac Toma", set: "zvijezde", cijena: 100, rijetkost: "rijetka", rec: "Sudi bez stolice.", boja: "#243040" },
  { id: "jahac-noc", ime: "Jahač Noći", set: "zvijezde", cijena: 130, rijetkost: "legenda", rec: "Nitko mu nije vidio lice.", boja: "#12141c" },
  { id: "zlatni-zub", ime: "Zlatni Zub", set: "relikvije", cijena: 35, rijetkost: "obicna", rec: "Zub iz Zlatne Jame.", boja: "#6a5018" },
  { id: "prazna-puska", ime: "Prazna Puška", set: "relikvije", cijena: 40, rijetkost: "obicna", rec: "Jedan metak. Nikad promašaj.", boja: "#3a3020" },
  { id: "sesir-serif", ime: "Šerifov šešir", set: "relikvije", cijena: 50, rijetkost: "obicna", rec: "Šešir stariji od kaube.", boja: "#4a3824" },
  { id: "mapa-jama", ime: "Mapa Jame", set: "relikvije", cijena: 85, rijetkost: "rijetka", rec: "X je tamo gdje Pavo stoji.", boja: "#4a3820" },
  { id: "zadnji-metak", ime: "Zadnji metak", set: "relikvije", cijena: 95, rijetkost: "rijetka", rec: "Čuva se za pravog čovjeka.", boja: "#3a2818" },
  { id: "zvezda-boro", ime: "Boroova zvijezda", set: "relikvije", cijena: 140, rijetkost: "legenda", rec: "Prva zvijezda kaube.", boja: "#c4a24a" },
  { id: "sapat-ana", ime: "Šapat Ana", set: "sjene", cijena: 48, rijetkost: "obicna", rec: "Čuješ je. Ne vidiš je.", boja: "#1c1824" },
  { id: "dugi-senko", ime: "Dugi Senko", set: "sjene", cijena: 58, rijetkost: "obicna", rec: "Sjena dulja od puta.", boja: "#181820" },
  { id: "crna-marica", ime: "Crna Marica", set: "sjene", cijena: 92, rijetkost: "rijetka", rec: "Smijeh iza rešetke.", boja: "#201018" },
  { id: "bezimeni", ime: "Bezimeni", set: "sjene", cijena: 150, rijetkost: "legenda", rec: "Plakat bez lica. Nagrada stoji.", boja: "#0e0e12" },
];

export const SETOVI: Array<{ id: PotjernicaSet; naziv: string; nagrada: { zlato: number; dijamanti: number } }> = [
  { id: "odmetnici", naziv: "Odmetnici", nagrada: { zlato: 40, dijamanti: 1 } },
  { id: "zvijezde", naziv: "Zvijezde", nagrada: { zlato: 50, dijamanti: 1 } },
  { id: "relikvije", naziv: "Relikvije", nagrada: { zlato: 60, dijamanti: 2 } },
  { id: "sjene", naziv: "Sjene", nagrada: { zlato: 70, dijamanti: 2 } },
];

export const RIJETKOST_REC: Record<Rijetkost, string> = {
  obicna: "Obična",
  rijetka: "Rijetka",
  legenda: "Legenda",
};

export function potjernicaPoId(id: string) {
  return POTJERNICE.find((p) => p.id === id) ?? null;
}

export function imaSet(album: Record<string, number>, setId: PotjernicaSet) {
  return POTJERNICE.filter((p) => p.set === setId).every((p) => (album[p.id] ?? 0) > 0);
}

export function albumBroj(album: Record<string, number>) {
  return POTJERNICE.filter((p) => (album[p.id] ?? 0) > 0).length;
}

export function baciPotjernicu(
  album: Record<string, number>,
  opts: { lucky?: boolean; linije?: number; jackpot?: boolean },
): Potjernica | null {
  let sansa = 0.012;
  if (opts.lucky) sansa = 0.028;
  if ((opts.linije ?? 0) >= 3) sansa += 0.008;
  if (opts.jackpot) sansa = 0.045;
  if (Math.random() > sansa) return null;

  const nedostaje = POTJERNICE.filter((p) => (album[p.id] ?? 0) === 0);
  const pool = nedostaje.length && Math.random() < 0.7 ? nedostaje : POTJERNICE;
  const tezine = pool.map((p) => (p.rijetkost === "legenda" ? 1 : p.rijetkost === "rijetka" ? 3 : 8));
  const zbroj = tezine.reduce((a, b) => a + b, 0);
  let r = Math.random() * zbroj;
  for (let i = 0; i < pool.length; i++) {
    r -= tezine[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1] ?? null;
}
