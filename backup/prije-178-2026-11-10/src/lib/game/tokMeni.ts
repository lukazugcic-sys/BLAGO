import { HOLD_KADAR_MS, HOLD_PX } from "./feel";
import type { Gradevine, SimbolId } from "./types";
import { POTREBE_META, type KaubaUsko } from "./economy";
import { BLAGO, type TabId } from "./constants";
import { minNiz } from "./tuning";

export type TokCvorId = "selo" | KaubaUsko;

export const TOK_HOLD_MS = HOLD_KADAR_MS;
export const TOK_HOLD_PX = HOLD_PX;
export const IDI_EVENT = "blago-idi";

export type IdiDetail = {
  tab?: TabId;
  hub?: KaubaUsko;
  pohod?: boolean;
  trg?: boolean;
  ruke?: boolean;
  almanah?: boolean;
  slot?: "auto" | "bonus";
  zid?: "kronika" | "cilj";
  zadaci?: "nalozi" | "zvijezde" | "karavana" | "uzivo";
  trznica?: "burza" | "alati" | "izgled";
};

let zadnjiIdi: IdiDetail | null = null;

export function idi(detail: IdiDetail) {
  zadnjiIdi = detail;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IDI_EVENT, { detail }));
}

/** Ako Kauba još nije montirana, prečica čeka prvi kadar. */
export function procitajIdi(): IdiDetail | null {
  const d = zadnjiIdi;
  zadnjiIdi = null;
  return d;
}

export type TokMeniIkona =
  | "pregled"
  | "zgrade"
  | "almanah"
  | "pohod"
  | "travar"
  | "kisa"
  | "salun"
  | "konji"
  | "krdo"
  | "trgovina"
  | "igraj"
  | "zid"
  | "kauba"
  | "zadaci"
  | "trznica"
  | "auto"
  | "bonus"
  | "kronika"
  | "cilj"
  | "nalog"
  | "zvijezda"
  | "karavana"
  | "uzivo"
  | "burza"
  | "alati"
  | "izgled"
  | "kruna"
  | "metci";

export type TokMeniAkcija =
  | { vrsta: "zgrada"; id: keyof Gradevine }
  | { vrsta: "almanah" }
  | { vrsta: "pohod" }
  | { vrsta: "travar" }
  | { vrsta: "kisa" }
  | { vrsta: "premjesti"; hub: KaubaUsko }
  | { vrsta: "tab"; tab: TabId }
  | { vrsta: "hub"; hub: KaubaUsko }
  | { vrsta: "trg" }
  | { vrsta: "ruke" }
  | { vrsta: "info" }
  | { vrsta: "slot"; slot: "auto" | "bonus" }
  | { vrsta: "zid-skok"; kamo: "kronika" | "cilj" }
  | { vrsta: "zadaci"; tab: "nalozi" | "zvijezde" | "karavana" | "uzivo" }
  | { vrsta: "trznica"; sekcija: "burza" | "alati" | "izgled" }
  | { vrsta: "metci" };

export type TokMeniStavka = {
  id: string;
  naziv: string;
  rec: string;
  ikona: TokMeniIkona;
  akcija: TokMeniAkcija;
  zakljucano?: boolean;
};

const KONTEKST: Partial<Record<TokCvorId, TokMeniStavka>> = {
  krov: {
    id: "kuca",
    naziv: "Kuća",
    rec: "Diži krov.",
    ikona: "zgrade",
    akcija: { vrsta: "zgrada", id: "kuca" },
  },
  zdravlje: {
    id: "travar",
    naziv: "Travar",
    rec: "Zovi travara. Zabava diže.",
    ikona: "travar",
    akcija: { vrsta: "travar" },
  },
  voda: {
    id: "kisa",
    naziv: "Kiša",
    rec: "Skupi kišu u cisternu.",
    ikona: "kisa",
    akcija: { vrsta: "kisa" },
  },
  zabava: {
    id: "salun",
    naziv: "Salun",
    rec: "Otvori salun.",
    ikona: "salun",
    akcija: { vrsta: "zgrada", id: "salun" },
  },
  red: {
    id: "pohod",
    naziv: "Pohod",
    rec: "Kreni u pohod.",
    ikona: "pohod",
    akcija: { vrsta: "pohod" },
  },
  konji: {
    id: "konji",
    naziv: "Konji",
    rec: "Staja i uzda.",
    ikona: "konji",
    akcija: { vrsta: "zgrada", id: "staja" },
  },
  jelo: {
    id: "krdo",
    naziv: "Krdo",
    rec: "Farma i goveda.",
    ikona: "krdo",
    akcija: { vrsta: "zgrada", id: "farma" },
  },
  posao: {
    id: "trgovina",
    naziv: "Trgovina",
    rec: "Tezga i burza.",
    ikona: "trgovina",
    akcija: { vrsta: "zgrada", id: "trgovina" },
  },
};

