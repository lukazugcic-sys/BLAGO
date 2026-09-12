import type { Gradevine, Gradnja, Karavana, Ostecenja, Resursi } from "@/lib/game/types";
import { POKRICE, izracunajKauba, konjaKap, type KaubaDuznost, type KaubaExtra, type GovedoDuznost } from "./economy";

export type LikAlat = "sjekira" | "kosar" | "kanta" | "casa" | "cekic" | "kruh" | "zvezda" | "uzda" | "torba" | "prazno";
export type LikHub = "krov" | "jelo" | "voda" | "zabava" | "posao" | "red" | "konji" | "zdravlje";
export type DanDoba = "jutro" | "dan" | "suton" | "noc";

export type Stanovnik = {
  id: string;
  ime: string;
  spol: "m" | "z";
  posao: string;
  hub: LikHub;
  rec: string;
  alat: LikAlat;
  xp: number;
  razina: number;
  buffovi: string[];
  mane: string[];
};

export const GLAVNI_ID = ["boro", "kata", "ivo", "mara", "mile"] as const;

export function jeGlavni(id: string) {
  return (GLAVNI_ID as readonly string[]).includes(id);
}

export function poredajGlavne<T extends { id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ga = (GLAVNI_ID as readonly string[]).indexOf(a.id);
    const gb = (GLAVNI_ID as readonly string[]).indexOf(b.id);
    if (ga < 0 && gb < 0) return 0;
    if (ga < 0) return 1;
    if (gb < 0) return -1;
    return ga - gb;
  });
}
export const LIK_XP_PO_LV = 96;
export const LIK_MAX_RAZINA = 20;

export type LikBuffSto = "brzina" | "obrana" | "sreca" | "plijen" | "red" | "rad" | "konj";

export const LIK_BUFFOVI: Array<{ id: string; rec: string; sto: LikBuffSto }> = [
  { id: "brze-ruke", rec: "Brze ruke", sto: "brzina" },
  { id: "tvrda-glava", rec: "Tvrda glava", sto: "obrana" },
  { id: "sretan-dlan", rec: "Sretan dlan", sto: "sreca" },
  { id: "puna-torba", rec: "Puna torba", sto: "plijen" },
  { id: "tihi-korak", rec: "Tihi korak", sto: "red" },
  { id: "jaka-leda", rec: "Jaka leđa", sto: "rad" },
  { id: "cvrsto-sedlo", rec: "Čvrsto sedlo", sto: "konj" },
  { id: "ostro-oko", rec: "Oštro oko", sto: "sreca" },
  { id: "prasina-u-krvi", rec: "Prašina u krvi", sto: "konj" },
  { id: "duga-uzda", rec: "Duga uzda", sto: "brzina" },
  { id: "tvrdi-pogled", rec: "Tvrdi pogled", sto: "red" },
  { id: "lovacki-njuh", rec: "Lovački njuh", sto: "plijen" },
  { id: "mirna-ruka", rec: "Mirna ruka", sto: "obrana" },
  { id: "tesarski-udar", rec: "Tesarski udar", sto: "rad" },
];

export const LIK_MANE: Array<{ id: string; rec: string; sto: LikBuffSto }> = [
  { id: "kriva-noga", rec: "Kriva noga", sto: "brzina" },
  { id: "prazan-dzep", rec: "Prazan džep", sto: "plijen" },
  { id: "glasna-usta", rec: "Glasna usta", sto: "red" },
  { id: "crna-sreca", rec: "Crna sreća", sto: "sreca" },
  { id: "pijana-glava", rec: "Pijana glava", sto: "rad" },
  { id: "strah-od-konja", rec: "Strah od konja", sto: "konj" },
  { id: "slaba-ruka", rec: "Slaba ruka", sto: "obrana" },
  { id: "lijen-korak", rec: "Lijen korak", sto: "brzina" },
  { id: "kradljiva-ruka", rec: "Kradljiva ruka", sto: "plijen" },
  { id: "kratak-fitilj", rec: "Kratak fitilj", sto: "red" },
  { id: "slaba-jetra", rec: "Slaba jetra", sto: "rad" },
  { id: "teska-glava", rec: "Teška glava", sto: "sreca" },
  { id: "mokre-cizme", rec: "Mokre čizme", sto: "obrana" },
];

type LikPredlozak = Omit<Stanovnik, "xp" | "razina" | "buffovi" | "mane"> & {
  startBuff?: string;
  startMana?: string;
};

const POCETAK: LikPredlozak[] = [
  { id: "ivo", ime: "Ivo", spol: "m", posao: "Građevinac", hub: "krov", alat: "cekic", rec: "Diže krov. Čekić mu je u ruci.", startBuff: "jaka-leda" },
  { id: "kata", ime: "Kata", spol: "z", posao: "Lovačica", hub: "jelo", alat: "kosar", rec: "Budi se prije pijetla. Donosi meso.", startBuff: "ostro-oko" },
  { id: "mile", ime: "Mile", spol: "m", posao: "Vodonoša", hub: "voda", alat: "kanta", rec: "Čuva bunar kao oko u glavi.", startMana: "strah-od-konja" },
  { id: "mara", ime: "Mara", spol: "z", posao: "Gostioničarka", hub: "zabava", alat: "casa", rec: "Salun drži na nogama.", startBuff: "sretan-dlan" },
  { id: "boro", ime: "Boro", spol: "m", posao: "Šerif", hub: "red", alat: "zvezda", rec: "Zvijezda na prsima. Red u ulici.", startBuff: "tvrda-glava" },
];

