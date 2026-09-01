import { create } from "zustand";
import {
  BAZA_TECAJ,
  ZGRADE,
  LUCKY_SPIN_INTERVAL,
  generirajMisiju,
  DOSTIGNUCA,
  generirajKlanZadatke,
} from "@/lib/game/constants";
import {
  izracunajMaxEnergiju,
  izracunajMaxStitova,
  izracunajPasivniMnozitelj,
  izracunajPotrebniXp,
  izracunajTokMnozitelj,
  izracunajEnergijaRegenMs,
  RESOURCE_TICK_MS,
  MAX_OFFLINE_MS,
} from "@/lib/game/economy";
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import {
  localDayKey,
  nagradaZaStreak,
  resolveDaily,
  cycleDay,
  type DailySave,
} from "@/lib/game/daily";
import type { CloudPayload } from "@/lib/game/cloud";
import type {
  Alat,
  DebriefStav,
  Gradevine,
  Klan,
  KronikaZapis,
  Misija,
  Nagrada,
  Ostecenja,
  Razine,
  Resursi,
  Skin,
  TecajStavka,
  TrznicaId,
  Zgrada,
} from "@/lib/game/types";
import { MAX_KRONIKA, parsirajKroniku } from "@/lib/game/kronika";
import { izgradiMrezu, kvSelaIzMreze, type MrezaUlaz } from "@/lib/game/mreza";

const PRAZNI_KLAN: Klan = {
  naziv: null,
  razina: 0,
  xp: 0,
  zadaci: [],
  zadnjiRefresh: null,
};

type Dnevna = { dan: number; nagrada: Nagrada; streak: number };
type Tecaj = Record<TrznicaId, TecajStavka>;
type Trend = Record<TrznicaId, number>;

export type GameState = {
  ucitavam: boolean;
  uid: string | null;
  imeIgraca: string;
  igracRazina: number;
  prestigeRazina: number;
  xp: number;
  zadnjiXp: number;
  xpFlash: number;
  energija: number;
  zlato: number;
  dijamanti: number;
  resursi: Resursi;
  stitovi: number;
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  razine: Razine;
  misije: Misija[];
  ukupnoVrtnji: number;
  ukupnoZlata: number;
  dostignucaDone: Record<string, boolean>;
  dnevniStreak: number;
  prikazDnevneNagrade: boolean;
  preuzetoDanas: boolean;
  dnevnaNagrada: Dnevna | null;
  tecaj: Tecaj;
  trend: Trend;
  luckySpinCounter: number;
  winStreak: number;
  poruka: string;
  levelUpData: { razina: number; skok?: number } | null;
  aktivniSkin: string;
  klan: Klan;
  zadnjiResursTick: number;
  zadnjaEnergijaTick: number;
  kronika: KronikaZapis[];
  stavSela: DebriefStav | null;
  kvalitetaSela: number;
  protokPuls: { ids: string[]; t: number } | null;

  setPoruka: (poruka: string) => void;
  clearLevelUp: () => void;
  ucitaj: () => void;
  spremi: () => void;
  spremiDostignuca: () => void;
  primijeniCloudSave: (d: CloudPayload) => void;
  timerTick: () => void;
  timerMarket: () => void;
  provjeriLevelUp: () => void;
  dodajXp: (iznos: number) => void;
  primiNagradu: (nagrada: Nagrada) => void;
  provjeriDostignuca: (
    novaVrtnja?: number,
    novoZlato?: number,
    novaTipGradnje?: number,
    noviPrestige?: number,
  ) => void;
  preuzmiDnevniBonus: () => void;
  otvoriDnevnuNagradu: () => void;
  sakrijDnevnuNagradu: () => void;
  azurirajMisiju: (tip: string, kolicina?: number) => void;
  preuzmiNagraduMisije: (id: number, nagrada: Nagrada) => void;
  nadogradiZgradu: (zgrada: Zgrada) => void;
  popraviZgradu: (zgrada: Zgrada) => void;
  izvrsiPrestige: () => void;
  kupiAlat: (alat: Alat) => void;
  trgovina: (akcija: "kupi" | "prodaj", resurs: TrznicaId, iznos: number) => boolean;
  kupiSkin: (skin: Skin) => void;
  osnujiKlan: (naziv: string) => void;
  doniraiUKlan: (iznosZlato: number) => void;
  azurirajKlanZadatak: (tip: string, kolicina?: number) => void;
  preuzmiKlanNagradu: (zadatakId: number) => void;
  refreshKlanZadatke: () => void;
  postaviUid: (uid: string | null) => void;
  postaviIme: (imeIgraca: string) => void;
  primiResurse: (ukradeno: Partial<Resursi> & { zlato?: number }) => void;
  zapisiDebrief: (zapis: Omit<KronikaZapis, "id" | "t">) => void;
  osvjeziProtok: (pulsIds?: string[]) => void;
  testAlat: (sto: "zlato" | "energija" | "dijamanti" | "resursi" | "stitovi" | "popravi") => void;
  autoTest: () => { ok: number; ukupno: number };
};

