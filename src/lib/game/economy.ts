import type { Gradevine, Ostecenja } from "./types";
import {
  alatLv,
  ENERGY_BASE_MAX,
  ENERGY_PER_BATTERY,
  ENERGY_REGEN_MS,
  ENERGY_REGEN_PER_LV,
  ENERGY_REGEN_FLOOR_MS,
  BUNAR_ENERGIJA,
  MLIN_ENERGIJA,
  WIN_CHANCE_BASE,
  WIN_CHANCE_PER_LUCK,
  WIN_CHANCE_CAP,
  LINE_MULT,
  JACKPOT_BONUS,
  RESOURCE_TICK_MS,
  MAX_OFFLINE_MS,
  POKRICE,
  SELIDBA_PRAG_DOCI,
  SELIDBA_PRAG_ICI,
  SELIDBA_DOCI,
  SELIDBA_DOCI_SRECA,
  SELIDBA_ICI,
  SALUN_ZLATO_PO_GOSTU,
  BANKA_KAP_PO_LV,
  BANKA_KAMATA,
  POPRAVAK_ZLATO,
  POPRAVAK_DRVO,
  TOK_BAZA,
  TOK_SPAN,
  XP_BAZA,
  XP_EXP,
  XP_LIN,
  PRESTIGE_PER_LV,
  PASIVNI_PO_RAZINI,
  CIJENA_RAST,
  KRUNA_CIJENA,
  GAMBLE_MAX,
  GAMBLE_WIN_P,
  KONJ_HRANA,
  KONJ_VODA,
  BANJA_VODA,
  GOVEDO_HRANA,
  GOVEDO_VODA,
  TRAVA_ZABAVA,
} from "./tuning";

export {
  RESOURCE_TICK_MS,
  MAX_OFFLINE_MS,
  POKRICE,
  LINE_MULT,
  JACKPOT_BONUS,
  GAMBLE_MAX,
  GAMBLE_WIN_P,
  ENERGY_REGEN_MS,
};

export function rast(baza: number, lv: number, k = CIJENA_RAST) {
  return Math.max(0, Math.floor(baza * Math.pow(k, Math.max(0, lv - 1))));
}

export function krunaCijenaMnoz(prestige: number) {
  const p = Math.max(0, Math.floor(Number(prestige) || 0));
  return p <= 0 ? 1 : Math.pow(KRUNA_CIJENA, p);
}

export function cijenaUzKrunu(iznos: number, prestige: number) {
  if (!(iznos > 0)) return 0;
  return Math.floor(iznos * krunaCijenaMnoz(prestige) + 1e-9);
}

export function skalaCijene<T extends Record<string, number>>(c: T, prestige: number): T {
  const m = krunaCijenaMnoz(prestige);
  if (m === 1) return c;
  const out = { ...c };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === "number" && v > 0) (out as Record<string, number>)[k] = Math.floor(v * m + 1e-9);
  }
  return out;
}

export function cijenaZgrade(
  z: { cijena: (lv: number) => { zlato: number; drvo: number; kamen: number; zeljezo: number } },
  lv: number,
  prestige: number,
) {
  return skalaCijene(z.cijena(lv), prestige);
}

export const PRAZNE_GRADEVINE: Gradevine = {
  pilana: 0,
  kamenolom: 0,
  rudnik: 0,
  kuca: 0,
  blok: 0,
  salun: 0,
  karte: 0,
  bunar: 0,
  cisterna: 0,
  mlin: 0,
  lov: 0,
  mesnica: 0,
  pekara: 0,
  ured: 0,
  staja: 0,
  korali: 0,
  staza: 0,
  farma: 0,
  tor: 0,
  ordinacija: 0,
  travar: 0,
  banja: 0,
  trgovina: 0,
  banka: 0,
  kovacnica: 0,
  barutana: 0,
  tvornica: 0,
};

export const PRAZNA_OSTECENJA: { [K in keyof Gradevine]: boolean } = {
  pilana: false,
  kamenolom: false,
  rudnik: false,
  kuca: false,
  blok: false,
  salun: false,
  karte: false,
  bunar: false,
  cisterna: false,
  mlin: false,
  lov: false,
  mesnica: false,
  pekara: false,
  ured: false,
  staja: false,
  korali: false,
  staza: false,
  farma: false,
  tor: false,
  ordinacija: false,
  travar: false,
  banja: false,
  trgovina: false,
  banka: false,
  kovacnica: false,
  barutana: false,
  tvornica: false,
};

export const popravakCijena = (lv: number) => ({
  zlato: Math.max(8, lv * POPRAVAK_ZLATO),
  drvo: Math.max(4, lv * POPRAVAK_DRVO),
});

export const izracunajMaxEnergiju = (baterija: number) =>
  ENERGY_BASE_MAX + alatLv("baterija", baterija) * ENERGY_PER_BATTERY;

export const capEnergija = (e: number, baterija: number) =>
  Math.max(0, Math.min(izracunajMaxEnergiju(baterija), e));

/** Regen puni do max i ne dira višak. Bonus (`preko`) smije prijeći granicu. */
export function dodajEnergiju(e: number, gain: number, baterija: number, preko = false) {
  const cur = Number.isFinite(e) ? e : 0;
  const g = Number.isFinite(gain) ? gain : 0;
  const next = Math.max(0, cur + g);
  if (g <= 0) return next;
  if (preko) return next;
  const max = izracunajMaxEnergiju(Number.isFinite(baterija) ? baterija : 0);
  if (cur >= max) return cur;
  return Math.min(max, next);
}

