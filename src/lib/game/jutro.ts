import { zoraDanKey } from "./daily";
import type { Nagrada } from "./types";

export type JutarnjiId = "kata" | "ivo" | "boro";
export type JutarnjiTip = "spin" | "drvo" | "selo";

export type JutarnjiPosao = {
  id: JutarnjiId;
  likId: string;
  likIme: string;
  rec: string;
  tip: JutarnjiTip;
  cilj: number;
  trenutno: number;
  nagrada: Nagrada;
  uzeto: boolean;
};

const REC_KATA = [
  (n: number) => `Knjiga čeka. Zavrti ${n} puta.`,
  (n: number) => `Kolo je gladno. Zavrti ${n} puta.`,
  (n: number) => `Prašina. Zavrti ${n} puta.`,
];
const REC_IVO = [
  (n: number) => `Tor treba dasku. Donesi ${n} drva.`,
  (n: number) => `Cisterna čeka gredu. Donesi ${n} drva.`,
  (n: number) => `Krov i tor. Donesi ${n} drva.`,
];
const REC_BORO = [
  () => "Krdo njuši tor. Posjeti tabor.",
  () => "Kiša na cisterne. Posjeti tabor.",
  () => "Staza i salun. Posjeti tabor.",
];

function danBroj(dan: string) {
  let n = 0;
  for (let i = 0; i < dan.length; i++) n += dan.charCodeAt(i);
  return n;
}

export function napraviJutarnji(dan = zoraDanKey(), ljudi: Array<{ id: string; ime: string; posao?: string }> = []): JutarnjiPosao[] {
  const s = danBroj(dan);
  const kataCilj = 4 + (s % 3);
  const ivoCilj = 6 + (s % 3) * 2;
  const i = s % 3;
  const ime = (id: string, posao: string, fallback: string) =>
    ljudi.find((p) => p.id === id)?.ime ?? ljudi.find((p) => p.posao === posao)?.ime ?? fallback;
  const likId = (id: string, posao: string) =>
    ljudi.find((p) => p.id === id)?.id ?? ljudi.find((p) => p.posao === posao)?.id ?? id;
  return [
    {
      id: "kata",
      likId: likId("kata", "Lovac"),
      likIme: ime("kata", "Lovac", "Kata"),
      tip: "spin",
      cilj: kataCilj,
      trenutno: 0,
      rec: REC_KATA[i]!(kataCilj),
      nagrada: { zlato: 12, energija: 3 },
      uzeto: false,
    },
    {
      id: "ivo",
      likId: likId("ivo", "Građevinac"),
      likIme: ime("ivo", "Građevinac", "Ivo"),
      tip: "drvo",
      cilj: ivoCilj,
      trenutno: 0,
      rec: REC_IVO[i]!(ivoCilj),
      nagrada: { zlato: 14, dijamanti: 1 },
      uzeto: false,
    },
    {
      id: "boro",
      likId: likId("boro", "Šerif"),
      likIme: ime("boro", "Šerif", "Boro"),
      tip: "selo",
      cilj: 1,
      trenutno: 0,
      rec: REC_BORO[i]!(),
      nagrada: { zlato: 12, stitovi: 1 },
      uzeto: false,
    },
  ];
}

export function jutroGotovo(p: JutarnjiPosao) {
  return p.trenutno >= p.cilj;
}

export function jutroLik<T extends { id: string; ime: string; posao: string }>(
  ljudi: T[],
  p: Pick<JutarnjiPosao, "id" | "likId">,
): T | null {
  return (
    ljudi.find((l) => l.id === p.likId) ??
    (p.id === "boro" ? ljudi.find((l) => l.posao === "Šerif") : undefined) ??
    (p.id === "kata" ? ljudi.find((l) => l.posao === "Lovac") : undefined) ??
    (p.id === "ivo" ? ljudi.find((l) => l.posao === "Građevinac") : undefined) ??
    null
  );
}

export function jutroSveUzeto(list: JutarnjiPosao[]) {
  return list.length > 0 && list.every((p) => p.uzeto);
}

export function jutroSpremni(list: JutarnjiPosao[]) {
  return list.filter((p) => jutroGotovo(p) && !p.uzeto).length;
}

export function parsirajJutro(raw: unknown, dan: string): JutarnjiPosao[] {
  const baza = napraviJutarnji(dan);
  if (!Array.isArray(raw) || raw.length !== 3) return baza;
  return baza.map((b, i) => {
    const r = raw[i] as Partial<JutarnjiPosao> | undefined;
    if (!r || r.id !== b.id) return b;
    const trenutno = Math.max(0, Math.min(b.cilj, Math.floor(Number(r.trenutno) || 0)));
    return {
      ...b,
      trenutno,
      uzeto: !!r.uzeto && trenutno >= b.cilj,
    };
  });
}
