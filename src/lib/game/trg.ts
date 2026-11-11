/**
 * 0.9.176 (t437u): mali trg između saluna, ordinacije, pekarne i glavne ceste.
 * 0.9.177 (t446u): trg uljepšan i malo veći — rub od kamenih blokova, zrakaste linije, fontana na
 * tri kata, spomenik, hlad sa kružnom klupom, štand s tendom, korita s cvijećem, fenjeri s košaricama,
 * lampice i zastavice, privez s pojilom, oglasna ploča, golubovi i mačka.
 * Čista geometrija prikaza (izvedena iz parcela), ništa se ne sprema. Sve je stalno (deterministički).
 */
import { PARCELE } from "./ulicaRaspored";

export type Trg = { x: number; y: number; rx: number; ry: number };

function trgIzParcela(): Trg | null {
  const s = PARCELE.find((p) => p.id === "salun");
  const o = PARCELE.find((p) => p.id === "ordinacija");
  const k = PARCELE.find((p) => p.id === "pekara");
  if (!s || !o || !k) return null;
  // težište triju zgrada, pomaknuto prema cesti (dolje-desno) na otvoreno tlo
  const x = (s.x + o.x + k.x) / 3 + 48;
  const y = (s.y + o.y + k.y) / 3 + 56;
  return { x: Math.round(x), y: Math.round(y), rx: 54, ry: 26 };
}

export const TRG = trgIzParcela();

/** Unutar trga (s rubom `rub` px). */
export function uTrgu(x: number, y: number, rub = 0) {
  if (!TRG) return false;
  return ((x - TRG.x) / (TRG.rx + rub)) ** 2 + ((y - TRG.y) / (TRG.ry + rub * 0.5)) ** 2 < 1;
}

export type TrgTip =
  | "fontana"
  | "klupa"
  | "fenjer"
  | "cvijece"
  | "drvo"
  | "lonac"
  | "spomenik"
  | "stand"
  | "privez"
  | "ploca"
  | "golub"
  | "macka"
  | "klupa-krug";

/** x/y = dodir s tlom (zabrane, testovi); z = dubina crtanja (zadano y); crta = gdje se simbol crta (zadano x/y). */
export type TrgStvar = { tip: TrgTip; x: number; y: number; okret: number; sc: number; zrcalo?: boolean; z?: number; cx?: number; cy?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Fenjeri na rubu (kutovi elipse) — i krajevi lampica/zastavica. */
export const TRG_FENJER_KUT = [Math.PI * 1.2, Math.PI * 1.8, Math.PI * 0.3, Math.PI * 0.7] as const;

/** Stvari na trgu (pomaci od središta, u px svijeta). Redoslijed nije bitan; crtaju se po y. */
export function stvariTrga(): TrgStvar[] {
  if (!TRG) return [];
  const { x, y, rx, ry } = TRG;
  const at = (dx: number, dy: number, tip: TrgTip, o: Partial<TrgStvar> = {}): TrgStvar => ({
    tip,
    x: r1(x + dx),
    y: r1(y + dy),
    okret: 0,
    sc: 1,
    ...o,
  });
  const na = (kut: number, f: number, tip: TrgTip, o: Partial<TrgStvar> = {}) => at(Math.cos(kut) * rx * f, Math.sin(kut) * ry * f, tip, o);
  return [
    at(0, 0, "fontana"),
    // stražnja polovica: štand desno, hlad s kružnom klupom lijevo, klupa iza fontane
    at(26, -13, "stand"),
    at(-30, -8, "klupa-krug", { sc: 1.2 }),
    // krošnja: Raslina(0) ima ishodište u krošnji, deblo ~15 px niže (sc 0.85) — crta se između pola klupe
    at(-30, -8, "drvo", { sc: 0.85, cy: r1(y - 8 - 15.3), cx: r1(x - 30 - 4), z: r1(y - 8.3) }),
    at(-2, -18, "klupa"),
    // fenjeri s košaricama cvijeća
    ...TRG_FENJER_KUT.map((k) => na(k, 1.0, "fenjer")),
    // korita s cvijećem uz rub
    at(-3, 24, "cvijece"),
    at(13, 23.2, "cvijece", { zrcalo: true }),
    at(-12, -22.6, "cvijece", { sc: 0.85 }),
    // spomenik (istok), oglasna ploča (zapad), privez s pojilom (jugoistok, prema cesti, izvan kruga)
    at(52, 4, "spomenik", { sc: 0.9 }),
    at(-50, 6, "ploca"),
    at(49, 21, "privez"),
    at(-17, 16, "klupa", { okret: -10 }),
    // lonci uz spomenik
    at(41, 11, "lonac", { sc: 0.85 }),
    at(60, 9, "lonac", { sc: 0.8 }),
    // golubovi i mačka (mačka sjedi na klupi)
    at(-8, 10, "golub"),
    at(-4, 12.5, "golub", { zrcalo: true }),
    at(19, 8, "golub", { sc: 0.9 }),
    at(-20.5, 15.4, "macka", { z: r1(y + 16.6) }),
  ];
}

export const TRG_STVARI = stvariTrga();

/** Krajevi lampica (stražnji luk) i zastavica (bočni lukovi): vrhovi fenjera. */
export function vrhFenjera(i: number) {
  if (!TRG) return { x: 0, y: 0 };
  const k = TRG_FENJER_KUT[i]!;
  return { x: r1(TRG.x + Math.cos(k) * TRG.rx), y: r1(TRG.y + Math.sin(k) * TRG.ry - 19) };
}