const HUB_IKONA: Record<KaubaUsko, TokMeniIkona> = {
  krov: "zgrade",
  jelo: "krdo",
  zabava: "salun",
  voda: "kisa",
  posao: "trgovina",
  red: "pohod",
  konji: "konji",
  zdravlje: "travar",
  oruzje: "metci",
};

export function jeTokCvor(id: string): id is TokCvorId {
  return id === "selo" || POTREBE_META.some((p) => p.id === id);
}

export function prvaZgradaHuba(hub: KaubaUsko, g?: Gradevine): keyof Gradevine {
  const lista = POTREBE_META.find((p) => p.id === hub)?.zgrade ?? [];
  if (g) {
    const ima = lista.find((id) => (g[id] || 0) > 0);
    if (ima) return ima;
  }
  return lista[0] ?? "kuca";
}

const OSMICA_RED: KaubaUsko[] = ["krov", "zdravlje", "voda", "red", "posao", "konji", "zabava", "jelo"];

/** Pet prečica umjesto prstena: krunidba, metci, pohod, kauboji, almanah. */
export function tokMeniPrsten(mozeKruna: boolean): TokMeniStavka[] {
  return [
    {
      id: "krunidba",
      naziv: "Krunidba",
      rec: mozeKruna
        ? "Selo je puno. Kruni kaubu."
        : "Zaključano. Sve zgrade moraju biti na maksimumu.",
      ikona: "kruna",
      zakljucano: !mozeKruna,
      akcija: { vrsta: "hub", hub: "krov" },
    },
    {
      id: "metci",
      naziv: "Metci",
      rec: "Kovačnica, barutana i trgovina.",
      ikona: "metci",
      akcija: { vrsta: "metci" },
    },
    {
      id: "pohod",
      naziv: "Pohod",
      rec: "Kreni u pohod.",
      ikona: "pohod",
      akcija: { vrsta: "pohod" },
    },
    {
      id: "kauboji",
      naziv: "Kauboji",
      rec: "Svi ljudi u kaubi.",
      ikona: "pregled",
      akcija: { vrsta: "ruke" },
    },
    {
      id: "almanah",
      naziv: "Almanah",
      rec: "Tko vuče koga u kaubi.",
      ikona: "almanah",
      akcija: { vrsta: "almanah" },
    },
  ];
}

/** Osam dijelova kaube oko prstena. */
export function tokMeniOsmica(): TokMeniStavka[] {
  return OSMICA_RED.map((id) => {
    const h = POTREBE_META.find((p) => p.id === id)!;
    return {
      id,
      naziv: h.naziv,
      rec: `Otvori ${h.naziv.toLowerCase()}.`,
      ikona: HUB_IKONA[id],
      akcija: { vrsta: "hub" as const, hub: id },
    };
  });
}

