import type { Gradevine } from "./types";

export type DogadajTip = "stranac" | "dvoboj" | "salun" | "krdo" | "konj" | "kisa" | "trgovac" | "svadba" | "posta" | "cirkus";

export type DogadajOpcija = {
  id: string;
  rec: string;
};

export type KaubaDogadaj = {
  id: string;
  tip: DogadajTip;
  rec: string;
  t: number;
  naslov?: string;
  serifIme?: string;
  opcije: DogadajOpcija[];
};

export type DogadajIshod = {
  rec: string;
  zlato?: number;
  energija?: number;
  stitovi?: number;
  ozljeda?: boolean;
  celija?: number;
  kisa?: boolean;
  kvaliteta?: number;
  ostecenje?: keyof Gradevine;
  popravi?: keyof Gradevine;
  serifXp?: boolean;
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
  "Netko vara na asovima. Mara viče.",
  "Salun je tijesan. Čaša leti.",
  "Karta pod stolom. Tišina reže.",
];
const KRDO_REC = [
  "Govedo razbilo tor. Prašina i rika.",
  "Tele u ulici. Kata viče na krdo.",
  "Rogovi na ogradi. Tor ne drži.",
];
const KONJ_REC = [
  "Konj hrom pred stajom. Neće u sedlo.",
  "Sedlo na prašini. Konj je sam.",
  "Kopito krvavo. Staja šuti.",
];
const KISA_REC = [
  "Oblaci nad mlinom. Kiša ili prah.",
  "Bunar pada. Cisterna čeka nebo.",
  "Suša na polju. Prašina u zubima.",
];
const TRGOVAC_REC = [
  "Trgovac na vratima. Torba puna željeza.",
  "Kola stala. Nudi kamen za drvo.",
  "Stranac s vagom. Traži željezo.",
];
const CIRKUS_REC = [
  "Šator na ulazu. Konj stoji na dvije noge.",
  "Bubanj. Dječak guta vatru. Kata se smije.",
  "Cirkus nudi kartu. Prašina i srebro.",
];
const SVADBA_REC = [
  "Vijenac na salunu. Mara pjeva do zore.",
  "Mladenci u prašini. Traže krov i čašu.",
  "Svadba. Konji kitom, salun pun.",
];
const POSTA_REC = [
  "Pismo na vratima. Pečat od voska. Ime tuđe.",
  "Potjernica u vjetru. Lice na papiru.",
  "Poštar na konju. Torba puna vijesti.",
];

