import { dopuniLika, type Stanovnik } from "./ljudi";
import type { KaravanaCin, KaravanaPutId } from "./types";

export type Susjed = {
  uid: string;
  kauba: string;
  serif: string;
  spol: "m" | "z";
  rec: string;
  recPohod: string;
  recPoraz: string;
  recPobjeda: string;
};

export const SUSJEDI: Susjed[] = [
  {
    uid: "npc-suhi-vir",
    kauba: "Suhi Vir",
    serif: "Joso",
    spol: "m",
    rec: "Joso čuva Suhi Vir.",
    recPohod: "Joso: ovo je Suhi Vir. Ne diraj.",
    recPoraz: "Joso: vrati se pješke.",
    recPobjeda: "Joso: uzmi i idi.",
  },
  {
    uid: "npc-crveni-brijeg",
    kauba: "Crveni Brijeg",
    serif: "Gara",
    spol: "z",
    rec: "Gara drži Crveni Brijeg.",
    recPohod: "Gara: brijeg nije tvoj.",
    recPoraz: "Gara: pijesak te jede.",
    recPobjeda: "Gara: uzmi prašinu i nestani.",
  },
  {
    uid: "npc-kostolom",
    kauba: "Kostolom",
    serif: "Vran",
    spol: "m",
    rec: "Vran ne spava. Kostolom šuti.",
    recPohod: "Vran: kosti ostaju ovdje.",
    recPoraz: "Vran: sljedeći put nosim tebe.",
    recPobjeda: "Vran: uzmi. Ne gledaj natrag.",
  },
  {
    uid: "npc-zlatna-jama",
    kauba: "Zlatna Jama",
    serif: "Pavo",
    spol: "m",
    rec: "Pavo broji zlato. Jama je njegova.",
    recPohod: "Pavo: ruka s zlata, odmah.",
    recPoraz: "Pavo: jama je dublja od tebe.",
    recPobjeda: "Pavo: dosta. Idi.",
  },
  {
    uid: "npc-donja-prasina",
    kauba: "Donja Prašina",
    serif: "Lila",
    spol: "z",
    rec: "Lila mete Prašinu. Red drži metlom.",
    recPohod: "Lila: prašina nije za krađu.",
    recPoraz: "Lila: metla te izgura.",
    recPobjeda: "Lila: uzmi. Više ne dolazi.",
  },
];

export function susjedPoUid(uid: string) {
  return SUSJEDI.find((s) => s.uid === uid) ?? null;
}

export type TeretId = "drvo" | "kamen" | "zeljezo";

export type KaravanaCilj = {
  uid: string;
  hoce: TeretId;
  vraca: TeretId | "zlato";
  sec: number;
  mnoz: number;
  rec: string;
};

export const KARAVANA_CILJ: KaravanaCilj[] = [
  { uid: "npc-suhi-vir", hoce: "drvo", vraca: "kamen", sec: 18, mnoz: 1.1, rec: "Joso plaća drvo kamenom." },
  { uid: "npc-crveni-brijeg", hoce: "kamen", vraca: "drvo", sec: 22, mnoz: 1.18, rec: "Gara mijenja kamen za drvo." },
  { uid: "npc-kostolom", hoce: "kamen", vraca: "zeljezo", sec: 28, mnoz: 1.26, rec: "Vran hoće kamen. Vraća željezo." },
  { uid: "npc-zlatna-jama", hoce: "zeljezo", vraca: "zlato", sec: 34, mnoz: 1.34, rec: "Pavo plaća željezo zlatom." },
  { uid: "npc-donja-prasina", hoce: "drvo", vraca: "kamen", sec: 16, mnoz: 1.08, rec: "Lila uzima drvo, daje kamen." },
];

export function karavanaCilj(uid: string) {
  return KARAVANA_CILJ.find((c) => c.uid === uid) ?? KARAVANA_CILJ[0]!;
}

export const KARAVANA_PUTOVI: Array<{
  id: KaravanaPutId;
  naziv: string;
  rec: string;
  vrijeme: number;
  plata: number;
  rizik: number;
}> = [
  { id: "staza", naziv: "Staza", rec: "Prašina i točak.", vrijeme: 1, plata: 1.35, rizik: 0.08 },
  { id: "noc", naziv: "Noć", rec: "Tiho. Brže. Gusari u sjeni.", vrijeme: 0.7, plata: 1.7, rizik: 0.22 },
  { id: "rijeka", naziv: "Rijeka", rec: "Gat i konop. Sporije, plaća.", vrijeme: 1.38, plata: 2.05, rizik: 0.12 },
];

export function karavanaPut(id?: string) {
  return KARAVANA_PUTOVI.find((p) => p.id === id) ?? KARAVANA_PUTOVI[0]!;
}

const PUT_CINOVI: KaravanaCin[] = [
  {
    id: "zasjeda",
    rec: "Prašina se diže. Netko čeka na stazi.",
    opcije: [
      { id: "plati", rec: "Baci 8g" },
      { id: "jasi", rec: "Jasi kroz" },
      { id: "pucaj", rec: "Pucaj" },
    ],
  },
  {
    id: "most",
    rec: "Most je truo. Voda huči ispod.",
    opcije: [
      { id: "obidji", rec: "Obiđi" },
      { id: "kroz", rec: "Kroz most" },
    ],
  },
  {
    id: "sajam",
    rec: "Sajam na raskršću. Trgovac maše.",
    opcije: [
      { id: "trguj", rec: "Trguj 6g" },
      { id: "idi", rec: "Idi dalje" },
    ],
  },
];

export function izaberiKaravanaCin(rng = Math.random): KaravanaCin {
  return PUT_CINOVI[Math.floor(rng() * PUT_CINOVI.length)] ?? PUT_CINOVI[0]!;
}

export function vrijemeKaravanaMs(kolicina: number, razina: number, uid: string, brzina = false, naKonju = false, putId: KaravanaPutId = "staza") {
  const c = karavanaCilj(uid);
  const put = karavanaPut(putId);
  const sec = Math.min(80, c.sec + Math.max(1, kolicina) * 0.32);
  return Math.round((sec * 1000 * put.vrijeme) / ((1 + Math.max(0, razina - 1) * 0.08) * (brzina ? 1.16 : 1) * (naKonju ? 1.18 : 1)));
}

export function karavanaIsplata(
  teret: { drvo: number; kamen: number; zeljezo: number },
  sajam: boolean,
  uid: string,
  putId: KaravanaPutId = "staza",
) {
  const c = karavanaCilj(uid);
  const put = karavanaPut(putId);
  const ukupno = teret.drvo + teret.kamen + teret.zeljezo;
  const hoce = teret[c.hoce];
  const udio = ukupno > 0 ? hoce / ukupno : 0;
  const baza = teret.drvo * 2.85 + teret.kamen * 5.4 + teret.zeljezo * 14;
  const zlato = Math.max(8, Math.floor(baza * (1 + udio * 0.55) * c.mnoz * put.plata * (sajam ? 1.18 : 1)));
  const natrag = Math.max(0, Math.floor(hoce * 0.28));
  const out = { zlato, drvo: 0, kamen: 0, zeljezo: 0 };
  if (c.vraca !== "zlato" && natrag > 0) out[c.vraca] = natrag;
  else if (c.vraca === "zlato") out.zlato += Math.floor(hoce * 0.45);
  return out;
}

export function serifKaoLik(s: Susjed): Stanovnik {
  return dopuniLika({
    id: s.uid,
    ime: s.serif,
    spol: s.spol,
    posao: "Šerif",
    hub: "red",
    alat: "zvezda",
    rec: s.rec,
  });
}