/** Dugi pritisak na prsten dijela — zgrade, prečice, almanah, kauboji, natrag. Bez Tok. */
export function tokMeniZaDio(id: TokCvorId | "ruke", gradevine?: Gradevine): TokMeniStavka[] {
  if (id === "ruke") {
    return [
      {
        id: "kauba",
        naziv: "Kauba",
        rec: "Natrag na trg.",
        ikona: "kauba",
        akcija: { vrsta: "trg" },
      },
      {
        id: "pohod",
        naziv: "Pohod",
        rec: "Kreni u pohod.",
        ikona: "pohod",
        akcija: { vrsta: "pohod" },
      },
    ];
  }
  const stavke: TokMeniStavka[] = [];
  if (id === "selo") {
    stavke.push({
      id: "pohod",
      naziv: "Pohod",
      rec: "Kreni u pohod.",
      ikona: "pohod",
      akcija: { vrsta: "pohod" },
    });
  } else {
    const zid = prvaZgradaHuba(id, gradevine);
    stavke.push({
      id: "zgrade",
      naziv: "Zgrade",
      rec: "Otvori zgrade ovog dijela.",
      ikona: "zgrade",
      akcija: { vrsta: "zgrada", id: zid },
    });
    const k = KONTEKST[id];
    if (k) stavke.push(k);
    if (id === "zabava") {
      stavke.push({
        id: "casino",
        naziv: "Casino",
        rec: "Stolovi i kocke.",
        ikona: "igraj",
        akcija: { vrsta: "zgrada", id: "karte" },
      });
    }
  }
  stavke.push({
    id: "almanah",
    naziv: "Almanah",
    rec: "Tko vuče koga u kaubi.",
    ikona: "almanah",
    akcija: { vrsta: "almanah" },
  });
  stavke.push({
    id: "ruke",
    naziv: "Kauboji",
    rec: "Svi ljudi u kaubi.",
    ikona: "pregled",
    akcija: { vrsta: "ruke" },
  });
  if (id !== "selo") {
    stavke.push({
      id: "kauba",
      naziv: "Kauba",
      rec: "Natrag na trg.",
      ikona: "kauba",
      akcija: { vrsta: "trg" },
    });
  }
  return stavke;
}


/** Pošalji kauboja u dio kaube. */
export function tokMeniZaLika(hubSad?: string | null): TokMeniStavka[] {
  return POTREBE_META.map((h) => ({
    id: `lik-${h.id}`,
    naziv: h.naziv,
    rec: hubSad === h.id ? "Već je tu." : `Pošalji na ${h.naziv.toLowerCase()}.`,
    ikona: HUB_IKONA[h.id],
    akcija: { vrsta: "premjesti" as const, hub: h.id },
  }));
}

/** Dugi pritisak na glas potrebe. */
export function tokMeniZaGlas(id: KaubaUsko, gradevine?: Gradevine): TokMeniStavka[] {
  const zid = prvaZgradaHuba(id, gradevine);
  const stavke: TokMeniStavka[] = [
    {
      id: "zgrade",
      naziv: "Zgrade",
      rec: "Otvori zgrade ovog dijela.",
      ikona: "zgrade",
      akcija: { vrsta: "zgrada", id: zid },
    },
  ];
  const k = KONTEKST[id];
  if (k) stavke.push(k);
  if (id === "zabava") {
    stavke.push({
      id: "casino",
      naziv: "Casino",
      rec: "Stolovi i kocke.",
      ikona: "igraj",
      akcija: { vrsta: "zgrada", id: "karte" },
    });
  }
  return stavke;
}

export function tokMeniZaTab(
  tab: TabId,
  ctx?: { dijamanti?: number; bonusCijena?: number },
): TokMeniStavka[] {
  if (tab === "automat") {
    const cijena = ctx?.bonusCijena ?? 15;
    if ((ctx?.dijamanti ?? 0) < cijena) return [];
    return [
      { id: "auto", naziv: "Auto", rec: "Vrti dok ima energije.", ikona: "auto", akcija: { vrsta: "slot", slot: "auto" } },
      { id: "bonus", naziv: "Bonus", rec: "Kupi vrtnje zvijezde.", ikona: "bonus", akcija: { vrsta: "slot", slot: "bonus" } },
    ];
  }
  if (tab === "zid") {
    return [
      { id: "kronika", naziv: "Kronika", rec: "Što se dogodilo.", ikona: "kronika", akcija: { vrsta: "zid-skok", kamo: "kronika" } },
      { id: "cilj", naziv: "Cilj", rec: "Sljedeća zgrada.", ikona: "cilj", akcija: { vrsta: "zid-skok", kamo: "cilj" } },
    ];
  }
  if (tab === "selo") {
    const potrebe: TokMeniStavka[] = POTREBE_META.map((h) => ({
      id: h.id,
      naziv: h.naziv,
      rec: `Otvori ${h.naziv.toLowerCase()}.`,
      ikona: HUB_IKONA[h.id],
      akcija: { vrsta: "hub" as const, hub: h.id },
    }));
    return potrebe;
  }
  if (tab === "misije") {
    return [
      { id: "nalozi", naziv: "Nalozi", rec: "Dnevni poslovi.", ikona: "nalog", akcija: { vrsta: "zadaci", tab: "nalozi" } },
      { id: "zvijezde", naziv: "Zvijezde", rec: "Što je Boro zabio.", ikona: "zvijezda", akcija: { vrsta: "zadaci", tab: "zvijezde" } },
      { id: "karavana", naziv: "Karavana", rec: "Put i cin.", ikona: "karavana", akcija: { vrsta: "zadaci", tab: "karavana" } },
      { id: "uzivo", naziv: "Uživo", rec: "Igra s drugima.", ikona: "uzivo", akcija: { vrsta: "zadaci", tab: "uzivo" } },
    ];
  }
  return [
    { id: "burza", naziv: "Burza", rec: "Kupi i prodaj.", ikona: "burza", akcija: { vrsta: "trznica", sekcija: "burza" } },
    { id: "alati", naziv: "Alati", rec: "Trajna pojačanja.", ikona: "alati", akcija: { vrsta: "trznica", sekcija: "alati" } },
    { id: "izgled", naziv: "Izlog", rec: "Koža automata.", ikona: "izgled", akcija: { vrsta: "trznica", sekcija: "izgled" } },
  ];
}