/** Regen 8s at rank 0, faster with Volt-remen, floor 3.8s. */
export const izracunajEnergijaRegenMs = (baterija: number) =>
  Math.max(ENERGY_REGEN_FLOOR_MS, ENERGY_REGEN_MS - alatLv("baterija", baterija) * ENERGY_REGEN_PER_LV);

export const izracunajMaxStitova = (oklop: number) => 1 + alatLv("oklop", oklop);

export const izracunajKapacitet = (g: Gradevine) =>
  4 + (g.kuca || 0) * POKRICE.kuca + (g.blok || 0) * POKRICE.blok;

/** @deprecated kapacitet kreveta, ne stvarni ljudi */
export const izracunajStanovnike = izracunajKapacitet;

export type KaubaPotrebe = {
  krov: number;
  voda: number;
  jelo: number;
  zabava: number;
  posao: number;
  red: number;
  konji: number;
  zdravlje: number;
  oruzje: number;
};

export type KaubaUsko = keyof KaubaPotrebe;

export type KonjDuznostId = "jahanje" | "ophodnja" | "rad" | "rodeo";
export type GovedoDuznostId = "pasa" | "tjeranje" | "klanje";

export const KONJ_DUZNOSTI: Array<{ id: KonjDuznostId; naziv: string; rec: string; poruka: string }> = [
  { id: "jahanje", naziv: "Jahanje", rec: "Sedlo na ulici. To je kauba.", poruka: "Na uzdu." },
  { id: "ophodnja", naziv: "Ophodnja", rec: "Šerif jaše. Ulica šuti.", poruka: "Jaše ophodnju." },
  { id: "rad", naziv: "Jaram", rec: "Plug i kamen. Konj vuče.", poruka: "U jaram." },
  { id: "rodeo", naziv: "Rodeo", rec: "Salun pun. Konji skaču. Nered raste.", poruka: "U arenu." },
];

export const GOVEDO_DUZNOSTI: Array<{ id: GovedoDuznostId; naziv: string; rec: string; poruka: string }> = [
  { id: "pasa", naziv: "Paša", rec: "Krdo na žitu. Firma diše.", poruka: "Na pašu." },
  { id: "tjeranje", naziv: "Tjeranje", rec: "Goniči jašu. Krdo ide na trg.", poruka: "Na trg." },
  { id: "klanje", naziv: "Klanje", rec: "Mesnica čeka. Gazda kima.", poruka: "Na klanje." },
];

export type KaubaUtjecaj = {
  od: KaubaUsko;
  do: KaubaUsko;
  predznak: 1 | -1;
  jacina: number;
  rec: string;
};

export type KaubaDuznost = Record<KonjDuznostId, number>;
export type GovedoDuznost = Record<GovedoDuznostId, number>;

export type KaubaExtra = {
  red?: number;
  konjiBroj?: number;
  duznost?: Partial<KaubaDuznost>;
  sijeno?: boolean;
  kisa?: boolean;
  trava?: boolean;
  potkova?: boolean;
  govedaBroj?: number;
  govedaDuznost?: Partial<GovedoDuznost>;
  celija?: number;
  hubovi?: Partial<Record<KaubaUsko, number>>;
};

export type KaubaStanje = {
  ljudi: number;
  kapacitet: number;
  poslovi: number;
  zaposleni: number;
  rad: number;
  sreca: number;
  efikasnost: number;
  tok: number;
  usko: KaubaUsko | null;
  potrebe: KaubaPotrebe;
  pokrivaju: KaubaPotrebe;
  utjecaji: KaubaUtjecaj[];
  konjiBroj: number;
  konjiKap: number;
  duznost: KaubaDuznost;
  radKonja: number;
  govedaBroj: number;
  govedaKap: number;
  govedaDuznost: GovedoDuznost;
};

export const POTREBE_META: Array<{
  id: KaubaUsko;
  naziv: string;
  zgrade: Array<keyof Gradevine>;
}> = [
  { id: "krov", naziv: "Smještaj", zgrade: ["kuca", "blok"] },
  { id: "jelo", naziv: "Hrana", zgrade: ["lov", "mesnica", "pekara", "farma", "tor"] },
  { id: "zabava", naziv: "Zabava", zgrade: ["salun", "karte"] },
  { id: "voda", naziv: "Voda", zgrade: ["bunar", "cisterna", "mlin"] },
  { id: "posao", naziv: "Posao", zgrade: ["pilana", "kamenolom", "rudnik", "trgovina"] },
  { id: "red", naziv: "Zakon", zgrade: ["ured", "banka"] },
  { id: "konji", naziv: "Konji", zgrade: ["staja", "korali", "staza"] },
  { id: "zdravlje", naziv: "Zdravlje", zgrade: ["ordinacija", "travar", "banja"] },
  { id: "oruzje", naziv: "Oružje", zgrade: ["kovacnica", "barutana", "tvornica"] },
];

export const POTREBA_BOJA: Record<KaubaUsko, string> = {
  krov: "#d4a06a",
  jelo: "#8aab54",
  zabava: "#e8b84a",
  voda: "#5a9aaa",
  posao: "#c4844a",
  red: "#c9a35a",
  konji: "#b07848",
  zdravlje: "#7aaa72",
  oruzje: "#c45c38",
};

/** Ruke na hubu. Ne zamjenjuje zgradu — 5 ljudi na hrani bez lova i dalje gladuje. */
export const RADNIK_POKRICE = 0.4;

