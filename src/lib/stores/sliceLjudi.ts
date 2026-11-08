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

export function sliceLjudi(set: SetGame, get: GetGame): Pick<GameState, "dajLiku" | "rijesiDogadaj" | "lijeci" | "bankaSpremi" | "bankaUzmi" | "postaviKrupija"> {
  return {
  dajLiku: (id) => {
    const s = get();
    const p =
      s.ljudi.find((l) => l.id === id) ??
      s.zamjenici.find((l) => l.id === id) ??
      s.segrti.find((l) => l.id === id);
    if (!p) return;
    const kauba = kaubaOd(s);
    const m = raspolozenjeKaube(kauba);
    const svi = s.ljudi.concat(s.segrti).concat(s.zamjenici);
    const gdje = gdjeJe(p, s.gradevine, s.gradnje, s.ostecenja, undefined, s.karavana, svi);
    if (gdje.mjesto === "put") {
      set({ poruka: `${p.ime} je na putu.` });
      return;
    }
    const govor = razgovor(p, m.id, gdje.mjesto === "zgrada", gdje.zgrada);
    if (!govor.dar || !mozeDati(govor.dar, s.zlato, s.resursi)) {
      set({ poruka: `${p.ime} čeka. Nemaš što dati.` });
      return;
    }
    const d = govor.dar;
    playSfx("collect");
    set((state) => ({
      zlato: state.zlato - (d.zlato || 0),
      resursi: {
        drvo: state.resursi.drvo - (d.drvo || 0),
        kamen: state.resursi.kamen - (d.kamen || 0),
        zeljezo: state.resursi.zeljezo - (d.zeljezo || 0),
      },
      ljudi: state.ljudi.map((l) => (l.id === id ? dodajXpLiku(l, 10) : l)),
      zamjenici: state.zamjenici.map((l) => (l.id === id ? { ...dodajXpLiku(l, 10), spreman: l.spreman } : l)),
      segrti: state.segrti.map((l) => (l.id === id ? { ...dodajXpLiku(l, 10), skola: l.skola, spreman: l.spreman } : l)),
      poruka: `${p.ime}: Hvala. Idem dalje.`,
    }));
    get().dodajXp(2);
  },

  rijesiDogadaj: (opcija) => {
    const s = get();
    const d = s.dogadaj;
    if (!d) return;
    const imaRed = !!(serif(s.ljudi) && (s.gradevine.ured || 0) > 0) || s.zamjenici.some((z) => z.spreman);
    const ishod = rijesiIshod(d, opcija, { imaRed, zlato: s.zlato, seed: Date.now() });
    if ((ishod.zlato ?? 0) < 0 && s.zlato < Math.abs(ishod.zlato ?? 0)) {
      set({ poruka: "Nema zlata za to." });
      return;
    }
    playSfx((ishod.zlato ?? 0) >= 0 ? "collect" : "skull");
    const dok = doktor(s.ljudi);
    let ljudi = s.ljudi;
    const liječiSe =
      (s.gradevine.ordinacija || 0) + (s.gradevine.travar || 0) + (s.gradevine.banja || 0) > 0;
    if (ishod.ozljeda && dok && liječiSe) {
      ljudi = ljudi.map((p) => (p.id === dok.id ? dodajXpLiku(p, 6) : p));
    }
    if (ishod.serifXp) {
      const tko = serif(ljudi);
      if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 8) : p));
    }
    const ostecenja = { ...s.ostecenja };
    if (ishod.ostecenje && (s.gradevine[ishod.ostecenje] || 0) > 0) {
      ostecenja[ishod.ostecenje] = true;
    }
    if (ishod.popravi) ostecenja[ishod.popravi] = false;
    const celijaBroj = Math.max(0, Math.min(3, s.celijaBroj + (ishod.celija ?? 0)));
    const kisaDo = ishod.kisa ? Math.max(s.kisaDo, Date.now()) + KISA_MS : s.kisaDo;
    const kvalitetaSela = Math.max(0, Math.min(100, s.kvalitetaSela + (ishod.kvaliteta ?? 0)));
    set({
      dogadaj: null,
      zadnjiDogadaj: nowMs(),
      serifCin: (s.gradevine.ured || 0) > 0 ? s.serifCin + 1 : s.serifCin,
      zlato: s.zlato + (ishod.zlato ?? 0),
      energija: dodajEnergiju(s.energija, ishod.energija ?? 0, s.razine.baterija || 0, true),
      stitovi: Math.min(izracunajMaxStitova(s.razine.oklop || 0), s.stitovi + (ishod.stitovi ?? 0)),
      ljudi,
      ostecenja,
      celijaBroj,
      kisaDo,
      kvalitetaSela,
      poruka: ishod.rec,
      kronika: [
        {
          id: `k-${Date.now()}`,
          t: Date.now(),
          metaIme: d.naslov ?? (d.tip === "stranac" ? "Stranac" : d.tip === "dvoboj" ? "Dvoboj" : "Šerif"),
          pobjeda: (ishod.zlato ?? 0) >= 0 && !ishod.ozljeda,
          stav: null,
          vrsta: "dogadaj" as const,
          recap: ishod.rec,
        },
        ...s.kronika,
      ].slice(0, MAX_KRONIKA),
    });
    get().dodajXp(3);
  },

  lijeci: (odakle = "ordinacija") => {
    const s = get();
    const mjesto = odakle === "travar" || odakle === "banja" ? odakle : "ordinacija";
    const cijena = mjesto === "travar" ? 5 : mjesto === "banja" ? 6 : 8;
    const energija = mjesto === "ordinacija" ? 3 : 2;
    const sansa = mjesto === "ordinacija" ? 0.45 : mjesto === "travar" ? 0.28 : 0.22;
    if ((s.gradevine[mjesto] || 0) < 1 || s.ostecenja[mjesto]) {
      set({
        poruka: mjesto === "travar" ? "Nema travara." : mjesto === "banja" ? "Nema banje." : "Nema ordinacije.",
      });
      return;
    }
    if (s.zlato < cijena) {
      set({ poruka: "NEDOSTAJE ZLATO" });
      return;
    }
    const tko =
      mjesto === "travar"
        ? s.ljudi.find((p) => p.posao === "Travarica") ?? doktor(s.ljudi)
        : doktor(s.ljudi);
    const glagol = tko?.spol === "m" ? "ubrao" : "ubrala";
    playSfx("collect");
    let ljudi = s.ljudi;
    const bolesni = [...ljudi].filter((p) => (p.mane ?? []).length > 0);
    const travaDo = mjesto === "travar" ? Math.max(s.travaDo, Date.now()) + TRAVA_MS : s.travaDo;
    if (bolesni.length && Math.random() < sansa) {
      const meta = bolesni[Math.floor(Math.random() * bolesni.length)]!;
      ljudi = ljudi.map((p) => (p.id === meta.id ? { ...p, mane: p.mane.slice(0, -1) } : p));
      if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 8) : p));
      const rec =
        mjesto === "travar"
          ? `${tko?.ime ?? "Zora"} je ${glagol} travu. ${meta.ime} diše lakše. Zabava u kaubi raste.`
          : mjesto === "banja"
            ? `Prašina sišla s ${meta.ime}.`
            : `${tko?.ime ?? "Doktor"} je skinuo tegobu s ${meta.ime}.`;
      set({
        zlato: s.zlato - cijena,
        energija: dodajEnergiju(s.energija, energija, s.razine.baterija || 0, true),
        ljudi,
        travaDo,
        poruka: rec,
      });
      return;
    }
    if (tko) ljudi = ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 5) : p));
    const rec =
      mjesto === "travar"
        ? `${tko?.ime ?? "Zora"} je ${glagol} travu. Zabava u kaubi raste.`
        : mjesto === "banja"
          ? "Topla voda. Prašina sišla s kože."
          : `${tko?.ime ?? "Doktor"} je zavio ruku. Kauba diše lakše.`;
    set({
      zlato: s.zlato - cijena,
      energija: dodajEnergiju(s.energija, energija, s.razine.baterija || 0, true),
      ljudi,
      travaDo,
      poruka: rec,
    });
  },

  bankaSpremi: (n) => {
    const s = get();
    const kap = bankaKap(s.gradevine.banka || 0);
    if (kap <= 0 || s.ostecenja.banka) {
      set({ poruka: "Nema banke." });
      return;
    }
    const iznos = Math.max(0, Math.min(Math.floor(n), Math.floor(s.zlato), kap - s.bankaZlato));
    if (iznos < 1) {
      set({ poruka: "Nema što spremiti." });
      return;
    }
    playSfx("collect");
    set({
      zlato: s.zlato - iznos,
      bankaZlato: s.bankaZlato + iznos,
      poruka: `U seifu ${s.bankaZlato + iznos} zlata.`,
    });
  },

  bankaUzmi: (n) => {
    const s = get();
    const iznos = Math.max(0, Math.min(Math.floor(n), s.bankaZlato));
    if (iznos < 1) {
      set({ poruka: "Sef je prazan." });
      return;
    }
    playSfx("collect");
    set({
      zlato: s.zlato + iznos,
      bankaZlato: s.bankaZlato - iznos,
      poruka: `Uzeo ${iznos} iz seifa.`,
    });
  },

  postaviKrupija: (id) => {
    const s = get();
    if (id && !s.ljudi.some((p) => p.id === id && mozeKrupije(p))) {
      set({ poruka: "On ne miješa faro." });
      return;
    }
    const tko = id ? s.ljudi.find((p) => p.id === id) : null;
    playSfx("button");
    set({
      faroKrupije: id,
      poruka: tko ? `${tko.ime} miješa faro.` : "Faro bez krupijea.",
    });
  },
  };
}
