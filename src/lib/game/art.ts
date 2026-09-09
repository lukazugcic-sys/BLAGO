import type { SimbolId } from "./types";

const V = "v=34";

export function asset(path: string) {
  const raw = (path.startsWith("/") ? path.slice(1) : path).split("?")[0];
  return `/${raw}?${V}`;
}

export function artSrc(src: string) {
  const m = src.match(/art\/[^?]+/);
  return m ? `/art/${m[0].replace(/^art\//, "")}?${V}` : src;
}

export const ART = {
  hall: asset("/art/hall.jpg"),
  aurora: asset("/art/aurora.jpg"),
  snow: asset("/art/zvjezdarnica.jpg"),
  cabin: asset("/art/cabin.jpg"),
  seloPoster: asset("/art/selo-poster.jpg"),
  raid: asset("/art/pohod-opsada.jpg"),
  pohodJahanje: asset("/art/pohod-jahanje.jpg"),
  pohodOpsada: asset("/art/pohod-opsada.jpg"),
  stazaUtrka: asset("/art/staza-utrka.jpg"),
  splash: asset("/art/pustinjaci.jpg"),
  seloVideo: asset("/art/selo.mp4"),
  ceh: asset("/art/ceh.jpg"),
  misije: asset("/art/kukuruz.jpg"),
  trznica: asset("/art/trznica.jpg"),
  lov: asset("/art/lov.jpg"),
  svemir: asset("/art/svemir.jpg"),
  isoMill: asset("/art/iso-mill.png"),
  isoQuarry: asset("/art/iso-quarry.png"),
  isoForge: asset("/art/iso-forge.png"),
  village: asset("/art/village.jpg"),
  cowboy: asset("/art/cowboy.jpg"),
  kauba: asset("/art/kauba.jpg"),
  kaubaCowboy: asset("/art/kauba-cowboy.jpg"),
  kuhar: asset("/art/kuhar.jpg"),
  prase: asset("/art/prase.jpg"),
  kukuruz: asset("/art/kukuruz.jpg"),
  bubbles: asset("/art/bubbles.jpg"),
  dobitak: asset("/art/dobitak.jpg"),
  selfie: asset("/art/selfie.jpg"),
  drustvo: asset("/art/drustvo.jpg"),
  pustinjaci: asset("/art/pustinjaci.jpg"),
  zvjezdarnica: asset("/art/zvjezdarnica.jpg"),
  polje: asset("/art/polje.jpg"),
  oblaci: asset("/art/oblaci.jpg"),
  vinograd: asset("/art/vinograd.jpg"),
  tractor: asset("/art/video/tractor.mp4"),
  vatra: asset("/art/video/vatra.mp4"),
  duga: asset("/art/video/duga.mp4"),
} as const;

export const SYMBOL_ART: Record<SimbolId, string> = {
  skull: asset("/art/symbols/skull.png"),
  wood: asset("/art/symbols/wood.png"),
  stone: asset("/art/symbols/stone.png"),
  iron: asset("/art/symbols/iron.png"),
  gold: asset("/art/symbols/gold.png"),
  energy: asset("/art/symbols/energy.png"),
  gem: asset("/art/symbols/gem.png"),
  shield: asset("/art/symbols/shield.png"),
  wild: asset("/art/symbols/wild.png"),
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
  pilana: asset("/art/zgrade/pilana.jpg"),
  kamenolom: asset("/art/zgrade/kamenolom.jpg"),
  rudnik: asset("/art/zgrade/rudnik.jpg"),
  kuca: asset("/art/zgrade/kuca.jpg"),
  blok: asset("/art/zgrade/blok.jpg"),
  salun: asset("/art/zgrade/salun.jpg"),
  bunar: asset("/art/zgrade/bunar.jpg"),
  mlin: asset("/art/zgrade/mlin.jpg"),
  lov: asset("/art/lov.jpg"),
  mesnica: asset("/art/zgrade/mesnica.jpg"),
  pekara: asset("/art/zgrade/pekara.jpg"),
  karte: asset("/art/zgrade/karte.jpg"),
  ured: asset("/art/cowboy.jpg"),
  staja: asset("/art/zgrade/staja.jpg"),
  korali: asset("/art/polje.jpg"),
  staza: asset("/art/zgrade/staza.jpg"),
  farma: asset("/art/zgrade/farma.jpg"),
  ordinacija: asset("/art/zgrade/ordinacija.jpg"),
  trgovina: asset("/art/zgrade/trgovina.jpg"),
  banka: asset("/art/zgrade/banka.jpg"),
};

