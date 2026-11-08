import type { GameState } from "./gameStore";
import { dogadaj } from "@/lib/game/analitika";
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
  METAK_OBNOVA_MS,
  metciPoObnovi,
  potkovePoObnovi,
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
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";
import { playSfx, vibrate } from "@/lib/game/audio";
import { pustiLetNagrade } from "@/lib/game/let";
import {
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
  parsirajKonje,
  parsirajDuznost,
  parsirajGoveda,
  parsirajGovedoDuznost,
  type GameBlob,
  type Tecaj,
  type Trend,
} from "./gameParse";
import { ocistiStavku, zapamtiOdsutnost } from "@/lib/game/aiDogadaj";
import { najaviPovratak } from "@/lib/game/aiPrikaz";

type SetGame = StoreApi<GameState>["setState"];
type GetGame = StoreApi<GameState>["getState"];

const POVRATAK_MIN = 10 * 60 * 1000;
let povratakJednom = false;

function hvatanjePovratka(get: GetGame) {
  if (povratakJednom) return { dodaj(_t: string) {}, objavi(_ai: boolean) {} };
  povratakJednom = true;
  const s = get();
  const sad = nowMs();
  const last = s.zadnjiResursTick;
  const razmak = Number.isFinite(last) ? Math.max(0, sad - last) : 0;
  zapamtiOdsutnost(razmak);
  const stavke: string[] = [];
  const smije = razmak >= POVRATAK_MIN;
  const dodaj = (t: string) => {
    if (!smije || stavke.length >= 8) return;
    const red = ocistiStavku(t);
    if (red) stavke.push(red);
  };
  if (smije) {
    for (const g of s.gradnje) {
      if (g.kraj > sad) continue;
      const z = ZGRADE.find((x) => x.id === g.zgrada);
      dodaj(`${z?.naziv ?? "Zgrada"} gotova`);
    }
  }
  return {
    dodaj,
    objavi(ai: boolean) {
      if (!smije) return;
      const kopija = stavke.slice(0, 8);
      queueMicrotask(() => {
        void najaviPovratak(razmak, kopija, ai);
      });
    },
  };
}

