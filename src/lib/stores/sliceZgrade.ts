import type { GameState } from "./gameStore";
import { dogadaj } from "@/lib/game/analitika";
import { vodicGradnja } from "@/lib/game/vodic";
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
import { playSfx } from "@/lib/game/audio";
import { haptika } from "@/lib/game/feel";
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

export function sliceZgrade(set: SetGame, get: GetGame): Pick<GameState, "nadogradiZgradu" | "zavrsiGradnju" | "posaljiKaravanu" | "zavrsiKaravanu"> {
  return {
  nadogradiZgradu: (zgrada) => {
    const s = get();
    const lv = s.gradevine[zgrada.id] || 0;
    if (lv >= zgrada.maxLv) return;
    const uvjet = zgradaUvjet(zgrada.id, s.gradevine);
    if (uvjet) {
      set({ poruka: uvjet.toUpperCase() });
      return;
    }
    if (s.gradnje.some((g) => g.zgrada === zgrada.id)) {
      set({ poruka: "Već se diže." });
      return;
    }
    const maj = slobodanGraditelj(s.ljudi, s.segrti, s.gradnje);
    if (!maj) {
      const učenik = s.segrti.find((x) => !x.spreman);
      set({
        poruka: učenik
          ? `${učenik.ime} još uči kod Ive. Još ${Math.max(1, SEGRT_SKOLA - učenik.skola)} posla.`
          : "Nema tko da diže.",
      });
      return;
    }
    const c = cijenaZgrade(zgrada, lv + 1, s.prestigeRazina);
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
    dogadaj(lv === 0 ? "build" : "upgrade", { broj: lv + 1, rec: zgrada.id });
    vodicGradnja(zgrada.id);
    const naKonju = tkoJaše(s.ljudi, s.gradevine, s.ostecenja, s.konjiDuznost).has(maj.id);
    const traje = vrijemeGradnjeMs(lv + 1, maj.razina, imaBuff(maj, "brzina"), naKonju);
    const recap = `${maj.ime} diže ${zgradaAkuzativ(zgrada.id)}.`;
    set((state) => ({
      zlato: state.zlato - c.zlato,
      resursi: {
        drvo: state.resursi.drvo - (c.drvo || 0),
        kamen: state.resursi.kamen - (c.kamen || 0),
        zeljezo: state.resursi.zeljezo - (c.zeljezo || 0),
      },
      gradnje: [
        ...state.gradnje,
        {
          zgrada: zgrada.id,
          ciljLv: lv + 1,
          start: nowMs(),
          kraj: nowMs() + traje,
          majstorId: maj.id,
          majstorIme: maj.ime,
        },
      ],
      poruka: recap,
    }));
  },

  zavrsiGradnju: () => {
    const s = get();
    const gotove = s.gradnje.filter((g) => nowMs() >= g.kraj);
    if (!gotove.length) return;
    const ivo = majstor(s.ljudi);
    playSfx("collect", { bezFeel: true });
    haptika("gradnja");
    set((state) => {
      const gradevine = { ...state.gradevine };
      let ljudi = state.ljudi;
      let segrti = state.segrti;
      let poruka = state.poruka;
      const zapisi = [...state.kronika];
      for (const g of gotove) {
        gradevine[g.zgrada] = g.ciljLv;
        const tko = [...ljudi, ...segrti].find((p) => p.id === g.majstorId);
        const glagol = tko?.spol === "z" ? "podigla" : "podigao";
        const recap = tko
          ? `${tko.ime} je ${glagol} ${zgradaAkuzativ(g.zgrada)}.`
          : "Zgrada je gotova.";
        poruka = recap;
        ljudi = ljudi.map((p) => {
          let next = p.id === g.majstorId ? dodajXpLiku(p, 14 + g.ciljLv * 4) : p;
          if (g.zgrada === "ured" && p.posao === "Šerif") next = dodajXpLiku(next, 12);
          if (g.zgrada === "staja" && p.hub === "konji") next = dodajXpLiku(next, 12);
          if (g.zgrada === "ordinacija" && p.hub === "zdravlje") next = dodajXpLiku(next, 12);
          if (g.zgrada === "farma" && p.posao === "Farmer") next = dodajXpLiku(next, 10);
          return next;
        });
        segrti = segrti.map((p) => {
          if (p.id === g.majstorId) {
            const next = dodajXpLiku(p, 14 + g.ciljLv * 4);
            return { ...p, ...next, skola: p.skola, spreman: p.spreman };
          }
          if (!p.spreman && ivo && g.majstorId === ivo.id) {
            const skola = p.skola + 1;
            const spreman = skola >= SEGRT_SKOLA;
            if (spreman) poruka = `${p.ime} je gotov sa školom. Može sam.`;
            return {
              ...p,
              skola,
              spreman,
              rec: spreman ? "Ivo ga pustio na drugu bauštelu." : p.rec,
            };
          }
          return p;
        });
        zapisi.unshift({
          id: `k-${Date.now()}-${g.zgrada}`,
          t: Date.now(),
          metaIme: tko?.ime ?? g.majstorIme,
          pobjeda: true,
          stav: null,
          vrsta: "gradnja" as const,
          recap,
        });
      }
      let konjiBroj = state.konjiBroj;
      let konjiDuznost = state.konjiDuznost;
      const kap = konjaKap(gradevine);
      for (const g of gotove) {
        if (g.zgrada === "staja" || g.zgrada === "korali" || g.zgrada === "staza") {
          konjiBroj = Math.min(kap, konjiBroj + 1);
        }
      }
      konjiBroj = Math.min(kap, konjiBroj);
      konjiDuznost = normalizirajDuznost(konjiBroj, konjiDuznost);
      return {
        gradevine,
        gradnje: state.gradnje.filter((g) => nowMs() < g.kraj),
        ljudi,
        segrti,
        zamjenici: uskladiZamjenike(state.zamjenici, state.igracRazina, gradevine.ured || 0),
        poruka,
        kronika: zapisi.slice(0, MAX_KRONIKA),
        konjiBroj,
        konjiDuznost,
      };
    });
    for (const g of gotove) {
      get().dodajXp(6 + g.ciljLv * 3);
      get().azurirajMisiju("zgrada");
      get().azurirajMisiju(g.zgrada);
    }
    const ljudiN = Math.floor(get().stanovnici);
    set((state) => ({
      misije: state.misije.map((m) => {
        if (m.tip !== "ljudi" || m.zavrseno) return m;
        const trenutno = Math.min(m.cilj, ljudiN);
        return { ...m, trenutno, zavrseno: trenutno >= m.cilj };
      }),
    }));
    get().azurirajKlanZadatak("zgrada");
    get().provjeriDostignuca();
    get().osvjeziProtok();
  },

  posaljiKaravanu: (ciljUid, teret, put) => {
    const s = get();
    if (s.karavana) {
      set({ poruka: `${s.karavana.vozacIme} je već na putu.` });
      return;
    }
    const susjed = susjedPoUid(ciljUid);
    if (!susjed) {
      set({ poruka: "Nema te kaube." });
      return;
    }
    const kolicina = Math.max(0, Math.floor(teret.drvo) + Math.floor(teret.kamen) + Math.floor(teret.zeljezo));
    if (kolicina < 5) {
      set({ poruka: "Natovari barem 5." });
      return;
    }
    if (s.resursi.drvo < teret.drvo || s.resursi.kamen < teret.kamen || s.resursi.zeljezo < teret.zeljezo) {
      set({ poruka: "NEDOSTAJU RESURSI" });
      return;
    }
    const vozacLik = vozar(
      s.ljudi.filter((p) => !s.gradnje.some((g) => g.majstorId === p.id)),
    );
    if (!vozacLik) {
      set({ poruka: "Nema tko da vozi." });
      return;
    }
    const putId: KaravanaPutId = put === "noc" || put === "rijeka" ? put : "staza";
    const traje = vrijemeKaravanaMs(
      kolicina,
      vozacLik.razina,
      susjed.uid,
      imaBuff(vozacLik, "brzina"),
      tkoJaše(s.ljudi, s.gradevine, s.ostecenja, s.konjiDuznost).has(vozacLik.id),
      putId,
    );
    playSfx("build");
    set({
      resursi: {
        drvo: s.resursi.drvo - teret.drvo,
        kamen: s.resursi.kamen - teret.kamen,
        zeljezo: s.resursi.zeljezo - teret.zeljezo,
      },
      karavana: {
        ciljUid: susjed.uid,
        ciljIme: susjed.kauba,
        start: nowMs(),
        kraj: nowMs() + traje,
        teret: {
          drvo: Math.floor(teret.drvo),
          kamen: Math.floor(teret.kamen),
          zeljezo: Math.floor(teret.zeljezo),
        },
        vozacId: vozacLik.id,
        vozacIme: vozacLik.ime,
        put: putId,
        cin: null,
        cinRijesen: false,
      },
      poruka: `${vozacLik.ime} ide u ${susjed.kauba}.`,
    });
  },

  zavrsiKaravanu: () => {
    const s = get();
    const k = s.karavana;
    if (!k) return;
    const t = tjedanSad();
    const sajam = t.vrsta === "sajam";
    const meta = t.vrsta === "pljacka" && t.susjed?.uid === k.ciljUid;
    const serifLik = serif(s.ljudi);
    const zastita = 0.28 / (1 + (s.gradevine.ured || 0) * 0.2 + (serifLik?.razina ?? 0) * 0.08);
    const ukradeno = meta && Math.random() < zastita;
    const isplata = ukradeno ? { zlato: 0, drvo: 0, kamen: 0, zeljezo: 0 } : karavanaIsplata(k.teret, sajam, k.ciljUid);
    playSfx(ukradeno ? "skull" : "collect");
    set((state) => ({
      karavana: null,
      zlato: state.zlato + isplata.zlato,
      resursi: {
        drvo: state.resursi.drvo + isplata.drvo,
        kamen: state.resursi.kamen + isplata.kamen,
        zeljezo: state.resursi.zeljezo + isplata.zeljezo,
      },
      ljudi: state.ljudi.map((p) => (p.id === k.vozacId ? dodajXpLiku(p, ukradeno ? 4 : 12) : p)),
      poruka: ukradeno
        ? `${k.vozacIme} se vratio prazan. ${k.ciljIme} je uzeo teret.`
        : `${k.vozacIme} se vratio iz ${k.ciljIme}. +${isplata.zlato} zlata${isplata.drvo || isplata.kamen || isplata.zeljezo ? " i roba" : ""}.`,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: k.vozacIme,
          pobjeda: !ukradeno,
          stav: null,
          vrsta: "selidba" as const,
          recap: ukradeno
            ? `${k.vozacIme} izgubio karavanu za ${k.ciljIme}.`
            : `${k.vozacIme} prodao teret u ${k.ciljIme}. +${isplata.zlato} zlata.`,
        },
        ...state.kronika,
      ].slice(0, MAX_KRONIKA),
    }));
    if (!ukradeno && Math.random() < (sajam ? 0.06 : 0.03)) {
      get().uhvatiPotjernicu({ lucky: sajam, linije: 2 });
    }
    get().dodajXp(ukradeno ? 2 : 5);
  },
  };
}
