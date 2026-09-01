import type { SimbolId } from "./types";

export const ART = {
  hall: "/art/hall.jpg",
  aurora: "/art/aurora.png",
  snow: "/art/zvjezdarnica.jpg",
  cabin: "/art/selo-poster.jpg",
  raid: "/art/cowboy.jpg",
  splash: "/art/pustinjaci.png",
  seloVideo: "/art/selo.mp4",
  ceh: "/art/ceh.jpg",
  misije: "/art/kukuruz.png",
  trznica: "/art/kuhar.png",
  lov: "/art/lov.png",
  svemir: "/art/svemir.jpg",
  isoMill: "/art/iso-mill.png",
  isoQuarry: "/art/iso-quarry.png",
  isoForge: "/art/iso-forge.png",
  village: "/art/village.png",
  cowboy: "/art/cowboy.jpg",
  kauba: "/art/kauba.jpg",
  kaubaCowboy: "/art/kauba-cowboy.jpg",
  kuhar: "/art/kuhar.png",
  prase: "/art/prase.png",
  kukuruz: "/art/kukuruz.png",
  bubbles: "/art/bubbles.png",
  dobitak: "/art/dobitak.jpg",
  selfie: "/art/selfie.png",
  drustvo: "/art/drustvo.png",
  pustinjaci: "/art/pustinjaci.png",
  zvjezdarnica: "/art/zvjezdarnica.jpg",
  polje: "/art/polje.jpg",
  oblaci: "/art/oblaci.jpg",
  vinograd: "/art/vinograd.jpg",
  tractor: "/art/video/tractor.mp4",
  vatra: "/art/video/vatra.mp4",
  duga: "/art/video/duga.mp4",
} as const;

const V = "v=7";

export const SYMBOL_ART: Record<SimbolId, string> = {
  skull: `/art/symbols/skull.png?${V}`,
  wood: `/art/symbols/wood.png?${V}`,
  stone: `/art/symbols/stone.png?${V}`,
  iron: `/art/symbols/iron.png?${V}`,
  gold: `/art/symbols/gold.png?${V}`,
  energy: `/art/symbols/energy.png?${V}`,
  gem: `/art/symbols/gem.png?${V}`,
  shield: `/art/symbols/shield.png?${V}`,
  wild: `/art/symbols/wild.png?${V}`,
};

export const RESURS_ART = {
  drvo: SYMBOL_ART.wood,
  kamen: SYMBOL_ART.stone,
  zeljezo: SYMBOL_ART.iron,
  dijamant: SYMBOL_ART.gem,
  zlato: SYMBOL_ART.gold,
  energija: SYMBOL_ART.energy,
  stitovi: SYMBOL_ART.shield,
} as const;

export const ZGRADA_ART: Record<string, string> = {
  pilana: "/art/zgrade/pilana.jpg?v=8",
  kamenolom: "/art/zgrade/kamenolom.jpg?v=8",
  rudnik: "/art/zgrade/rudnik.jpg",
};

const M = "v=1";

export const MREZA_ART = {
  selo: `/art/mreza/house.png?${M}`,
  pilana: `/art/mreza/lumber.png?${M}`,
  kamenolom: `/art/mreza/wall.png?${M}`,
  rudnik: `/art/mreza/iron.png?${M}`,
  oklop: `/art/mreza/shield.png?${M}`,
  klan: `/art/mreza/flag.png?${M}`,
  pozar: `/art/mreza/fire.png?${M}`,
  osvetnik: `/art/mreza/skull.png?${M}`,
  strateg: `/art/mreza/book.png?${M}`,
  pljackas: `/art/mreza/pouch.png?${M}`,
  metaWin: `/art/mreza/sword.png?${M}`,
  metaLoss: `/art/mreza/shield.png?${M}`,
} as const;

export const CREDITS =
  "Glazba 1925. javno vlasništvo (Internet Archive) · klavir Kevin MacLeod CC-BY";

let artPreloaded = false;

export function preloadArt() {
  if (artPreloaded || typeof window === "undefined") return;
  artPreloaded = true;
  const urls = [
    ...Object.values(SYMBOL_ART),
    ART.splash,
    ART.village,
    ART.raid,
    ART.kuhar,
    ART.prase,
    ART.selfie,
    ART.kukuruz,
    ART.pustinjaci,
    ART.kauba,
  ];
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
