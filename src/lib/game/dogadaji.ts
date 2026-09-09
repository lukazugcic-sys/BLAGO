import type { Gradevine } from "./types";

export type DogadajTip = "stranac" | "dvoboj" | "salun";

export type DogadajOpcija = {
  id: string;
  rec: string;
};

export type KaubaDogadaj = {
  id: string;
  tip: DogadajTip;
  rec: string;
  t: number;
  opcije: DogadajOpcija[];
};

export type DogadajIshod = {
  rec: string;
  zlato?: number;
  energija?: number;
  stitovi?: number;
  ozljeda?: boolean;
};

const STRANAC_REC = [
  "Stranac na ulici. Konj hrom. Traži krov.",
  "Čovjek s prašinom u bradi. Ne kaže ime.",
  "Stranac sjedi kod bunara. Gleda kaubu.",
];
const DVOBOJ_REC = [
  "Dva pijanca pred salunom. Pistoli van.",
  "Svađa u prašini. Netko viknuo ime.",
  "Dvoboj. Ulica se cijepa.",
];
const SALUN_REC = [
  "Netko vara na faru. Mara viče.",
  "Salun je tijesan. Čaša leti.",
  "Karta pod stolom. Tišina reže.",
];

function iz<T>(arr: T[], n: number) {
  return arr[Math.abs(n) % arr.length]!;
}

export function napraviDogadaj(tip: DogadajTip, serifIme: string, t = Date.now()): KaubaDogadaj {
  const id = `d-${t.toString(36)}`;
  if (tip === "stranac") {
    return {
      id,
      tip,
      rec: iz(STRANAC_REC, t),
      t,
      opcije: [
        { id: "primi", rec: "Primi" },
        { id: "otjeraj", rec: `Otjera ${serifIme}` },
        { id: "ostavi", rec: "Ostavi" },
      ],
    };
  }
  if (tip === "dvoboj") {
    return {
      id,
      tip,
      rec: iz(DVOBOJ_REC, t),
      t,
      opcije: [
        { id: "serif", rec: `${serifIme} staje` },
        { id: "gledaj", rec: "Gledaj · 8 zlata" },
        { id: "pusti", rec: "Pusti" },
      ],
    };
  }
  return {
    id,
    tip: "salun",
    rec: iz(SALUN_REC, t),
    t,
    opcije: [
      { id: "izbaci", rec: "Izbaci" },
      { id: "nali", rec: "Nali · 6 zlata" },
      { id: "serif", rec: `${serifIme} uđe` },
    ],
  };
}

export function izaberiDogadajTip(g: Gradevine, sreca: number, seed: number): DogadajTip {
  const imaSalun = (g.salun || 0) > 0;
  const r = Math.abs(seed) % 10;
  if (imaSalun && r < 4) return "salun";
  if (imaSalun && r < 7) return "dvoboj";
  if (sreca < 40 && r < 8) return "stranac";
  return r < 5 ? "stranac" : imaSalun ? "dvoboj" : "stranac";
}

export const DOGADJ_PAUSE_MS = 50_000;

export function smijeNoviDogadaj(zadnji: number, sad: number, imaAktivan: boolean) {
  if (imaAktivan) return false;
  return sad - Math.max(0, zadnji) >= DOGADJ_PAUSE_MS;
}

export function rijesiIshod(
  d: KaubaDogadaj,
  opcija: string,
  ctx: { imaRed: boolean; zlato: number; seed: number },
): DogadajIshod {
  const r = Math.abs(ctx.seed) % 100;
  if (d.tip === "stranac") {
    if (opcija === "primi") {
      if (r < 28) return { rec: "Stranac je uzeo i pobjegao.", zlato: -12 };
      return { rec: "Stranac sjedi. Kauba ima još jedan par očiju.", zlato: -6, stitovi: r < 55 ? 1 : 0 };
    }
    if (opcija === "otjeraj") {
      if (!ctx.imaRed) return { rec: "Nema tko da ga otjera. Uzeo je torbu.", zlato: -10 };
      return { rec: "Otjerali su ga. Prašina ostaje." };
    }
    if (r < 22) return { rec: "Otišao. I torba s njim.", zlato: -8 };
    return { rec: "Otišao. Ulica je opet naša." };
  }
  if (d.tip === "dvoboj") {
    if (opcija === "serif") {
      if (!ctx.imaRed) return { rec: "Nema tko da stane. Salun je krvav.", zlato: -8, ozljeda: true };
      return { rec: "Dvoboj je stao. Kazna plaćena.", zlato: 6 };
    }
    if (opcija === "gledaj") {
      if (ctx.zlato < 8) return { rec: "Nemaš 8 zlata za ulog. Ulica gleda." };
      if (r < 48) return { rec: "Pogodak. Ulog se vratio duplo.", zlato: 8 };
      return { rec: "Promašaj. Prašina i prazan džep.", zlato: -8 };
    }
    return { rec: "Pustili. Salun plaća staklo.", zlato: -4, ozljeda: true };
  }
  if (opcija === "nali") {
    if (ctx.zlato < 6) return { rec: "Nema zlata za još jedan krug." };
    return { rec: "Još jedna tura. Mara kihne, ali pjeva.", zlato: -6 };
  }
  if (opcija === "serif") {
    if (!ctx.imaRed) return { rec: "Šerifa nema. Faro ide dalje, ružno." };
    return { rec: "Ušao je. Karte na stol. Tišina." };
  }
  return { rec: "Izbacili varača. Faro opet čist.", zlato: 4 };
}