export const HUB_ART: Record<string, string> = {
  krov: ZGRADA_ART.kuca,
  jelo: ZGRADA_ART.lov,
  zabava: ZGRADA_ART.salun,
  voda: ZGRADA_ART.bunar,
  posao: ZGRADA_ART.pilana,
  red: ZGRADA_ART.ured,
  konji: ZGRADA_ART.staja,
  zdravlje: ZGRADA_ART.ordinacija,
  selo: ART.seloPoster,
};

export const MREZA_ART = {
  selo: asset("/art/mreza/house.png"),
  pilana: asset("/art/mreza/lumber.png"),
  kamenolom: asset("/art/mreza/wall.png"),
  rudnik: asset("/art/mreza/iron.png"),
  kuca: asset("/art/mreza/house.png"),
  blok: asset("/art/mreza/pawns.png"),
  salun: asset("/art/mreza/pouch.png"),
  bunar: asset("/art/mreza/book.png"),
  mlin: asset("/art/mreza/book.png"),
  lov: asset("/art/mreza/skull.png"),
  mesnica: asset("/art/mreza/skull.png"),
  pekara: asset("/art/mreza/pouch.png"),
  karte: asset("/art/mreza/pouch.png"),
  ured: asset("/art/mreza/shield.png"),
  staja: asset("/art/mreza/pawns.png"),
  korali: asset("/art/mreza/pawns.png"),
  staza: asset("/art/mreza/flag.png"),
  farma: asset("/art/mreza/lumber.png"),
  ordinacija: asset("/art/mreza/book.png"),
  trgovina: asset("/art/mreza/pouch.png"),
  banka: asset("/art/mreza/pouch.png"),
  oklop: asset("/art/mreza/shield.png"),
  klan: asset("/art/mreza/flag.png"),
  pozar: asset("/art/mreza/fire.png"),
  osvetnik: asset("/art/mreza/skull.png"),
  strateg: asset("/art/mreza/book.png"),
  pljackas: asset("/art/mreza/pouch.png"),
  metaWin: asset("/art/mreza/sword.png"),
  metaLoss: asset("/art/mreza/shield.png"),
} as const;

export const CREDITS =
  "Glazba 1925. javno vlasništvo (Internet Archive) · klavir Kevin MacLeod CC-BY";

let artPreloaded = false;

export function preloadArt() {
  if (artPreloaded || typeof window === "undefined") return;
  artPreloaded = true;
  const hitno = [...Object.values(SYMBOL_ART), ART.splash];
  const kasnije = [
    ...Object.values(MREZA_ART),
    ART.raid,
    ART.cabin,
    ART.seloPoster,
    ART.trznica,
    ART.lov,
    ART.kukuruz,
    ART.kaubaCowboy,
    ZGRADA_ART.pilana,
    ZGRADA_ART.kamenolom,
    ZGRADA_ART.rudnik,
    ZGRADA_ART.kuca,
    ZGRADA_ART.blok,
    ZGRADA_ART.salun,
    ZGRADA_ART.bunar,
    ZGRADA_ART.mlin,
    ZGRADA_ART.lov,
    ZGRADA_ART.mesnica,
    ZGRADA_ART.pekara,
    ZGRADA_ART.karte,
  ];
  const load = (src: string) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  };
  for (const src of hitno) load(src);
  const rest = () => {
    for (const src of kasnije) load(src);
  };
  const later = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof later.requestIdleCallback === "function") {
    later.requestIdleCallback(rest, { timeout: 2500 });
  } else {
    window.setTimeout(rest, 900);
  }
}