const SERIF_CINOVI: Array<{
  tip: DogadajTip;
  naslov: string;
  rec: (ime: string) => string;
  opcije: (ime: string) => DogadajOpcija[];
  kraj: (ime: string, opcija: string, imaRed: boolean) => DogadajIshod;
}> = [
  {
    tip: "stranac",
    naslov: "I. Prašina",
    rec: (ime) => `Konj hrom. Čovjek bez imena na trijemu. ${ime} drži zvijezdu. Krov, ćelija ili prašina.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} u ćeliju` },
      { id: "primi", rec: "Krov i juha" },
      { id: "ostavi", rec: "Okreni leđa" },
    ],
    kraj: (ime, opcija, imaRed) => {
      if (opcija === "serif") {
        if (!imaRed) return { rec: `${ime} nema ured. Stranac uzima torbu i ide.`, zlato: -10, kvaliteta: -3 };
        return { rec: `${ime} okreće ključ. Ćelija drži. Sutra ćemo znati tko je.`, zlato: 6, celija: 1, serifXp: true, kvaliteta: 2 };
      }
      if (opcija === "primi") return { rec: "Krov dan. Ruka mu je brza. Nestao je i džep s njim.", zlato: -12, kvaliteta: -2 };
      return { rec: "Okrenuli leđa. Ujutro bunar smrdi na ulje.", kvaliteta: -4, ostecenje: "bunar" };
    },
  },
  {
    tip: "salun",
    naslov: "II. Čaša",
    rec: (ime) => `As pod stolom. Mara šuti. ${ime} čuje ime. Zakon, tura ili vrata.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} stane` },
      { id: "nali", rec: "Natoči · 6g" },
      { id: "izbaci", rec: "Baci ga van" },
    ],
    kraj: (ime, opcija, imaRed) => {
      if (opcija === "serif") {
        if (!imaRed) return { rec: "Zvijezde nema. Čaša leti. Mara briše krv.", zlato: -8, ozljeda: true, kvaliteta: -4, ostecenje: "salun" };
        return { rec: `${ime} stane. Karte na daski. Kazna plaćena. Salun diše.`, zlato: 8, celija: 1, serifXp: true, kvaliteta: 3 };
      }
      if (opcija === "nali") return { rec: "Tura plaćena. Mara pjeva. Varač ostaje. Sutra će opet.", zlato: -6, energija: 1, kvaliteta: 2 };
      return { rec: "Vrata ga progutala. Staklo ostaje. Mara kima.", zlato: 4, ozljeda: true, kvaliteta: -1 };
    },
  },
  {
    tip: "dvoboj",
    naslov: "III. Ulica",
    rec: (ime) => `Podne. Dva pištolja. Prašina stoji. ${ime} može stati u sredinu, ili ne.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} u sredinu` },
      { id: "gledaj", rec: "Ulog · 8g" },
      { id: "pusti", rec: "Pusti krv" },
    ],
    kraj: (ime, opcija, imaRed) => {
      if (opcija === "serif") {
        if (!imaRed) return { rec: "Nema tko da stane. Krv na dasci. Salun plaća staklo.", zlato: -12, ozljeda: true, kvaliteta: -6, ostecenje: "salun" };
        return { rec: `${ime} spusti ruke. Pištolji u prašinu. Jedan ide u ćeliju. Ulica sluša.`, zlato: 10, celija: 1, serifXp: true, kvaliteta: 4 };
      }
      if (opcija === "gledaj") return { rec: "Pogodak u prašinu. Džep prazan. Zakon šuti.", zlato: -8, kvaliteta: -2 };
      return { rec: "Pustili. Metak u gredu. Salun krvav. Sutra će pričati.", zlato: -6, ozljeda: true, kvaliteta: -5, ostecenje: "salun" };
    },
  },
  {
    tip: "stranac",
    naslov: "IV. Ćelija",
    rec: (ime) => `Rešetke. Šuti. Ključ teži. ${ime} bira: drži, pusti, ili ostavi ključ na kuki.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} drži` },
      { id: "primi", rec: "Pusti ga" },
      { id: "ostavi", rec: "Ključ na kuki" },
    ],
    kraj: (ime, opcija, imaRed) => {
      if (opcija === "serif") {
        if (!imaRed) return { rec: "Nema ćelije. Šuti i ide. Uzeo je što je našao.", zlato: -8, kvaliteta: -3 };
        return { rec: `${ime} okreće. Ćelija puna. Kazna stoji. Braća još nisu tu.`, zlato: 12, celija: 1, serifXp: true, kvaliteta: 3 };
      }
      if (opcija === "primi") return { rec: "Pustili. Zahvalio se. Uzeo konja pred stajom.", zlato: -4, kvaliteta: -3, ostecenje: "staja" };
      return { rec: "Ključ visio. Ujutro rešetke prazne. Trag u prašini.", kvaliteta: -4, celija: -1 };
    },
  },
  {
    tip: "dvoboj",
    naslov: "V. Braća",
    rec: (ime) => `Tri konja na brdu. Braća. ${ime} sam u prašini. Jaši, gledaj ili pusti brdo.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} jaše` },
      { id: "gledaj", rec: "Gledaj s trijema" },
      { id: "pusti", rec: "Pusti brdo" },
    ],
    kraj: (ime, opcija, imaRed) => {
      if (opcija === "serif") {
        if (!imaRed) return { rec: "Sam. Tri prema jedan. Krv i prašina. Ured gori.", zlato: -14, ozljeda: true, kvaliteta: -6, ostecenje: "ured" };
        return { rec: `${ime} jaše ususret. Jedan padne. Dva bježe. Zvijezda drži brdo.`, zlato: 14, stitovi: 1, serifXp: true, kvaliteta: 5 };
      }
      if (opcija === "gledaj") return { rec: "Gledali. Braća uzela torbu i konja. Ulica šuti.", zlato: -12, kvaliteta: -5 };
      return { rec: "Brdo prazno. Noćas se vraćaju. Banka ne spava.", zlato: -6, kvaliteta: -4, ostecenje: "banka" };
    },
  },
  {
    tip: "salun",
    naslov: "VI. Kraj",
    rec: (ime) => `Prašina sjele. ${ime} skida zvijezdu. Čaša, mir ili još jedan krug. Sutra opet.`,
    opcije: (ime) => [
      { id: "serif", rec: `${ime} sjedi` },
      { id: "nali", rec: "Natoči · 6g" },
      { id: "izbaci", rec: "Mir u ulici" },
    ],
    kraj: (ime, opcija) => {
      if (opcija === "serif") return { rec: `${ime} sjedi. Čaša. Ulica diše. Cin je gotov. Zvijezda opet na prsima.`, zlato: 10, energija: 3, kvaliteta: 4, serifXp: true };
      if (opcija === "nali") return { rec: "Natočili. Mara kima. Sutra nova prašina.", zlato: -6, energija: 2, kvaliteta: 2 };
      return { rec: "Mir. Vrata zatvorena. Zakon spava jednu noć.", zlato: 6, kvaliteta: 3, popravi: "salun" };
    },
  },
];

