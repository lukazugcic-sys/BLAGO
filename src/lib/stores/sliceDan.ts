import type { GameState } from "./gameStore";
import { dogadaj } from "@/lib/game/analitika";
import { vodicProdaja } from "@/lib/game/vodic";
import type { StoreApi } from "zustand";
import {
  BAZA_TECAJ,
  ZGRADE,
  LUCKY_SPIN_INTERVAL,
  generirajMisiju,
  generirajKlanZadatke,
  seloNaMaxu,
  primijeniSkinTemu,
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
import { loadJSON, SAVE_KEYS } from "@/lib/game/persist";
import { vodicDnevnaSmije } from "@/lib/game/vodic";
import { playSfx, vibrate } from "@/lib/game/audio";
import {
  nagradaZaStreak,
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

type SetGame = StoreApi<GameState>["setState"];
type GetGame = StoreApi<GameState>["getState"];

let danUTijeku = false;
let danSljedeci = 0;
let danOtvoren = "";
let danPrisili = false;

/** Ponovi upit poslužitelju, mimo kratke stanke. */
export function ponoviDnevniSat() {
  danSljedeci = 0;
  danPrisili = true;
}

type DanOdgovor = { now: string; dan: string; streak: number; preuzeto: boolean };

function jeDanOdgovor(x: unknown): x is DanOdgovor {
  if (!x || typeof x !== "object") return false;
  const o = x as DanOdgovor;
  return (
    typeof o.now === "string" &&
    typeof o.dan === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(o.dan) &&
    typeof o.preuzeto === "boolean" &&
    Number.isFinite(Number(o.streak))
  );
}

export function sliceDan(set: SetGame, get: GetGame): Pick<GameState, "osvjeziTjedan" | "osvjeziJutro" | "osvjeziDnevnu" | "azurirajJutro" | "dajIvuDrvo" | "posjetiKaubu" | "uzmiJutarnju" | "otvoriJutro" | "skloniJutro" | "uzmiSajamCeker" | "popraviZgradu" | "izvrsiPrestige" | "kupiAlat" | "trgovina" | "kupiSkin" | "osnujiKlan" | "doniraiUKlan" | "azurirajKlanZadatak" | "preuzmiKlanNagradu" | "refreshKlanZadatke" | "postaviUid" | "postaviIme" | "primiResurse" | "zapisiDebrief" | "osvjeziProtok" | "testAlat" | "autoTest"> {
  return {
  osvjeziTjedan: () => {
    const sad = tjedanKljuc();
    const s = get();
    if (s.tjedanKljuc === sad) return;
    set({
      tjedanKljuc: sad,
      tjedanCeker: false,
      tjedanPohod: false,
      poruka: tjedanSad().naziv,
    });
  },

  osvjeziJutro: () => {
    const dan = zoraDanKey();
    const s = get();
    if (s.jutroDan === dan && s.jutro.length === 3) {
      const jutro = s.jutro.map((p) => {
        const ime = s.ljudi.find((l) => l.id === p.likId)?.ime;
        return ime && ime !== p.likIme ? { ...p, likIme: ime } : p;
      });
      if (jutro.some((p, i) => p !== s.jutro[i])) set({ jutro });
      return;
    }
    const bilo = s.jutroDan;
    const novaZora = !!bilo && bilo !== dan;
    set({
      jutroDan: dan,
      jutro: napraviJutarnji(dan, s.ljudi),
      jutroList: novaZora,
      poruka: novaZora ? "Zora. Nove naredbe." : s.poruka,
    });
  },

  osvjeziDnevnu: () => {
    if (typeof window === "undefined") return;
    const sila = danPrisili;
    danPrisili = false;
    if (danUTijeku) return;
    const s = get();
    const sad = Date.now();
    if (!sila && sad < danSljedeci) return;
    if (!sila && s.dnevnaPotvrda && sad - (s.dnevniSatLokal || 0) < 60_000) return;
    danUTijeku = true;
    const pd = loadJSON<DailySave>(SAVE_KEYS.daily);
    void fetch("/api/dan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        streak: pd?.streak ?? s.dnevniStreak,
        zadnjaDnevna: pd?.zadnjaDnevna,
      }),
      signal: AbortSignal.timeout(8000),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("dan");
        const tijelo: unknown = await r.json();
        if (!jeDanOdgovor(tijelo)) throw new Error("dan");
        return tijelo;
      })
      .then((odg) => {
        const streak = Math.max(0, Math.floor(odg.streak));
        const pack = nagradaZaStreak(streak);
        const sat = Date.parse(odg.now);
        const baza = {
          dnevnaPotvrda: true,
          dnevniDan: odg.dan,
          dnevniSat: Number.isFinite(sat) ? sat : Date.now(),
          dnevniSatLokal: Date.now(),
          dnevniStreak: streak,
        };
        if (odg.preuzeto) {
          set({
            ...baza,
            preuzetoDanas: true,
            dnevnaNagrada: null,
            prikazDnevneNagrade: false,
          });
          return;
        }
        if (!vodicDnevnaSmije(odg.dan)) {
          set({
            ...baza,
            preuzetoDanas: false,
            dnevnaNagrada: { ...pack, streak },
            prikazDnevneNagrade: false,
          });
          return;
        }
        const otvori = odg.dan !== danOtvoren;
        if (otvori) danOtvoren = odg.dan;
        set({
          ...baza,
          preuzetoDanas: false,
          dnevnaNagrada: { ...pack, streak },
          ...(otvori ? { prikazDnevneNagrade: true } : {}),
        });
      })
      .catch(() => {
        danSljedeci = Date.now() + 15_000;
      })
      .finally(() => {
        danUTijeku = false;
      });
  },

  azurirajJutro: (tip, kolicina = 1) => {
    const s = get();
    if (!s.jutro.some((p) => p.tip === tip && !p.uzeto && p.trenutno < p.cilj)) return;
    set((state) => ({
      jutro: state.jutro.map((p) => {
        if (p.tip !== tip || p.uzeto || p.trenutno >= p.cilj) return p;
        const trenutno = Math.min(p.cilj, p.trenutno + kolicina);
        return { ...p, trenutno };
      }),
      poruka: (() => {
        const p = state.jutro.find((x) => x.tip === tip && !x.uzeto);
        if (!p) return state.poruka;
        const next = Math.min(p.cilj, p.trenutno + kolicina);
        return next >= p.cilj ? `${p.likIme}: to je to.` : state.poruka;
      })(),
    }));
  },

  dajIvuDrvo: () => {
    const s = get();
    const p = s.jutro.find((x) => x.id === "ivo");
    if (!p || p.uzeto || p.trenutno >= p.cilj) return;
    if (s.resursi.drvo < p.cilj) {
      set({ poruka: `${p.likIme}: treba mi još drva.` });
      return;
    }
    playSfx("build");
    set((state) => ({
      resursi: { ...state.resursi, drvo: state.resursi.drvo - p.cilj },
      jutro: state.jutro.map((x) => (x.id === "ivo" ? { ...x, trenutno: x.cilj } : x)),
      poruka: `${p.likIme}: ovo sjeda. Hvala.`,
    }));
  },

  posjetiKaubu: () => get().azurirajJutro("selo"),

  uzmiJutarnju: (id) => {
    const s = get();
    const p = s.jutro.find((x) => x.id === id);
    if (!p || p.uzeto || !jutroGotovo(p)) return;
    playSfx("collect");
    set((state) => ({
      jutro: state.jutro.map((x) => (x.id === id ? { ...x, uzeto: true } : x)),
      ljudi: state.ljudi.map((l) => (l.id === p.likId ? dodajXpLiku(l, 6) : l)),
      poruka: `${p.likIme}: hvala. Idem dalje.`,
    }));
    get().primiNagradu(p.nagrada);
    get().dodajXp(4);
    const after = get().jutro;
    if (jutroSveUzeto(after)) {
      get().primiNagradu({ zlato: 12 });
      set({
        poruka: `Zora je mirna. Tri naredbe obavljene. ${recDodjiZoru()}.`,
        jutroList: false,
      });
    }
  },

  otvoriJutro: () => set({ jutroList: true }),
  skloniJutro: () => set({ jutroList: false }),

  uzmiSajamCeker: () => {
    get().osvjeziTjedan();
    const s = get();
    const t = tjedanSad();
    if (t.vrsta !== "sajam" || s.tjedanCeker) {
      set({ poruka: s.tjedanCeker ? "Ceker je već uzet." : "Sajam nije ovaj tjedan." });
      return;
    }
    playSfx("collect");
    set({
      tjedanCeker: true,
      energija: dodajEnergiju(s.energija, 6, s.razine.baterija || 0, true),
      zlato: s.zlato + 8,
      resursi: { ...s.resursi, drvo: s.resursi.drvo + 4 },
      poruka: "Sajamski ceker: +6 vrtnji · +8 zlata · +4 drva",
    });
  },

  popraviZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id] || 0;
    if (lv <= 0) return;
    const c = skalaCijene(popravakCijena(lv), s.prestigeRazina);
    if (s.zlato < c.zlato || s.resursi.drvo < c.drvo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("build");
    set((state) => ({
      zlato: state.zlato - c.zlato,
      resursi: { ...state.resursi, drvo: state.resursi.drvo - c.drvo },
      ostecenja: { ...state.ostecenja, [zgrada.id]: false },
      poruka: zgradaPopravakRec(zgrada.id, zgrada.naziv),
    }));
    get().osvjeziProtok();
  },

  izvrsiPrestige: () => {
    const s = get();
    if (!seloNaMaxu(s.gradevine)) {
      set({ poruka: "Selo još nije puno." });
      return;
    }
    const noviPrestige = s.prestigeRazina + 1;
    playSfx("jackpot");
    set({
      prestigeRazina: noviPrestige,
      krunjenja: s.krunjenja + 1,
      igracRazina: 1,
      xp: 0,
      gradevine: {
        ...PRAZNE_GRADEVINE,
        pilana: START.pilana,
        kuca: Math.min(s.gradevine.kuca || 0, 2),
      },
      ostecenja: { ...PRAZNA_OSTECENJA },
      resursi: { drvo: START.drvo, kamen: START.kamen, zeljezo: START.zeljezo },
      zlato: START.zlato,
      energija: izracunajMaxEnergiju(s.razine.baterija || 0),
      stanovnici: START.stanovnici,
      ljudi: pocetniLjudi(),
      segrti: s.segrti,
      zamjenici: [],
      dogadaj: null,
      zadnjiDogadaj: 0,
      bankaZlato: 0,
      faroKrupije: null,
      serifCin: 0,
      celijaBroj: 0,
      metci: 6,
      potkove: 0,
      potkoveDo: 0,
      metakRed: 0,
      metakBuffNa: -1,
      metakVreca: [],
      metakDogadaj: null,
      gradnje: [],
      karavana: null,
      konjiBroj: 0,
      konjiDuznost: praznaDuznost(),
      sijenoDo: 0,
      kisaDo: 0,
      travaDo: 0,
      govedaBroj: 0,
      govedaDuznost: praznaGovedoDuznost(),
      knjigaSkup: 0,
      besplatneVrtnje: 0,
      besplatneExpand: null,
      besplatneUlog: 1,
      zadnjiNalozi: [],
      jutroDan: "",
      jutro: [],
      winStreak: 0,
      winStreakDo: 0,
      luckySpinCounter: LUCKY_SPIN_INTERVAL,
      misije: (() => {
        const a = generirajMisiju("jelo");
        const b = generirajMisiju("jelo", [a.tip]);
        const c = generirajMisiju("voda", [a.tip, b.tip]);
        return [a, b, c];
      })(),
      poruka: `KRUNIDBA! +1 krunjenje. Sve poslije krunidbe skuplje. Tok ×${izracunajPrestigeMnozitelj(noviPrestige).toFixed(2)}`,
    });
    get().provjeriDostignuca();
    get().osvjeziProtok();
    get().osvjeziJutro();
  },

  kupiAlat: (alat) => {
    const s = get();
    const id = alat.id as AlatId;
    const lv = alatLv(id, s.razine[alat.id] || 0);
    if (lv >= ALAT_MAX[id]) {
      set({ poruka: "To je to." });
      return;
    }
    const p = s.prestigeRazina;
    const zl = cijenaUzKrunu(alatCijena(alat.cZlato, lv), p);
    const ka = cijenaUzKrunu(alatCijena(alat.cKamen, lv), p);
    const ze = cijenaUzKrunu(alatCijena(alat.cZeljezo, lv), p);
    if (s.krunjenja < 1) {
      set({ poruka: "Treba krunjenje." });
      return;
    }
    if (
      s.zlato < zl ||
      s.resursi.kamen < ka ||
      s.resursi.zeljezo < ze
    ) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    const noviLv = alatLv(id, lv + 1);
    const maxStitova = izracunajMaxStitova(noviLv);
    playSfx("collect");
    set((state) => ({
      krunjenja: Math.max(0, state.krunjenja - 1),
      zlato: state.zlato - zl,
      resursi: {
        ...state.resursi,
        kamen: state.resursi.kamen - ka,
        zeljezo: state.resursi.zeljezo - ze,
      },
      razine: capRazine({ ...state.razine, [alat.id]: noviLv }),
      ...(alat.id === "oklop" ? { stitovi: maxStitova } : {}),
      poruka: "Alat diže.",
    }));
    get().azurirajMisiju("oprema");
    get().azurirajKlanZadatak("oprema");
    get().osvjeziProtok();
  },

  trgovina: (akcija, resurs, iznos) => {
    const s = get();
    const stavka = s.tecaj[resurs] ?? BAZA_TECAJ[resurs];
    const jeSajam = tjedanSad().vrsta === "sajam";
    const cijenaPoKomadu = sajamCijena(akcija, stavka[akcija], jeSajam);
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
    dogadaj("purchase_burza", { broj: iznos, rec: resurs });
    vodicProdaja();
    return true;
  },

  kupiSkin: (skin) => {
    const s = get();
    const ima = s.skinovi.includes(skin.id);
    if (s.aktivniSkin === skin.id) return;
    if (!ima && skin.cijenaDijamanti > 0 && s.dijamanti < skin.cijenaDijamanti) {
      set({ poruka: "NEDOVOLJNO DIJAMANATA" });
      return;
    }
    playSfx("collect");
    set({
      dijamanti: ima || skin.cijenaDijamanti === 0 ? s.dijamanti : s.dijamanti - skin.cijenaDijamanti,
      aktivniSkin: skin.id,
      skinovi: ima ? s.skinovi : [...s.skinovi, skin.id],
      poruka: ima ? `IZGLED "${skin.naziv.toUpperCase()}"` : `NOVI IZGLED "${skin.naziv.toUpperCase()}"`,
    });
    primijeniSkinTemu(skin);
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
      energija: dodajEnergiju(state.energija, energija, state.razine.baterija || 0, true),
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
    get().osvjeziProtok();
  },

  zapisiDebrief: (zapis) => {
    const t = tjedanSad();
    const prije = get().tjedanPohod;
    const meta = (zapis.metaIme ?? "").toLowerCase();
    const metaTjedna =
      t.vrsta === "pljacka" &&
      zapis.pobjeda &&
      !!t.susjed &&
      (meta.includes(t.susjed.kauba.toLowerCase()) || meta.includes(t.susjed.serif.toLowerCase()));
    const bonus = metaTjedna && !prije;
    set((state) => ({
      stavSela: zapis.stav ?? state.stavSela,
      tjedanPohod: metaTjedna ? true : state.tjedanPohod,
      zlato: state.zlato + (bonus ? 24 : 0),
      dijamanti: state.dijamanti + (bonus ? 1 : 0),
      poruka: bonus ? `Pljačka tjedna. +24 zlata · +1 dijamant.` : state.poruka,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: zapis.metaIme,
          pobjeda: zapis.pobjeda,
          stav: zapis.stav,
          recap: zapis.recap,
          vrsta: zapis.vrsta,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    get().osvjeziProtok();
    get().provjeriDostignuca();
  },

  osvjeziProtok: () => {
    const s = get();
    const kv = kvSelaIzMreze(izgradiMrezu(mrezaUlaz(s)));
    if (kv === s.kvalitetaSela) return;
    set({ kvalitetaSela: kv });
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
      ostecenja: { ...PRAZNA_OSTECENJA },
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
  };
}
