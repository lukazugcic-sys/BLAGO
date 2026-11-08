import type { GameState } from "./gameStore";
import type { StoreApi } from "zustand";
import {
  BAZA_TECAJ,
  ZGRADE,
  LUCKY_SPIN_INTERVAL,
  generirajMisiju,
  generirajKlanZadatke,
  seloNaMaxu,
} from "@/lib/game/constants";
import { DOSTIGNUCA, napredakDostignuca, snapshotDostignuca } from "@/lib/game/dostignuca";
import { nizAkoVrijedi } from "@/lib/game/tuning";
import {
  izracunajMaxEnergiju,
  dodajEnergiju,
  popravakCijena,
  cijenaZgrade,
  cijenaUzKrunu,
  skalaCijene,
  izracunajMaxStitova,
  izracunajPasivniMnozitelj,
  izracunajPotrebniXp,
  izracunajPrestigeMnozitelj,
  izracunajTokMnozitelj,
  izracunajEnergijaRegenMs,
  izracunajSelidbu,
  izracunajSalunZlato,
  raspolozenjeKaube,
  zgradaUvjet,
  bankaKap,
  bankaKamata,
  PRAZNE_GRADEVINE,
  PRAZNA_OSTECENJA,
  RESOURCE_TICK_MS,
  MAX_OFFLINE_MS,
  konjaKap,
  govedaKap,
  normalizirajDuznost,
  normalizirajGovedo,
  praznaDuznost,
  praznaGovedoDuznost,
  KONJ_DUZNOSTI,
  GOVEDO_DUZNOSTI,
  type KonjDuznostId,
  type KaubaDuznost,
  type GovedoDuznost,
  type GovedoDuznostId,
} from "@/lib/game/economy";
import { useSlotStore } from "@/lib/stores/slotStore";
import { parsirajAiPosljednje } from "@/lib/game/aiDogadaj";
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";
import { vodicNaUcitavanju } from "@/lib/game/vodic";
import { oznaciUredjajBezSavea } from "@/lib/game/noviPocetak";
import { imeJePrazno } from "@/lib/game/ime";
import { playSfx, vibrate } from "@/lib/game/audio";
import {
  localDayKey,
  nagradaZaStreak,
  resolveDaily,
  cycleDay,
  recDodjiZoru,
  zoraDanKey,
  type DailySave,
} from "@/lib/game/daily";
import type { CloudPayload } from "@/lib/game/cloud";
import type {
  Alat,
  DebriefStav,
  Gradevine,
  Gradnja,
  Karavana,
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
  ResursId,
  Zgrada,
  KaravanaPutId,
  SimbolId,
} from "@/lib/game/types";
import { MAX_KRONIKA, parsirajKroniku } from "@/lib/game/kronika";
import {
  pocetniLjudi,
  parsirajLjude,
  uskladiLjude,
  recapDolazak,
  recapOdlazak,
  imaBuff,
  jacina,
  recNoviBuff,
  recNovaMana,
  majstor,
  serif,
  vozar,
  vrijemeGradnjeMs,
  dodajXpLiku,
  razgovor,
  mozeDati,
  gdjeJe,
  zgradaAkuzativ,
  zgradaPopravakRec,
  slobodanGraditelj,
  uskladiSegrte,
  napraviSegrta,
  uskladiZamjenike,
  napraviZamjenika,
  tkoJaše,
  doktor,
  mozeKrupije,
  kaubaOd,
  SEGRT_SKOLA,
  recPremjesti,
  type Stanovnik,
  type Segrt,
  type Zamjenik,
  type LikHub,
} from "@/lib/game/ljudi";
import { baciPotjernicu, imaSet, SETOVI } from "@/lib/game/potjernice";
import {
  napraviDogadaj,
  izaberiDogadajTip,
  smijeNoviDogadaj,
  rijesiIshod,
  type KaubaDogadaj,
} from "@/lib/game/dogadaji";
import { sajamCijena, tjedanKljuc, tjedanSad } from "@/lib/game/tjedan";
import { napraviJutarnji, parsirajJutro, jutroGotovo, jutroSveUzeto, type JutarnjiPosao, type JutarnjiId } from "@/lib/game/jutro";
import { alatCijena, alatLv, ALAT_MAX, parsirajKrunjenja, type AlatId, START, LEVEL_UP_GEMS, SHIELD_ROLL_P, TRGOVINA_CIJENA, TRGOVINA_BAZA, BUNAR_ENERGIJA, MLIN_ENERGIJA, KONJ_CIJENA_ZLATO, KONJ_CIJENA_DRVO, SIJENO_ZLATO, SIJENO_MS, GOVEDO_CIJENA_ZLATO, GOVEDO_CIJENA_DRVO, GOVEDO_TJERAJ, GOVEDO_KLANJE, GOVEDO_KLANJE_MESNICA, KISA_ZLATO, KISA_MS, TRAVA_MS } from "@/lib/game/tuning";
import { susjedPoUid, vrijemeKaravanaMs, karavanaIsplata, izaberiKaravanaCin } from "@/lib/game/susjedi";
import { izgradiMrezu, kvSelaIzMreze, type MrezaUlaz } from "@/lib/game/mreza";
import { jeExpandZnak, KNJIGA_SKUP_CILJ } from "@/lib/game/knjiga";
import {
  tickClock,
  nowMs,
  PRAZNI_KLAN,
  mrezaUlaz,
  spojSkinove,
  parsirajGradnje,
  parsirajSegrte,
  parsirajZamjenike,
  parsirajDogadaj,
  parsirajKaravanu,
  capRazine,
  num,
  neneg,
  resursiNeneg,
  energijaIzSave,
  parsirajDobitak,
  parsirajSimbole,
  parsirajKonje,
  parsirajDuznost,
  parsirajGoveda,
  parsirajGovedoDuznost,
  type GameBlob,
  type Tecaj,
  type Trend,
} from "./gameParse";

