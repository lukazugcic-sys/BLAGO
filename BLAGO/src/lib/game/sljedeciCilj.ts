import { ZGRADE } from "./constants";
import {
  bankaKap,
  hubZaZgradu,
  zgradaUvjet,
  type KaubaUsko,
} from "./economy";
import { BUNAR_ENERGIJA, MLIN_ENERGIJA, POKRICE, RESOURCE_TICK_MS } from "./tuning";
import type { Gradevine, Gradnja, Resursi, Zgrada } from "./types";

export const CILJ_EVENT = "blago:otvori-cilj";

export type CiljCijena = {
  zlato: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
};

export type SljedeciCilj = {
  zgrada: Zgrada;
  lv: number;
  ciljLv: number;
  cijena: CiljCijena;
  nedostaje: CiljCijena;
  ima: { zlato: number; drvo: number; kamen: number; zeljezo: number };
  mozeKupiti: boolean;
  nagrada: string;
  uGradnji: boolean;
  hub: KaubaUsko | null;
  akcija: "IZGRADI" | "NADOGRADI" | "GRADI SE";
};

export function otvoriCiljZgradu(id: keyof Gradevine) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CILJ_EVENT, { detail: { id } }));
}

function nedostajeOd(cijena: CiljCijena, zlato: number, resursi: Resursi): CiljCijena {
  return {
    zlato: Math.max(0, Math.ceil(cijena.zlato - zlato)),
    drvo: Math.max(0, Math.ceil(cijena.drvo - (resursi.drvo || 0))),
    kamen: Math.max(0, Math.ceil(cijena.kamen - (resursi.kamen || 0))),
    zeljezo: Math.max(0, Math.ceil(cijena.zeljezo - (resursi.zeljezo || 0))),
  };
}

function zbrojNedostaje(n: CiljCijena) {
  return n.zlato + n.drvo + n.kamen + n.zeljezo;
}

function zbrojCijene(c: CiljCijena) {
  return c.zlato + c.drvo + c.kamen + c.zeljezo;
}

/** What the player gets when this upgrade finishes. */
export function nagradaZaNadogradnju(z: Zgrada, ciljLv: number): string {
  const tick = RESOURCE_TICK_MS / 1000;
  const id = z.id;
  if (id === "kuca") return `+${POKRICE.kuca} kreveta · LVL ${ciljLv}/${z.maxLv}`;
  if (id === "blok") return `+${POKRICE.blok} kreveta · LVL ${ciljLv}/${z.maxLv}`;
  if (id === "pilana") return `+${(ciljLv * z.bazaProizvodnja).toFixed(1)} drva / ${tick}s`;
  if (id === "kamenolom") return `+${(ciljLv * z.bazaProizvodnja).toFixed(1)} kamena / ${tick}s`;
  if (id === "rudnik") return `+${(ciljLv * z.bazaProizvodnja).toFixed(1)} željeza / ${tick}s`;
  if (id === "salun") return `Zabava za ${ciljLv * POKRICE.salun} · zlato od gostiju`;
  if (id === "karte") return `Stol asova · zabava ${ciljLv * POKRICE.karte}`;
  if (id === "bunar") return `Voda ${ciljLv * POKRICE.bunar} · +${(ciljLv * BUNAR_ENERGIJA).toFixed(1)} energije / ${tick}s`;
  if (id === "mlin") return `Voda ${ciljLv * POKRICE.mlin} · +${(ciljLv * MLIN_ENERGIJA).toFixed(1)} energije / ${tick}s`;
  if (id === "cisterna") return `Kiša za ${ciljLv * POKRICE.cisterna} ljudi`;
  if (id === "lov") return `Hrana za ${ciljLv * POKRICE.lov} ljudi`;
  if (id === "mesnica") return `Hrana za ${ciljLv * POKRICE.mesnica} ljudi`;
  if (id === "pekara") return `Hrana za ${ciljLv * POKRICE.pekara} ljudi`;
  if (id === "farma") return `Hrana za ${ciljLv * POKRICE.farma} ljudi`;
  if (id === "tor") return `Tor za ${ciljLv * POKRICE.tor} grla`;
  if (id === "ured") return `Red za ${ciljLv * POKRICE.ured} ljudi`;
  if (id === "banka") return `Sef ${bankaKap(ciljLv)} · kamata`;
  if (id === "staja") return `Staja za ${ciljLv * POKRICE.staja} konja`;
  if (id === "korali") return `Ispust za ${ciljLv * POKRICE.korali} konja`;
  if (id === "staza") return `Staza za ${ciljLv * POKRICE.staza} konja`;
  if (id === "ordinacija") return `Liječi ${ciljLv * POKRICE.ordinacija} ljudi`;
  if (id === "travar") return `Trava za ${ciljLv * POKRICE.travar} ljudi`;
  if (id === "banja") return `Kupelj za ${ciljLv * POKRICE.banja} ljudi`;
  if (id === "trgovina") return `Posao za ${ciljLv * POKRICE.posao} ljudi`;
  return `LVL ${ciljLv}/${z.maxLv}`;
}