export function tokMeniZaResurs(id: "zlato" | "dijamanti" | "drvo" | "kamen" | "željezo" | "štitovi"): TokMeniStavka[] {
  if (id === "zlato" || id === "dijamanti") {
    return [
      { id: "trznica", naziv: "Tržnica", rec: "Burza i dijamanti.", ikona: "trznica", akcija: { vrsta: "tab", tab: "trznica" } },
      { id: "igraj", naziv: "Igraj", rec: "Okreni za više.", ikona: "igraj", akcija: { vrsta: "tab", tab: "automat" } },
    ];
  }
  if (id === "štitovi") {
    return [
      { id: "red", naziv: "Zakon", rec: "Ured i oklop.", ikona: "pohod", akcija: { vrsta: "hub", hub: "red" } },
      { id: "pohod", naziv: "Pohod", rec: "Kreni u pohod.", ikona: "pohod", akcija: { vrsta: "pohod" } },
    ];
  }
  return [
    { id: "posao", naziv: "Posao", rec: "Pilana, kamen, ruda.", ikona: "trgovina", akcija: { vrsta: "hub", hub: "posao" } },
    { id: "trznica", naziv: "Tržnica", rec: "Prodaj višak.", ikona: "trznica", akcija: { vrsta: "tab", tab: "trznica" } },
  ];
}

const PLAKAT_HUB: Record<string, KaubaUsko | "trg"> = {
  RED: "red",
  GRANICA: "red",
  AKCIJA: "red",
  ZAKON: "red",
  PODNE: "red",
  UHO: "red",
  ŠERIF: "red",
  VODA: "voda",
  MOST: "voda",
  RIJEKA: "voda",
  OPREZ: "voda",
  FIRMA: "jelo",
  TRG: "trg",
  SELO: "trg",
  STRAŽA: "trg",
  PUT: "konji",
  PRAŠINA: "konji",
  RIJEČ: "krov",
};

export function tokMeniZaPlakat(stem: string): TokMeniStavka[] {
  const gdje = PLAKAT_HUB[stem] ?? "trg";
  const hub = gdje === "trg" ? null : gdje;
  const ime = hub ? (POTREBE_META.find((h) => h.id === hub)?.naziv ?? hub) : "Trg";
  return [
    {
      id: "idi",
      naziv: ime,
      rec: hub ? `Šerif šalje na ${ime.toLowerCase()}.` : "Na trg kaube.",
      ikona: hub === "red" ? "pohod" : hub === "voda" ? "kisa" : "kauba",
      akcija: hub ? { vrsta: "hub", hub } : { vrsta: "trg" },
    },
    { id: "zid", naziv: "Zid", rec: "Ostani na daski.", ikona: "zid", akcija: { vrsta: "tab", tab: "zid" } },
    { id: "pohod", naziv: "Pohod", rec: "Kreni u pohod.", ikona: "pohod", akcija: { vrsta: "pohod" } },
  ];
}

