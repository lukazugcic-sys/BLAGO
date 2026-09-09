import { dopuniLika, type Stanovnik } from "./ljudi";

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

export function vrijemeKaravanaMs(kolicina: number, razina: number, uid: string, brzina = false, naKonju = false) {
  const c = karavanaCilj(uid);
  const sec = Math.min(80, c.sec + Math.max(1, kolicina) * 0.32);
  return Math.round((sec * 1000) / ((1 + Math.max(0, razina - 1) * 0.08) * (brzina ? 1.16 : 1) * (naKonju ? 1.18 : 1)));
}

export function karavanaIsplata(
  teret: { drvo: number; kamen: number; zeljezo: number },
  sajam: boolean,
  uid: string,
) {
  const c = karavanaCilj(uid);
  const ukupno = teret.drvo + teret.kamen + teret.zeljezo;
  const hoce = teret[c.hoce];
  const udio = ukupno > 0 ? hoce / ukupno : 0;
  const baza = teret.drvo * 1.05 + teret.kamen * 1.32 + teret.zeljezo * 2;
  const zlato = Math.max(4, Math.floor(baza * (1 + udio * 0.4) * c.mnoz * (sajam ? 1.15 : 1)));
  const natrag = Math.max(0, Math.floor(hoce * 0.22));
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