const nowMs = () => Date.now();
let tickMemR = 0;
let tickMemE = 0;

const pocetnoStanje = {
  ucitavam: true,
  uid: null as string | null,
  imeIgraca: "Kauboj",
  igracRazina: 1,
  prestigeRazina: 0,
  xp: 0,
  zadnjiXp: 0,
  xpFlash: 0,
  energija: 24,
  zlato: 80,
  dijamanti: 3,
  resursi: { drvo: 24, kamen: 0, zeljezo: 0 } as Resursi,
  stitovi: 1,
  gradevine: { pilana: 1, kamenolom: 0, rudnik: 0 } as Gradevine,
  ostecenja: { pilana: false, kamenolom: false, rudnik: false } as Ostecenja,
  razine: { sreca: 0, pojacalo: 0, baterija: 0, oklop: 0, wildBoost: 0 } as Razine,
  misije: [generirajMisiju(), generirajMisiju(), generirajMisiju()] as Misija[],
  ukupnoVrtnji: 0,
  ukupnoZlata: 0,
  dostignucaDone: {} as Record<string, boolean>,
  dnevniStreak: 0,
  prikazDnevneNagrade: false,
  preuzetoDanas: false,
  dnevnaNagrada: null as Dnevna | null,
  tecaj: { ...BAZA_TECAJ } as Tecaj,
  trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0 } as Trend,
  luckySpinCounter: LUCKY_SPIN_INTERVAL,
  winStreak: 0,
  poruka: "SPREMAN",
  levelUpData: null as { razina: number; skok?: number } | null,
  aktivniSkin: "default",
  klan: { ...PRAZNI_KLAN } as Klan,
  zadnjiResursTick: nowMs(),
  zadnjaEnergijaTick: nowMs(),
  kronika: [] as KronikaZapis[],
  stavSela: null as DebriefStav | null,
  kvalitetaSela: 20,
  protokPuls: null as { ids: string[]; t: number } | null,
};

function mrezaUlaz(s: {
  imeIgraca: string;
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  stitovi: number;
  razine: Razine;
  klan: Klan;
  stavSela: DebriefStav | null;
  kronika: KronikaZapis[];
  igracRazina: number;
  prestigeRazina: number;
}): MrezaUlaz {
  return {
    imeIgraca: s.imeIgraca,
    gradevine: s.gradevine,
    ostecenja: s.ostecenja,
    stitovi: s.stitovi,
    oklop: s.razine.oklop,
    klan: s.klan,
    stavSela: s.stavSela,
    kronika: s.kronika,
    igracRazina: s.igracRazina,
    prestigeRazina: s.prestigeRazina,
  };
}

type GameBlob = {
  igracRazina?: number;
  prestigeRazina?: number;
  xp?: number;
  energija?: number;
  zlato?: number;
  dijamanti?: number;
  resursi?: Partial<Resursi>;
  gradevine?: Partial<Gradevine>;
  ostecenja?: Partial<Ostecenja>;
  razine?: Partial<Razine>;
  stitovi?: number;
  misije?: Misija[];
  tecaj?: Tecaj;
  trend?: Trend;
  luckySpinCounter?: number;
  winStreak?: number;
  aktivniSkin?: string;
  klan?: Klan;
  imeIgraca?: string;
  zadnjiResursTick?: number;
  zadnjaEnergijaTick?: number;
  kronika?: KronikaZapis[];
  stavSela?: DebriefStav | null;
};