export function tokMeniZaSimbol(id: SimbolId): TokMeniStavka[] {
  const tip = BLAGO[id]?.tip ?? id;
  const min = minNiz(id);
  if (id === "skull") {
    return [
      { id: "opasnost", naziv: "OPASNOST", rec: "Tri lubanje. Štit ili pohod.", ikona: "pohod", akcija: { vrsta: "info" } },
      { id: "red", naziv: "Zakon", rec: "Ured i štitovi.", ikona: "pohod", akcija: { vrsta: "hub", hub: "red" } },
    ];
  }
  if (id === "knjiga") {
    return [
      { id: "knjiga5", naziv: "5 knjiga", rec: "Pet knjiga otvara deset vrtnji.", ikona: "almanah", akcija: { vrsta: "info" } },
      { id: "knjiga-manje", naziv: "3 · 4", rec: "Tri knjige daju šest vrtnji, četiri daju osam.", ikona: "almanah", akcija: { vrsta: "info" } },
      { id: "bonus", naziv: "BONUS", rec: "Kupi osam vrtnji.", ikona: "igraj", akcija: { vrsta: "tab", tab: "automat" } },
    ];
  }
  if (id === "wild") {
    return [
      { id: "wild", naziv: "WILD", rec: "Zvijezda je wild simbol. Zamjenjuje ostale.", ikona: "igraj", akcija: { vrsta: "info" } },
      { id: "n3", naziv: "3 · ×1", rec: "Tri u liniji, sa zvijezdom.", ikona: "igraj", akcija: { vrsta: "info" } },
      { id: "n4", naziv: "4 · ×3", rec: "Četiri u liniji.", ikona: "igraj", akcija: { vrsta: "info" } },
      { id: "n5", naziv: "5 · ×6", rec: "Pet. Jackpot linija.", ikona: "igraj", akcija: { vrsta: "info" } },
    ];
  }
  const tri = min <= 3 ? `3 · ×1` : "—";
  return [
    { id: "n3", naziv: tri, rec: `${tip}. Tri u liniji.`, ikona: "igraj", akcija: { vrsta: "info" } },
    { id: "n4", naziv: "4 · ×3", rec: "Četiri u liniji.", ikona: "igraj", akcija: { vrsta: "info" } },
    { id: "n5", naziv: "5 · ×6", rec: "Pet. Jackpot linija.", ikona: "igraj", akcija: { vrsta: "info" } },
  ];
}

export const TOK_MENI_R = 62;
export const TOK_MENI_STAVKA_R = 26;
export const TOK_MENI_PAD = 8 + 26;
export const TOK_MENI_NAV = 84;
export const TOK_MENI_RAZMAK = 50;

/** Donja polovica ekrana — svi hold-izbornici stoje tu, ne preko slike. */
export function tokMeniEkran(x: number, y: number) {
  const w = typeof window === "undefined" ? 390 : window.innerWidth;
  const h = typeof window === "undefined" ? 844 : window.innerHeight;
  const visina = Math.max(TOK_MENI_PAD * 2 + 8, h - TOK_MENI_NAV);
  return {
    x: Math.max(TOK_MENI_PAD, Math.min(w - TOK_MENI_PAD, x)),
    y: Math.max(TOK_MENI_PAD, Math.min(visina - TOK_MENI_PAD, y)),
    w,
    h: visina,
  };
}


export type TokMeniTocka = { dx: number; dy: number };

export function tokMeniStaneKrug(cx: number, cy: number, sirina: number, visina: number, r = TOK_MENI_R) {
  const pad = TOK_MENI_PAD;
  return cx - r >= pad && cy - r >= pad && cx + r <= sirina - pad && cy + r <= visina - pad;
}

function stezni(cx: number, cy: number, dx: number, dy: number, W: number, H: number): TokMeniTocka {
  const pad = TOK_MENI_PAD;
  const x = Math.max(pad, Math.min(W - pad, cx + dx));
  const y = Math.max(pad, Math.min(H - pad, cy + dy));
  return { dx: x - cx, dy: y - cy };
}

