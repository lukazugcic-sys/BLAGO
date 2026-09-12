export type SezonalniDogadaj = {
  id: string;
  naziv: string;
  znak: string;
  boja: string;
  opis: string;
  pocetakMjesec: number;
  pocetakDan: number;
  krajMjesec: number;
  krajDan: number;
  modifikatorBlaga: Record<string, number>;
  bonusMnozitelj: number;
};

export const SEZONALNI_DOGADAJI: SezonalniDogadaj[] = [
  {
    id: "nova_godina",
    naziv: "Nova godina",
    znak: "vatromet",
    boja: "#e879f9",
    opis: "Dijamantska kiša. Bonus dijamanti na svakom dobitku.",
    pocetakMjesec: 12,
    pocetakDan: 30,
    krajMjesec: 1,
    krajDan: 3,
    modifikatorBlaga: { gem: 2.5, gold: 1.8, skull: 0.4 },
    bonusMnozitelj: 2.0,
  },
  {
    id: "halloween",
    naziv: "Noć vještica",
    znak: "lubanja",
    boja: "#f97316",
    opis: "Lubanje napadaju češće, ali jackpot je dvostruk.",
    pocetakMjesec: 10,
    pocetakDan: 15,
    krajMjesec: 10,
    krajDan: 31,
    modifikatorBlaga: { skull: 2.5, gem: 1.8, gold: 0.7 },
    bonusMnozitelj: 2.0,
  },
  {
    id: "bozic",
    naziv: "Božićni festival",
    znak: "bor",
    boja: "#22c55e",
    opis: "Više drva, manje teškoće. Vesele igre.",
    pocetakMjesec: 12,
    pocetakDan: 20,
    krajMjesec: 1,
    krajDan: 5,
    modifikatorBlaga: { wood: 2.5, gold: 1.5, skull: 0.3 },
    bonusMnozitelj: 1.5,
  },
  {
    id: "ljeto",
    naziv: "Ljetni festival",
    znak: "sunce",
    boja: "#fbbf24",
    opis: "Zlatna sezona — više zlata i energije.",
    pocetakMjesec: 7,
    pocetakDan: 1,
    krajMjesec: 7,
    krajDan: 31,
    modifikatorBlaga: { gold: 2.0, energy: 1.8 },
    bonusMnozitelj: 1.25,
  },
];

export const dohvatiAktivniDogadaj = (
  datum = new Date(),
): SezonalniDogadaj | null => {
  const mj = datum.getMonth() + 1;
  const dan = datum.getDate();

  for (const d of SEZONALNI_DOGADAJI) {
    const { pocetakMjesec: pm, pocetakDan: pd, krajMjesec: km, krajDan: kd } = d;
    const premostujeGodinu = pm > km || (pm === km && pd > kd);

    const aktivan = premostujeGodinu
      ? mj > pm || (mj === pm && dan >= pd) || mj < km || (mj === km && dan <= kd)
      : (mj > pm || (mj === pm && dan >= pd)) &&
        (mj < km || (mj === km && dan <= kd));

    if (aktivan) return d;
  }
  return null;
};
