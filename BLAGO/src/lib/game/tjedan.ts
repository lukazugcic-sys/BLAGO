import { SUSJEDI, type Susjed } from "./susjedi";

export type TjedanVrsta = "sajam" | "pljacka";

export type Tjedan = {
  kljuc: string;
  vrsta: TjedanVrsta;
  naziv: string;
  rec: string;
  susjed: Susjed | null;
  dani: number;
};

function isoTjedan(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dan = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dan);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const tjedan = Math.ceil(((t.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return { godina: t.getUTCFullYear(), tjedan };
}

export function tjedanKljuc(d = new Date()) {
  const { godina, tjedan } = isoTjedan(d);
  return `${godina}-W${String(tjedan).padStart(2, "0")}`;
}

export function daniDoKrajaTjedna(d = new Date()) {
  const dan = d.getDay() || 7;
  return Math.max(1, 8 - dan);
}

export function tjedanSad(d = new Date()): Tjedan {
  const { tjedan } = isoTjedan(d);
  const kljuc = tjedanKljuc(d);
  const dani = daniDoKrajaTjedna(d);
  if (tjedan % 2 === 0) {
    return {
      kljuc,
      vrsta: "sajam",
      naziv: "Sajam tjedna",
      rec: "Karavana je u kaubi. Burza je jeftinija.",
      susjed: null,
      dani,
    };
  }
  const susjed = SUSJEDI[tjedan % SUSJEDI.length]!;
  return {
    kljuc,
    vrsta: "pljacka",
    naziv: "Pljačka tjedna",
    rec: `Meta: ${susjed.kauba}. Šerif ${susjed.serif} čeka.`,
    susjed,
    dani,
  };
}

export function sajamCijena(akcija: "kupi" | "prodaj", cijena: number, jeSajam: boolean) {
  if (!jeSajam) return cijena;
  const n = akcija === "kupi" ? cijena * 0.85 : cijena * 1.12;
  return Math.max(1, Math.round(n));
}
