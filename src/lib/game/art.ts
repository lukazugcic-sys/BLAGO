import type { SimbolId } from "./types";

const V = "v=57";

export function asset(path: string) {
  const raw = (path.startsWith("/") ? path.slice(1) : path).split("?")[0];
  return `/${raw}?${V}`;
}

export function artSrc(src: string) {
  const m = src.match(/art\/[^?]+/);
  return m ? `/art/${m[0].replace(/^art\//, "")}?${V}` : src;
}

export const ART = {
  hall: asset("/art/hall.webp"),
  aurora: asset("/art/aurora.webp"),
  snow: asset("/art/zvjezdarnica.webp"),
  cabin: asset("/art/cabin.webp"),
  seloPoster: asset("/art/selo-poster.webp"),
  raid: asset("/art/pohod-opsada.webp"),
  pohodJahanje: asset("/art/pohod-jahanje.webp"),
  pohodOpsada: asset("/art/pohod-opsada.webp"),
  stazaUtrka: asset("/art/staza-utrka.webp"),
  splash: asset("/art/pustinjaci.webp"),
  seloVideo: asset("/art/selo.mp4"),
  ceh: asset("/art/ceh.webp"),
  misije: asset("/art/kukuruz.webp"),
  trznica: asset("/art/trznica.webp"),
  lov: asset("/art/lov.webp"),
  svemir: asset("/art/svemir.webp"),
  isoMill: asset("/art/iso-mill.png"),
  isoQuarry: asset("/art/iso-quarry.png"),
  isoForge: asset("/art/iso-forge.png"),
  village: asset("/art/village.webp"),
  cowboy: asset("/art/cowboy.webp"),
  kauba: asset("/art/kauba.webp"),
  kaubaCowboy: asset("/art/kauba-cowboy.webp"),
  knjigaKorice: asset("/art/knjiga-korice.webp"),
  knjigaList: asset("/art/knjiga-list.webp"),
  kuhar: asset("/art/kuhar.webp"),
  prase: asset("/art/prase.webp"),
  kukuruz: asset("/art/kukuruz.webp"),
  bubbles: asset("/art/bubbles.webp"),
  dobitak: asset("/art/dobitak.webp"),
  selfie: asset("/art/selfie.webp"),
  drustvo: asset("/art/drustvo.webp"),
  pustinjaci: asset("/art/pustinjaci.webp"),
  zvjezdarnica: asset("/art/zvjezdarnica.webp"),
  polje: asset("/art/polje.webp"),
  oblaci: asset("/art/oblaci.webp"),
  vinograd: asset("/art/vinograd.webp"),
  tractor: asset("/art/video/tractor.mp4"),
  vatra: asset("/art/video/vatra.mp4"),
  duga: asset("/art/video/duga.mp4"),
  ulica: asset("/art/hub/ulica.webp"),
  kola: asset("/art/hub/kola.webp"),
  bubanj: asset("/art/bubanj.png"),
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
  knjiga: asset("/art/symbols/znacka.png"),
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
  pilana: asset("/art/zgrade/pilana.webp"),
  kamenolom: asset("/art/zgrade/kamenolom.webp"),
  rudnik: asset("/art/zgrade/rudnik.webp"),
  kuca: asset("/art/zgrade/kuca-w.webp"),
  blok: asset("/art/zgrade/blok-w.webp"),
  salun: asset("/art/zgrade/salun.webp"),
  bunar: asset("/art/zgrade/bunar.webp"),
  cisterna: asset("/art/zgrade/cisterna.webp"),
  mlin: asset("/art/zgrade/mlin.webp"),
  lov: asset("/art/lov.webp"),
  mesnica: asset("/art/zgrade/mesnica-w.webp"),
  pekara: asset("/art/zgrade/pekara-w.webp"),
  karte: asset("/art/zgrade/karte.webp"),
  ured: asset("/art/zgrade/ured.webp"),
  staja: asset("/art/zgrade/staja.webp"),
  korali: asset("/art/polje.webp"),
  staza: asset("/art/zgrade/staza.webp"),
  farma: asset("/art/zgrade/farma.webp"),
  tor: asset("/art/zgrade/tor.webp"),
  ordinacija: asset("/art/zgrade/ordinacija.webp"),
  travar: asset("/art/zgrade/travar.webp"),
  banja: asset("/art/zgrade/banja.webp"),
  trgovina: asset("/art/zgrade/trgovina.webp"),
  banka: asset("/art/zgrade/banka.webp"),
  kovacnica: asset("/art/zgrade/kovacnica.webp"),
  barutana: asset("/art/zgrade/barutana.webp"),
  tvornica: asset("/art/zgrade/tvornica.webp"),
};

const izo = (ime: string) => asset(`/art/zgrade/izo/${ime}.webp`);

/** Prazna parcela, skela, sjena i dekor ulice. Prozirni WebP. */
export const IZO_DEKOR = {
  kolci: izo("kolci"),
  skela: izo("skela"),
  sjena: izo("sjena"),
  bacva: izo("bacva"),
  kaktus: izo("kaktus"),
  ograda: izo("ograda"),
  kola: izo("kola"),
} as const;