const POOL: LikPredlozak[] = [
  ...POCETAK,
  { id: "pero", ime: "Pero", spol: "m", posao: "Konjušar", hub: "konji", alat: "uzda", rec: "Konj mu vjeruje. Čovjek manje.", startBuff: "cvrsto-sedlo" },
  { id: "tena", ime: "Tena", spol: "z", posao: "Kaubojka", hub: "konji", alat: "uzda", rec: "Jaše prije doručka.", startBuff: "cvrsto-sedlo" },
  { id: "andrija", ime: "Andrija", spol: "m", posao: "Jahač", hub: "konji", alat: "uzda", rec: "Prašina mu je kuća.", startBuff: "prasina-u-krvi" },
  { id: "vlado", ime: "Vlado", spol: "m", posao: "Farmer", hub: "jelo", alat: "kosar", rec: "Žito ne laže. On ništa.", startBuff: "jaka-leda" },
  { id: "sima", ime: "Sima", spol: "m", posao: "Gazda", hub: "jelo", alat: "uzda", rec: "Krdo sluša. Ljudi manje. Firma je tijesna.", startBuff: "jaka-leda" },
  { id: "mito", ime: "Mito", spol: "m", posao: "Referent", hub: "jelo", alat: "torba", rec: "Broji grla. Plaća tanka. Firma ga jede.", startMana: "prazan-dzep" },
  { id: "luka", ime: "Luka", spol: "m", posao: "Gonič", hub: "jelo", alat: "uzda", rec: "Tjera prašinu. I goveda.", startBuff: "prasina-u-krvi" },
  { id: "jure", ime: "Jure", spol: "m", posao: "Klesar", hub: "posao", alat: "cekic", rec: "Kamen sluša samo njega.", startBuff: "tesarski-udar" },
  { id: "ruza", ime: "Ruža", spol: "z", posao: "Liječnica", hub: "zdravlje", alat: "torba", rec: "Rana priča. Ona sluša.", startBuff: "mirna-ruka" },
  { id: "zora", ime: "Zora", spol: "z", posao: "Travarica", hub: "zdravlje", alat: "kosar", rec: "Bere travu. Rana čeka nju.", startBuff: "mirna-ruka" },
  { id: "karlo", ime: "Karlo", spol: "m", posao: "Cisternar", hub: "voda", alat: "kanta", rec: "Kiša mu je bunar. Krov hvata.", startBuff: "jaka-leda" },
  { id: "luce", ime: "Luce", spol: "z", posao: "Pekarica", hub: "jelo", alat: "kruh", rec: "Kruh ide iz ruke u ruku." },
  { id: "bozo", ime: "Božo", spol: "m", posao: "Kauboj", hub: "konji", alat: "uzda", rec: "Sedlo ne skida.", startBuff: "cvrsto-sedlo", startMana: "glasna-usta" },
  { id: "simun", ime: "Šime", spol: "m", posao: "Trgovac", hub: "posao", alat: "torba", rec: "Cijena je zakon. On piše zakon.", startBuff: "puna-torba" },
  { id: "tome", ime: "Tome", spol: "m", posao: "Krovopokrivač", hub: "krov", alat: "cekic", rec: "Nema kuće bez njegova čavla.", startBuff: "jaka-leda" },
  { id: "anka", ime: "Anka", spol: "z", posao: "Vodarica", hub: "voda", alat: "kanta", rec: "Mlinsko kolo zna njezino ime.", startMana: "mokre-cizme" },
  { id: "pavao", ime: "Pavao", spol: "m", posao: "Bankar", hub: "red", alat: "torba", rec: "Zlato spava kod njega. On ne spava.", startBuff: "tihi-korak" },
  { id: "ljuba", ime: "Ljuba", spol: "z", posao: "Konjušarica", hub: "konji", alat: "uzda", rec: "Staja miriše na nju.", startBuff: "cvrsto-sedlo" },
  { id: "stipe", ime: "Stipe", spol: "m", posao: "Rudar", hub: "posao", alat: "cekic", rec: "Ruda ga zove u mrak.", startMana: "teska-glava" },
  { id: "cvita", ime: "Cvita", spol: "z", posao: "Mesarica", hub: "jelo", alat: "kosar", rec: "Nož drži mirno.", startBuff: "mirna-ruka" },
  { id: "roko", ime: "Roko", spol: "m", posao: "Pilar", hub: "posao", alat: "sjekira", rec: "Pilana ne staje dok on stoji." },
  { id: "manda", ime: "Manda", spol: "z", posao: "Pjevačica", hub: "zabava", alat: "casa", rec: "U salunu prva i zadnja.", startMana: "glasna-usta" },
  { id: "savka", ime: "Savka", spol: "z", posao: "Kaubojka", hub: "konji", alat: "uzda", rec: "Konj i ona, isti korak.", startBuff: "duga-uzda" },
  { id: "frane", ime: "Frane", spol: "m", posao: "Mlinar", hub: "voda", alat: "kanta", rec: "Voda i žito, ništa treće." },
  { id: "doma", ime: "Doma", spol: "z", posao: "Domaćica", hub: "krov", alat: "prazno", rec: "Kuća diše dok je ona u njoj." },
  { id: "vinko", ime: "Vinko", spol: "m", posao: "Kauboj", hub: "konji", alat: "uzda", rec: "Kauba bez konja nije kauba.", startBuff: "cvrsto-sedlo", startMana: "kratak-fitilj" },
  { id: "niko", ime: "Niko", spol: "m", posao: "Klesar", hub: "posao", alat: "cekic", rec: "Kamenolom mu je drugi dom." },
  { id: "zorka", ime: "Zorka", spol: "z", posao: "Pekarica", hub: "jelo", alat: "kruh", rec: "Peć ne gasi." },
  { id: "mate", ime: "Mate", spol: "m", posao: "Lovac", hub: "jelo", alat: "kosar", rec: "Trag čita bolje od mape.", startBuff: "lovacki-njuh" },
  { id: "bara", ime: "Bara", spol: "z", posao: "Vodarica", hub: "voda", alat: "kanta", rec: "Bunar joj šapće." },
  { id: "jozo", ime: "Jozo", spol: "m", posao: "Rudar", hub: "posao", alat: "cekic", rec: "Željezo mu je u dlanu." },
  { id: "tonka", ime: "Tonka", spol: "z", posao: "Djeliteljica", hub: "zabava", alat: "casa", rec: "Asove dijeli bez treptaja.", startBuff: "sretan-dlan", startMana: "crna-sreca" },
  { id: "ante", ime: "Ante", spol: "m", posao: "Tesar", hub: "krov", alat: "sjekira", rec: "Greda mora sjediti ravno.", startBuff: "tesarski-udar" },
  { id: "ika", ime: "Ika", spol: "z", posao: "Lovačica", hub: "jelo", alat: "kosar", rec: "Puška je lakša od brige.", startBuff: "ostro-oko" },
];

export const LIK_CRTE: Record<string, string> = {
  ivo: "Greda mora sjediti. Inače ne spava.",
  kata: "Meso prvo. Priča poslije.",
  mile: "Voda ne laže. Ljudi da.",
  mara: "Salun hrani kaubu. I nju.",
  boro: "Zvijezda teža od puške.",
  pero: "Konjima vjeruje. Ljudima broji zube.",
  tena: "Prašina joj je parfem.",
  andrija: "Put bez sedla nije put.",
  vlado: "Žito zna kad kiša laže.",
  sima: "Krdo zna tko je gazda. Firma ne.",
  mito: "Broji. Šuti. Plaća ne stiže.",
  luka: "Tjera dok prašina stane.",
  jure: "Kamen mu je brat. Tiši od brata.",
  ruza: "Rana ne čeka. Ni ona.",
  zora: "Trava zna ime rane.",
  karlo: "Kiša mu je bunar.",
  luce: "Tijesto sluša toplinu ruke.",
  bozo: "Glas prvi. Pamet druga.",
  simun: "Broji brže nego što diše.",
  tome: "Čavao mora ući ravno.",
  anka: "Kolo i ona, isti ritam.",
  pavao: "Ključ nosi na prsima.",
  ljuba: "Svaki konj ima ime. Ona ga zna.",
  stipe: "Mrak mu ne smeta. Sunce da.",
  cvita: "Reže čisto. Govori manje.",
  roko: "Pilana je njegova crkva.",
  manda: "Pjesma joj je oružje.",
  savka: "Jaše kao da hoda.",
  frane: "Žito i voda. Treće ne treba.",
  doma: "Kuća bez nje nije kuća.",
  vinko: "Fitilj kratak. Konj dug.",
  niko: "Prašina kamena mu je kruh.",
  zorka: "Peć ne gasi ni u snu.",
  mate: "Trag čita. Čovjeka još bolje.",
  bara: "Bunar joj šapće ime.",
  jozo: "Ruda i on, isti mrak.",
  tonka: "Karta laže. Ona ne.",
  ante: "Greda ili ništa.",
  ika: "Puška laka. Briga teška.",
  "segrt-bero": "Čekić mu je još težak. Uči.",
  "segrt-cile": "Gleda Ivu. Ponavlja.",
  "segrt-duje": "Čavao ide krivo. Još uči.",
  "zam-joso": "Zvijezda nova. Još gori.",
  "zam-neda": "Zvijezda nova. Ona je drži.",
};

