import { ZGRADE } from "./constants";
import { izracunajMaxStitova, izracunajPasivniMnozitelj } from "./economy";
import { stavOd } from "./kronika";
import { MREZA_ART } from "./art";
import type { DebriefStav, Gradevine, Klan, KronikaZapis, Ostecenja } from "./types";

export type MrezaVrsta = "selo" | "zgrada" | "obrana" | "klan" | "stav" | "meta" | "kriza";

export type MrezaCvor = {
  id: string;
  naziv: string;
  vrsta: MrezaVrsta;
  art: string;
  x: number;
  y: number;
  kvaliteta: number;
  akcija?: "zgrada" | "napad" | "ceh";
  zgradaId?: keyof Gradevine;
};

export type MrezaVeza = {
  id: string;
  od: string;
  do: string;
  predznak: 1 | -1;
  jacina: number;
  doprinos: number;
  opis: string;
};

export type MrezaUlaz = {
  imeIgraca: string;
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  stitovi: number;
  oklop: number;
  klan: Klan;
  stavSela: DebriefStav | null;
  kronika: KronikaZapis[];
  igracRazina: number;
  prestigeRazina: number;
};

export const BAZA_SELO = 20;

const ZGRADA_XY: Record<keyof Gradevine, { x: number; y: number }> = {
  pilana: { x: 22, y: 28 },
  kamenolom: { x: 78, y: 26 },
  rudnik: { x: 80, y: 62 },
};