function num(v: unknown, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export const useGameStore = create<GameState>((set, get) => ({
  ...pocetnoStanje,

  setPoruka: (poruka) => set({ poruka }),
  clearLevelUp: () => set({ levelUpData: null }),

  ucitaj: () => {
    try {
      const d = loadJSON<GameBlob>(SAVE_KEYS.game);
      if (d) {
        const ticksNow = nowMs();
        set({
          igracRazina: num(d.igracRazina, get().igracRazina),
          prestigeRazina: num(d.prestigeRazina, get().prestigeRazina),
          xp: num(d.xp, get().xp),
          energija: num(d.energija, get().energija),
          zlato: num(d.zlato, get().zlato),
          dijamanti: num(d.dijamanti, get().dijamanti),
          resursi: { ...get().resursi, ...(d.resursi ?? {}) },
          gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
          ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
          razine: { ...get().razine, ...(d.razine ?? {}) },
          stitovi: num(d.stitovi, get().stitovi),
          misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
          tecaj: d.tecaj ?? get().tecaj,
          trend: d.trend ?? get().trend,
          luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
          winStreak: num(d.winStreak, get().winStreak),
          aktivniSkin: d.aktivniSkin || get().aktivniSkin,
          klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
          imeIgraca: d.imeIgraca || get().imeIgraca,
          zadnjiResursTick: num(d.zadnjiResursTick, ticksNow),
          zadnjaEnergijaTick: num(d.zadnjaEnergijaTick, ticksNow),
          kronika: parsirajKroniku(d.kronika),
          stavSela: d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
            ? d.stavSela
            : null,
        });
      }

      const da = loadJSON<{
        dostignucaDone?: Record<string, boolean>;
        ukupnoVrtnji?: number;
        ukupnoZlata?: number;
      }>(SAVE_KEYS.ach);
      if (da) {
        set({
          dostignucaDone: da.dostignucaDone ?? get().dostignucaDone,
          ukupnoVrtnji: num(da.ukupnoVrtnji, get().ukupnoVrtnji),
          ukupnoZlata: num(da.ukupnoZlata, get().ukupnoZlata),
        });
      }

      const pd = loadJSON<DailySave>(SAVE_KEYS.daily);
      const resolved = resolveDaily(pd);
      if (resolved.claimedToday) {
        set({
          dnevniStreak: resolved.streak,
          preuzetoDanas: true,
          prikazDnevneNagrade: false,
          dnevnaNagrada: null,
        });
      } else {
        const pack = nagradaZaStreak(resolved.streak);
        set({
          dnevniStreak: resolved.streak,
          preuzetoDanas: false,
          dnevnaNagrada: { ...pack, streak: resolved.streak },
          prikazDnevneNagrade: true,
        });
      }
    } catch (e) {
      console.error("Failed to load game state:", e);
    } finally {
      tickMemR = nowMs();
      tickMemE = nowMs();
      set({ ucitavam: false });
      get().osvjeziProtok();
    }
  },

  spremi: () => {
    const s = get();
    const payload: GameBlob = {
      igracRazina: s.igracRazina,
      prestigeRazina: s.prestigeRazina,
      xp: s.xp,
      energija: s.energija,
      zlato: s.zlato,
      dijamanti: s.dijamanti,
      resursi: s.resursi,
      gradevine: s.gradevine,
      ostecenja: s.ostecenja,
      razine: s.razine,
      stitovi: s.stitovi,
      misije: s.misije,
      tecaj: s.tecaj,
      trend: s.trend,
      luckySpinCounter: s.luckySpinCounter,
      winStreak: s.winStreak,
      aktivniSkin: s.aktivniSkin,
      klan: s.klan,
      imeIgraca: s.imeIgraca,
      zadnjiResursTick: s.zadnjiResursTick,
      zadnjaEnergijaTick: s.zadnjaEnergijaTick,
      kronika: s.kronika,
      stavSela: s.stavSela,
    };
    saveJSON(SAVE_KEYS.game, payload);
  },

  spremiDostignuca: () => {
    const s = get();
    saveJSON(SAVE_KEYS.ach, {
      dostignucaDone: s.dostignucaDone,
      ukupnoVrtnji: s.ukupnoVrtnji,
      ukupnoZlata: s.ukupnoZlata,
    });
  },

  primijeniCloudSave: (d) => {
    const ticksNow = nowMs();
    set({
      imeIgraca: d.imeIgraca || get().imeIgraca,
      igracRazina: num(d.igracRazina, get().igracRazina),
      prestigeRazina: num(d.prestigeRazina, get().prestigeRazina),
      xp: num(d.xp, get().xp),
      energija: num(d.energija, get().energija),
      zlato: num(d.zlato, get().zlato),
      dijamanti: num(d.dijamanti, get().dijamanti),
      resursi: { ...get().resursi, ...(d.resursi ?? {}) },
      stitovi: num(d.stitovi, get().stitovi),
      gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
      ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
      razine: { ...get().razine, ...(d.razine ?? {}) },
      misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
      tecaj: (d.tecaj as Tecaj) ?? get().tecaj,
      trend: (d.trend as Trend) ?? get().trend,
      luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
      winStreak: num(d.winStreak, get().winStreak),
      aktivniSkin: d.aktivniSkin || get().aktivniSkin,
      klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
      ukupnoVrtnji: num(d.ukupnoVrtnji, get().ukupnoVrtnji),
      ukupnoZlata: num(d.ukupnoZlata, get().ukupnoZlata),
      dostignucaDone: d.dostignucaDone ?? get().dostignucaDone,
      zadnjiResursTick: get().zadnjiResursTick || ticksNow,
      zadnjaEnergijaTick: get().zadnjaEnergijaTick || ticksNow,
      kronika: d.kronika ? parsirajKroniku(d.kronika) : get().kronika,
      stavSela:
        d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
          ? d.stavSela
          : get().stavSela,
    });
    get().osvjeziProtok();
  },

  timerTick: () => {
    const s = get();
    const now = nowMs();
    let lastR = tickMemR || s.zadnjiResursTick || now;
    let lastE = tickMemE || s.zadnjaEnergijaTick || now;
    if (now - lastR > MAX_OFFLINE_MS) lastR = now - MAX_OFFLINE_MS;
    if (now - lastE > MAX_OFFLINE_MS) lastE = now - MAX_OFFLINE_MS;
    const regenMs = izracunajEnergijaRegenMs(s.razine.baterija || 0);
    const rTicks = Math.floor((now - lastR) / RESOURCE_TICK_MS);
    const eTicks = Math.floor((now - lastE) / regenMs);
    if (rTicks <= 0 && eTicks <= 0) return;

    const maxEnergija = izracunajMaxEnergiju(s.razine.baterija || 0);
    const maxStitova = izracunajMaxStitova(s.razine.oklop || 0);
    const pasivniMnozitelj =
      izracunajPasivniMnozitelj(s.igracRazina, s.prestigeRazina) *
      izracunajTokMnozitelj(kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s))));
    const drvoGain =
      rTicks > 0 && !s.ostecenja.pilana
        ? s.gradevine.pilana * ZGRADE[0]!.bazaProizvodnja * pasivniMnozitelj * rTicks
        : 0;
    const kamenGain =
      rTicks > 0 && !s.ostecenja.kamenolom
        ? s.gradevine.kamenolom * ZGRADE[1]!.bazaProizvodnja * pasivniMnozitelj * rTicks
        : 0;
    const zeljezoGain =
      rTicks > 0 && !s.ostecenja.rudnik
        ? s.gradevine.rudnik * ZGRADE[2]!.bazaProizvodnja * pasivniMnozitelj * rTicks
        : 0;

    const nextEnergy = eTicks > 0 ? Math.min(maxEnergija, s.energija + eTicks) : s.energija;
    const shieldRoll =
      rTicks > 0 && s.stitovi < maxStitova && Math.random() < Math.min(1, 0.08 * rTicks);
    const nextResursTick = rTicks > 0 ? lastR + rTicks * RESOURCE_TICK_MS : s.zadnjiResursTick;
    const nextEnergyTick = eTicks > 0 ? lastE + eTicks * regenMs : s.zadnjaEnergijaTick;
    const resChanged = drvoGain !== 0 || kamenGain !== 0 || zeljezoGain !== 0;
    tickMemR = nextResursTick;
    tickMemE = nextEnergyTick;

    if (nextEnergy === s.energija && !resChanged && !shieldRoll) return;

    const puls: string[] = [];
    if (drvoGain > 0) puls.push("z:pilana>selo");
    if (kamenGain > 0) puls.push("z:kamenolom>selo");
    if (zeljezoGain > 0) puls.push("z:rudnik>selo");
    if (shieldRoll) puls.push("oklop>selo");

    set((state) => ({
      energija: nextEnergy,
      resursi: resChanged
        ? {
            drvo: state.resursi.drvo + drvoGain,
            kamen: state.resursi.kamen + kamenGain,
            zeljezo: state.resursi.zeljezo + zeljezoGain,
          }
        : state.resursi,
      stitovi: shieldRoll ? state.stitovi + 1 : state.stitovi,
      zadnjiResursTick: nextResursTick,
      zadnjaEnergijaTick: nextEnergyTick,
    }));
    get().osvjeziProtok(puls);
  },

  timerMarket: () => {
    set((state) => {
      const noviTecaj = { ...state.tecaj };
      const noviTrend: Trend = { ...state.trend };
      (["drvo", "kamen", "zeljezo", "dijamant"] as TrznicaId[]).forEach((res) => {
        const promjena = 0.7 + Math.random() * 0.6;
        const baza = BAZA_TECAJ[res];
        const novaKupi = Math.max(1, Math.floor(baza.kupi * promjena));
        const novaProdaj = Math.max(1, Math.floor(baza.prodaj * promjena));
        noviTrend[res] =
          novaKupi > state.tecaj[res].kupi ? 1 : novaKupi < state.tecaj[res].kupi ? -1 : 0;
        noviTecaj[res] = { kupi: novaKupi, prodaj: novaProdaj };
      });
      return { tecaj: noviTecaj, trend: noviTrend };
    });
  },

  provjeriLevelUp: () => {
    const s = get();
    let xp = s.xp;
    let razina = s.igracRazina;
    let dijamanti = s.dijamanti;
    let skok = 0;
    while (xp >= izracunajPotrebniXp(razina)) {
      xp -= izracunajPotrebniXp(razina);
      razina += 1;
      dijamanti += 5;
      skok += 1;
      if (skok > 20) break;
    }
    if (skok === 0) return;
    const maxEnergija = izracunajMaxEnergiju(s.razine.baterija || 0);
    set({
      xp,
      igracRazina: razina,
      dijamanti,
      energija: maxEnergija,
      poruka: `LEVEL UP! RAZINA ${razina}`,
      levelUpData: { razina, skok: skok > 1 ? skok : undefined },
    });
  },

  dodajXp: (iznos) => {
    if (iznos <= 0) return;
    set((state) => ({
      xp: state.xp + iznos,
      zadnjiXp: iznos,
      xpFlash: state.xpFlash + 1,
    }));
    get().provjeriLevelUp();
  },

  primiNagradu: (nagrada) => {
    set((state) => {
      const maxE = izracunajMaxEnergiju(state.razine.baterija || 0);
      const maxS = izracunajMaxStitova(state.razine.oklop || 0);
      return {
        zlato: state.zlato + (nagrada.zlato || 0),
        dijamanti: state.dijamanti + (nagrada.dijamanti || 0),
        energija: Math.min(maxE, state.energija + (nagrada.energija || 0)),
        stitovi: Math.min(maxS, state.stitovi + (nagrada.stitovi || 0)),
        resursi: {
          drvo: state.resursi.drvo + (nagrada.drvo || 0),
          kamen: state.resursi.kamen + (nagrada.kamen || 0),
          zeljezo: state.resursi.zeljezo + (nagrada.zeljezo || 0),
        },
      };
    });
  },

  provjeriDostignuca: (novaVrtnja, novoZlato, novaTipGradnje, noviPrestige) => {
    const s = get();
    const novaDostignuca = { ...s.dostignucaDone };
    const nagrade: Nagrada[] = [];
    let novaPoruka: string | null = null;

    DOSTIGNUCA.forEach((d) => {
      if (novaDostignuca[d.id]) return;
      let ispunjeno = false;
      if (d.tip === "spin" && novaVrtnja !== undefined && novaVrtnja >= d.cilj) ispunjeno = true;
      if (d.tip === "ukupnoZlato" && novoZlato !== undefined && novoZlato >= d.cilj)
        ispunjeno = true;
      if (d.tip === "gradnja" && novaTipGradnje !== undefined && novaTipGradnje >= d.cilj)
        ispunjeno = true;
      if (d.tip === "prestige" && noviPrestige !== undefined && noviPrestige >= d.cilj)
        ispunjeno = true;
      if (ispunjeno) {
        novaDostignuca[d.id] = true;
        nagrade.push(d.nagrada);
        novaPoruka = `DOSTIGNUĆE: ${d.naziv.toUpperCase()}!`;
      }
    });

    if (nagrade.length > 0 || novaPoruka) {
      set({
        dostignucaDone: novaDostignuca,
        ...(novaPoruka ? { poruka: novaPoruka } : {}),
      });
      nagrade.forEach((n) => get().primiNagradu(n));
    }
  },

  preuzmiDnevniBonus: () => {
    const s = get();
    if (s.preuzetoDanas || !s.dnevnaNagrada) return;
    playSfx("collect");
    get().primiNagradu(s.dnevnaNagrada.nagrada);
    saveJSON(SAVE_KEYS.daily, { streak: s.dnevniStreak, zadnjaDnevna: localDayKey() });
    set({
      preuzetoDanas: true,
      prikazDnevneNagrade: false,
      poruka: `DNEVNA NAGRADA DAN ${cycleDay(s.dnevniStreak)} PREUZETA!`,
    });
  },

  otvoriDnevnuNagradu: () => {
    if (get().preuzetoDanas) return;
    set({ prikazDnevneNagrade: true });
  },

  sakrijDnevnuNagradu: () => set({ prikazDnevneNagrade: false }),

  azurirajMisiju: (tip, kolicina = 1) => {
    set((state) => ({
      misije: state.misije.map((m) => {
        if (m.tip === tip && !m.zavrseno && m.trenutno < m.cilj) {
          const trenutno = Math.min(m.cilj, m.trenutno + kolicina);
          return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
        }
        return m;
      }),
    }));
  },

  preuzmiNagraduMisije: (id, nagrada) => {
    playSfx("collect");
    set((state) => ({
      misije: state.misije.map((m) => (m.id === id ? generirajMisiju() : m)),
      poruka: "MISIJA ZAVRŠENA! NAGRADA PREUZETA.",
    }));
    get().primiNagradu(nagrada);
  },

  nadogradiZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id] || 0;
    if (lv >= zgrada.maxLv) return;
    const c = zgrada.cijena(lv + 1);
    if (
      s.zlato < c.zlato ||
      s.resursi.drvo < (c.drvo || 0) ||
      s.resursi.kamen < (c.kamen || 0) ||
      s.resursi.zeljezo < (c.zeljezo || 0)
    ) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("build");
    set((state) => ({
      zlato: state.zlato - c.zlato,
      resursi: {
        drvo: state.resursi.drvo - (c.drvo || 0),
        kamen: state.resursi.kamen - (c.kamen || 0),
        zeljezo: state.resursi.zeljezo - (c.zeljezo || 0),
      },
      gradevine: { ...state.gradevine, [zgrada.id]: lv + 1 },
      poruka: `${zgrada.naziv.toUpperCase()} NADOGRAĐEN!`,
    }));
    get().azurirajMisiju("zgrada");
    get().azurirajKlanZadatak("zgrada");
    get().provjeriDostignuca(undefined, undefined, lv + 1, undefined);
    get().osvjeziProtok([`z:${zgrada.id}>selo`]);
  },

  popraviZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id];
    const cPopravakZlato = lv * 50;
    const cPopravakDrvo = lv * 20;
    if (s.zlato < cPopravakZlato || s.resursi.drvo < cPopravakDrvo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("build");
    set((state) => ({
      zlato: state.zlato - cPopravakZlato,
      resursi: { ...state.resursi, drvo: state.resursi.drvo - cPopravakDrvo },
      ostecenja: { ...state.ostecenja, [zgrada.id]: false },
      poruka: `${zgrada.naziv.toUpperCase()} POPRAVLJEN!`,
    }));
    get().osvjeziProtok([`z:${zgrada.id}>selo`]);
  },

  izvrsiPrestige: () => {
    const s = get();
    const noviPrestige = s.prestigeRazina + 1;
    playSfx("jackpot");
    set({
      prestigeRazina: noviPrestige,
      igracRazina: 1,
      xp: 0,
      gradevine: { pilana: 1, kamenolom: 0, rudnik: 0 },
      ostecenja: { pilana: false, kamenolom: false, rudnik: false },
      resursi: { drvo: 24, kamen: 0, zeljezo: 0 },
      zlato: 80,
      energija: izracunajMaxEnergiju(0),
      winStreak: 0,
      luckySpinCounter: LUCKY_SPIN_INTERVAL,
      poruka: `KRUNIDBA! NOVI MNOŽITELJ ×${(1 + noviPrestige * 0.5).toFixed(1)}`,
    });
    get().provjeriDostignuca(undefined, undefined, undefined, noviPrestige);
    get().osvjeziProtok();
  },

  kupiAlat: (alat) => {
    const s = get();
    const mult = Math.pow(1.6, s.razine[alat.id] || 0);
    const zl = Math.floor(alat.cZlato * mult);
    const ka = Math.floor(alat.cKamen * mult);
    const ze = Math.floor(alat.cZeljezo * mult);
    if (s.zlato < zl || s.resursi.kamen < ka || s.resursi.zeljezo < ze) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    const maxStitova = izracunajMaxStitova(s.razine.oklop || 0);
    playSfx("collect");
    set((state) => ({
      zlato: state.zlato - zl,
      resursi: {
        ...state.resursi,
        kamen: state.resursi.kamen - ka,
        zeljezo: state.resursi.zeljezo - ze,
      },
      razine: { ...state.razine, [alat.id]: (state.razine[alat.id] || 0) + 1 },
      ...(alat.id === "oklop" ? { stitovi: maxStitova + 1 } : {}),
      poruka: "OPREMA POBOLJŠANA",
    }));
    get().azurirajMisiju("oprema");
    get().azurirajKlanZadatak("oprema");
    get().osvjeziProtok(alat.id === "oklop" ? ["oklop>selo"] : undefined);
  },

  trgovina: (akcija, resurs, iznos) => {
    const s = get();
    const cijenaPoKomadu = s.tecaj[resurs][akcija];
    const ukupnaCijena = cijenaPoKomadu * iznos;

    if (akcija === "kupi") {
      if (s.zlato < ukupnaCijena) {
        set({ poruka: "NEDOVOLJNO ZLATA" });
        return false;
      }
      playSfx("collect");
      set((state) => {
        if (resurs === "dijamant") {
          return {
            zlato: state.zlato - ukupnaCijena,
            dijamanti: state.dijamanti + iznos,
            poruka: `KUPLJENO ${iznos} DIJAMANT`,
          };
        }
        return {
          zlato: state.zlato - ukupnaCijena,
          resursi: {
            ...state.resursi,
            [resurs]: state.resursi[resurs] + iznos,
          },
          poruka: `KUPLJENO ${iznos} ${resurs.toUpperCase()}`,
        };
      });
      return true;
    }
    const trenutnaKolicina = resurs === "dijamant" ? s.dijamanti : s.resursi[resurs];
    if (trenutnaKolicina < iznos) {
      set({ poruka: "NEDOVOLJNO RESURSA" });
      return false;
    }
    playSfx("collect");
    set((state) => {
      if (resurs === "dijamant") {
        return {
          zlato: state.zlato + ukupnaCijena,
          dijamanti: state.dijamanti - iznos,
          poruka: `PRODANO ZA ${ukupnaCijena} ZLATA`,
        };
      }
      return {
        zlato: state.zlato + ukupnaCijena,
        resursi: {
          ...state.resursi,
          [resurs]: state.resursi[resurs] - iznos,
        },
        poruka: `PRODANO ZA ${ukupnaCijena} ZLATA`,
      };
    });
    get().azurirajMisiju("zlato", ukupnaCijena);
    return true;
  },

  kupiSkin: (skin) => {
    const s = get();
    if (s.aktivniSkin === skin.id) return;
    if (skin.cijenaDijamanti > 0 && s.dijamanti < skin.cijenaDijamanti) {
      set({ poruka: "NEDOVOLJNO DIJAMANATA" });
      return;
    }
    playSfx("collect");
    set({
      dijamanti: skin.cijenaDijamanti > 0 ? s.dijamanti - skin.cijenaDijamanti : s.dijamanti,
      aktivniSkin: skin.id,
      poruka: `SKIN "${skin.naziv.toUpperCase()}" AKTIVIRAN`,
    });
  },

  osnujiKlan: (naziv) => {
    const trimmed = naziv.trim();
    if (trimmed.length < 2) return;
    set({
      klan: {
        naziv: trimmed,
        razina: 1,
        xp: 0,
        zadaci: generirajKlanZadatke(),
        zadnjiRefresh: new Date().toISOString(),
      },
      poruka: `KLAN "${trimmed.toUpperCase()}" OSNOVAN!`,
    });
  },

  doniraiUKlan: (iznosZlato) => {
    const s = get();
    if (!s.klan.naziv) return;
    if (s.zlato < iznosZlato) {
      set({ poruka: "NEDOVOLJNO ZLATA ZA DONACIJU" });
      return;
    }
    const xpGain = Math.floor(iznosZlato / 10);
    const noviXp = s.klan.xp + xpGain;
    const xpZaRazinu = s.klan.razina * 1000;
    const novaRazina = noviXp >= xpZaRazinu ? s.klan.razina + 1 : s.klan.razina;
    const noviZadaci = s.klan.zadaci
      .map((z) =>
        z.tip === "donacija" && !z.zavrseno
          ? { ...z, trenutno: Math.min(z.cilj, z.trenutno + iznosZlato) }
          : z,
      )
      .map((z) => (!z.zavrseno && z.trenutno >= z.cilj ? { ...z, zavrseno: true } : z));
    playSfx("collect");
    set((state) => ({
      zlato: state.zlato - iznosZlato,
      klan: {
        ...state.klan,
        xp: noviXp >= xpZaRazinu ? 0 : noviXp,
        razina: novaRazina,
        zadaci: noviZadaci,
      },
      poruka: `DONIRANO ${iznosZlato} ZLATA KLANU (+${xpGain} XP)`,
    }));
    get().azurirajMisiju("donacija", iznosZlato);
  },

  azurirajKlanZadatak: (tip, kolicina = 1) => {
    const s = get();
    if (!s.klan.naziv) return;
    const noviZadaci = s.klan.zadaci.map((z) => {
      if (z.tip === tip && !z.zavrseno) {
        const novoTrenutno = Math.min(z.cilj, z.trenutno + kolicina);
        return { ...z, trenutno: novoTrenutno, zavrseno: novoTrenutno >= z.cilj };
      }
      return z;
    });
    set((state) => ({ klan: { ...state.klan, zadaci: noviZadaci } }));
  },

  preuzmiKlanNagradu: (zadatakId) => {
    const s = get();
    const zadatak = s.klan.zadaci.find((z) => z.id === zadatakId);
    if (!zadatak || !zadatak.zavrseno || zadatak.preuzeto) return;
    const { dijamanti = 0, zlato = 0, energija = 0, drvo = 0, kamen = 0, zeljezo = 0 } =
      zadatak.nagrada;
    const noviZadaci = s.klan.zadaci.map((z) =>
      z.id === zadatakId ? { ...z, preuzeto: true } : z,
    );
    const xpGain = 200;
    const noviXp = s.klan.xp + xpGain;
    const xpZaRazinu = s.klan.razina * 1000;
    const novaRazina = noviXp >= xpZaRazinu ? s.klan.razina + 1 : s.klan.razina;
    playSfx("collect");
    set((state) => ({
      dijamanti: state.dijamanti + dijamanti,
      zlato: state.zlato + zlato,
      energija: state.energija + energija,
      resursi: {
        drvo: state.resursi.drvo + drvo,
        kamen: state.resursi.kamen + kamen,
        zeljezo: state.resursi.zeljezo + zeljezo,
      },
      klan: {
        ...state.klan,
        xp: noviXp >= xpZaRazinu ? 0 : noviXp,
        razina: novaRazina,
        zadaci: noviZadaci,
      },
      poruka: "KLANSKI ZADATAK PREUZET!",
    }));
  },

  refreshKlanZadatke: () => {
    const s = get();
    if (!s.klan.naziv) return;
    const zadnjiRefresh = s.klan.zadnjiRefresh ? new Date(s.klan.zadnjiRefresh) : null;
    const tjedno = 7 * 24 * 60 * 60 * 1000;
    if (zadnjiRefresh && Date.now() - zadnjiRefresh.getTime() < tjedno) return;
    set((state) => ({
      klan: {
        ...state.klan,
        zadaci: generirajKlanZadatke(),
        zadnjiRefresh: new Date().toISOString(),
      },
    }));
  },

  postaviUid: (uid) => set({ uid }),
  postaviIme: (imeIgraca) => set({ imeIgraca }),

  primiResurse: (ukradeno) => {
    set((state) => ({
      zlato: state.zlato + Math.max(0, Math.floor(ukradeno.zlato ?? 0)),
      resursi: {
        drvo: state.resursi.drvo + (ukradeno.drvo ?? 0),
        kamen: state.resursi.kamen + (ukradeno.kamen ?? 0),
        zeljezo: state.resursi.zeljezo + (ukradeno.zeljezo ?? 0),
      },
      poruka: `PLJAČKA: +${Math.floor(ukradeno.zlato ?? 0)} zlata · +${Math.floor(ukradeno.drvo ?? 0)} drvo · +${Math.floor(ukradeno.kamen ?? 0)} kamen · +${Math.floor(ukradeno.zeljezo ?? 0)} željezo`,
    }));
    get().osvjeziProtok(
      [
        ukradeno.drvo ? "z:pilana>selo" : "",
        ukradeno.kamen ? "z:kamenolom>selo" : "",
        ukradeno.zeljezo ? "z:rudnik>selo" : "",
      ].filter(Boolean),
    );
  },

  zapisiDebrief: (zapis) => {
    set((state) => ({
      stavSela: zapis.stav,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: zapis.metaIme,
          pobjeda: zapis.pobjeda,
          stav: zapis.stav,
          recap: zapis.recap,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    get().osvjeziProtok([`m:${zapis.metaIme}>selo`, "stav>selo"]);
  },

  osvjeziProtok: (pulsIds) => {
    const s = get();
    const kv = kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s)));
    set({
      kvalitetaSela: kv,
      protokPuls:
        pulsIds && pulsIds.length > 0 ? { ids: pulsIds, t: Date.now() } : s.protokPuls,
    });
  },

  testAlat: (sto) => {
    const s = get();
    playSfx("collect");
    if (sto === "zlato") {
      set({ zlato: s.zlato + 5000, poruka: "TEST +5000 ZLATA" });
      return;
    }
    if (sto === "energija") {
      const max = izracunajMaxEnergiju(s.razine.baterija || 0);
      set({ energija: max, poruka: "TEST ENERGIJA PUNA" });
      return;
    }
    if (sto === "dijamanti") {
      set({ dijamanti: s.dijamanti + 50, poruka: "TEST +50 DIJAMANT" });
      return;
    }
    if (sto === "resursi") {
      set({
        resursi: {
          drvo: s.resursi.drvo + 200,
          kamen: s.resursi.kamen + 200,
          zeljezo: s.resursi.zeljezo + 100,
        },
        poruka: "TEST +RESURSI",
      });
      return;
    }
    if (sto === "stitovi") {
      const max = izracunajMaxStitova(s.razine.oklop || 0);
      set({ stitovi: max, poruka: "TEST ŠTITOVI PUNI" });
      return;
    }
    set({
      ostecenja: { pilana: false, kamenolom: false, rudnik: false },
      poruka: "TEST ZGRADE POPRAVLJENE",
    });
  },

  autoTest: () => {
    const prije = get();
    get().testAlat("zlato");
    get().testAlat("energija");
    get().testAlat("dijamanti");
    get().testAlat("resursi");
    get().testAlat("stitovi");
    get().testAlat("popravi");
    const poslije = get();
    const maxE = izracunajMaxEnergiju(poslije.razine.baterija || 0);
    const maxS = izracunajMaxStitova(poslije.razine.oklop || 0);
    const checks = [
      poslije.zlato >= prije.zlato + 5000,
      poslije.energija === maxE,
      poslije.dijamanti >= prije.dijamanti + 50,
      poslije.resursi.drvo >= prije.resursi.drvo + 200,
      poslije.resursi.kamen >= prije.resursi.kamen + 200,
      poslije.resursi.zeljezo >= prije.resursi.zeljezo + 100,
      poslije.stitovi === maxS,
      !poslije.ostecenja.pilana && !poslije.ostecenja.kamenolom && !poslije.ostecenja.rudnik,
    ];
    const ok = checks.filter(Boolean).length;
    set({ poruka: ok === checks.length ? `AUTO-TEST ${ok}/${checks.length} OK` : `AUTO-TEST ${ok}/${checks.length}` });
    return { ok, ukupno: checks.length };
  },
}));