export function hubBroj(ljudi: Array<{ hub?: string | null }>): Partial<Record<KaubaUsko, number>> {
  const out: Partial<Record<KaubaUsko, number>> = {};
  for (const p of ljudi) {
    const h = p.hub;
    if (!h || !(h in POTREBA_BOJA)) continue;
    const id = h as KaubaUsko;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

/** Mjesta u sobi: pusto drži dvoje, svaka zgrada +2, do 8. */
export function hubKap(zgrade: Array<{ kvaliteta: number }>): number {
  const puni = zgrade.filter((z) => z.kvaliteta > 0).length;
  return Math.max(2, Math.min(8, 2 + puni * 2));
}

export function hubZaZgradu(id: keyof Gradevine): KaubaUsko | null {
  for (const p of POTREBE_META) {
    if (p.zgrade.includes(id)) return p.id;
  }
  return null;
}

export function zgradaUvjet(id: keyof Gradevine, g: Gradevine): string | null {
  if (id === "blok" && (g.kuca || 0) < 2) return "Prvo dvije kuće";
  if (id === "mesnica" && (g.lov || 0) < 1) return "Prvo lovački dom";
  if (id === "pekara" && (g.lov || 0) < 1) return "Prvo lovački dom";
  if (id === "salun" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "karte" && (g.salun || 0) < 1) return "Prvo salun";
  if (id === "mlin" && (g.bunar || 0) < 1) return "Prvo bunar";
  if (id === "cisterna" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "staja" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "korali" && (g.staja || 0) < 1) return "Prvo staju";
  if (id === "staza" && (g.korali || 0) < 1) return "Prvo ispust";
  if (id === "farma" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "tor" && (g.farma || 0) < 1) return "Prvo farmu";
  if (id === "ordinacija" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "travar" && (g.kuca || 0) < 1) return "Prvo kuću";
  if (id === "banja" && (g.bunar || 0) < 1 && (g.cisterna || 0) < 1) return "Prvo bunar ili cisternu";
  if (id === "trgovina" && (g.kuca || 0) < 2) return "Prvo dvije kuće";
  if (id === "banka" && (g.ured || 0) < 1) return "Prvo ured";
  if (id === "kovacnica" && (g.rudnik || 0) < 1) return "Prvo rudnik";
  if (id === "barutana" && (g.kovacnica || 0) < 1) return "Prvo kovačnicu";
  if (id === "tvornica" && (g.barutana || 0) < 1) return "Prvo barutanu";
  return null;
}

/** Jedan metak na prvoj zajedničkoj razini kovačnice i barutane. Tvornica dodaje svoju. */
export const METAK_OBNOVA_MS = 6 * 60 * 1000;

export function metciPoObnovi(g: Gradevine, o: Ostecenja) {
  const k = o.kovacnica ? 0 : g.kovacnica || 0;
  const b = o.barutana ? 0 : g.barutana || 0;
  if (k < 1 || b < 1) return 0;
  const tvornica = o.tvornica ? 0 : g.tvornica || 0;
  return Math.min(k, b) + tvornica;
}

/** Kovačnica kuje potkove i bez barutane. Prva razina = jedna na 6 min. */
export function potkovePoObnovi(g: Gradevine, o: Ostecenja) {
  if (o.kovacnica) return 0;
  return Math.max(0, g.kovacnica || 0);
}

const TEZINA: KaubaPotrebe = {
  krov: 1.2,
  jelo: 1.2,
  voda: 1.1,
  zabava: 0.8,
  posao: 0.7,
  red: 0.95,
  konji: 0.9,
  zdravlje: 0.85,
  oruzje: 0.75,
};
const TEZINA_ZBROJ = Object.values(TEZINA).reduce((a, b) => a + b, 0);

function pokrice(pokriva: number, ljudi: number) {
  if (ljudi <= 0) return 1;
  return Math.max(0, Math.min(1, pokriva / ljudi));
}

export function konjaKap(g: Gradevine) {
  return Math.max(
    0,
    (g.staja || 0) * POKRICE.staja + (g.korali || 0) * POKRICE.korali + (g.staza || 0) * POKRICE.staza,
  );
}

export function govedaKap(g: Gradevine) {
  return Math.max(0, (g.tor || 0) * POKRICE.tor);
}

/** 0 ispod 75% tora, 1 kad je tor pun. Firma puca. */
export function krdoTijesno(broj: number, kap: number) {
  if (kap <= 0 || broj <= 0) return 0;
  return Math.max(0, Math.min(1, (broj / kap - 0.75) / 0.25));
}

export function praznaDuznost(): KaubaDuznost {
  return { jahanje: 0, ophodnja: 0, rad: 0, rodeo: 0 };
}

export function praznaGovedoDuznost(): GovedoDuznost {
  return { pasa: 0, tjeranje: 0, klanje: 0 };
}

export function normalizirajDuznost(broj: number, raw?: Partial<KaubaDuznost> | null): KaubaDuznost {
  const n = Math.max(0, Math.floor(broj));
  const d = praznaDuznost();
  if (n <= 0) return d;
  d.jahanje = Math.max(0, Math.floor(raw?.jahanje ?? 0));
  d.ophodnja = Math.max(0, Math.floor(raw?.ophodnja ?? 0));
  d.rad = Math.max(0, Math.floor(raw?.rad ?? 0));
  d.rodeo = Math.max(0, Math.floor(raw?.rodeo ?? 0));
  let zbroj = d.jahanje + d.ophodnja + d.rad + d.rodeo;
  if (zbroj <= 0) {
    d.jahanje = n;
    return d;
  }
  if (zbroj !== n) {
    const ids = KONJ_DUZNOSTI.map((x) => x.id);
    if (zbroj > n) {
      for (const id of [...ids].reverse()) {
        const skini = Math.min(d[id], zbroj - n);
        d[id] -= skini;
        zbroj -= skini;
        if (zbroj <= n) break;
      }
    } else {
      d.jahanje += n - zbroj;
    }
  }
  return d;
}

export function normalizirajGovedo(broj: number, raw?: Partial<GovedoDuznost> | null): GovedoDuznost {
  const n = Math.max(0, Math.floor(broj));
  const d = praznaGovedoDuznost();
  if (n <= 0) return d;
  d.pasa = Math.max(0, Math.floor(raw?.pasa ?? 0));
  d.tjeranje = Math.max(0, Math.floor(raw?.tjeranje ?? 0));
  d.klanje = Math.max(0, Math.floor(raw?.klanje ?? 0));
  let zbroj = d.pasa + d.tjeranje + d.klanje;
  if (zbroj <= 0) {
    d.pasa = n;
    return d;
  }
  if (zbroj !== n) {
    const ids = GOVEDO_DUZNOSTI.map((x) => x.id);
    if (zbroj > n) {
      for (const id of [...ids].reverse()) {
        const skini = Math.min(d[id], zbroj - n);
        d[id] -= skini;
        zbroj -= skini;
        if (zbroj <= n) break;
      }
    } else {
      d.pasa += n - zbroj;
    }
  }
  return d;
}

export function izracunajEfikasnost(sreca: number) {
  const k = Math.max(0, Math.min(100, sreca));
  return 0.55 + (0.45 * k) / 100;
}

export function izracunajKauba(g: Gradevine, ljudi: number, extra?: KaubaExtra): KaubaStanje {
  const n = Math.max(0, ljudi);
  const kapacitet = izracunajKapacitet(g);
  const konjiKapN = konjaKap(g);
  const konjiBroj = Math.max(0, Math.min(konjiKapN, Math.floor(extra?.konjiBroj ?? 0)));
  const duznost = normalizirajDuznost(konjiBroj, extra?.duznost);
  const sijeno = !!extra?.sijeno;
  const potkova = !!extra?.potkova;
  const kisa = !!extra?.kisa;
  const govedaKapN = govedaKap(g);
  const govedaBroj = Math.max(0, Math.min(govedaKapN, Math.floor(extra?.govedaBroj ?? 0)));
  const govedaDuznost = normalizirajGovedo(govedaBroj, extra?.govedaDuznost);

  let voda = (g.bunar || 0) * POKRICE.bunar + (g.mlin || 0) * POKRICE.mlin;
  const krovK = n <= 0 ? 1 : Math.min(1, kapacitet / Math.max(1, n));
  if ((g.cisterna || 0) > 0) {
    const cisternaBaza = (g.cisterna || 0) * POKRICE.cisterna;
    voda += cisternaBaza * (0.55 + 0.45 * krovK) * (kisa ? 1.4 : 1);
  }
  let jelo =
    (g.lov || 0) * POKRICE.lov +
    (g.mesnica || 0) * POKRICE.mesnica +
    (g.pekara || 0) * POKRICE.pekara +
    (g.farma || 0) * POKRICE.farma;
  let zabava = (g.salun || 0) * POKRICE.salun + (g.karte || 0) * POKRICE.karte;
  let posao = ((g.pilana || 0) + (g.kamenolom || 0) + (g.rudnik || 0) + (g.trgovina || 0)) * POKRICE.posao;
  let red = (g.ured || 0) * POKRICE.ured + (g.banka || 0) * POKRICE.banka + (extra?.red ?? 0);
  let konji = konjiBroj;
  let zdravlje = (g.ordinacija || 0) * POKRICE.ordinacija;
  let oruzje = (g.kovacnica || 0) * 6 + (g.barutana || 0) * 6 + (g.tvornica || 0) * 8;
  const utjecaji: KaubaUtjecaj[] = [];
  const veza = (od: KaubaUsko, dest: KaubaUsko, predznak: 1 | -1, jacina: number, rec: string) => {
    if (jacina < 0.07) return;
    utjecaji.push({ od, do: dest, predznak, jacina: Math.min(1, jacina), rec });
  };

  const vodaOmjer = n <= 0 ? 1 : Math.min(1, voda / Math.max(1, n));
  if ((g.cisterna || 0) > 0) {
    veza("krov", "voda", krovK >= 0.5 ? 1 : -1, 0.16 + 0.22 * krovK, kisa ? "Kiša pada. Cisterna puna." : "Krov hvata kišu.");
  }
  const farmBase = (g.farma || 0) * POKRICE.farma;
  if (farmBase > 0) {
    const farmAdj = farmBase * (0.55 + 0.45 * vodaOmjer) - farmBase;
    jelo += farmAdj;
    veza("voda", "jelo", farmAdj >= 0 ? 1 : -1, 0.22 + 0.35 * vodaOmjer, "Žito pije iz bunara.");
  }

  const pije = konjiBroj * KONJ_VODA;
  if (pije > 0) {
    voda = Math.max(0, voda - pije);
    veza("konji", "voda", -1, Math.min(1, pije / Math.max(4, n || 4)), "Konji piju bunar.");
  }
  const jede = konjiBroj * KONJ_HRANA * (sijeno ? 0.28 : 1);
  if (jede > 0) {
    jelo = Math.max(0, jelo - jede);
    veza("konji", "jelo", -1, Math.min(1, jede / Math.max(4, n || 4)), sijeno ? "Sijeno u jaslama. Kuhinja mirna." : "Konji jedu iz kuhinje.");
  }

  if (duznost.rad > 0 && (g.farma || 0) + (g.lov || 0) > 0) {
    const bonus = duznost.rad * 0.7;
    jelo += bonus;
    veza("konji", "jelo", 1, Math.min(1, 0.18 + duznost.rad * 0.08), "Jaram vuče plug.");
  }
  if (duznost.rad > 0) {
    posao += duznost.rad * 1.2;
    veza("konji", "posao", 1, Math.min(1, 0.16 + duznost.rad * 0.07), "Konji vuku teret.");
  }
  if (duznost.jahanje > 0 && (g.lov || 0) > 0) {
    const lovBonus = duznost.jahanje * 0.35;
    jelo += lovBonus;
    veza("konji", "jelo", 1, Math.min(1, 0.12 + duznost.jahanje * 0.05), "Lovci jašu trag.");
  }
  if (duznost.ophodnja > 0) {
    red += duznost.ophodnja * 5;
    veza("konji", "red", 1, Math.min(1, 0.2 + duznost.ophodnja * 0.1), "Ophodnja drži ulicu.");
  }
  if (duznost.rodeo > 0) {
    zabava += duznost.rodeo * 3.5;
    red = Math.max(0, red - duznost.rodeo * 2.2);
    veza("konji", "zabava", 1, Math.min(1, 0.18 + duznost.rodeo * 0.08), "Rodeo puni salun.");
    veza("konji", "red", -1, Math.min(1, 0.16 + duznost.rodeo * 0.08), "Rodeo diže prašinu i svađu.");
  }
  if ((g.staza || 0) > 0 && konjiBroj > 0) {
    zabava += (g.staza || 0) * 2.2;
    veza("konji", "zabava", 1, Math.min(1, 0.14 + (g.staza || 0) * 0.04), "Staza puni ogradu.");
  }
  if (potkova && konjiBroj > 0) {
    konji += konjiBroj * 0.45;
    veza("oruzje", "konji", 1, 0.32, "Potkova drži kopito.");
  }
  if ((g.trgovina || 0) > 0 && konjiBroj > 0) {
    posao += (g.trgovina || 0) * 1.1;
    veza("konji", "posao", 1, 0.18, "Vreće idu na konju.");
  }

  const gPije = govedaBroj * GOVEDO_VODA;
  if (gPije > 0) {
    voda = Math.max(0, voda - gPije);
    veza("jelo", "voda", -1, Math.min(1, gPije / Math.max(4, n || 4)), "Krdo pije bunar.");
  }
  const pasaNaZitu = govedaDuznost.pasa > 0 && (g.farma || 0) > 0;
  const gJede = govedaBroj * GOVEDO_HRANA * (pasaNaZitu ? 0.45 : 1);
  if (gJede > 0) {
    jelo = Math.max(0, jelo - gJede);
    veza("jelo", "jelo", -1, Math.min(1, gJede / Math.max(4, n || 4)), pasaNaZitu ? "Paša na žitu. Kuhinja mirna." : "Krdo jede iz kuhinje. Koža je tijesna.");
  }
  if (govedaDuznost.pasa > 0) {
    const pasaJelo = govedaDuznost.pasa * 0.65 * ((g.farma || 0) > 0 ? 1 : 0.55);
    jelo += pasaJelo;
    veza("jelo", "jelo", 1, Math.min(1, 0.14 + govedaDuznost.pasa * 0.04), "Paša puni kotao.");
  }
  if (govedaDuznost.klanje > 0) {
    const klanjeJelo = govedaDuznost.klanje * 1.35 * ((g.mesnica || 0) > 0 ? 1 : 0.5);
    jelo += klanjeJelo;
    veza("jelo", "jelo", 1, Math.min(1, 0.16 + govedaDuznost.klanje * 0.05), (g.mesnica || 0) > 0 ? "Mesnica reže. Kotao pun." : "Klanje bez mesnice. Meso se kvari.");
  }
  if (govedaDuznost.tjeranje > 0 && duznost.jahanje > 0) {
    posao += govedaDuznost.tjeranje * 0.45;
    veza("konji", "jelo", 1, Math.min(1, 0.12 + govedaDuznost.tjeranje * 0.04), "Goniči jašu krdo na trg.");
  } else if (govedaDuznost.tjeranje > 0) {
    veza("konji", "jelo", -1, 0.22, "Bez konja krdo ne ide.");
  }
  const tijesno = krdoTijesno(govedaBroj, govedaKapN);
  if (tijesno > 0) {
    zabava *= 1 - 0.18 * tijesno;
    red *= 1 - 0.14 * tijesno;
    zdravlje *= 1 - 0.08 * tijesno;
    veza("jelo", "zabava", -1, 0.14 + 0.16 * tijesno, "Koža je tijesna. Tor puca.");
    veza("jelo", "red", -1, 0.1 + 0.12 * tijesno, "Gazda viče. Referent šuti.");
  }

  const farmK = n <= 0 ? 1 : Math.min(1, ((g.farma || 0) * POKRICE.farma) / Math.max(1, n));
  if ((g.travar || 0) > 0) {
    const travarBaza = (g.travar || 0) * POKRICE.travar;
    zdravlje += travarBaza * (0.62 + 0.38 * farmK);
    veza("jelo", "zdravlje", farmK >= 0.5 ? 1 : -1, 0.16 + 0.2 * farmK, "Trava raste uz žito.");
  }
  if (extra?.trava) {
    zabava += TRAVA_ZABAVA;
    veza("zdravlje", "zabava", 1, 0.28, "Trava diže salun.");
  }
  if ((g.banja || 0) > 0) {
    const pijeBanja = (g.banja || 0) * BANJA_VODA;
    voda = Math.max(0, voda - pijeBanja);
    veza("zdravlje", "voda", -1, Math.min(1, pijeBanja / Math.max(4, n || 4)), "Banja pije bunar.");
    const vodaBanja = n <= 0 ? 1 : Math.min(1, voda / Math.max(1, n));
    zdravlje += (g.banja || 0) * POKRICE.banja * (0.4 + 0.6 * vodaBanja);
    zabava += (g.banja || 0) * 1.4;
    veza("voda", "zdravlje", vodaBanja >= 0.5 ? 1 : -1, 0.18 + 0.22 * vodaBanja, "Topla voda pere prašinu.");
    veza("zdravlje", "zabava", 1, Math.min(1, 0.1 + (g.banja || 0) * 0.04), "Banja topi prašinu.");
  }

  const gosti = Math.min(n, (g.salun || 0) * POKRICE.salun + (g.karte || 0) * POKRICE.karte * 0.5);
  if (gosti > 0) {
    const nered = gosti * 0.28;
    red = Math.max(0, red - nered);
    veza("zabava", "red", -1, Math.min(1, 0.14 + gosti * 0.02), "Salun toči. Ulica se trese.");
  }

  const ruke = extra?.hubovi;
  if (ruke) {
    const r = (h: KaubaUsko) => {
      const nRuku = ruke[h] ?? 0;
      const zids = POTREBE_META.find((p) => p.id === h)?.zgrade ?? [];
      const kap = hubKap(zids.map((id) => ({ kvaliteta: g[id] || 0 })));
      return Math.min(nRuku, kap) * RADNIK_POKRICE;
    };
    jelo += r("jelo");
    voda += r("voda");
    zabava += r("zabava");
    posao += r("posao");
    red += r("red");
    konji += r("konji");
    zdravlje += r("zdravlje");
    oruzje += r("oruzje");
    if ((ruke.red ?? 0) > 0) {
      veza("red", "zabava", 1, Math.min(0.24, 0.07 * (ruke.red ?? 0)), "Šerif drži ulicu.");
    }
    if ((ruke.zabava ?? 0) > 0) {
      veza("zabava", "red", -1, Math.min(0.18, 0.05 * (ruke.zabava ?? 0)), "Salun pun. Ulica glasna.");
    }
    if ((ruke.jelo ?? 0) > 0) {
      veza("jelo", "zdravlje", 1, Math.min(0.2, 0.05 * (ruke.jelo ?? 0)), "Ruke u kuhinji. Kotao diše.");
    }
    if ((ruke.zdravlje ?? 0) > 0) {
      veza("zdravlje", "red", 1, Math.min(0.16, 0.05 * (ruke.zdravlje ?? 0)), "Trava i zavoj. Kauba stoji.");
    }
  }

  const krovRaw = kapacitet;
  const tjeskoba = n > 0 && krovRaw < n;
  if (tjeskoba) {
    zdravlje *= 0.72;
    red *= 0.88;
    veza("krov", "zdravlje", -1, 0.35, "Nema krova. Ljudi kašlju.");
    veza("krov", "red", -1, 0.22, "Tijesno. Nož ide van.");
  }

  const vodaSad = n <= 0 ? 1 : Math.min(1, voda / Math.max(1, n));
  const jeloSad = n <= 0 ? 1 : Math.min(1, jelo / Math.max(1, n));
  if ((g.ordinacija || 0) > 0) {
    const prije = zdravlje;
    zdravlje *= 0.5 + 0.5 * vodaSad;
    zdravlje *= 0.65 + 0.35 * jeloSad;
    if (prije > 0) {
      veza("voda", "zdravlje", vodaSad >= 0.7 ? 1 : -1, 0.2 + 0.2 * vodaSad, "Rana se pere iz bunara.");
      veza("jelo", "zdravlje", jeloSad >= 0.7 ? 1 : -1, 0.16 + 0.16 * jeloSad, "Sit čovjek rana pusti.");
    }
  } else if (n >= 10 && (vodaSad < 0.5 || jeloSad < 0.5)) {
    zdravlje = Math.max(0, zdravlje);
    veza("jelo", "zdravlje", -1, 0.25, "Glad i žeđ bez doktora.");
  }

  if (vodaSad < 0.45 && konjiBroj > 0) {
    konji *= 0.7;
    veza("voda", "konji", -1, 0.28, "Žedan konj ne vuče.");
  }
  if (jeloSad < 0.4 && konjiBroj > 0 && !sijeno) {
    konji *= 0.75;
    veza("jelo", "konji", -1, 0.3, "Gladni konji ne vuku.");
  }

  const pokrivaju: KaubaPotrebe = {
    krov: krovRaw,
    voda,
    jelo,
    zabava,
    posao,
    red,
    konji,
    zdravlje,
    oruzje,
  };
  const poslovi = Math.max(0, posao);
  const zaposleni = Math.min(n, poslovi);
  const potrebe: KaubaPotrebe = {
    krov: pokrice(pokrivaju.krov, n),
    voda: pokrice(pokrivaju.voda, n),
    jelo: pokrice(pokrivaju.jelo, n),
    zabava: pokrice(pokrivaju.zabava, n),
    posao: n <= 0 ? 1 : zaposleni / n,
    red: pokrice(pokrivaju.red, n),
    konji: n < 8 ? 1 : pokrice(pokrivaju.konji, n),
    zdravlje: n < 10 ? 1 : pokrice(pokrivaju.zdravlje, n),
    oruzje: n < 6 ? 1 : pokrice(pokrivaju.oruzje, n),
  };

  if (n >= 8 && potrebe.posao < 0.45) {
    pokrivaju.red *= 0.82;
    potrebe.red = pokrice(pokrivaju.red, n);
    veza("posao", "red", -1, 0.28, "Nema posla. Prazne ruke kradu.");
  }
  if (potrebe.red < 0.4 && zabava > 0) {
    pokrivaju.zabava *= 0.8;
    potrebe.zabava = pokrice(pokrivaju.zabava, n);
    veza("red", "zabava", -1, 0.24, "Bez reda salun se zatvara.");
  }
  if ((g.banka || 0) > 0) {
    veza("red", "posao", potrebe.red >= 0.6 ? 1 : -1, 0.14 + 0.12 * potrebe.red, "Sef diše dok šerif jaše.");
  }

  const sreca = Math.round(
    (100 *
      (potrebe.krov * TEZINA.krov +
        potrebe.jelo * TEZINA.jelo +
        potrebe.voda * TEZINA.voda +
        potrebe.zabava * TEZINA.zabava +
        potrebe.posao * TEZINA.posao +
        potrebe.red * TEZINA.red +
        potrebe.konji * TEZINA.konji +
        potrebe.zdravlje * TEZINA.zdravlje +
        potrebe.oruzje * TEZINA.oruzje)) /
      TEZINA_ZBROJ,
  );
  const rad = poslovi <= 0 ? 0 : zaposleni / poslovi;
  const zdravljeK = 0.82 + 0.18 * potrebe.zdravlje;
  const efikasnost = izracunajEfikasnost(sreca) * zdravljeK;
  const radKonja = 1 + duznost.rad * 0.055 + (potkova ? 0.12 : 0);
  let usko: KaubaUsko | null = null;
  let minV = 1;
  (Object.keys(potrebe) as KaubaUsko[]).forEach((k) => {
    const v = potrebe[k];
    const tezi = usko == null || TEZINA[k] > TEZINA[usko];
    if (v < minV - 0.001 || (Math.abs(v - minV) < 0.001 && tezi)) {
      minV = v;
      usko = k;
    }
  });
  if (minV >= 0.99) usko = null;
  const stanje: KaubaStanje = {
    ljudi: n,
    kapacitet,
    poslovi,
    zaposleni,
    rad,
    sreca,
    efikasnost,
    tok: 0,
    usko,
    potrebe,
    pokrivaju,
    utjecaji,
    konjiBroj,
    konjiKap: konjiKapN,
    duznost,
    radKonja,
    govedaBroj,
    govedaKap: govedaKapN,
    govedaDuznost,
  };
  stanje.tok = izracunajSelidbuDelta(stanje);
  return stanje;
}

/** People moved in one resource tick (6s). */
export function izracunajSelidbuDelta(kauba: KaubaStanje) {
  if (kauba.potrebe.zdravlje < 0.35 && kauba.ljudi >= 10) {
    return -SELIDBA_ICI * (1 - kauba.potrebe.zdravlje);
  }
  if (kauba.sreca >= SELIDBA_PRAG_DOCI && kauba.ljudi < kauba.kapacitet && kauba.potrebe.zdravlje >= 0.45) {
    return SELIDBA_DOCI + kauba.sreca / SELIDBA_DOCI_SRECA;
  }
  if (kauba.sreca < SELIDBA_PRAG_ICI && kauba.ljudi > 4) {
    return -SELIDBA_ICI * (1 - kauba.sreca / SELIDBA_PRAG_ICI);
  }
  return 0;
}

/** Immigration if happy and beds free; people leave if miserable. Floor 4. */
export function izracunajSelidbu(kauba: KaubaStanje, ticks: number) {
  const d = izracunajSelidbuDelta(kauba) * ticks;
  return Math.min(kauba.kapacitet, Math.max(4, kauba.ljudi + d));
}

export const izracunajSalunGoste = (g: Gradevine, ljudi: number) =>
  Math.min(Math.max(0, ljudi), (g.salun || 0) * POKRICE.salun);

export const izracunajSalunZlato = (g: Gradevine, ljudi: number) =>
  izracunajSalunGoste(g, ljudi) * SALUN_ZLATO_PO_GOSTU;

export const izracunajBunarEnergiju = (g: Gradevine) =>
  (g.bunar || 0) * BUNAR_ENERGIJA + (g.mlin || 0) * MLIN_ENERGIJA;

export const izracunajSansuZaDobitak = (sreca: number) =>
  Math.min(WIN_CHANCE_CAP, WIN_CHANCE_BASE + alatLv("sreca", sreca) * WIN_CHANCE_PER_LUCK);

/** L1=120, L5≈430, L10≈1340, L20≈17k. Full energy bar is a slice of one level. */
export const izracunajPotrebniXp = (razina: number) =>
  Math.floor(XP_BAZA * Math.pow(XP_EXP, Math.max(0, razina - 1)) + XP_LIN * Math.max(1, razina));

export const izracunajPrestigeMnozitelj = (prestige: number) =>
  1 + prestige * PRESTIGE_PER_LV;

export const izracunajPasivniMnozitelj = (
  igracRazina: number,
  prestigeRazina: number,
) => (1 + igracRazina * PASIVNI_PO_RAZINI) * izracunajPrestigeMnozitelj(prestigeRazina);

export const izracunajTokMnozitelj = (kvalitetaSela: number) => {
  const k = Math.max(0, Math.min(100, kvalitetaSela));
  return TOK_BAZA + (TOK_SPAN * k) / 100;
};

/** Bet size does not dump XP — a full energy bar is a slice of one level. */
export const izracunajXpVrtnje = (_ulog: number, dobitneCelije: number, sretna: boolean) => {
  const baza = 1;
  const linija = dobitneCelije > 0 ? 1 : 0;
  const sreca = sretna ? 2 : 0;
  return baza + linija + sreca;
};

export type KaubaKategorija = {
  id: "tabor" | "selo" | "kauba" | "grad";
  naziv: string;
  moto: string;
};

export function kategorijaKaube(ljudi: number): KaubaKategorija {
  const n = Math.floor(Math.max(0, ljudi));
  if (n < 8) return { id: "tabor", naziv: "Tabor", moto: "Oko vatre" };
  if (n < 16) return { id: "selo", naziv: "Selo", moto: "Dim iz kuća" };
  if (n < 32) return { id: "kauba", naziv: "Kauba", moto: "Konji u prašini" };
  return { id: "grad", naziv: "Grad", moto: "Brončani kraj" };
}

export type SeloMood = {
  id: "pusto" | "glad" | "susa" | "krov" | "tiho" | "dokolica" | "nered" | "pjeske" | "bolesno" | "zurka" | "mir";
  rec: string;
  usko: KaubaUsko | null;
};

/** What the town looks like right now — one mood, one line. */
export function raspolozenjeKaube(kauba: KaubaStanje): SeloMood {
  const n = Math.floor(kauba.ljudi);
  if (n <= 0) return { id: "pusto", rec: "Pusto. Samo vjetar.", usko: "krov" };
  const u = kauba.usko;
  if (u === "jelo") return { id: "glad", rec: "Kauba je gladna.", usko: "jelo" };
  if (u === "voda") return { id: "susa", rec: "Nema kapi.", usko: "voda" };
  if (u === "krov") return { id: "krov", rec: "Nema krova za sve.", usko: "krov" };
  if (u === "zabava") return { id: "tiho", rec: "Ulica je tiha.", usko: "zabava" };
  if (u === "posao") return { id: "dokolica", rec: "Ruke vise.", usko: "posao" };
  if (u === "red") return { id: "nered", rec: "U kaubi nema reda.", usko: "red" };
  if (u === "konji") return { id: "pjeske", rec: "Kauboj pješke nije kauboj.", usko: "konji" };
  if (u === "zdravlje") return { id: "bolesno", rec: "Kauba kašlje. Nema lijeka.", usko: "zdravlje" };
  if (u === "oruzje") return { id: "dokolica", rec: "Kovačnica šuti. Nema metka.", usko: "oruzje" };
  if (kauba.sreca >= 78 && kauba.potrebe.zabava >= 0.8) {
    return { id: "zurka", rec: "U salunu svira.", usko: "zabava" };
  }
  if (kauba.sreca >= 70) return { id: "mir", rec: "Kauba stoji čvrsto.", usko: null };
  return { id: "mir", rec: "Kauba diše.", usko: null };
}

/** Slot weights lean toward what the town needs to build. */
export function modifikatorBlagaZaUsko(u: KaubaUsko | null): Partial<Record<string, number>> {
  if (!u) return {};
  if (u === "krov") return { wood: 1.7, gold: 1.25, stone: 1.15 };
  if (u === "jelo") return { wood: 1.65, gold: 1.45 };
  if (u === "voda") return { stone: 1.75, wood: 1.25, gold: 1.15 };
  if (u === "zabava") return { gold: 1.7, wood: 1.2 };
  if (u === "red") return { shield: 1.8, iron: 1.4, gold: 1.15 };
  if (u === "konji") return { wood: 1.6, gold: 1.35, iron: 1.15 };
  if (u === "zdravlje") return { gold: 1.55, wood: 1.2 };
  if (u === "oruzje") return { iron: 1.8, gold: 1.25, stone: 1.15 };
  return { iron: 1.55, stone: 1.35, wood: 1.3 };
}

export function uskoVrtnjaRec(u: KaubaUsko | null): string | null {
  if (!u) return null;
  if (u === "krov") return "Vrtnja ide u drvo za kuće.";
  if (u === "jelo") return "Vrtnja češće daje drvo i zlato za hranu.";
  if (u === "voda") return "Vrtnja ide u kamen za bunar i cisternu.";
  if (u === "zabava") return "Vrtnja ide u zlato za salun.";
  if (u === "red") return "Vrtnja ide u štit za ured.";
  if (u === "konji") return "Vrtnja ide u drvo za staju i ispust.";
  if (u === "zdravlje") return "Vrtnja ide u zlato za lijek.";
  if (u === "oruzje") return "Vrtnja ide u željezo za kovačnicu.";
  return "Vrtnja ide u željezo za posao.";
}

export function serifDrziRed(uredLv: number, serifRazina: number, ljudi: number) {
  const pokr = ljudi <= 0 ? 1 : Math.min(1, (uredLv * POKRICE.ured) / ljudi);
  return Math.min(0.82, pokr * 0.5 + Math.max(0, serifRazina) * 0.06);
}

export function bankaKap(lv: number) {
  return Math.max(0, lv) * BANKA_KAP_PO_LV;
}

export function bankaKamata(zlato: number, lv: number, ticks: number) {
  if (lv <= 0 || zlato <= 0 || ticks <= 0) return 0;
  return Math.max(0, Math.min(bankaKap(lv) - zlato, zlato * BANKA_KAMATA * lv * ticks));
}