function iz<T>(arr: T[], n: number) {
  return arr[Math.abs(n) % arr.length]!;
}

function sIme(ime: string, d: Omit<KaubaDogadaj, "serifIme">): KaubaDogadaj {
  return { ...d, serifIme: ime };
}

export function napraviDogadaj(tip: DogadajTip, serifIme: string, t = Date.now(), cin = -1): KaubaDogadaj {
  const id = `d-${t.toString(36)}`;
  if (cin >= 0) {
    const s = SERIF_CINOVI[cin % SERIF_CINOVI.length]!;
    return sIme(serifIme, {
      id,
      tip: s.tip,
      naslov: s.naslov,
      rec: s.rec(serifIme),
      t,
      opcije: s.opcije(serifIme),
    });
  }
  if (tip === "stranac") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(STRANAC_REC, t),
      t,
      opcije: [
        { id: "primi", rec: "Primi" },
        { id: "otjeraj", rec: `Otjera ${serifIme}` },
        { id: "ostavi", rec: "Ostavi" },
      ],
    });
  }
  if (tip === "dvoboj") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(DVOBOJ_REC, t),
      t,
      opcije: [
        { id: "serif", rec: `${serifIme} staje` },
        { id: "gledaj", rec: "Gledaj · 8 zlata" },
        { id: "pusti", rec: "Pusti" },
      ],
    });
  }
  if (tip === "krdo") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(KRDO_REC, t),
      t,
      opcije: [
        { id: "vrati", rec: "Vrati krdo" },
        { id: "pusti", rec: "Pusti" },
        { id: "serif", rec: `${serifIme} jaše` },
      ],
    });
  }
  if (tip === "konj") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(KONJ_REC, t),
      t,
      opcije: [
        { id: "lijeci", rec: "Zaveži · 5" },
        { id: "pusti", rec: "Pusti" },
        { id: "serif", rec: `${serifIme} vodi` },
      ],
    });
  }
  if (tip === "kisa") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(KISA_REC, t),
      t,
      opcije: [
        { id: "kisa", rec: "Otvori cisternu" },
        { id: "pusti", rec: "Čekaj nebo" },
        { id: "serif", rec: `${serifIme} kopa` },
      ],
    });
  }
  if (tip === "trgovac") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(TRGOVAC_REC, t),
      t,
      opcije: [
        { id: "trguj", rec: "Trguj · 8" },
        { id: "ostavi", rec: "Ostavi" },
        { id: "serif", rec: `${serifIme} mjeri` },
      ],
    });
  }
  if (tip === "svadba") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(SVADBA_REC, t),
      t,
      opcije: [
        { id: "daj", rec: "Baci 8g" },
        { id: "plesi", rec: "Plesi" },
        { id: "ostavi", rec: "Ostavi" },
      ],
    });
  }
  if (tip === "posta") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(POSTA_REC, t),
      t,
      opcije: [
        { id: "citaj", rec: "Otvori" },
        { id: "serif", rec: `${serifIme} čita` },
        { id: "spali", rec: "Spali" },
      ],
    });
  }
  if (tip === "cirkus") {
    return sIme(serifIme, {
      id,
      tip,
      rec: iz(CIRKUS_REC, t),
      t,
      opcije: [
        { id: "ulaz", rec: "Ulaz · 5" },
        { id: "gledaj", rec: "Gledaj s ruba" },
        { id: "ostavi", rec: "Ostavi šator" },
      ],
    });
  }
  return sIme(serifIme, {
    id,
    tip: "salun",
    rec: iz(SALUN_REC, t),
    t,
    opcije: [
      { id: "izbaci", rec: "Izbaci" },
      { id: "nali", rec: "Natoči · 6 zlata" },
      { id: "serif", rec: `${serifIme} uđe` },
    ],
  });
}