function razmakni(tocke: TokMeniTocka[], minDist: number) {
  for (let k = 0; k < 8; k++) {
    for (let i = 0; i < tocke.length; i++) {
      for (let j = i + 1; j < tocke.length; j++) {
        const a = tocke[i]!;
        const b = tocke[j]!;
        let ddx = b.dx - a.dx;
        let ddy = b.dy - a.dy;
        const d = Math.hypot(ddx, ddy) || 0.01;
        if (d >= minDist) continue;
        const push = (minDist - d) / 2;
        const ux = ddx / d;
        const uy = ddy / d;
        a.dx -= ux * push;
        a.dy -= uy * push;
        b.dx += ux * push;
        b.dy += uy * push;
      }
    }
  }
}

/** Polarne točke menija. Na rubu se otvara prema sredini ploče, nikad van. */
export function tokMeniRaspored(
  cx: number,
  cy: number,
  n: number,
  sirina: number,
  visina: number,
): { krug: boolean; tocke: TokMeniTocka[] } {
  const broj = Math.max(1, n);
  const W = Math.max(TOK_MENI_PAD * 2 + 8, sirina);
  const H = Math.max(TOK_MENI_PAD * 2 + 8, visina);
  const krug = tokMeniStaneKrug(cx, cy, W, H);
  const tocke: TokMeniTocka[] = [];

  if (krug) {
    for (let i = 0; i < broj; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / broj;
      tocke.push(stezni(cx, cy, Math.cos(a) * TOK_MENI_R, Math.sin(a) * TOK_MENI_R, W, H));
    }
  } else {
    const toward = Math.atan2(H / 2 - cy, W / 2 - cx);
    const span = broj <= 1 ? 0 : Math.min(Math.PI * 1.2, (broj - 1) * 0.88);
    const dist = Math.hypot(W / 2 - cx, H / 2 - cy);
    const r = Math.min(TOK_MENI_R, Math.max(52, dist * 0.42));
    for (let i = 0; i < broj; i++) {
      const t = broj === 1 ? 0.5 : i / (broj - 1);
      const a = toward - span / 2 + t * span;
      tocke.push(stezni(cx, cy, Math.cos(a) * r, Math.sin(a) * r, W, H));
    }
  }

  razmakni(tocke, TOK_MENI_RAZMAK);
  for (let i = 0; i < tocke.length; i++) {
    tocke[i] = stezni(cx, cy, tocke[i]!.dx, tocke[i]!.dy, W, H);
  }
  return { krug, tocke };
}

/** Polukrug na prikazu (voda, trg…). Luk gleda od ruba prema ploči. */
export function tokMeniPolukrug(
  cx: number,
  cy: number,
  n: number,
  sirina: number,
  visina: number,
): { krug: boolean; tocke: TokMeniTocka[] } {
  const broj = Math.max(1, n);
  const W = Math.max(TOK_MENI_PAD * 2 + 8, sirina);
  const H = Math.max(TOK_MENI_PAD * 2 + 8, visina);
  const left = cx;
  const right = W - cx;
  const top = cy;
  const bottom = H - cy;
  const min = Math.min(left, right, top, bottom);
  let toward = -Math.PI / 2;
  if (min === top && top < TOK_MENI_R + TOK_MENI_PAD) toward = Math.PI / 2;
  else if (min === left && left < TOK_MENI_R + TOK_MENI_PAD) toward = 0;
  else if (min === right && right < TOK_MENI_R + TOK_MENI_PAD) toward = Math.PI;
  const span = broj <= 1 ? 0 : Math.min(Math.PI, (broj - 1) * (broj <= 3 ? 1.05 : 0.72));
  const r = broj <= 3 ? 118 : TOK_MENI_R;
  const tocke: TokMeniTocka[] = [];
  for (let i = 0; i < broj; i++) {
    const t = broj === 1 ? 0.5 : i / (broj - 1);
    const a = toward - span / 2 + t * span;
    tocke.push(stezni(cx, cy, Math.cos(a) * r, Math.sin(a) * r, W, H));
  }
  razmakni(tocke, TOK_MENI_RAZMAK);
  for (let i = 0; i < tocke.length; i++) {
    tocke[i] = stezni(cx, cy, tocke[i]!.dx, tocke[i]!.dy, W, H);
  }
  return { krug: false, tocke };
}