function scoreKandidata(
  z: Zgrada,
  lv: number,
  cijena: CiljCijena,
  nedostaje: CiljCijena,
  usko: KaubaUsko | null,
): number {
  const hub = hubZaZgradu(z.id);
  let score = 0;

  // Active town bottleneck wins — spin home already steers resources there.
  if (usko && hub === usko) score += 1000;

  // House is the clearest mid-term ladder (review fix #2).
  if (z.id === "kuca") score += 520;
  if (z.id === "blok") score += 180;

  // Prefer continuing an existing building over a brand-new one.
  if (lv > 0) score += 80;

  // Closer to affordability = clearer "what am I gathering for".
  const total = Math.max(1, zbrojCijene(cijena));
  const miss = zbrojNedostaje(nedostaje);
  const pct = 1 - Math.min(1, miss / total);
  score += Math.round(pct * 220);

  // Prefer cheaper next steps when otherwise tied.
  score += Math.max(0, 120 - Math.min(120, Math.floor(total / 8)));

  // Prefer lower target levels slightly (early ladders read clearer).
  score += Math.max(0, 40 - ciljPenalty(lv + 1));

  return score;
}

function ciljPenalty(ciljLv: number) {
  return Math.min(40, (ciljLv - 1) * 4);
}

function sastaviCilj(
  z: Zgrada,
  gradevine: Gradevine,
  zlato: number,
  resursi: Resursi,
  uGradnji: boolean,
): Omit<SljedeciCilj, "uGradnji" | "akcija"> & { uGradnji?: boolean } {
  const lv = gradevine[z.id] || 0;
  const ciljLv = Math.min(z.maxLv, lv + 1);
  const cijena = z.cijena(ciljLv);
  const nedostaje = nedostajeOd(cijena, zlato, resursi);
  const mozeKupiti =
    nedostaje.zlato === 0 &&
    nedostaje.drvo === 0 &&
    nedostaje.kamen === 0 &&
    nedostaje.zeljezo === 0;
  return {
    zgrada: z,
    lv,
    ciljLv,
    cijena,
    nedostaje,
    ima: {
      zlato: Math.floor(zlato),
      drvo: Math.floor(resursi.drvo || 0),
      kamen: Math.floor(resursi.kamen || 0),
      zeljezo: Math.floor(resursi.zeljezo || 0),
    },
    mozeKupiti,
    nagrada: nagradaZaNadogradnju(z, ciljLv),
    hub: hubZaZgradu(z.id),
    uGradnji,
  };
}

/**
 * Picks ONE next building upgrade from live village state.
 * Prefers in-progress jobs, then bottleneck hub, then house ladder.
 */
export function odaberiSljedeciCilj(ulaz: {
  gradevine: Gradevine;
  zlato: number;
  resursi: Resursi;
  gradnje?: Gradnja[];
  usko?: KaubaUsko | null;
}): SljedeciCilj | null {
  const { gradevine, zlato, resursi } = ulaz;
  const usko = ulaz.usko ?? null;
  const gradnje = ulaz.gradnje ?? [];

  const aktivna = gradnje[0];
  if (aktivna) {
    const z = ZGRADE.find((x) => x.id === aktivna.zgrada);
    if (z) {
      const base = sastaviCilj(z, gradevine, zlato, resursi, true);
      return {
        ...base,
        ciljLv: aktivna.ciljLv,
        uGradnji: true,
        akcija: "GRADI SE",
        nagrada: nagradaZaNadogradnju(z, aktivna.ciljLv),
      };
    }
  }

  let best: { score: number; cilj: ReturnType<typeof sastaviCilj> } | null = null;
  for (const z of ZGRADE) {
    const lv = gradevine[z.id] || 0;
    if (lv >= z.maxLv) continue;
    if (zgradaUvjet(z.id, gradevine)) continue;
    const cilj = sastaviCilj(z, gradevine, zlato, resursi, false);
    const score = scoreKandidata(z, lv, cilj.cijena, cilj.nedostaje, usko);
    if (!best || score > best.score) best = { score, cilj };
  }

  if (!best) return null;
  return {
    ...best.cilj,
    uGradnji: false,
    akcija: best.cilj.lv === 0 ? "IZGRADI" : "NADOGRADI",
  };
}