type SetGame = StoreApi<GameState>["setState"];
type GetGame = StoreApi<GameState>["getState"];

export function sliceSpremnik(set: SetGame, get: GetGame): Pick<GameState, "ucitaj" | "spremi" | "spremiDostignuca" | "primijeniCloudSave"> {
  return {
  ucitaj: () => {
    const imaIgru = !!loadJSON(SAVE_KEYS.game);
    oznaciUredjajBezSavea(imaIgru);
    vodicNaUcitavanju(imaIgru);
    try {
      const d = loadJSON<GameBlob>(SAVE_KEYS.game);
      if (d) {
        const ticksNow = nowMs();
        set({
          igracRazina: Math.max(1, Math.floor(neneg(d.igracRazina, get().igracRazina))),
          prestigeRazina: Math.floor(neneg(d.prestigeRazina, get().prestigeRazina)),
          krunjenja: parsirajKrunjenja(d.krunjenja, num(d.prestigeRazina, 0)),
          xp: neneg(d.xp, get().xp),
          energija: energijaIzSave(d.energija, num(d.razine?.baterija, get().razine.baterija || 0), get().energija),
          zlato: neneg(d.zlato, get().zlato),
          dijamanti: neneg(d.dijamanti, get().dijamanti),
          resursi: resursiNeneg(d.resursi, get().resursi),
          gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
          ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
          stanovnici: num(d.stanovnici, get().stanovnici),
          ljudi: parsirajLjude(d.ljudi, num(d.stanovnici, get().stanovnici)),
          segrti: uskladiSegrte(parsirajSegrte(d.segrti), num(d.igracRazina, get().igracRazina)),
          zamjenici: uskladiZamjenike(
            parsirajZamjenike(d.zamjenici),
            num(d.igracRazina, get().igracRazina),
            num(d.gradevine?.ured, get().gradevine.ured || 0),
          ),
          dogadaj: parsirajDogadaj(d.dogadaj),
          zadnjiDogadaj: num(d.zadnjiDogadaj, 0),
          bankaZlato: Math.max(0, num(d.bankaZlato, 0)),
          faroKrupije: typeof d.faroKrupije === "string" ? d.faroKrupije : null,
          konjiBroj: parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
          konjiDuznost: parsirajDuznost(d.konjiDuznost, parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
          sijenoDo: num(d.sijenoDo, 0),
          potkove: Math.max(0, Math.floor(num(d.potkove, 0))),
          potkoveDo: num(d.potkoveDo, 0),
          kisaDo: num(d.kisaDo, 0),
          travaDo: num(d.travaDo, 0),
          govedaBroj: parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
          govedaDuznost: parsirajGovedoDuznost(d.govedaDuznost, parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
          knjigaSkup: Math.max(0, Math.min(KNJIGA_SKUP_CILJ - 1, Math.floor(num(d.knjigaSkup, 0)))),
          besplatneVrtnje: Math.max(0, Math.floor(num(d.besplatneVrtnje, 0))),
          besplatneExpand: jeExpandZnak(d.besplatneExpand) ? d.besplatneExpand : null,
          besplatneUlog: Math.max(1, Math.floor(num(d.besplatneUlog, 1))),
          serifCin: Math.max(0, Math.floor(num(d.serifCin, 0))),
          celijaBroj: Math.max(0, Math.min(3, Math.floor(num(d.celijaBroj, 0)))),
          metci: Math.max(0, Math.floor(num(d.metci, 6))),
          metakRed: Math.max(0, Math.min(23, Math.floor(num(d.metakRed, 0)))),
          metakBuffNa: Math.max(-1, Math.min(23, Math.floor(num(d.metakBuffNa, -1)))),
          metakVreca: Array.isArray(d.metakVreca) ? d.metakVreca.filter((x): x is GameState["metakVreca"][number] => x === "zlato" || x === "energija" || x === "stit" || x === "sreca" || x === "drvo" || x === "zeljezo") : [],
          gradnje: parsirajGradnje(d.gradnje, d.gradnja),
          karavana: parsirajKaravanu(d.karavana),
          potjernice: d.potjernice && typeof d.potjernice === "object" ? d.potjernice : get().potjernice,
          potjerniceSetovi: Array.isArray(d.potjerniceSetovi) ? d.potjerniceSetovi : get().potjerniceSetovi,
          tjedanKljuc: typeof d.tjedanKljuc === "string" ? d.tjedanKljuc : "",
          tjedanCeker: !!d.tjedanCeker,
          tjedanPohod: !!d.tjedanPohod,
          jutroDan: typeof d.jutroDan === "string" ? d.jutroDan : "",
          jutro: parsirajJutro(d.jutro, typeof d.jutroDan === "string" ? d.jutroDan : ""),
          razine: capRazine({ ...get().razine, ...(d.razine ?? {}) }),
          stitovi: neneg(d.stitovi, get().stitovi),
          misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
          zadnjiNalozi: Array.isArray(d.zadnjiNalozi) ? d.zadnjiNalozi.filter((x): x is string => typeof x === "string").slice(0, 8) : get().zadnjiNalozi,
          tecaj: { ...BAZA_TECAJ, ...(d.tecaj ?? {}) },
          trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...(d.trend as Partial<Trend> | undefined) },
          luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
          winStreak: nizAkoVrijedi(num(d.winStreak, 0), num(d.winStreakDo, 0)),
          winStreakDo: nizAkoVrijedi(num(d.winStreak, 0), num(d.winStreakDo, 0)) > 0 ? num(d.winStreakDo, 0) : 0,
          aktivniSkin: d.aktivniSkin || get().aktivniSkin,
          skinovi: spojSkinove(d.aktivniSkin || get().aktivniSkin, d.skinovi),
          klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
          imeIgraca: imeJePrazno(d.imeIgraca) ? get().imeIgraca : d.imeIgraca,
          zadnjiResursTick: num(d.zadnjiResursTick, ticksNow),
          zadnjaEnergijaTick: num(d.zadnjaEnergijaTick, ticksNow),
          zadnjiMetakTick: num(d.zadnjiMetakTick, ticksNow),
          kronika: parsirajKroniku(d.kronika),
          stavSela: d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
            ? d.stavSela
            : null,
          aiDogadaji: d.aiDogadaji !== false,
          aiPosljednji: parsirajAiPosljednje(d.aiPosljednji),
        });
        const slotSimboli = parsirajSimbole(d.slotSimboli);
        const ceka = parsirajDobitak(d.dobitakNaCekanju);
        if (slotSimboli || ceka || typeof d.gambleCount === "number") {
          useSlotStore.setState({
            ...(slotSimboli ? { simboli: slotSimboli } : {}),
            dobitakNaCekanju: ceka,
            gambleCount: ceka ? Math.max(0, Math.min(3, Math.floor(neneg(d.gambleCount, 0)))) : 0,
          });
        }
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
      set({
        dnevniStreak: Math.max(0, Math.floor(pd?.streak || 0)),
        preuzetoDanas: true,
        dnevnaPotvrda: false,
        dnevniDan: "",
        prikazDnevneNagrade: false,
        dnevnaNagrada: null,
      });
    } catch (e) {
      console.error("Failed to load game state:", e);
    } finally {
      const n = nowMs();
      const s = get();
      const imaSave = !!loadJSON(SAVE_KEYS.game);
      if (imaSave) {
        tickClock.r = s.zadnjiResursTick || n;
        tickClock.e = s.zadnjaEnergijaTick || n;
      } else {
        tickClock.r = n;
        tickClock.e = n;
        set({ zadnjiResursTick: n, zadnjaEnergijaTick: n });
      }
      set({ ucitavam: false });
      get().osvjeziProtok();
      get().osvjeziTjedan();
      get().osvjeziJutro();
      get().osvjeziDnevnu();
    }
  },

  spremi: () => {
    const s = get();
    const payload: GameBlob = {
      igracRazina: s.igracRazina,
      prestigeRazina: s.prestigeRazina,
      krunjenja: s.krunjenja,
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
      zadnjiNalozi: s.zadnjiNalozi,
      tecaj: s.tecaj,
      trend: s.trend,
      luckySpinCounter: s.luckySpinCounter,
      winStreak: s.winStreak,
      winStreakDo: s.winStreakDo,
      aktivniSkin: s.aktivniSkin,
      skinovi: s.skinovi,
      klan: s.klan,
      imeIgraca: s.imeIgraca,
      zadnjiResursTick: s.zadnjiResursTick,
      zadnjaEnergijaTick: s.zadnjaEnergijaTick,
      zadnjiMetakTick: s.zadnjiMetakTick,
      kronika: s.kronika,
      stavSela: s.stavSela,
      stanovnici: s.stanovnici,
      ljudi: s.ljudi,
      segrti: s.segrti,
      gradnje: s.gradnje,
      karavana: s.karavana,
      potjernice: s.potjernice,
      potjerniceSetovi: s.potjerniceSetovi,
      tjedanKljuc: s.tjedanKljuc,
      tjedanCeker: s.tjedanCeker,
      tjedanPohod: s.tjedanPohod,
      jutroDan: s.jutroDan,
      jutro: s.jutro,
      zamjenici: s.zamjenici,
      dogadaj: s.dogadaj,
      zadnjiDogadaj: s.zadnjiDogadaj,
      bankaZlato: s.bankaZlato,
      faroKrupije: s.faroKrupije,
      konjiBroj: s.konjiBroj,
      konjiDuznost: s.konjiDuznost,
      sijenoDo: s.sijenoDo,
      potkove: s.potkove,
      potkoveDo: s.potkoveDo,
      kisaDo: s.kisaDo,
      travaDo: s.travaDo,
      govedaBroj: s.govedaBroj,
      govedaDuznost: s.govedaDuznost,
      knjigaSkup: s.knjigaSkup,
      besplatneVrtnje: s.besplatneVrtnje,
      besplatneExpand: s.besplatneExpand,
      besplatneUlog: s.besplatneUlog,
      serifCin: s.serifCin,
      celijaBroj: s.celijaBroj,
      metci: s.metci,
      metakRed: s.metakRed,
      metakBuffNa: s.metakBuffNa,
      metakVreca: s.metakVreca,
      aiDogadaji: s.aiDogadaji !== false,
      aiPosljednji: s.aiPosljednji,
      savedAt: Date.now(),
      dobitakNaCekanju: useSlotStore.getState().dobitakNaCekanju,
      gambleCount: useSlotStore.getState().gambleCount,
      slotSimboli: useSlotStore.getState().simboli,
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
      imeIgraca: imeJePrazno(d.imeIgraca) ? get().imeIgraca : d.imeIgraca,
      igracRazina: Math.max(1, Math.floor(neneg(d.igracRazina, get().igracRazina))),
      prestigeRazina: Math.floor(neneg(d.prestigeRazina, get().prestigeRazina)),
      krunjenja: parsirajKrunjenja(d.krunjenja, num(d.prestigeRazina, get().prestigeRazina)),
      xp: neneg(d.xp, get().xp),
      energija: energijaIzSave(d.energija, num(d.razine?.baterija, get().razine.baterija || 0), get().energija),
      zlato: neneg(d.zlato, get().zlato),
      dijamanti: neneg(d.dijamanti, get().dijamanti),
      resursi: resursiNeneg(d.resursi, get().resursi),
      stitovi: neneg(d.stitovi, get().stitovi),
      gradevine: { ...get().gradevine, ...(d.gradevine ?? {}) },
      ostecenja: { ...get().ostecenja, ...(d.ostecenja ?? {}) },
      razine: capRazine({ ...get().razine, ...(d.razine ?? {}) }),
      misije: d.misije && d.misije.length > 0 ? d.misije : get().misije,
      zadnjiNalozi: Array.isArray(d.zadnjiNalozi) ? d.zadnjiNalozi.filter((x): x is string => typeof x === "string").slice(0, 8) : get().zadnjiNalozi,
      tecaj: { ...BAZA_TECAJ, ...((d.tecaj as Tecaj | undefined) ?? {}) },
      trend: { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...((d.trend as Partial<Trend> | undefined) ?? {}) },
      luckySpinCounter: num(d.luckySpinCounter, get().luckySpinCounter),
      winStreak: nizAkoVrijedi(num(d.winStreak, 0), num((d as { winStreakDo?: number }).winStreakDo, 0)),
      winStreakDo: nizAkoVrijedi(num(d.winStreak, 0), num((d as { winStreakDo?: number }).winStreakDo, 0)) > 0 ? num((d as { winStreakDo?: number }).winStreakDo, 0) : 0,
      aktivniSkin: d.aktivniSkin || get().aktivniSkin,
      skinovi: spojSkinove(d.aktivniSkin || get().aktivniSkin, d.skinovi),
      klan: d.klan ? { ...PRAZNI_KLAN, ...d.klan } : get().klan,
      ukupnoVrtnji: num(d.ukupnoVrtnji, get().ukupnoVrtnji),
      ukupnoZlata: num(d.ukupnoZlata, get().ukupnoZlata),
      dostignucaDone: d.dostignucaDone ?? get().dostignucaDone,
      stanovnici: num(d.stanovnici, get().stanovnici),
      ljudi: parsirajLjude((d as { ljudi?: unknown }).ljudi, num(d.stanovnici, get().stanovnici)),
      segrti: uskladiSegrte(parsirajSegrte((d as { segrti?: unknown }).segrti), num(d.igracRazina, get().igracRazina)),
      zamjenici: uskladiZamjenike(
        parsirajZamjenike((d as { zamjenici?: unknown }).zamjenici),
        num(d.igracRazina, get().igracRazina),
        num((d.gradevine as { ured?: number } | undefined)?.ured, get().gradevine.ured || 0),
      ),
      gradnje: parsirajGradnje((d as { gradnje?: unknown }).gradnje, (d as { gradnja?: unknown }).gradnja),
      karavana: "karavana" in d ? parsirajKaravanu((d as { karavana?: unknown }).karavana) : get().karavana,
      potjernice: (d as { potjernice?: Record<string, number> }).potjernice ?? get().potjernice,
      potjerniceSetovi: (d as { potjerniceSetovi?: string[] }).potjerniceSetovi ?? get().potjerniceSetovi,
      tjedanKljuc: typeof (d as { tjedanKljuc?: unknown }).tjedanKljuc === "string" ? (d as { tjedanKljuc: string }).tjedanKljuc : get().tjedanKljuc,
      tjedanCeker: typeof (d as { tjedanCeker?: unknown }).tjedanCeker === "boolean" ? (d as { tjedanCeker: boolean }).tjedanCeker : get().tjedanCeker,
      tjedanPohod: typeof (d as { tjedanPohod?: unknown }).tjedanPohod === "boolean" ? (d as { tjedanPohod: boolean }).tjedanPohod : get().tjedanPohod,
      dogadaj: parsirajDogadaj((d as { dogadaj?: unknown }).dogadaj),
      zadnjiDogadaj: num((d as { zadnjiDogadaj?: unknown }).zadnjiDogadaj, get().zadnjiDogadaj),
      bankaZlato: Math.max(0, num((d as { bankaZlato?: unknown }).bankaZlato, get().bankaZlato)),
      faroKrupije: typeof (d as { faroKrupije?: unknown }).faroKrupije === "string" ? (d as { faroKrupije: string }).faroKrupije : get().faroKrupije,
      konjiBroj: parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
      konjiDuznost: parsirajDuznost((d as { konjiDuznost?: unknown }).konjiDuznost, parsirajKonje(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
      sijenoDo: num((d as { sijenoDo?: unknown }).sijenoDo, get().sijenoDo),
      potkove: Math.max(0, Math.floor(num((d as { potkove?: unknown }).potkove, get().potkove))),
      potkoveDo: num((d as { potkoveDo?: unknown }).potkoveDo, get().potkoveDo),
      kisaDo: num((d as { kisaDo?: unknown }).kisaDo, get().kisaDo),
      travaDo: num((d as { travaDo?: unknown }).travaDo, get().travaDo),
      govedaBroj: parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) }),
      govedaDuznost: parsirajGovedoDuznost((d as { govedaDuznost?: unknown }).govedaDuznost, parsirajGoveda(d, { ...get().gradevine, ...(d.gradevine ?? {}) })),
      knjigaSkup: Math.max(0, Math.min(KNJIGA_SKUP_CILJ - 1, Math.floor(num((d as { knjigaSkup?: unknown }).knjigaSkup, get().knjigaSkup)))),
      besplatneVrtnje: Math.max(0, Math.floor(num((d as { besplatneVrtnje?: unknown }).besplatneVrtnje, get().besplatneVrtnje))),
      besplatneExpand: jeExpandZnak((d as { besplatneExpand?: unknown }).besplatneExpand) ? (d as { besplatneExpand: SimbolId }).besplatneExpand : get().besplatneExpand,
      besplatneUlog: Math.max(1, Math.floor(num((d as { besplatneUlog?: unknown }).besplatneUlog, get().besplatneUlog))),
      serifCin: Math.max(0, Math.floor(num((d as { serifCin?: unknown }).serifCin, get().serifCin))),
      celijaBroj: Math.max(0, Math.min(3, Math.floor(num((d as { celijaBroj?: unknown }).celijaBroj, get().celijaBroj)))),
      metci: Math.max(0, Math.floor(num((d as { metci?: unknown }).metci, get().metci))),
      metakRed: Math.max(0, Math.min(23, Math.floor(num((d as { metakRed?: unknown }).metakRed, get().metakRed)))),
      metakBuffNa: Math.max(-1, Math.min(23, Math.floor(num((d as { metakBuffNa?: unknown }).metakBuffNa, get().metakBuffNa)))),
      metakVreca: Array.isArray((d as unknown as { metakVreca?: unknown }).metakVreca)
        ? ((d as unknown as { metakVreca: unknown[] }).metakVreca.filter((x): x is GameState["metakVreca"][number] => x === "zlato" || x === "energija" || x === "stit" || x === "sreca" || x === "drvo" || x === "zeljezo"))
        : get().metakVreca,
      zadnjiResursTick: num((d as { zadnjiResursTick?: unknown }).zadnjiResursTick, get().zadnjiResursTick || ticksNow),
      zadnjaEnergijaTick: num((d as { zadnjaEnergijaTick?: unknown }).zadnjaEnergijaTick, get().zadnjaEnergijaTick || ticksNow),
      zadnjiMetakTick: num((d as { zadnjiMetakTick?: unknown }).zadnjiMetakTick, get().zadnjiMetakTick || ticksNow),
      jutroDan: typeof (d as { jutroDan?: unknown }).jutroDan === "string" ? (d as { jutroDan: string }).jutroDan : get().jutroDan,
      jutro: parsirajJutro((d as { jutro?: unknown }).jutro, typeof (d as { jutroDan?: unknown }).jutroDan === "string" ? (d as { jutroDan: string }).jutroDan : get().jutroDan),
      kronika: d.kronika ? parsirajKroniku(d.kronika) : get().kronika,
      stavSela:
        d.stavSela === "osvetnik" || d.stavSela === "strateg" || d.stavSela === "pljackas"
          ? d.stavSela
          : get().stavSela,
    });
    const slotSimboli = parsirajSimbole((d as { slotSimboli?: unknown }).slotSimboli);
    const ceka = parsirajDobitak((d as { dobitakNaCekanju?: unknown }).dobitakNaCekanju);
    if (slotSimboli || ceka) {
      const kocka = neneg((d as { gambleCount?: unknown }).gambleCount, 0);
      useSlotStore.setState({
        ...(slotSimboli ? { simboli: slotSimboli } : {}),
        dobitakNaCekanju: ceka,
        gambleCount: ceka ? Math.max(0, Math.min(3, Math.floor(kocka))) : 0,
      });
    }
    get().osvjeziProtok();
    get().osvjeziJutro();
    tickClock.r = get().zadnjiResursTick || nowMs();
    tickClock.e = get().zadnjaEnergijaTick || nowMs();
  },
  };
}
