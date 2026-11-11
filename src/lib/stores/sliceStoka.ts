import type { GameState } from "./gameStore";
import { vodicZaposli } from "@/lib/game/vodic";
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

const METAK_DOGADJAJI = [
  { id: "zlato", naziv: "Gazdina kesa", rec: "+2 zlata svakih 10 s", sek: 4 * 60, korak: 10 },
  { id: "energija", naziv: "Barut u krvi", rec: "+1 energija svakih 8 s", sek: 3 * 60, korak: 8 },
  { id: "stit", naziv: "Šerifov zvižduk", rec: "+1 štit", sek: 2 * 60, korak: 0 },
  { id: "sreca", naziv: "Mirna ruka", rec: "Zlatni dobitak +50%", sek: 6 * 60, korak: 0 },
  { id: "drvo", naziv: "Cijepanje", rec: "+1 drvo svakih 12 s", sek: 5 * 60, korak: 12 },
  { id: "zeljezo", naziv: "Kovačev udarac", rec: "+1 željezo svakih 15 s", sek: 4 * 60, korak: 15 },
] as const;

function promijesaj<T>(ulaz: readonly T[]): T[] {
  const a = [...ulaz];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

function uzmiVrstu(
  vreca: GameState["metakVreca"],
  stitPun: boolean,
): { id: GameState["metakVreca"][number]; vreca: GameState["metakVreca"] } {
  let bag = vreca.length > 0 ? [...vreca] : promijesaj(METAK_DOGADJAJI.map((d) => d.id));
  let id = bag.shift()!;
  if (id === "stit" && stitPun) {
    bag.push("stit");
    const i = bag.findIndex((x) => x !== "stit");
    id = i < 0 ? "zlato" : bag.splice(i, 1)[0]!;
  }
  return { id, vreca: bag };
}

export function sliceStoka(set: SetGame, get: GetGame): Pick<GameState, "kupiKonja" | "prodajKonja" | "pomakniKonja" | "kupiSijeno" | "potkovaj" | "rijesiKaravanaCin" | "preimenujLika" | "premjestiLika" | "dajCasu" | "strpajCeliju" | "pustiCeliju" | "kupiGovedo" | "prodajGovedo" | "pomakniGovedo" | "tjerajGovedo" | "koljiGovedo" | "skupiKisu" | "trgovinaKupi" | "ispali" | "iskujMetke" | "napuniBarut" | "kupiMetke" | "tikMetka" | "ugasiMetak" | "uhvatiPotjernicu" | "skloniPotjernicu"> {
  return {
  kupiKonja: (n = 1) => {
    const s = get();
    const kap = konjaKap(s.gradevine);
    const koliko = Math.max(1, Math.floor(n));
    if (s.ostecenja.staja) {
      set({ poruka: "Staja gori. Konj ne ulazi." });
      return;
    }
    if (kap < 1) {
      set({ poruka: "Prvo staju." });
      return;
    }
    if (s.konjiBroj >= kap) {
      set({ poruka: "Staja puna. Diži korale ili stazu." });
      return;
    }
    const moze = Math.min(koliko, kap - s.konjiBroj);
    const p = s.prestigeRazina;
    const zl = cijenaUzKrunu(KONJ_CIJENA_ZLATO, p) * moze;
    const dr = cijenaUzKrunu(KONJ_CIJENA_DRVO, p) * moze;
    if (s.zlato < zl || s.resursi.drvo < dr) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("collect");
    const broj = s.konjiBroj + moze;
    const duznost = { ...s.konjiDuznost, jahanje: s.konjiDuznost.jahanje + moze };
    set({
      zlato: s.zlato - zl,
      resursi: { ...s.resursi, drvo: s.resursi.drvo - dr },
      konjiBroj: broj,
      konjiDuznost: normalizirajDuznost(broj, duznost),
      poruka: moze === 1 ? `Konj ušao. ${broj}/${kap} pod uzdom.` : `${moze} konja ušlo. ${broj}/${kap} pod uzdom.`,
    });
    get().provjeriDostignuca();
  },

  prodajKonja: () => {
    const s = get();
    if (s.konjiBroj < 1) {
      set({ poruka: "Nema konja." });
      return;
    }
    playSfx("collect");
    const broj = s.konjiBroj - 1;
    set({
      zlato: s.zlato + Math.floor(cijenaUzKrunu(KONJ_CIJENA_ZLATO, s.prestigeRazina) / 2),
      konjiBroj: broj,
      konjiDuznost: normalizirajDuznost(broj, s.konjiDuznost),
      poruka: broj < 1 ? "Staja prazna." : `Konj otišao. Ostalo ${broj}.`,
    });
  },

  pomakniKonja: (od, na) => {
    const s = get();
    if (od === na) return;
    if (s.konjiDuznost[od] < 1) return;
    playSfx("button");
    const next = { ...s.konjiDuznost, [od]: s.konjiDuznost[od] - 1, [na]: s.konjiDuznost[na] + 1 };
    set({
      konjiDuznost: normalizirajDuznost(s.konjiBroj, next),
      poruka: KONJ_DUZNOSTI.find((x) => x.id === na)?.poruka ?? "Konji",
    });
  },

  kupiSijeno: () => {
    const s = get();
    if (s.konjiBroj < 1) {
      set({ poruka: "Nema konja." });
      return;
    }
    const cijena = cijenaUzKrunu(SIJENO_ZLATO, s.prestigeRazina);
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    playSfx("collect");
    const doKad = Math.max(s.sijenoDo, Date.now()) + SIJENO_MS;
    set({
      zlato: s.zlato - cijena,
      sijenoDo: doKad,
      poruka: "Sijeno u jaslama.",
    });
  },

  potkovaj: () => {
    const s = get();
    if (s.konjiBroj < 1) {
      set({ poruka: "Nema konja." });
      return;
    }
    if ((s.gradevine.kovacnica || 0) < 1 || s.ostecenja.kovacnica) {
      set({ poruka: "Prvo podigni kovačnicu." });
      return;
    }
    if (s.potkove < 1) {
      set({ poruka: "Kovačnica još nema potkovu." });
      return;
    }
    playSfx("build");
    const doKad = Math.max(s.potkoveDo, Date.now()) + METAK_OBNOVA_MS;
    set({
      potkove: s.potkove - 1,
      potkoveDo: doKad,
      poruka: "Kopita potkovana.",
    });
  },

  rijesiKaravanaCin: (opcija) => {
    const s = get();
    const k = s.karavana;
    if (!k?.cin) return;
    let zlato = 0;
    let kasni = 0;
    let rec = "Put ide dalje.";
    if (k.cin.id === "zasjeda") {
      if (opcija === "plati") {
        if (s.zlato < 8) {
          set({ poruka: "Nema 8 zlata." });
          return;
        }
        zlato = -8;
        rec = "Baciše vreću. Put je čist.";
      } else if (opcija === "pucaj") {
        if (Math.random() < 0.45) rec = "Pucanj. Gusari bježe.";
        else {
          kasni = 8000;
          rec = "Pucanj. Točak puca. Sporije.";
        }
      } else if (Math.random() < 0.4) rec = "Konj prođe. Prašina u očima.";
      else {
        zlato = -6;
        rec = "Uhvatili. Uzeše 6 zlata.";
      }
    } else if (k.cin.id === "most") {
      if (opcija === "obidji") {
        kasni = 10000;
        rec = "Obišli. Duže, suho.";
      } else if (Math.random() < 0.7) rec = "Most drži. Ide dalje.";
      else {
        kasni = 14000;
        rec = "Daska puca. Vuku kola.";
      }
    } else if (k.cin.id === "sajam") {
      if (opcija === "trguj") {
        if (s.zlato < 6) {
          set({ poruka: "Nema 6 zlata." });
          return;
        }
        zlato = 4 + Math.floor(Math.random() * 8);
        rec = `Trgovac kima. +${zlato + 6} zlata.`;
      } else rec = "Mašu i idu. Sajam ostaje.";
    }
    if (zlato < 0 && s.zlato < Math.abs(zlato)) {
      set({ poruka: "Nema zlata." });
      return;
    }
    playSfx(zlato >= 0 ? "collect" : "button");
    set({
      zlato: s.zlato + zlato,
      karavana: {
        ...k,
        cin: null,
        cinRijesen: true,
        kraj: k.kraj + Math.max(0, kasni),
      },
      poruka: rec,
    });
  },

  preimenujLika: (id, ime) => {
    const novo = ime.replace(/\s+/g, " ").trim().slice(0, 14);
    if (novo.length < 2) {
      set({ poruka: "Ime je kratko." });
      return;
    }
    const s = get();
    const tko = s.ljudi.find((p) => p.id === id) ?? s.segrti.find((p) => p.id === id) ?? s.zamjenici.find((p) => p.id === id);
    if (!tko) return;
    const zauzeto = [...s.ljudi, ...s.segrti, ...s.zamjenici].some(
      (p) => p.id !== id && p.ime.toLocaleLowerCase("hr") === novo.toLocaleLowerCase("hr"),
    );
    if (zauzeto) {
      set({ poruka: "To ime već živi u kaubi." });
      return;
    }
    playSfx("button");
    set({
      ljudi: s.ljudi.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      segrti: s.segrti.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      zamjenici: s.zamjenici.map((p) => (p.id === id ? { ...p, ime: novo } : p)),
      jutro: s.jutro.map((p) => (p.likId === id ? { ...p, likIme: novo } : p)),
      poruka: `${tko.ime} sad je ${novo}.`,
    });
  },

  premjestiLika: (id, hub) => {
    const s = get();
    const tko =
      s.ljudi.find((p) => p.id === id) ??
      s.segrti.find((p) => p.id === id) ??
      s.zamjenici.find((p) => p.id === id);
    if (!tko) return;
    if (tko.hub === hub) {
      set({ poruka: `${tko.ime} već stoji tu.` });
      return;
    }
    playSfx("button");
    set({
      ljudi: s.ljudi.map((p) => (p.id === id ? { ...p, hub } : p)),
      segrti: s.segrti.map((p) => (p.id === id ? { ...p, hub } : p)),
      zamjenici: s.zamjenici.map((p) => (p.id === id ? { ...p, hub } : p)),
      poruka: recPremjesti(tko, hub),
    });
    vodicZaposli();
  },

  dajCasu: (id) => {
    const s = get();
    if (s.zlato < 2) {
      set({ poruka: "Nema zlata za kocku." });
      return;
    }
    const tko = s.ljudi.find((p) => p.id === id) ?? s.segrti.find((p) => p.id === id) ?? s.zamjenici.find((p) => p.id === id);
    if (!tko) return;
    const kocka = 1 + Math.floor(Math.random() * 6);
    const dobit = kocka >= 5 ? 4 : kocka >= 3 ? 2 : 0;
    const rec =
      kocka >= 5
        ? `${tko.ime} baci ${kocka}. Tvoje. +4 zlata.`
        : kocka >= 3
          ? `${tko.ime} baci ${kocka}. Stoji.`
          : `${tko.ime} baci ${kocka}. Prašina u oku.`;
    playSfx(dobit >= 4 ? "collect" : "button");
    set({
      zlato: s.zlato - 2 + dobit,
      ljudi: s.ljudi.map((p) => (p.id === id ? dodajXpLiku(p, 5) : p)),
      segrti: s.segrti.map((p) => (p.id === id ? { ...dodajXpLiku(p, 5), skola: p.skola, spreman: p.spreman } : p)),
      zamjenici: s.zamjenici.map((p) => (p.id === id ? { ...dodajXpLiku(p, 5), spreman: p.spreman } : p)),
      poruka: rec,
    });
    get().dodajXp(1);
  },

  strpajCeliju: () => {
    const s = get();
    if ((s.gradevine.ured || 0) < 1 || s.ostecenja.ured) {
      set({ poruka: "Nema ureda." });
      return;
    }
    if (s.celijaBroj >= 3) {
      set({ poruka: "Ćelija puna." });
      return;
    }
    playSfx("button");
    const n = s.celijaBroj + 1;
    set({
      celijaBroj: n,
      poruka: n === 1 ? "Jedan iza rešetaka." : `${n} iza rešetaka. Zakon diše.`,
    });
  },

  pustiCeliju: () => {
    const s = get();
    if (s.celijaBroj < 1) {
      set({ poruka: "Ćelija prazna." });
      return;
    }
    const kazna = s.celijaBroj * 8;
    playSfx("collect");
    set({
      zlato: s.zlato + kazna,
      celijaBroj: 0,
      poruka: `Pustili. Kazna +${kazna} zlata.`,
    });
  },

  kupiGovedo: (n = 1) => {
    const s = get();
    const kap = govedaKap(s.gradevine);
    const kolicina = Math.max(1, Math.floor(n));
    if (s.ostecenja.tor) {
      set({ poruka: "Tor gori. Krdo ne ulazi." });
      return;
    }
    if (kap < 1) {
      set({ poruka: "Prvo tor." });
      return;
    }
    if (s.govedaBroj >= kap) {
      set({ poruka: "Tor pun. Koža je tijesna." });
      return;
    }
    const uzmi = Math.min(kolicina, kap - s.govedaBroj);
    const p = s.prestigeRazina;
    const zlato = cijenaUzKrunu(GOVEDO_CIJENA_ZLATO, p) * uzmi;
    const drvo = cijenaUzKrunu(GOVEDO_CIJENA_DRVO, p) * uzmi;
    if (s.zlato < zlato || s.resursi.drvo < drvo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    playSfx("collect");
    const broj = s.govedaBroj + uzmi;
    const duznost = { ...s.govedaDuznost, pasa: s.govedaDuznost.pasa + uzmi };
    set({
      zlato: s.zlato - zlato,
      resursi: { ...s.resursi, drvo: s.resursi.drvo - drvo },
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, duznost),
      poruka: uzmi === 1 ? `Govedo ušlo. ${broj}/${kap} u toru.` : `${uzmi} grla ušlo. ${broj}/${kap} u toru.`,
    });
    get().azurirajMisiju("govedo", uzmi);
    get().azurirajKlanZadatak("govedo", uzmi);
  },

  prodajGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    playSfx("collect");
    const broj = s.govedaBroj - 1;
    set({
      zlato: s.zlato + Math.floor(cijenaUzKrunu(GOVEDO_CIJENA_ZLATO, s.prestigeRazina) / 2),
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      poruka: broj < 1 ? "Tor prazan." : `Govedo otišlo. Ostalo ${broj}.`,
    });
  },

  pomakniGovedo: (od, na) => {
    const s = get();
    if (od === na || s.govedaDuznost[od] < 1) return;
    playSfx("button");
    const duznost = {
      ...s.govedaDuznost,
      [od]: s.govedaDuznost[od] - 1,
      [na]: s.govedaDuznost[na] + 1,
    };
    set({
      govedaDuznost: normalizirajGovedo(s.govedaBroj, duznost),
      poruka: GOVEDO_DUZNOSTI.find((x) => x.id === na)?.poruka ?? "Krdo",
    });
  },

  tjerajGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    if (s.konjiDuznost.jahanje < 1) {
      set({ poruka: "Bez konja krdo ne ide." });
      return;
    }
    const n = Math.min(Math.max(1, s.govedaDuznost.tjeranje || 1), s.govedaBroj);
    const plata = n * GOVEDO_TJERAJ;
    const broj = s.govedaBroj - n;
    playSfx("collect");
    const gazda = s.ljudi.find((p) => p.posao === "Gazda") ?? s.ljudi.find((p) => p.posao === "Referent" || p.posao === "Gonič");
    let ljudi = s.ljudi;
    if (gazda) ljudi = ljudi.map((p) => (p.id === gazda.id ? dodajXpLiku(p, 6) : p));
    set({
      zlato: s.zlato + plata,
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      ljudi,
      poruka: `${gazda?.ime ?? "Gazda"} otjerao ${n}. +${plata} zlata. Firma diše.`,
    });
    get().azurirajMisiju("zlato", plata);
  },

  koljiGovedo: () => {
    const s = get();
    if (s.govedaBroj < 1) {
      set({ poruka: "Nema krda." });
      return;
    }
    const broj = s.govedaBroj - 1;
    const extra = (s.gradevine.mesnica || 0) > 0 && !s.ostecenja.mesnica ? GOVEDO_KLANJE_MESNICA : 0;
    const plata = GOVEDO_KLANJE + extra;
    playSfx("collect");
    const mesar = s.ljudi.find((p) => p.posao === "Mesarica") ?? s.ljudi.find((p) => p.posao === "Gazda");
    let ljudi = s.ljudi;
    if (mesar) ljudi = ljudi.map((p) => (p.id === mesar.id ? dodajXpLiku(p, 5) : p));
    set({
      zlato: s.zlato + plata,
      govedaBroj: broj,
      govedaDuznost: normalizirajGovedo(broj, s.govedaDuznost),
      ljudi,
      poruka: extra
        ? `Mesnica reže. +${plata} zlata. Kotao pun.`
        : `Klanje. +${plata} zlata. Bez mesnice meso je tanko.`,
    });
  },

  skupiKisu: () => {
    const s = get();
    if ((s.gradevine.cisterna || 0) < 1 || s.ostecenja.cisterna) {
      set({ poruka: "Nema cisterne." });
      return;
    }
    const cijena = cijenaUzKrunu(KISA_ZLATO, s.prestigeRazina);
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    playSfx("collect");
    const tko = s.ljudi.find((p) => p.posao === "Cisternar") ?? s.ljudi.find((p) => p.hub === "voda");
    const doKad = Math.max(s.kisaDo, Date.now()) + KISA_MS;
    let ljudi = s.ljudi;
    if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 4) : p));
    const glagol = tko?.spol === "z" ? "skupila" : "skupio";
    set({
      zlato: s.zlato - cijena,
      kisaDo: doKad,
      ljudi,
      poruka: `${tko?.ime ?? "Karlo"} je ${glagol} kišu. Cisterna diše.`,
    });
    get().azurirajMisiju("kisa");
  },

  trgovinaKupi: (res) => {
    const s = get();
    const lv = s.gradevine.trgovina || 0;
    if (lv < 1 || s.ostecenja.trgovina) {
      set({ poruka: "Nema trgovine." });
      return;
    }
    const cijena = TRGOVINA_CIJENA;
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    const kolicina = TRGOVINA_BAZA + lv;
    playSfx("collect");
    set({
      zlato: s.zlato - cijena,
      resursi: { ...s.resursi, [res]: s.resursi[res] + kolicina },
      poruka: `Šime: +${kolicina} ${res}.`,
    });
  },

  ispali: () => {
    const s = get();
    if (s.metci < 1) {
      playSfx("button");
      set({ poruka: "Prazan bubanj." });
      return;
    }
    playSfx("attack");
    const buffNa =
      s.metakBuffNa >= s.metakRed && s.metakBuffNa <= 23
        ? s.metakBuffNa
        : s.metakBuffNa >= 0 && s.metakBuffNa < s.metakRed
          ? s.metakBuffNa
          : s.metakRed + Math.floor(Math.random() * (24 - s.metakRed));
    const poseban = s.metakRed === buffNa;
    const sljedeciRed = s.metakRed + 1;
    const noviMagazin = sljedeciRed >= 24;
    let stitovi = s.stitovi;
    let dog = s.metakDogadaj;
    let vreca = s.metakVreca;
    let poruka = s.metci === 1 ? "Zadnji metak." : "";
    if (poseban) {
      const maxStit = izracunajMaxStitova(s.razine.oklop || 0);
      const izvucen = uzmiVrstu(vreca, s.stitovi >= maxStit);
      vreca = izvucen.vreca;
      const izbor = METAK_DOGADJAJI.find((d) => d.id === izvucen.id)!;
      const sad = Date.now();
      if (izbor.id === "stit") stitovi = Math.min(maxStit, s.stitovi + 1);
      dog = { id: izbor.id, naziv: izbor.naziv, rec: izbor.rec, do: sad + izbor.sek * 1000, pulse: 0, zadnji: sad };
      poruka = `${izbor.naziv}: ${izbor.rec}. Traje ${izbor.sek / 60} min.`;
    }
    set({
      metci: s.metci - 1,
      metakRed: noviMagazin ? 0 : sljedeciRed,
      metakBuffNa: noviMagazin ? Math.floor(Math.random() * 24) : buffNa,
      metakVreca: vreca,
      stitovi,
      metakDogadaj: dog,
      poruka,
    });
  },

  tikMetka: () => {
    const s = get();
    const d = s.metakDogadaj;
    if (!d) return;
    const sad = Date.now();
    if (d.id === "stit" || d.id === "sreca") {
      if (sad >= d.do) set({ metakDogadaj: null });
      return;
    }
    const meta = METAK_DOGADJAJI.find((x) => x.id === d.id);
    if (!meta || meta.korak < 1) {
      if (sad >= d.do) set({ metakDogadaj: null });
      return;
    }
    const korak = meta.korak * 1000;
    const maxKoraka = Math.floor(meta.sek / meta.korak);
    const dospjelo = Math.min(maxKoraka - d.pulse, Math.floor((sad - d.zadnji) / korak));
    if (dospjelo <= 0) {
      if (sad >= d.do || d.pulse >= maxKoraka) set({ metakDogadaj: null });
      return;
    }
    const pulse = d.pulse + dospjelo;
    const gotovo = pulse >= maxKoraka || sad >= d.do;
    const patch =
      d.id === "zlato"
        ? { zlato: s.zlato + 2 * dospjelo }
        : d.id === "energija"
          ? { energija: dodajEnergiju(s.energija, dospjelo, s.razine.baterija || 0, false) }
          : d.id === "drvo"
            ? { resursi: { ...s.resursi, drvo: s.resursi.drvo + dospjelo } }
            : { resursi: { ...s.resursi, zeljezo: s.resursi.zeljezo + dospjelo } };
    set({
      ...patch,
      metakDogadaj: gotovo ? null : { ...d, pulse, zadnji: d.zadnji + dospjelo * korak },
    });
  },

  ugasiMetak: () => {
    if (get().metakDogadaj) set({ metakDogadaj: null });
  },

  iskujMetke: () => {
    const s = get();
    if ((s.gradevine.kovacnica || 0) < 1 || s.ostecenja.kovacnica) {
      set({ poruka: "Prvo podigni kovačnicu." });
      return;
    }
    if (s.resursi.zeljezo < 1) {
      set({ poruka: "Kovačnica traži željezo." });
      return;
    }
    playSfx("build");
    set({
      resursi: { ...s.resursi, zeljezo: s.resursi.zeljezo - 1 },
      metci: s.metci + 6,
      poruka: "Kovač iskovao 6 metaka.",
    });
  },

  napuniBarut: () => {
    const s = get();
    if ((s.gradevine.barutana || 0) < 1 || s.ostecenja.barutana) {
      set({ poruka: "Prvo podigni barutanu." });
      return;
    }
    if (s.zlato < 6) {
      set({ poruka: "Barutana traži 6 zlata." });
      return;
    }
    playSfx("build");
    set({ zlato: s.zlato - 6, metci: s.metci + 6, poruka: "Barutana napunila 6 metaka." });
  },

  kupiMetke: () => {
    const s = get();
    if (s.zlato < 12) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    playSfx("collect");
    set({ zlato: s.zlato - 12, metci: s.metci + 6, poruka: "Trgovina: 6 metaka." });
  },

  uhvatiPotjernicu: (opts) => {
    const s = get();
    const p = baciPotjernicu(s.potjernice, opts);
    if (!p) return;
    const bilo = s.potjernice[p.id] ?? 0;
    const album = { ...s.potjernice, [p.id]: bilo + 1 };
    const noviSetovi = [...s.potjerniceSetovi];
    let extraZlato = 0;
    let extraGem = 0;
    let setRec = "";
    for (const set of SETOVI) {
      if (!noviSetovi.includes(set.id) && imaSet(album, set.id)) {
        noviSetovi.push(set.id);
        extraZlato += set.nagrada.zlato;
        extraGem += set.nagrada.dijamanti;
        setRec = ` ${set.naziv} skupljeni.`;
      }
    }
    const duplikat = bilo > 0;
    playSfx("collect");
    set({
      potjernice: album,
      potjerniceSetovi: noviSetovi,
      novaPotjernica: duplikat ? s.novaPotjernica : p.id,
      zlato: s.zlato + (duplikat ? 4 : 0) + extraZlato,
      dijamanti: s.dijamanti + extraGem,
      poruka: duplikat
        ? `Plakat već visi. +4 zlata.${setRec}`
        : `Šerif: plakat. ${p.ime}. Traži se.${setRec}`,
    });
    get().provjeriDostignuca();
  },

  skloniPotjernicu: () => set({ novaPotjernica: null }),
  };
}