function clampK(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function doprinosVeze(predznak: 1 | -1, jacina: number, kvOd: number) {
  return predznak * jacina * kvOd;
}

function jacinaProizvodnje(prod: number, kap: number) {
  if (prod <= 0) return 0;
  return 0.14 + 0.22 * clamp01(prod / Math.max(0.001, kap));
}

function jedinstveneMete(kronika: KronikaZapis[]) {
  const seen = new Set<string>();
  const out: KronikaZapis[] = [];
  for (const z of kronika) {
    const k = z.metaIme.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(z);
    if (out.length >= 3) break;
  }
  return out;
}

export function izgradiMrezu(s: MrezaUlaz): { cvorovi: MrezaCvor[]; veze: MrezaVeza[] } {
  const cvorovi: MrezaCvor[] = [];
  const veze: MrezaVeza[] = [];
  const kv: Record<string, number> = {};
  const goriBroj = Number(s.ostecenja.pilana) + Number(s.ostecenja.kamenolom) + Number(s.ostecenja.rudnik);
  const maxStit = izracunajMaxStitova(s.oklop);
  const pasivni = izracunajPasivniMnozitelj(s.igracRazina, s.prestigeRazina);

  const dodaj = (od: string, doId: string, predznak: 1 | -1, jacina: number, opis: string) => {
    const j = Math.max(0.08, Math.min(1, jacina));
    const doprinos = doprinosVeze(predznak, j, kv[od] ?? 0);
    veze.push({
      id: `${od}>${doId}`,
      od,
      do: doId,
      predznak,
      jacina: j,
      doprinos,
      opis,
    });
  };

  for (const z of ZGRADE) {
    const lv = s.gradevine[z.id] || 0;
    const gori = !!s.ostecenja[z.id];
    const prod = !gori && lv > 0 ? lv * z.bazaProizvodnja * pasivni : 0;
    const kap = z.maxLv * z.bazaProizvodnja * 2.5;
    const id = `z:${z.id}`;
    kv[id] = gori ? 0 : clampK((lv / z.maxLv) * 100);
    cvorovi.push({
      id,
      naziv: z.naziv,
      vrsta: "zgrada",
      art: MREZA_ART[z.id],
      x: ZGRADA_XY[z.id].x,
      y: ZGRADA_XY[z.id].y,
      kvaliteta: kv[id],
      akcija: "zgrada",
      zgradaId: z.id,
    });
    const j = jacinaProizvodnje(prod, kap);
    if (j > 0) dodaj(id, "selo", 1, j, `Proizvodnja ${z.naziv.toLowerCase()}`);
  }

  kv.oklop = clampK((s.stitovi / Math.max(1, maxStit)) * 100);
  cvorovi.push({
    id: "oklop",
    naziv: "Oklop",
    vrsta: "obrana",
    art: MREZA_ART.oklop,
    x: 20,
    y: 64,
    kvaliteta: kv.oklop,
  });
  if (s.stitovi > 0) {
    dodaj("oklop", "selo", 1, 0.2 + 0.1 * (s.stitovi / maxStit), "Štit drži bazu");
  }

  if (s.klan.naziv) {
    kv.klan = clampK(24 + s.klan.razina * 14 + s.klan.xp / 80);
    cvorovi.push({
      id: "klan",
      naziv: s.klan.naziv,
      vrsta: "klan",
      art: MREZA_ART.klan,
      x: 88,
      y: 46,
      kvaliteta: kv.klan,
      akcija: "ceh",
    });
    dodaj("klan", "selo", 1, 0.12 + 0.03 * s.klan.razina, "Ceh drži leđa");
  }

  const stav = stavOd(s.stavSela);
  if (stav) {
    kv.stav = stav.id === "strateg" ? 78 : stav.id === "osvetnik" ? 64 : 58;
    cvorovi.push({
      id: "stav",
      naziv: stav.naziv,
      vrsta: "stav",
      art: MREZA_ART[stav.id],
      x: 10,
      y: 46,
      kvaliteta: kv.stav,
    });
    const jStav = stav.id === "strateg" ? 0.16 : stav.id === "osvetnik" ? 0.08 : 0.1;
    dodaj("stav", "selo", 1, jStav, stav.moto);
  }

  if (goriBroj > 0) {
    kv.pozar = clampK(35 + 22 * goriBroj);
    cvorovi.push({
      id: "pozar",
      naziv: "Požar",
      vrsta: "kriza",
      art: MREZA_ART.pozar,
      x: 50,
      y: 14,
      kvaliteta: kv.pozar,
      akcija: "napad",
    });
    dodaj("pozar", "selo", -1, 0.4 + 0.08 * goriBroj, "Selo gori — proizvodnja pada");
  }

  const mete = jedinstveneMete(s.kronika);
  const metaX = [28, 50, 72];
  mete.forEach((z, i) => {
    const id = `m:${z.metaIme}`;
    kv[id] = z.pobjeda
      ? clampK(52 + (z.stav === "strateg" ? 16 : z.stav === "osvetnik" ? 10 : 6))
      : clampK(34 + (z.stav === "strateg" ? 8 : 0));
    cvorovi.push({
      id,
      naziv: z.metaIme,
      vrsta: "meta",
      art: z.pobjeda ? MREZA_ART.metaWin : MREZA_ART.metaLoss,
      x: metaX[i] ?? 50,
      y: 82,
      kvaliteta: kv[id],
      akcija: "napad",
    });
    if (z.pobjeda) dodaj(id, "selo", 1, 0.1, `Plijen iz ${z.metaIme}`);
    else dodaj(id, "selo", -1, 0.12, `${z.metaIme} drži ravnotežu`);
    if (stav) {
      dodaj(
        "stav",
        id,
        1,
        0.18,
        z.stav === "strateg" ? "Čitaš im hrpe" : z.stav === "osvetnik" ? "Pritisak osvete" : "Gledaš ostavu",
      );
    }
  });

  const zbroj = veze.filter((v) => v.do === "selo").reduce((a, v) => a + v.doprinos, 0);
  kv.selo = clampK(BAZA_SELO + zbroj);
  cvorovi.unshift({
    id: "selo",
    naziv: s.imeIgraca || "Selo",
    vrsta: "selo",
    art: MREZA_ART.selo,
    x: 50,
    y: 48,
    kvaliteta: kv.selo,
  });

  return { cvorovi, veze };
}

export function kvSelaIzMreze(g: { cvorovi: MrezaCvor[] }) {
  return g.cvorovi.find((c) => c.id === "selo")?.kvaliteta ?? BAZA_SELO;
}

export function vezeZa(id: string, veze: MrezaVeza[]) {
  const ulaz: MrezaVeza[] = [];
  const izlaz: MrezaVeza[] = [];
  for (const v of veze) {
    if (v.do === id) ulaz.push(v);
    if (v.od === id) izlaz.push(v);
  }
  ulaz.sort((a, b) => Math.abs(b.doprinos) - Math.abs(a.doprinos));
  izlaz.sort((a, b) => Math.abs(b.doprinos) - Math.abs(a.doprinos));
  return { ulaz, izlaz };
}