/**
 * Izometrijski sprite zgrade.
 * a = razina 1–2, b = 3–5, c = 6+.
 * Svaka zgrada ima barem a/b. c imaju one čiji strop ide na 6 ili više.
 */
export const ZGRADA_IZO: Record<string, { a: string; b?: string; c?: string }> = {
  kuca: { a: izo("kuca-a"), b: izo("kuca-b"), c: izo("kuca-c") },
  blok: { a: izo("blok-a"), b: izo("blok-b"), c: izo("blok-c") },
  lov: { a: izo("lov-a"), b: izo("lov-b"), c: izo("lov-c") },
  mesnica: { a: izo("mesnica-a"), b: izo("mesnica-b") },
  pekara: { a: izo("pekara-a"), b: izo("pekara-b") },
  farma: { a: izo("farma-a"), b: izo("farma-b"), c: izo("farma-c") },
  tor: { a: izo("tor-a"), b: izo("tor-b"), c: izo("tor-c") },
  salun: { a: izo("salun-a"), b: izo("salun-b"), c: izo("salun-c") },
  karte: { a: izo("karte-a"), b: izo("karte-b") },
  bunar: { a: izo("bunar-a"), b: izo("bunar-b") },
  cisterna: { a: izo("cisterna-a"), b: izo("cisterna-b"), c: izo("cisterna-c") },
  mlin: { a: izo("mlin-a"), b: izo("mlin-b") },
  pilana: { a: izo("pilana-a"), b: izo("pilana-b") },
  kamenolom: { a: izo("kamenolom-a"), b: izo("kamenolom-b"), c: izo("kamenolom-c") },
  rudnik: { a: izo("rudnik-a"), b: izo("rudnik-b"), c: izo("rudnik-c") },
  trgovina: { a: izo("trgovina-a"), b: izo("trgovina-b") },
  ured: { a: izo("ured-a"), b: izo("ured-b"), c: izo("ured-c") },
  banka: { a: izo("banka-a"), b: izo("banka-b") },
  staja: { a: izo("staja-a"), b: izo("staja-b") },
  korali: { a: izo("korali-a"), b: izo("korali-b"), c: izo("korali-c") },
  staza: { a: izo("staza-a"), b: izo("staza-b"), c: izo("staza-c") },
  ordinacija: { a: izo("ordinacija-a"), b: izo("ordinacija-b") },
  travar: { a: izo("travar-a"), b: izo("travar-b"), c: izo("travar-c") },
  banja: { a: izo("banja-a"), b: izo("banja-b") },
  kovacnica: { a: izo("kovacnica-a"), b: izo("kovacnica-b") },
  barutana: { a: izo("barutana-a"), b: izo("barutana-b") },
  tvornica: { a: izo("tvornica-a"), b: izo("tvornica-b") },
};

export function izoZgrada(id: string, lv: number) {
  const s = ZGRADA_IZO[id];
  if (!s) return undefined;
  if (lv >= 6 && s.c) return s.c;
  if (lv >= 3 && s.b) return s.b;
  return s.a;
}

export const JACKPOT_POSTERI = [
  asset("/art/jackpot/ulica.webp"),
  asset("/art/jackpot/san.webp"),
  asset("/art/jackpot/knjige.webp"),
];

export const HUB_ART: Record<string, string> = {
  krov: asset("/art/hub/krov.webp"),
  jelo: asset("/art/hub/jelo.webp"),
  zabava: asset("/art/hub/zabava.webp"),
  voda: asset("/art/hub/voda.webp"),
  posao: asset("/art/hub/posao.webp"),
  red: asset("/art/hub/red.webp"),
  konji: asset("/art/hub/konji.webp"),
  zdravlje: asset("/art/hub/zdravlje.webp"),
  oruzje: asset("/art/zgrade/tvornica.webp"),
  selo: asset("/art/kauba.webp"),
};

export const HUB_VIDEO: Record<string, string> = {
  krov: asset("/art/hub/krov.mp4"),
  jelo: asset("/art/hub/jelo.mp4"),
  zabava: asset("/art/hub/zabava.mp4"),
  voda: asset("/art/hub/voda.mp4"),
  posao: asset("/art/hub/posao.mp4"),
  red: asset("/art/hub/red.mp4"),
  konji: asset("/art/hub/konji.mp4"),
  zdravlje: asset("/art/hub/zdravlje.mp4"),
  selo: asset("/art/selo.mp4"),
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
  cisterna: asset("/art/mreza/book.png"),
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
  tor: asset("/art/mreza/pawns.png"),
  ordinacija: asset("/art/mreza/book.png"),
  travar: asset("/art/mreza/lumber.png"),
  banja: asset("/art/mreza/book.png"),
  trgovina: asset("/art/mreza/pouch.png"),
  banka: asset("/art/mreza/pouch.png"),
  kovacnica: asset("/art/mreza/iron.png"),
  barutana: asset("/art/mreza/fire.png"),
  tvornica: asset("/art/mreza/sword.png"),
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