export function likCrta(p: Stanovnik) {
  return LIK_CRTE[p.id] ?? p.rec;
}

export function razinaLika(xp: number) {
  return Math.min(LIK_MAX_RAZINA, 1 + Math.floor(Math.max(0, xp) / LIK_XP_PO_LV));
}

export function likXpPostotak(p: { xp: number; razina: number }) {
  if (p.razina >= LIK_MAX_RAZINA) return 100;
  const od = (p.razina - 1) * LIK_XP_PO_LV;
  return Math.max(0, Math.min(100, ((p.xp - od) / LIK_XP_PO_LV) * 100));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function izaberiBuff(ima: string[], kljuc: string) {
  const slobodni = LIK_BUFFOVI.filter((b) => !ima.includes(b.id));
  if (!slobodni.length) return null;
  return slobodni[hash(kljuc) % slobodni.length]!;
}

function izaberiManu(ima: string[], kljuc: string) {
  const slobodni = LIK_MANE.filter((b) => !ima.includes(b.id));
  if (!slobodni.length) return null;
  return slobodni[hash(kljuc) % slobodni.length]!;
}

export function imaBuff(p: Stanovnik, sto: LikBuffSto) {
  return (p.buffovi ?? []).some((id) => LIK_BUFFOVI.some((b) => b.id === id && b.sto === sto));
}

export function imaManu(p: Stanovnik, sto: LikBuffSto) {
  return (p.mane ?? []).some((id) => LIK_MANE.some((b) => b.id === id && b.sto === sto));
}

export function brojBuff(ljudi: Stanovnik[], sto: LikBuffSto) {
  return Math.min(3, ljudi.filter((p) => imaBuff(p, sto)).length);
}

export function jacina(ljudi: Stanovnik[], sto: LikBuffSto) {
  const plus = ljudi.filter((p) => imaBuff(p, sto)).length;
  const minus = ljudi.filter((p) => imaManu(p, sto)).length;
  return Math.max(-3, Math.min(3, plus - minus));
}

export function recBuff(p: Stanovnik) {
  const zadnji = (p.buffovi ?? []).at(-1);
  if (!zadnji) return null;
  return LIK_BUFFOVI.find((b) => b.id === zadnji)?.rec ?? null;
}

export function recMana(p: Stanovnik) {
  const zadnja = (p.mane ?? []).at(-1);
  if (!zadnja) return null;
  return LIK_MANE.find((b) => b.id === zadnja)?.rec ?? null;
}

export function recSveBuff(p: Stanovnik) {
  return (p.buffovi ?? [])
    .map((id) => LIK_BUFFOVI.find((b) => b.id === id)?.rec)
    .filter((x): x is string => !!x);
}

export function recSveMane(p: Stanovnik) {
  return (p.mane ?? [])
    .map((id) => LIK_MANE.find((b) => b.id === id)?.rec)
    .filter((x): x is string => !!x);
}

export function recNoviBuff(stari: Stanovnik, novi: Stanovnik) {
  if ((novi.buffovi?.length ?? 0) <= (stari.buffovi?.length ?? 0)) return null;
  return recBuff(novi);
}

export function recNovaMana(stari: Stanovnik, novi: Stanovnik) {
  if ((novi.mane?.length ?? 0) <= (stari.mane?.length ?? 0)) return null;
  return recMana(novi);
}

export function dodajXpLiku(p: Stanovnik, n: number): Stanovnik {
  const xp = Math.max(0, p.xp + n);
  const stara = p.razina;
  const nova = Math.min(LIK_MAX_RAZINA, Math.max(stara, razinaLika(xp)));
  const buffovi = [...(p.buffovi ?? [])];
  const mane = [...(p.mane ?? [])];
  if (nova > stara) {
    for (let lv = stara + 1; lv <= nova; lv++) {
      if (lv % 5 === 0) {
        const b = izaberiBuff(buffovi, `${p.id}:${lv}`);
        if (b) buffovi.push(b.id);
      }
      if (lv % 5 === 3) {
        const m = izaberiManu(mane, `${p.id}:m:${lv}`);
        if (m) mane.push(m.id);
      }
    }
  }
  return { ...p, xp, razina: nova, buffovi, mane };
}

export { konjaKap };

export function tkoJaše(
  ljudi: Stanovnik[],
  g: Gradevine,
  ostecenja: Ostecenja,
  duznost?: KaubaDuznost | null,
): Set<string> {
  if (ostecenja.staja || !(g.staja || 0)) return new Set();
  const kap = duznost ? duznost.jahanje + duznost.ophodnja : konjaKap(g);
  if (kap <= 0) return new Set();
  const red = [...ljudi]
    .filter((p) => p.posao !== "Šegrt" && !imaManu(p, "konj"))
    .sort((a, b) => {
      const bod = (p: Stanovnik) => {
        if (p.posao === "Šerif") return 120 + p.razina;
        if (p.posao === "Zamjenik") return 110 + p.razina;
        if (p.hub === "konji") return 90 + p.razina;
        if (p.posao === "Lovačica" || p.posao === "Lovac") return 70 + p.razina;
        if (imaBuff(p, "konj")) return 60 + p.razina;
        return 20 + p.razina;
      };
      return bod(b) - bod(a);
    });
  return new Set(red.slice(0, kap).map((p) => p.id));
}

export function trebaKonja(p: Stanovnik) {
  if (p.posao === "Šegrt" || imaManu(p, "konj")) return false;
  return (
    p.hub === "konji" ||
    p.posao === "Šerif" ||
    p.posao === "Zamjenik" ||
    p.posao === "Lovac" ||
    p.posao === "Lovačica" ||
    imaBuff(p, "konj")
  );
}

export function recJahanje(p: Stanovnik, jaše: boolean) {
  if (imaManu(p, "konj")) return `${p.ime}: konj? Ne.`;
  if (jaše) return p.hub === "konji" ? `${p.ime}: sedlo drži.` : `${p.ime}: jaše.`;
  if (trebaKonja(p)) return p.hub === "konji" ? `${p.ime}: staja je prazna.` : `${p.ime}: kauboj pješke nije kauboj.`;
  return null;
}

export function serif(ljudi: Stanovnik[]) {
  return ljudi.find((p) => p.posao === "Šerif") ?? ljudi.find((p) => p.hub === "red") ?? null;
}

export function majstor(ljudi: Stanovnik[]) {
  return ljudi.find((p) => p.posao === "Građevinac") ?? ljudi.find((p) => p.hub === "krov") ?? ljudi[0] ?? null;
}

export function doktor(ljudi: Stanovnik[]) {
  return ljudi.find((p) => p.posao === "Liječnica" || p.hub === "zdravlje") ?? null;
}

export const SEGRT_MAX = 3;
export const SEGRT_SKOLA = 3;
const SEGRT_IMENA: Array<{ id: string; ime: string; spol: "m" | "z" }> = [
  { id: "segrt-bero", ime: "Bero", spol: "m" },
  { id: "segrt-cile", ime: "Cile", spol: "m" },
  { id: "segrt-duje", ime: "Duje", spol: "m" },
];

export type Segrt = Stanovnik & { skola: number; spreman: boolean };

export function segrtiZaRazinu(razina: number) {
  return Math.min(SEGRT_MAX, Math.floor(Math.max(0, razina - 1) / 3));
}

export function napraviSegrta(i: number, spreman = false): Segrt {
  const t = SEGRT_IMENA[Math.max(0, Math.min(SEGRT_IMENA.length - 1, i))]!;
  return {
    ...dopuniLika({
      id: t.id,
      ime: t.ime,
      spol: t.spol,
      posao: "Šegrt",
      hub: "krov",
      alat: "cekic",
      rec: spreman ? "Ivo ga pustio na drugu bauštelu." : "Uči od Ive. Čekić mu je još težak.",
    }),
    skola: spreman ? SEGRT_SKOLA : 0,
    spreman,
  };
}

export function uskladiSegrte(segrti: Segrt[], igracRazina: number): Segrt[] {
  const treba = segrtiZaRazinu(igracRazina);
  const ima = segrti.slice(0, SEGRT_MAX);
  while (ima.length < treba) {
    const unlockLv = ima.length * 3 + 4;
    const kasni = igracRazina >= unlockLv + SEGRT_SKOLA;
    ima.push(napraviSegrta(ima.length, kasni));
  }
  return ima;
}

export const ZAMJENIK_MAX = 2;
export const ZAMJENIK_RED = 8;
export const CELIJA_RED = 6;

export function kaubaSaRedom(
  g: Gradevine,
  n: number,
  zamjenici: { spreman?: boolean }[] = [],
  extra?: Omit<KaubaExtra, "red">,
) {
  const red = zamjenici.filter((z) => z.spreman).length * ZAMJENIK_RED + Math.max(0, extra?.celija ?? 0) * CELIJA_RED;
  return izracunajKauba(g, n, { ...extra, red });
}

export function kaubaOd(s: {
  gradevine: Gradevine;
  stanovnici: number;
  zamjenici?: { spreman?: boolean }[];
  konjiBroj?: number;
  konjiDuznost?: KaubaDuznost;
  sijenoDo?: number;
  kisaDo?: number;
  govedaBroj?: number;
  govedaDuznost?: GovedoDuznost;
  celijaBroj?: number;
}) {
  return kaubaSaRedom(s.gradevine, s.stanovnici, s.zamjenici ?? [], {
    konjiBroj: s.konjiBroj,
    duznost: s.konjiDuznost,
    sijeno: (s.sijenoDo ?? 0) > Date.now(),
    kisa: (s.kisaDo ?? 0) > Date.now(),
    govedaBroj: s.govedaBroj,
    govedaDuznost: s.govedaDuznost,
    celija: s.celijaBroj,
  });
}

const ZAMJENIK_IMENA: Array<{ id: string; ime: string; spol: "m" | "z" }> = [
  { id: "zam-joso", ime: "Joso", spol: "m" },
  { id: "zam-neda", ime: "Neda", spol: "z" },
];

export type Zamjenik = Stanovnik & { spreman: boolean };

export function zamjeniciZa(igracRazina: number, uredLv: number) {
  if (uredLv < 1) return 0;
  if (igracRazina >= 8) return 2;
  if (igracRazina >= 5) return 1;
  return 0;
}

export function napraviZamjenika(i: number): Zamjenik {
  const t = ZAMJENIK_IMENA[Math.max(0, Math.min(ZAMJENIK_IMENA.length - 1, i))]!;
  return {
    ...dopuniLika({
      id: t.id,
      ime: t.ime,
      spol: t.spol,
      posao: "Zamjenik",
      hub: "red",
      alat: "zvezda",
      rec: t.spol === "z" ? "Zvijezda nova. Ona je drži." : "Zvijezda nova. Još gori.",
      buffovi: ["tvrdi-pogled"],
    }),
    spreman: true,
  };
}

export function uskladiZamjenike(zamjenici: Zamjenik[], igracRazina: number, uredLv: number): Zamjenik[] {
  const treba = zamjeniciZa(igracRazina, uredLv);
  const ima = zamjenici.slice(0, ZAMJENIK_MAX);
  while (ima.length < treba) ima.push(napraviZamjenika(ima.length));
  return ima.slice(0, treba);
}

export function kaoGradnje(g: Gradnja | Gradnja[] | null | undefined): Gradnja[] {
  if (!g) return [];
  return Array.isArray(g) ? g : [g];
}

export function slobodanGraditelj(ljudi: Stanovnik[], segrti: Segrt[], gradnje: Gradnja[]) {
  const zauzeti = new Set(gradnje.map((g) => g.majstorId));
  const ivo = majstor(ljudi);
  if (ivo && !zauzeti.has(ivo.id)) return ivo;
  return segrti.find((s) => s.spreman && !zauzeti.has(s.id)) ?? null;
}

export function vozar(ljudi: Stanovnik[], zauzetId?: string | null) {
  const slobodni = ljudi.filter((p) => p.id !== zauzetId && p.posao !== "Šerif" && p.posao !== "Građevinac" && p.posao !== "Zamjenik");
  return slobodni.find((p) => p.hub === "konji") ?? slobodni.find((p) => p.hub === "posao") ?? slobodni.find((p) => p.hub === "voda") ?? slobodni[0] ?? ljudi[0] ?? null;
}

export function vrijemeGradnjeMs(ciljLv: number, razina: number, brzina = false, naKonju = false) {
  const sec = Math.min(60, 6 + Math.max(1, ciljLv) * 6);
  return Math.round((sec * 1000) / ((1 + Math.max(0, razina - 1) * 0.12) * (brzina ? 1.18 : 1) * (naKonju ? 1.16 : 1)));
}

function noviId() {
  return `l-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

function izPoola(ime: string) {
  return POOL.find((p) => p.ime === ime) ?? null;
}

export function dopuniLika(p: Partial<Stanovnik> & Pick<Stanovnik, "ime">): Stanovnik {
  const iz = izPoola(p.ime);
  const baza = iz ?? {
    id: p.id ?? noviId(),
    ime: p.ime,
    spol: p.spol === "z" ? "z" : "m",
    posao: p.posao ?? "Kauboj",
    hub: p.hub ?? "krov",
    alat: p.alat ?? "prazno",
    rec: p.rec ?? `${p.ime} živi u kaubi.`,
  };
  const xp = Math.max(0, p.xp ?? 0);
  const izStart = iz as LikPredlozak | undefined;
  const buffovi = Array.isArray(p.buffovi)
    ? p.buffovi.filter((id): id is string => typeof id === "string" && LIK_BUFFOVI.some((b) => b.id === id))
    : izStart?.startBuff && LIK_BUFFOVI.some((b) => b.id === izStart.startBuff)
      ? [izStart.startBuff]
      : [];
  const mane = Array.isArray(p.mane)
    ? p.mane.filter((id): id is string => typeof id === "string" && LIK_MANE.some((b) => b.id === id))
    : izStart?.startMana && LIK_MANE.some((b) => b.id === izStart.startMana)
      ? [izStart.startMana]
      : [];
  return {
    id: p.id ?? baza.id,
    ime: p.ime,
    spol: p.spol === "z" || p.spol === "m" ? p.spol : baza.spol,
    posao: p.posao ?? baza.posao,
    hub: p.hub ?? baza.hub,
    rec: p.rec ?? baza.rec,
    alat: p.alat ?? baza.alat,
    xp,
    razina: p.razina ?? razinaLika(xp),
    buffovi,
    mane,
  };
}

export function pocetniLjudi(): Stanovnik[] {
  return POCETAK.map((p) => dopuniLika({ ...p, xp: 0 }));
}

export function parsirajLjude(raw: unknown, n: number): Stanovnik[] {
  const lista = Array.isArray(raw)
    ? raw
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && typeof (x as { ime?: unknown }).ime === "string")
        .map((x) =>
          dopuniLika({
            id: typeof x.id === "string" ? x.id : undefined,
            ime: String(x.ime),
            spol: x.spol === "z" ? "z" : "m",
            posao: typeof x.posao === "string" ? x.posao : undefined,
            hub: typeof x.hub === "string" ? (x.hub as LikHub) : undefined,
            rec: typeof x.rec === "string" ? x.rec : undefined,
            alat: typeof x.alat === "string" ? (x.alat as LikAlat) : undefined,
            xp: typeof x.xp === "number" ? x.xp : 0,
            razina: typeof x.razina === "number" ? x.razina : undefined,
            buffovi: Array.isArray(x.buffovi) ? (x.buffovi as string[]) : [],
            mane: Array.isArray(x.mane) ? (x.mane as string[]) : [],
          }),
        )
    : [];
  return uskladiLjude(lista.length ? lista : pocetniLjudi(), Math.max(1, Math.floor(n || lista.length || 5))).ljudi;
}

export function uskladiLjude(ljudi: Stanovnik[], cilj: number) {
  const n = Math.max(1, Math.min(POOL.length, Math.floor(cilj)));
  const ima = [...ljudi];
  const dosli: Stanovnik[] = [];
  const otisli: Stanovnik[] = [];
  while (ima.length < n) {
    const zauzeti = new Set(ima.map((p) => p.ime));
    const sljedeci = POOL.find((p) => !zauzeti.has(p.ime));
    if (!sljedeci) break;
    const novi = dopuniLika(sljedeci);
    ima.push(novi);
    dosli.push(novi);
  }
  while (ima.length > n) {
    const idx = ima.findIndex((p) => !POCETAK.some((z) => z.id === p.id));
    const i = idx >= 0 ? idx : ima.length - 1;
    const [off] = ima.splice(i, 1);
    if (off) otisli.push(off);
  }
  return { ljudi: ima, dosli, otisli };
}

export function recapDolazak(p: Stanovnik) {
  return p.spol === "z" ? `${p.ime} je došla u kaubu.` : `${p.ime} je došao u kaubu.`;
}

export function recapOdlazak(p: Stanovnik, usko?: string) {
  const razlog =
    usko === "krov"
      ? "Nema krova."
      : usko === "jelo"
        ? "Nema hrane."
        : usko === "voda"
          ? "Nema vode."
          : usko === "red"
            ? "Nema reda."
            : usko === "konji"
              ? "Nema konja."
              : usko === "zdravlje"
                ? "Nema lijeka."
                : "Kaubi je tijesno.";
  return p.spol === "z" ? `${p.ime} je otišla. ${razlog}` : `${p.ime} je otišao. ${razlog}`;
}

const ZGRADA_AKUZATIV: Record<keyof Gradevine, string> = {
  pilana: "pilanu",
  kamenolom: "kamenolom",
  rudnik: "rudnik",
  kuca: "kuću",
  blok: "zgradu",
  salun: "salun",
  bunar: "bunar",
  cisterna: "cisternu",
  mlin: "mlin",
  lov: "lov",
  mesnica: "mesnicu",
  pekara: "pekarnu",
  karte: "stol za asove",
  ured: "ured",
  staja: "staju",
  korali: "ispust",
  staza: "stazu",
  farma: "farmu",
  tor: "tor",
  ordinacija: "ordinaciju",
  travar: "travara",
  banja: "banju",
  trgovina: "trgovinu",
  banka: "banku",
};

const ZGRADA_LOKATIV: Record<keyof Gradevine, string> = {
  pilana: "pilani",
  kamenolom: "kamenolomu",
  rudnik: "rudniku",
  kuca: "kući",
  blok: "zgradi",
  salun: "salunu",
  bunar: "bunaru",
  cisterna: "cisterni",
  mlin: "mlinu",
  lov: "lovu",
  mesnica: "mesnici",
  pekara: "pekarni",
  karte: "faru",
  ured: "uredu",
  staja: "staji",
  korali: "koralima",
  staza: "stazi",
  farma: "farmi",
  tor: "toru",
  ordinacija: "ordinaciji",
  travar: "travaru",
  banja: "banji",
  trgovina: "trgovini",
  banka: "banci",
};

const ZGRADA_ZENSKA = new Set<keyof Gradevine>(["pilana", "kuca", "blok", "mesnica", "pekara", "staja", "staza", "farma", "ordinacija", "banja", "cisterna", "trgovina", "banka"]);

export function zgradaAkuzativ(id: keyof Gradevine) {
  return ZGRADA_AKUZATIV[id];
}

export function zgradaLokativ(id: keyof Gradevine) {
  return ZGRADA_LOKATIV[id];
}

export function zgradaPopravakRec(id: keyof Gradevine, naziv: string) {
  return ZGRADA_ZENSKA.has(id) ? `${naziv.toUpperCase()} POPRAVLJENA` : `${naziv.toUpperCase()} POPRAVLJEN`;
}

export function recapGradnja(p: Stanovnik, id: keyof Gradevine) {
  return `${p.ime} otvara ${zgradaAkuzativ(id)}.`;
}

export function likBoja(ime: string) {
  const pal = ["#c4783a", "#6a8a4a", "#7a4a2a", "#c4a04a", "#4a6a7a", "#8a4a5a", "#5a5a7a", "#a06a3a"];
  let h = 0;
  for (let i = 0; i < ime.length; i++) h = (h + ime.charCodeAt(i) * (i + 3)) % 997;
  return pal[h % pal.length]!;
}

export type LikTema = {
  koza: string;
  kosa: string;
  sesir: string;
  kosulja: string;
  prsluk: string;
  hlace: string;
  cizma: string;
  traka: string;
};

export function likTema(p: Stanovnik): LikTema {
  let h = 0;
  for (let i = 0; i < p.ime.length; i++) h += p.ime.charCodeAt(i) * (i + 2);
  const koza = ["#f0d0b0", "#e2b889", "#c9956a", "#dcb089"][h % 4]!;
  const kosa = ["#1a0c08", "#3a1c10", "#5a3018", "#2a1810", "#6a4428"][h % 5]!;
  const baza: LikTema = {
    koza,
    kosa,
    sesir: "#2a1810",
    kosulja: "#e8d2b0",
    prsluk: likBoja(p.ime),
    hlace: "#2a1c14",
    cizma: "#1a0c08",
    traka: "#8a3a28",
  };
  if (p.posao === "Šerif") {
    return { ...baza, kosa: "#1a0c08", sesir: "#161210", kosulja: "#f4ead4", prsluk: "#1e3d4a", hlace: "#1a2428", traka: "#d4a017" };
  }
  if (p.posao === "Zamjenik") {
    return { ...baza, sesir: "#1a1610", kosulja: "#e8dcc4", prsluk: "#2a3a44", hlace: "#1a2428", traka: "#c4a04a" };
  }
  if (p.posao === "Građevinac" || p.hub === "krov") {
    return { ...baza, sesir: "#5a3a22", prsluk: "#6a3a22", kosulja: "#d4b896", traka: "#c4783a" };
  }
  if (p.hub === "jelo") {
    return { ...baza, sesir: "#3a2814", prsluk: "#3d4a28", kosulja: "#dcc8a0", traka: "#6a8a4a" };
  }
  if (p.hub === "voda") {
    return { ...baza, sesir: "#3a5058", prsluk: "#2a4a58", kosulja: "#d0d8dc", traka: "#4a8aa0" };
  }
  if (p.hub === "zabava") {
    return { ...baza, sesir: "#3a1418", prsluk: "#6a2430", kosulja: "#f0d4a8", traka: "#c45a48" };
  }
  if (p.hub === "posao") {
    return { ...baza, sesir: "#2a2a28", prsluk: "#4a4a44", kosulja: "#c8b090", traka: "#8a7a58" };
  }
  if (p.hub === "konji") {
    return { ...baza, sesir: "#2a1810", prsluk: "#5a3a22", kosulja: "#d4c4a0", hlace: "#2a1c14", traka: "#8a5a28" };
  }
  if (p.hub === "zdravlje") {
    return { ...baza, sesir: "#3a2a28", prsluk: "#5a2428", kosulja: "#f0e4d4", traka: "#c45a58" };
  }
  return baza;
}

export const ULICA_SLOTOVI = [
  { x: 16, y: 74 },
  { x: 33, y: 68 },
  { x: 50, y: 76 },
  { x: 67, y: 69 },
  { x: 84, y: 73 },
];

export function danDoba(d = new Date()): DanDoba {
  const h = d.getHours();
  if (h >= 6 && h < 11) return "jutro";
  if (h >= 11 && h < 18) return "dan";
  if (h >= 18 && h < 21) return "suton";
  return "noc";
}

export const DOBA_REC: Record<DanDoba, string> = {
  jutro: "Jutro",
  dan: "Dan",
  suton: "Suton",
  noc: "Noć",
};

export function praznaUlicaRec(doba: DanDoba) {
  if (doba === "jutro") return "Ulica se budi.";
  if (doba === "dan") return "Svi su na poslu.";
  if (doba === "suton") return "Tko može, sjedi u salunu.";
  return "Noć. Samo šerif hoda.";
}

export function radnoMjesto(p: Stanovnik): keyof Gradevine {
  if (p.posao === "Šerif" || p.posao === "Zamjenik") return "ured";
  if (p.posao === "Građevinac" || p.hub === "krov") return "kuca";
  if (p.posao === "Konjušar" || p.posao === "Konjušarica" || p.posao === "Kauboj" || p.posao === "Kaubojka" || p.posao === "Jahač" || p.hub === "konji")
    return "staja";
  if (p.posao === "Lovačica" || p.posao === "Lovac") return "lov";
  if (p.posao === "Mesarica") return "mesnica";
  if (p.posao === "Pekarica") return "pekara";
  if (p.posao === "Farmer") return "farma";
  if (p.posao === "Gazda" || p.posao === "Gonič" || p.posao === "Referent") return "tor";
  if (p.posao === "Liječnica") return "ordinacija";
  if (p.posao === "Travarica") return "travar";
  if (p.hub === "zdravlje") return "ordinacija";
  if (p.posao === "Trgovac") return "trgovina";
  if (p.posao === "Bankar") return "banka";
  if (p.posao === "Cisternar") return "cisterna";
  if (p.posao === "Vodonoša" || p.posao === "Vodarica") return "bunar";
  if (p.posao === "Mlinar") return "mlin";
  if (p.posao === "Gostioničarka" || p.posao === "Pjevačica" || p.posao === "Djeliteljica" || p.posao === "Krupije") return "salun";
  if (p.posao === "Pilar") return "pilana";
  if (p.posao === "Klesar") return "kamenolom";
  if (p.posao === "Rudar") return "rudnik";
  if (p.hub === "jelo") return "lov";
  if (p.hub === "voda") return "bunar";
  if (p.hub === "zabava") return "salun";
  if (p.hub === "posao") return "pilana";
  if (p.hub === "red") return "ured";
  if (p.hub === "konji") return "staja";
  return "kuca";
}

function kucaIliBlok(
  p: Stanovnik,
  g: Gradevine,
  ostecenja: Ostecenja,
  svi: Stanovnik[],
  gradnje: Gradnja[],
  karavana: Karavana | null,
  imaSalun: boolean,
): "kuca" | "blok" | null {
  const imaK = (g.kuca || 0) > 0 && !ostecenja.kuca;
  const imaB = (g.blok || 0) > 0 && !ostecenja.blok;
  if (!imaK && !imaB) return null;
  if (imaK && !imaB) return "kuca";
  if (!imaK && imaB) return "blok";
  const kucaKap = (g.kuca || 0) * POKRICE.kuca;
  const blokKap = (g.blok || 0) * POKRICE.blok;
  const udio = kucaKap / Math.max(1, kucaKap + blokKap);
  const zauzeti = new Set(gradnje.map((x) => x.majstorId));
  const stanari = (svi.length ? svi : [p])
    .filter((x) => {
      if (karavana && x.id === karavana.vozacId) return false;
      if (zauzeti.has(x.id)) return false;
      if (x.posao === "Šerif" || x.posao === "Zamjenik") return false;
      if (imaSalun && x.hub === "zabava") return false;
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const i = stanari.findIndex((x) => x.id === p.id);
  if (i < 0) return "kuca";
  const nKuca = Math.max(1, Math.round(stanari.length * udio));
  return i < nKuca ? "kuca" : "blok";
}

export function gdjeJe(
  p: Stanovnik,
  g: Gradevine,
  gradnja: Gradnja | Gradnja[] | null,
  ostecenja: Ostecenja,
  doba: DanDoba = danDoba(),
  karavana: Karavana | null = null,
  svi: Stanovnik[] = [],
): { mjesto: "ulica" | "zgrada" | "put"; zgrada?: keyof Gradevine } {
  if (karavana && p.id === karavana.vozacId) return { mjesto: "put" };
  const gradnje = kaoGradnje(gradnja);
  const moj = gradnje.find((x) => x.majstorId === p.id);
  if (moj) return { mjesto: "zgrada", zgrada: moj.zgrada };
  const ivoPosao = gradnje.find((x) => {
    const tko = svi.find((l) => l.id === x.majstorId);
    return tko?.posao === "Građevinac";
  });
  if (p.posao === "Šegrt" && !(p as Segrt).spreman && ivoPosao) return { mjesto: "zgrada", zgrada: ivoPosao.zgrada };
  const posao = radnoMjesto(p);
  const imaPosao = (g[posao] || 0) > 0 && !ostecenja[posao] && posao !== "kuca";
  const imaSalun = (g.salun || 0) > 0 && !ostecenja.salun;
  const lista = svi.length ? svi : [p];

  if (doba === "jutro") return { mjesto: "ulica" };
  if (doba === "dan") {
    if (imaPosao) return { mjesto: "zgrada", zgrada: posao };
    const home = kucaIliBlok(p, g, ostecenja, lista, gradnje, karavana, false);
    if (home) return { mjesto: "zgrada", zgrada: home };
    return { mjesto: "ulica" };
  }
  if (doba === "suton") {
    if (p.hub === "zabava" && imaSalun) return { mjesto: "zgrada", zgrada: "salun" };
    if (p.posao === "Šerif" || p.posao === "Zamjenik") return { mjesto: "ulica" };
    if (imaPosao) return { mjesto: "zgrada", zgrada: posao };
    const home = kucaIliBlok(p, g, ostecenja, lista, gradnje, karavana, imaSalun);
    if (home) return { mjesto: "zgrada", zgrada: home };
    return { mjesto: "ulica" };
  }
  if (p.hub === "zabava" && imaSalun) return { mjesto: "zgrada", zgrada: "salun" };
  if (p.posao === "Šerif" || p.posao === "Zamjenik") return { mjesto: "ulica" };
  const home = kucaIliBlok(p, g, ostecenja, lista, gradnje, karavana, imaSalun);
  if (home) return { mjesto: "zgrada", zgrada: home };
  return { mjesto: "ulica" };
}

export function naUlici(
  ljudi: Stanovnik[],
  g: Gradevine,
  gradnja: Gradnja | Gradnja[] | null,
  ostecenja: Ostecenja,
  doba: DanDoba = danDoba(),
  karavana: Karavana | null = null,
) {
  return ljudi.filter((p) => gdjeJe(p, g, gradnja, ostecenja, doba, karavana, ljudi).mjesto === "ulica");
}

export function ljudiUZgradi(
  ljudi: Stanovnik[],
  zgrada: keyof Gradevine,
  g: Gradevine,
  gradnja: Gradnja | Gradnja[] | null,
  ostecenja: Ostecenja,
  doba: DanDoba = danDoba(),
  karavana: Karavana | null = null,
) {
  return ljudi.filter((p) => gdjeJe(p, g, gradnja, ostecenja, doba, karavana, ljudi).zgrada === zgrada);
}

export function recOsoba(p: Stanovnik, mood: string) {
  if (mood === "glad") return p.hub === "jelo" ? `${p.ime}: kuhinja je prazna.` : `${p.ime}: želudac vrije.`;
  if (mood === "susa") return p.hub === "voda" ? `${p.ime}: nema kapi.` : `${p.ime}: grlo je suho.`;
  if (mood === "nered") return p.posao === "Šerif" || p.posao === "Zamjenik" ? `${p.ime}: red puca.` : `${p.ime}: noć je glasna.`;
  if (mood === "tiho" || mood === "dosada") return p.hub === "zabava" ? `${p.ime}: salun zijeva.` : `${p.ime}: tišina bode.`;
  if (mood === "dokolica" || mood === "posao") return `${p.ime}: ruke vise. Daj posao.`;
  if (mood === "krov") return `${p.ime}: krov prokišnjava.`;
  if (mood === "pjeske") return p.hub === "konji" ? `${p.ime}: staja je prazna.` : `${p.ime}: kauboj pješke nije kauboj.`;
  if (mood === "bolesno") return p.hub === "zdravlje" ? `${p.ime}: nema trave ni rane.` : `${p.ime}: kašalj ide ulicom.`;
  if (p.posao === "Referent") return `${p.ime}: plaća tanka. Gazda hoće još.`;
  return p.rec;
}

export function govornik(ljudi: Stanovnik[], mood: string, usko: string | null) {
  if (mood === "nered") return serif(ljudi) ?? ljudi[0] ?? null;
  if (usko === "jelo") return ljudi.find((p) => p.hub === "jelo") ?? ljudi[0] ?? null;
  if (usko === "voda") return ljudi.find((p) => p.hub === "voda") ?? ljudi[0] ?? null;
  if (usko === "zabava") return ljudi.find((p) => p.hub === "zabava") ?? ljudi[0] ?? null;
  if (usko === "posao") return ljudi.find((p) => p.hub === "posao") ?? ljudi[0] ?? null;
  if (usko === "krov") return majstor(ljudi);
  if (usko === "red") return serif(ljudi);
  if (usko === "konji") return ljudi.find((p) => p.hub === "konji") ?? ljudi[0] ?? null;
  if (usko === "zdravlje") return doktor(ljudi) ?? ljudi[0] ?? null;
  return ljudi[0] ?? null;
}

export type Dar = { zlato?: number; drvo?: number; kamen?: number; zeljezo?: number };

export function razgovor(
  p: Stanovnik,
  mood: string,
  unutra: boolean,
  zgrada?: keyof Gradevine,
  doba: DanDoba = danDoba(),
): { rec: string; dar?: Dar } {
  const dar: Dar | undefined =
    p.hub === "krov"
      ? { drvo: 2 }
      : p.hub === "jelo"
        ? { zlato: 4 }
        : p.hub === "voda"
          ? { kamen: 2 }
          : p.hub === "zabava"
            ? { zlato: 6 }
            : p.hub === "red"
              ? { zlato: 5 }
              : p.hub === "konji"
                ? { drvo: 3 }
                : p.hub === "zdravlje"
                  ? { zlato: 5 }
                  : { drvo: 3 };

  if (unutra && zgrada === "staja") return { rec: `${p.ime} četka konja.`, dar };
  if (unutra && zgrada === "korali") return { rec: `${p.ime} broji grla.`, dar };
  if (unutra && zgrada === "staza") return { rec: `${p.ime} mjeri stazu.`, dar };
  if (unutra && zgrada === "ordinacija") return { rec: `${p.ime} zavija ruku.`, dar };
  if (unutra && zgrada === "cisterna") return { rec: `${p.ime} gleda nebo.`, dar };
  if (unutra && zgrada === "travar") return { rec: `${p.ime} bere travu.`, dar };
  if (unutra && zgrada === "banja") return { rec: `${p.ime} pere prašinu.`, dar };
  if (unutra && zgrada === "farma") return { rec: `${p.ime} gleda žito.`, dar };
  if (unutra && zgrada === "tor") {
    if (p.posao === "Gazda") return { rec: `${p.ime}: firma mora rasti. Koža pa šta.`, dar };
    if (p.posao === "Referent") return { rec: `${p.ime} broji. Plaća stoji. Šuti.`, dar };
    return { rec: `${p.ime} broji krdo. Koža je tijesna.`, dar };
  }
  if (unutra && zgrada === "trgovina") return { rec: `${p.ime} broji vreće.`, dar };
  if (unutra && zgrada === "banka") return { rec: `${p.ime} čuva ključ.`, dar };
  if (unutra && zgrada) {
    return { rec: `${p.ime} je u ${zgradaLokativ(zgrada)}.`, dar };
  }
  if (doba === "jutro") return { rec: `${p.ime}: jutro je kratko. Hajde.`, dar };
  if (doba === "noc") {
    if (p.posao === "Šerif" || p.posao === "Zamjenik") return { rec: `${p.ime}: noć je moja. Ti spavaj.`, dar };
    return { rec: `${p.ime}: sutra. Sad mir.`, dar };
  }
  return { rec: recOsoba(p, mood), dar };
}

export function darRec(dar: Dar) {
  if (dar.zlato) return `Daj ${dar.zlato} zlata`;
  if (dar.drvo) return `Daj ${dar.drvo} drva`;
  if (dar.kamen) return `Daj ${dar.kamen} kamena`;
  if (dar.zeljezo) return `Daj ${dar.zeljezo} željeza`;
  return "Daj";
}

export function mozeDati(dar: Dar, zlato: number, r: Resursi) {
  if ((dar.zlato ?? 0) > zlato) return false;
  if ((dar.drvo ?? 0) > r.drvo) return false;
  if ((dar.kamen ?? 0) > r.kamen) return false;
  if ((dar.zeljezo ?? 0) > r.zeljezo) return false;
  return true;
}

const TIP_HUB: Record<string, LikHub> = {
  kuca: "krov",
  blok: "krov",
  ljudi: "krov",
  zgrada: "krov",
  lov: "jelo",
  mesnica: "jelo",
  pekara: "jelo",
  farma: "jelo",
  tor: "jelo",
  govedo: "jelo",
  bunar: "voda",
  cisterna: "voda",
  kisa: "voda",
  mlin: "voda",
  salun: "zabava",
  karte: "zabava",
  dvadesetjedan: "zabava",
  knjiga: "zabava",
  spin: "zabava",
  luckySpin: "zabava",
  dobitak: "zabava",
  streak: "zabava",
  zlato: "zabava",
  oprema: "posao",
  pilana: "posao",
  kamenolom: "posao",
  rudnik: "posao",
  trgovina: "posao",
  ured: "red",
  banka: "red",
  staja: "konji",
  korali: "konji",
  staza: "konji",
  utrka: "konji",
  ordinacija: "zdravlje",
  travar: "zdravlje",
  banja: "zdravlje",
};

export function tkoZaNalog(ljudi: Stanovnik[], tip: string) {
  if (tip === "ured") return serif(ljudi);
  if (tip === "ordinacija" || tip === "travar" || tip === "banja") return doktor(ljudi) ?? ljudi[0] ?? null;
  if (tip === "tor" || tip === "govedo") return ljudi.find((p) => p.posao === "Gazda" || p.posao === "Referent" || p.posao === "Gonič") ?? ljudi.find((p) => p.hub === "jelo") ?? ljudi[0] ?? null;
  if (tip === "kuca" || tip === "blok" || tip === "zgrada" || tip === "ljudi") return majstor(ljudi);
  const hub = TIP_HUB[tip];
  if (hub) return ljudi.find((p) => p.hub === hub) ?? ljudi[0] ?? null;
  return ljudi[0] ?? null;
}

export function nalogOd(p: Stanovnik, tip: string, cilj: number) {
  if (tip === "spin") return `Zavrti ${cilj} puta.`;
  if (tip === "luckySpin") return "Uhvati sretnu vrtnju.";
  if (tip === "zlato") return `Skupi ${cilj} zlata.`;
  if (tip === "dobitak") return "Ostvari 3 dobitka.";
  if (tip === "streak") return "Drži niz od 3.";
  if (tip === "ljudi") return `Dovedi ${cilj} ljudi.`;
  if (tip === "oprema") return "Kupi alat.";
  if (tip === "zgrada") return "Podigni zgradu.";
  if (tip === "knjiga") return "Skupi tri knjige u prašini.";
  if (tip === "govedo") return "Uzmi govedo u tor.";
  if (tip === "kisa") return "Skupi kišu s cisterne.";
  if (tip === "dvadesetjedan") return "Sjedni na blackjack.";
  if (tip === "utrka") return "Trči konja na stazi.";
  const zid = tip as keyof Gradevine;
  if (ZGRADA_AKUZATIV[zid]) {
    const ime = zid === "ured" ? "šerifov ured" : zgradaAkuzativ(zid);
    return `Izgradi ${ime}.`;
  }
  return p.rec;
}

export function mozeKrupije(p: Stanovnik) {
  return p.hub === "zabava" || p.posao === "Djeliteljica" || p.posao === "Krupije" || p.posao === "Gostioničarka";
}