let persistBound = false;

export function startLocalPersist() {
  if (persistBound || typeof window === "undefined") return;
  persistBound = true;
  let saveT: number | null = null;
  let achT: number | null = null;
  useGameStore.subscribe((s, prev) => {
    if (s.ucitavam) return;
    if (
      s.zlato === prev.zlato &&
      s.energija === prev.energija &&
      s.dijamanti === prev.dijamanti &&
      s.resursi === prev.resursi &&
      s.gradevine === prev.gradevine &&
      s.ostecenja === prev.ostecenja &&
      s.razine === prev.razine &&
      s.stitovi === prev.stitovi &&
      s.xp === prev.xp &&
      s.igracRazina === prev.igracRazina &&
      s.aktivniSkin === prev.aktivniSkin &&
      s.klan === prev.klan &&
      s.misije === prev.misije &&
      s.imeIgraca === prev.imeIgraca &&
      s.ukupnoVrtnji === prev.ukupnoVrtnji &&
      s.tecaj === prev.tecaj &&
      s.trend === prev.trend &&
      s.luckySpinCounter === prev.luckySpinCounter &&
      s.prestigeRazina === prev.prestigeRazina &&
      s.dnevniStreak === prev.dnevniStreak
    ) {
      return;
    }
    if (saveT) window.clearTimeout(saveT);
    saveT = window.setTimeout(() => {
      useGameStore.getState().spremi();
    }, 500);
    if (
      s.dostignucaDone !== prev.dostignucaDone ||
      s.ukupnoVrtnji !== prev.ukupnoVrtnji ||
      s.ukupnoZlata !== prev.ukupnoZlata
    ) {
      if (achT) window.clearTimeout(achT);
      achT = window.setTimeout(() => {
        useGameStore.getState().spremiDostignuca();
      }, 400);
    }
  });
  const flush = () => {
    if (useGameStore.getState().ucitavam) return;
    useGameStore.getState().spremi();
    useGameStore.getState().spremiDostignuca();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}