export function izaberiDogadajTip(g: Gradevine, sreca: number, seed: number): DogadajTip {
  const imaSalun = (g.salun || 0) > 0;
  const imaTor = (g.tor || 0) > 0;
  const imaStaju = (g.staja || 0) > 0;
  const imaVodu = (g.bunar || 0) > 0 || (g.cisterna || 0) > 0;
  const r = Math.abs(seed) % 16;
  if (imaTor && r < 2) return "krdo";
  if (imaStaju && r < 4) return "konj";
  if (imaVodu && r < 5) return "kisa";
  if ((g.trgovina || 0) > 0 && r < 7) return "trgovac";
  if (imaSalun && r === 8) return "svadba";
  if (r === 9) return "posta";
  if (r === 10) return "cirkus";
  if (imaSalun && r < 13) return "salun";
  if (imaSalun) return "dvoboj";
  if (sreca < 40) return "stranac";
  return "stranac";
}

export const DOGADJ_PAUSE_MS = 6 * 60 * 1000;

export function smijeNoviDogadaj(zadnji: number, sad: number, imaAktivan: boolean) {
  if (imaAktivan) return false;
  return sad - Math.max(0, zadnji) >= DOGADJ_PAUSE_MS;
}

export function rijesiIshod(
  d: KaubaDogadaj,
  opcija: string,
  ctx: { imaRed: boolean; zlato: number; seed: number },
): DogadajIshod {
  if (d.naslov) {
    const i = SERIF_CINOVI.findIndex((s) => s.naslov === d.naslov);
    const cin = SERIF_CINOVI[i] ?? SERIF_CINOVI[0]!;
    return cin.kraj(d.serifIme ?? "Boro", opcija, ctx.imaRed);
  }
  const r = Math.abs(ctx.seed) % 100;
  if (d.tip === "stranac") {
    if (opcija === "primi") {
      if (r < 28) return { rec: "Stranac je uzeo i pobjegao.", zlato: -12, kvaliteta: -3 };
      return { rec: "Stranac sjedi. Kauba ima još jedan par očiju.", zlato: -6, stitovi: r < 55 ? 1 : 0, kvaliteta: 2 };
    }
    if (opcija === "otjeraj") {
      if (!ctx.imaRed) return { rec: "Nema tko da ga otjera. Uzeo je torbu.", zlato: -10, kvaliteta: -2 };
      return { rec: "Otjerali su ga. Prašina ostaje.", serifXp: true, kvaliteta: 1 };
    }
    if (r < 22) return { rec: "Otišao. I torba s njim.", zlato: -8, kvaliteta: -2 };
    return { rec: "Otišao. Ulica je opet naša." };
  }
  if (d.tip === "dvoboj") {
    if (opcija === "serif") {
      if (!ctx.imaRed) return { rec: "Nema tko da stane. Salun je krvav.", zlato: -8, ozljeda: true, ostecenje: "salun", kvaliteta: -4 };
      return { rec: "Dvoboj je stao. Kazna plaćena.", zlato: 6, celija: 1, serifXp: true, kvaliteta: 2 };
    }
    if (opcija === "gledaj") {
      if (ctx.zlato < 8) return { rec: "Nemaš 8 zlata za ulog. Ulica gleda." };
      if (r < 48) return { rec: "Pogodak. Ulog se vratio duplo.", zlato: 8 };
      return { rec: "Promašaj. Prašina i prazan džep.", zlato: -8, kvaliteta: -1 };
    }
    return { rec: "Pustili. Salun plaća staklo.", zlato: -4, ozljeda: true, ostecenje: "salun", kvaliteta: -3 };
  }
  if (d.tip === "krdo") {
    if (opcija === "vrati") return { rec: "Krdo u toru. Kata kima.", zlato: 4, kvaliteta: 2 };
    if (opcija === "serif") {
      if (!ctx.imaRed) return { rec: "Nema tko da jaše. Govedo u kukuruzu.", zlato: -6, kvaliteta: -2 };
      return { rec: "Jaše. Rogovi natrag iza ograde.", zlato: 6, serifXp: true, kvaliteta: 2 };
    }
    return { rec: "Pustili. Meso u prašini. Tor puca.", zlato: -8, ostecenje: "tor", kvaliteta: -3 };
  }
  if (d.tip === "konj") {
    if (opcija === "lijeci") {
      if (ctx.zlato < 5) return { rec: "Nema 5g za zavoj." };
      return { rec: "Kopito zavezano. Konj diše.", zlato: -5, energija: 1, kvaliteta: 1 };
    }
    if (opcija === "serif") return { rec: "Vodi ga u staju. Tiho.", stitovi: 1, serifXp: true };
    return { rec: "Pustili. Sutra hromlje i dalje.", kvaliteta: -2 };
  }
  if (d.tip === "kisa") {
    if (opcija === "kisa") return { rec: "Cisterna otvorena. Kap po kap.", energija: 3, kisa: true, kvaliteta: 2 };
    if (opcija === "serif") return { rec: "Kopa. Voda na dlanu.", energija: 2, serifXp: true };
    return { rec: "Čekali nebo. Prašina ostaje.", kvaliteta: -2 };
  }
  if (d.tip === "trgovac") {
    if (opcija === "trguj") {
      if (ctx.zlato < 8) return { rec: "Nema 8g. Trgovac ode." };
      return { rec: "Mjera gotova. Torba teža.", zlato: -8 + 12, kvaliteta: 1 };
    }
    if (opcija === "serif") return { rec: "Mjeri. Vaga ne laže.", zlato: 4, serifXp: true };
    return { rec: "Ostavi. Kola idu dalje." };
  }
  if (d.tip === "svadba") {
    if (opcija === "daj") {
      if (ctx.zlato < 8) return { rec: "Nema 8g. Mladenci kimali i otišli." };
      return { rec: "Bacio si 8g. Mara pjeva. Salun diše.", zlato: -8, energija: 2, kvaliteta: 3 };
    }
    if (opcija === "plesi") return { rec: "Ples u prašini. Čizma lupa. Kauba vesela.", energija: 1, kvaliteta: 2 };
    return { rec: "Ostavi. Vijenac se suši na vjetru.", kvaliteta: -1 };
  }
  if (d.tip === "posta") {
    if (opcija === "citaj") {
      if (r < 40) return { rec: "Pismo nosi zlato. Netko je vratio dug.", zlato: 10 };
      if (r < 70) return { rec: "Potjernica. Lice tuđe. Šerif trže uhom.", stitovi: 1, serifXp: true };
      return { rec: "Prazan papir. Prašina umjesto riječi." };
    }
    if (opcija === "serif") return { rec: "Čita naglas. Ulica sluša. Zakon stoji.", zlato: 4, serifXp: true, kvaliteta: 2 };
    return { rec: "Papir u vatri. Dim i mir." };
  }
  if (d.tip === "cirkus") {
    if (opcija === "ulaz") {
      if (ctx.zlato < 5) return { rec: "Nema 5g. Šator ostaje zatvoren." };
      return { rec: "Ulaz. Vatra u grlu. Smijeh. Kauba odahne.", zlato: -5, energija: 3, kvaliteta: 3 };
    }
    if (opcija === "gledaj") return { rec: "S ruba. Bubanj daleko. Dosta je.", energija: 1 };
    return { rec: "Šator se sklopio. Prašina opet." };
  }
  if (opcija === "nali") {
    if (ctx.zlato < 6) return { rec: "Nema zlata za još jedan krug." };
    return { rec: "Još jedna tura. Mara kihne, ali pjeva.", zlato: -6, kvaliteta: 1 };
  }
  if (opcija === "serif") {
    if (!ctx.imaRed) return { rec: "Šerifa nema. Asovi idu dalje, ružno.", kvaliteta: -2 };
    return { rec: "Ušao je. Karte na stol. Tišina.", serifXp: true, kvaliteta: 1 };
  }
  return { rec: "Izbacili varača. Asovi opet čisti.", zlato: 4, kvaliteta: 1 };
}