export function sliceSat(set: SetGame, get: GetGame): Pick<GameState, "timerTick" | "timerMarket" | "provjeriLevelUp" | "dodajXp" | "primiNagradu" | "provjeriDostignuca" | "skloniZvijezdu" | "preuzmiDnevniBonus" | "otvoriDnevnuNagradu" | "sakrijDnevnuNagradu" | "azurirajMisiju" | "preuzmiNagraduMisije"> {
  return {
  timerTick: () => {
    if (get().ucitavam) return;
    const povr = hvatanjePovratka(get);
    try {
    {
      const s = get();
      const now = nowMs();
      const gain = metciPoObnovi(s.gradevine, s.ostecenja);
      const potkove = potkovePoObnovi(s.gradevine, s.ostecenja);
      let lastM = s.zadnjiMetakTick || now;
      if (!Number.isFinite(lastM) || now < lastM) {
        lastM = now;
        set({ zadnjiMetakTick: now });
      }
      if (now - lastM > MAX_OFFLINE_MS) lastM = now - MAX_OFFLINE_MS;
      if (gain < 1 && potkove < 1) {
        if (now - lastM > 5000) set({ zadnjiMetakTick: now });
      } else {
        const n = Math.floor((now - lastM) / METAK_OBNOVA_MS);
        if (n > 0) {
          set({
            metci: s.metci + n * gain,
            potkove: s.potkove + n * potkove,
            zadnjiMetakTick: lastM + n * METAK_OBNOVA_MS,
          });
          if (gain > 0) povr.dodaj(`metci ${n * gain}`);
        }
      }
    }
    get().osvjeziTjedan();
    get().osvjeziJutro();
    get().osvjeziDnevnu();
    if (get().gradnje.some((g) => nowMs() >= g.kraj)) get().zavrsiGradnju();
    if (get().karavana && nowMs() >= get().karavana!.kraj) get().zavrsiKaravanu();
    {
      const k = get().karavana;
      const r = nowMs();
      if (k && !k.cin && !k.cinRijesen && k.kraj > k.start && (r - k.start) / (k.kraj - k.start) >= 0.42) {
        set({ karavana: { ...k, cin: izaberiKaravanaCin() } });
      }
    }
    const s = get();
    const now = nowMs();
    let lastR = tickClock.r || s.zadnjiResursTick || now;
    let lastE = tickClock.e || s.zadnjaEnergijaTick || now;
    if (!Number.isFinite(lastR) || now < lastR) lastR = now;
    if (!Number.isFinite(lastE) || now < lastE) lastE = now;
    if (lastR !== (tickClock.r || s.zadnjiResursTick) || lastE !== (tickClock.e || s.zadnjaEnergijaTick)) {
      tickClock.r = lastR;
      tickClock.e = lastE;
      set({ zadnjiResursTick: lastR, zadnjaEnergijaTick: lastE });
    } else {
      tickClock.r = lastR;
      tickClock.e = lastE;
    }
    if (now - lastR > MAX_OFFLINE_MS) lastR = now - MAX_OFFLINE_MS;
    if (now - lastE > MAX_OFFLINE_MS) lastE = now - MAX_OFFLINE_MS;
    const regenMs = izracunajEnergijaRegenMs(s.razine.baterija || 0);
    const rRaw = Math.floor((now - lastR) / RESOURCE_TICK_MS);
    const eRaw = Math.floor((now - lastE) / regenMs);
    const rTicks = Number.isFinite(rRaw) ? Math.max(0, rRaw) : 0;
    const eTicks = Number.isFinite(eRaw) ? Math.max(0, eRaw) : 0;
    if (rTicks <= 0 && eTicks <= 0) {
      const k = get().karavana;
      const r = nowMs();
      if (k && !k.cin && !k.cinRijesen && k.kraj > k.start && (r - k.start) / Math.max(1, k.kraj - k.start) >= 0.42) {
        set({ karavana: { ...k, cin: izaberiKaravanaCin() } });
      }
      return;
    }

    if (rTicks <= 0) {
      const nextEnergy = dodajEnergiju(s.energija, eTicks, s.razine.baterija || 0, false);
      const nextEnergyTick = lastE + eTicks * regenMs;
      tickClock.e = nextEnergyTick;
      if (nextEnergy > s.energija) povr.dodaj(`energija ${Math.floor(nextEnergy - s.energija)}`);
      set({ energija: nextEnergy, zadnjaEnergijaTick: nextEnergyTick });
      return;
    }

    const maxStitova = izracunajMaxStitova(s.razine.oklop || 0);
    const pasivniMnozitelj =
      izracunajPasivniMnozitelj(s.igracRazina, s.prestigeRazina) *
      izracunajTokMnozitelj(kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s))));
    const zamjenici = uskladiZamjenike(s.zamjenici, s.igracRazina, s.gradevine.ured || 0);
    const kauba = kaubaOd({ ...s, zamjenici });
    const radE = kauba.rad * kauba.efikasnost * (1 + jacina(s.ljudi, "rad") * 0.06) * kauba.radKonja;
    const drvoGain =
      rTicks > 0 && !s.ostecenja.pilana
        ? (s.gradevine.pilana || 0) * ZGRADE[0]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const kamenGain =
      rTicks > 0 && !s.ostecenja.kamenolom
        ? (s.gradevine.kamenolom || 0) * ZGRADE[1]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const zeljezoGain =
      rTicks > 0 && !s.ostecenja.rudnik
        ? (s.gradevine.rudnik || 0) * ZGRADE[2]!.bazaProizvodnja * pasivniMnozitelj * radE * rTicks
        : 0;
    const zlatoGain =
      rTicks > 0 && !s.ostecenja.salun
        ? izracunajSalunZlato(s.gradevine, kauba.ljudi) *
          (1 + kauba.duznost.rodeo * 0.07) *
          pasivniMnozitelj *
          rTicks
        : 0;
    const bunarGain =
      rTicks > 0
        ? (((s.ostecenja.bunar ? 0 : s.gradevine.bunar || 0) * BUNAR_ENERGIJA +
            (s.ostecenja.mlin ? 0 : s.gradevine.mlin || 0) * MLIN_ENERGIJA) *
            rTicks)
        : 0;
    const nextLjudi = rTicks > 0 ? izracunajSelidbu(kauba, rTicks) : s.stanovnici;
    const kamata =
      rTicks > 0 && !s.ostecenja.banka
        ? bankaKamata(s.bankaZlato, s.gradevine.banka || 0, rTicks) * (0.55 + 0.45 * kauba.potrebe.red)
        : 0;
    const nextBanka = Math.min(bankaKap(s.gradevine.banka || 0), s.bankaZlato + kamata);

    const nextEnergy = dodajEnergiju(
      s.energija,
      (eTicks > 0 ? eTicks : 0) + bunarGain,
      s.razine.baterija || 0,
      false,
    );
    const serifLik = serif(s.ljudi);
    const redBoost =
      1 +
      (s.gradevine.ured || 0) * 0.18 +
      (serifLik?.razina ?? 0) * 0.05 +
      jacina(s.ljudi, "red") * 0.08;
    const shieldRoll =
      rTicks > 0 && s.stitovi < maxStitova && Math.random() < Math.min(1, SHIELD_ROLL_P * rTicks * redBoost);
    const nextResursTick = rTicks > 0 ? lastR + rTicks * RESOURCE_TICK_MS : s.zadnjiResursTick;
    const nextEnergyTick = eTicks > 0 ? lastE + eTicks * regenMs : s.zadnjaEnergijaTick;
    const resChanged = drvoGain !== 0 || kamenGain !== 0 || zeljezoGain !== 0 || zlatoGain !== 0;
    tickClock.r = nextResursTick;
    tickClock.e = nextEnergyTick;

    const floorPrije = Math.floor(s.stanovnici + 1e-6);
    const floorPoslije = Math.floor(nextLjudi + 1e-6);
    const doslo = floorPoslije - floorPrije;
    const uskl = uskladiLjude(s.ljudi, floorPoslije);
    const selidba: KronikaZapis[] = [];
    if (uskl.dosli.length === 1 && uskl.otisli.length === 0) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.dosli[0]!.ime,
        pobjeda: true,
        stav: null,
        vrsta: "selidba",
        recap: recapDolazak(uskl.dosli[0]!),
      });
    } else if (uskl.otisli.length === 1 && uskl.dosli.length === 0) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.otisli[0]!.ime,
        pobjeda: false,
        stav: null,
        vrsta: "selidba",
        recap: recapOdlazak(uskl.otisli[0]!, kauba.usko ?? undefined),
      });
    } else if (uskl.dosli.length > 1) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.dosli[0]!.ime,
        pobjeda: true,
        stav: null,
        vrsta: "selidba",
        recap: `${uskl.dosli[0]!.ime} i još ${uskl.dosli.length - 1} došli u kaubu.`,
      });
    } else if (uskl.otisli.length > 1) {
      selidba.push({
        id: `k-${Date.now()}`,
        t: Date.now(),
        metaIme: uskl.otisli[0]!.ime,
        pobjeda: false,
        stav: null,
        vrsta: "selidba",
        recap: `${uskl.otisli[0]!.ime} i još ${uskl.otisli.length - 1} otišli iz kaube.`,
      });
    }
    if (doslo > 0) playSfx("collect");

    let buffPoruka: string | null = null;
    if (Math.floor(drvoGain) > 0) povr.dodaj(`drvo ${Math.floor(drvoGain)}`);
    if (Math.floor(kamenGain) > 0) povr.dodaj(`kamen ${Math.floor(kamenGain)}`);
    if (Math.floor(zeljezoGain) > 0) povr.dodaj(`zeljezo ${Math.floor(zeljezoGain)}`);
    if (Math.floor(zlatoGain) > 0) povr.dodaj(`zlato ${Math.floor(zlatoGain)}`);
    if (nextEnergy > s.energija) povr.dodaj(`energija ${Math.floor(nextEnergy - s.energija)}`);
    set((state) => ({
      energija: nextEnergy,
      zlato: zlatoGain > 0 ? state.zlato + zlatoGain : state.zlato,
      resursi: resChanged
        ? {
            drvo: state.resursi.drvo + drvoGain,
            kamen: state.resursi.kamen + kamenGain,
            zeljezo: state.resursi.zeljezo + zeljezoGain,
          }
        : state.resursi,
      stitovi: shieldRoll ? state.stitovi + 1 : state.stitovi,
      stanovnici: nextLjudi,
      zamjenici: zamjenici.map((z) => {
        if (rTicks <= 0) return z;
        const n = Math.min(6, rTicks);
        const radi = (s.gradevine.ured || 0) + (s.gradevine.banka || 0) > 0;
        let next = radi ? dodajXpLiku(z, n) : z;
        if (shieldRoll) next = dodajXpLiku(next, 3);
        return { ...next, spreman: z.spreman };
      }),
      bankaZlato: nextBanka,
      ljudi: uskl.ljudi.map((p) => {
        if (rTicks <= 0) return p;
        const n = Math.min(6, rTicks);
        const g = s.gradevine;
        const radi =
          (p.hub === "posao" && (g.pilana || 0) + (g.kamenolom || 0) + (g.rudnik || 0) + (g.trgovina || 0) > 0) ||
          (p.hub === "jelo" && (g.lov || 0) + (g.mesnica || 0) + (g.pekara || 0) + (g.farma || 0) + (g.tor || 0) > 0) ||
          (p.hub === "voda" && (g.bunar || 0) + (g.mlin || 0) + (g.cisterna || 0) > 0) ||
          (p.hub === "zabava" && (g.salun || 0) + (g.karte || 0) > 0) ||
          (p.hub === "krov" && (g.kuca || 0) + (g.blok || 0) > 0) ||
          (p.hub === "red" && (g.ured || 0) + (g.banka || 0) > 0) ||
          (p.hub === "konji" && (g.staja || 0) + (g.korali || 0) + (g.staza || 0) > 0) ||
          (p.hub === "zdravlje" && (g.ordinacija || 0) + (g.travar || 0) + (g.banja || 0) > 0) ||
          (p.hub === "oruzje" && (g.kovacnica || 0) + (g.barutana || 0) + (g.tvornica || 0) > 0);
        let next = radi ? dodajXpLiku(p, n) : p;
        if (shieldRoll && (p.posao === "Šerif" || p.posao === "Zamjenik")) next = dodajXpLiku(next, 3);
        const rec = recNoviBuff(p, next);
        const mana = recNovaMana(p, next);
        if (rec) buffPoruka = `${next.ime}: ${rec}.`;
        else if (mana) buffPoruka = `${next.ime}: ${mana}.`;
        return next;
      }),
      zadnjiResursTick: nextResursTick,
      zadnjaEnergijaTick: nextEnergyTick,
      poruka:
        buffPoruka ??
        selidba[0]?.recap ??
        (doslo > 0
          ? doslo === 1
            ? "Novi čovjek u kaubi."
            : `Došlo +${doslo} ljudi.`
          : doslo < 0
            ? "Netko je otišao iz kaube."
            : state.poruka),
      kronika: selidba.length ? [...selidba, ...state.kronika].slice(0, MAX_KRONIKA) : state.kronika,
      misije:
        doslo === 0
          ? state.misije
          : state.misije.map((m) => {
              if (m.tip !== "ljudi" || m.zavrseno) return m;
              const trenutno = Math.min(m.cilj, floorPoslije);
              return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
            }),
    }));
    get().osvjeziProtok();
    if (selidba.length) get().provjeriDostignuca();
    const after = get();
    if (
      rTicks > 0 &&
      smijeNoviDogadaj(after.zadnjiDogadaj, nowMs(), !!after.dogadaj) &&
      Math.random() < Math.min(0.07, 0.03 * rTicks)
    ) {
      const tko = serif(after.ljudi);
      const tip = izaberiDogadajTip(after.gradevine, kauba.sreca, nowMs());
      const cin = (after.gradevine.ured || 0) > 0 ? after.serifCin : -1;
      set({ dogadaj: napraviDogadaj(tip, tko?.ime ?? "Boro", nowMs(), cin) });
    }
    } finally {
      povr.objavi(get().aiDogadaji !== false);
    }
  },

  timerMarket: () => {
    set((state) => {
      const noviTecaj = { ...BAZA_TECAJ, ...state.tecaj };
      const noviTrend: Trend = { drvo: 0, kamen: 0, zeljezo: 0, dijamant: 0, ...(state.trend as Partial<Trend>) };
      (["drvo", "kamen", "zeljezo", "dijamant"] as TrznicaId[]).forEach((res) => {
        const swing = 0.9 + Math.random() * 0.22;
        const baza = BAZA_TECAJ[res];
        const stari = state.tecaj[res] ?? baza;
        const novaKupi = Math.max(2, Math.round(baza.kupi * swing));
        const novaProdaj = Math.max(
          1,
          Math.min(Math.floor(novaKupi * 0.78), Math.round(baza.prodaj * swing)),
        );
        noviTrend[res] = novaKupi > stari.kupi ? 1 : novaKupi < stari.kupi ? -1 : 0;
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
      dijamanti += LEVEL_UP_GEMS;
      skok += 1;
      if (skok > 20) break;
    }
    if (skok === 0) return;
    const maxEnergija = izracunajMaxEnergiju(s.razine.baterija || 0);
    const segrti = uskladiSegrte(s.segrti, razina);
    const zamjenici = uskladiZamjenike(s.zamjenici, razina, s.gradevine.ured || 0);
    const novi = segrti.filter((x) => !s.segrti.some((y) => y.id === x.id));
    const noviZam = zamjenici.filter((x) => !s.zamjenici.some((y) => y.id === x.id));
    set({
      xp,
      igracRazina: razina,
      dijamanti,
      energija: Math.max(s.energija, maxEnergija),
      segrti,
      zamjenici,
      poruka: noviZam.length
        ? `LEVEL UP! ${noviZam.map((n) => n.ime).join(" i ")} ${noviZam.length > 1 ? "su" : "je"} zamjenik.`
        : novi.length
          ? `LEVEL UP! ${novi.map((n) => n.ime).join(" i ")} ${novi.length > 1 ? "uče" : "uči"} od Ive.`
          : `LEVEL UP! RAZINA ${razina}`,
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
    pustiLetNagrade(nagrada);
    set((state) => {
      const maxS = izracunajMaxStitova(state.razine.oklop || 0);
      return {
        zlato: state.zlato + (nagrada.zlato || 0),
        dijamanti: state.dijamanti + (nagrada.dijamanti || 0),
        energija: dodajEnergiju(state.energija, nagrada.energija || 0, state.razine.baterija || 0, true),
        stitovi: Math.min(maxS, state.stitovi + (nagrada.stitovi || 0)),
        resursi: {
          drvo: state.resursi.drvo + (nagrada.drvo || 0),
          kamen: state.resursi.kamen + (nagrada.kamen || 0),
          zeljezo: state.resursi.zeljezo + (nagrada.zeljezo || 0),
        },
      };
    });
  },

  provjeriDostignuca: () => {
    const s = get();
    const novaDostignuca = { ...s.dostignucaDone };
    const nagrade: Nagrada[] = [];
    let zadnja: (typeof DOSTIGNUCA)[number] | null = null;
    const ulaz = snapshotDostignuca(s);
    for (const d of DOSTIGNUCA) {
      if (novaDostignuca[d.id]) continue;
      const n = napredakDostignuca(ulaz, d);
      if (n.trenutno < d.cilj) continue;
      novaDostignuca[d.id] = true;
      nagrade.push(d.nagrada);
      zadnja = d;
    }
    if (!zadnja) return;
    set((state) => ({
      dostignucaDone: novaDostignuca,
      novaZvijezda: zadnja!.id,
      poruka: `Zvijezda: ${zadnja!.naziv}.`,
      kronika: [
        {
          id: `k-z-${Date.now()}`,
          t: Date.now(),
          metaIme: zadnja!.naziv,
          pobjeda: true,
          stav: null,
          vrsta: "dostignuce" as const,
          recap: `Zvijezda: ${zadnja!.naziv}. ${zadnja!.opis}`,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    nagrade.forEach((n) => get().primiNagradu(n));
  },

  skloniZvijezdu: () => set({ novaZvijezda: null }),

  preuzmiDnevniBonus: () => {
    const s = get();
    if (s.preuzetoDanas || !s.dnevnaNagrada || !s.dnevnaPotvrda || !s.dnevniDan) return;
    playSfx("collect");
    get().primiNagradu(s.dnevnaNagrada.nagrada);
    dogadaj("daily_claim", { broj: s.dnevniStreak });
    saveJSON(SAVE_KEYS.daily, { streak: s.dnevniStreak, zadnjaDnevna: s.dnevniDan });
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
    if (tip === "spin") get().azurirajJutro("spin", kolicina);
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
    const stara = get().misije.find((m) => m.id === id);
    if (!stara || stara.trenutno < stara.cilj) return;
    playSfx("collect");
    dogadaj("quest_claim", { rec: stara.tip });
    set((state) => {
      const kauba = kaubaOd(state);
      const zauzeti = state.misije.filter((m) => m.id !== id).map((m) => m.tip);
      const stara = state.misije.find((m) => m.id === id);
      const nalozi = stara?.tip
        ? [stara.tip, ...state.zadnjiNalozi.filter((t) => t !== stara.tip)].slice(0, 8)
        : state.zadnjiNalozi;
      return {
        zadnjiNalozi: nalozi,
        misije: state.misije.map((m) =>
          m.id === id ? generirajMisiju(kauba.usko, zauzeti, state.ljudi, state.gradevine, nalozi) : m,
        ),
        ljudi: state.ljudi.map((p) => {
          return stara?.likId === p.id ? dodajXpLiku(p, 8) : p;
        }),
        poruka: stara?.likIme ? `${stara.likIme}: hvala. Nalog je gotov.` : "Nalog je gotov.",
      };
    });
    get().primiNagradu(nagrada);
  },
  };
}
