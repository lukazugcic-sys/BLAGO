import { useCallback } from "react";
import { razinaDobitka } from "@/lib/game/slotPrikaz";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { flash, shake, hitstop } from "@/lib/context/UIContext";
import { simbolSkoro } from "@/lib/game/slotFx";
import {
  LUCKY_SPIN_INTERVAL,
  WILD_BOOST_CHANCE_PER_LEVEL,
  ZGRADE,
  izgradiTezinskiPool,
  uloziZaMax,
} from "@/lib/game/constants";
import {
  dodajEnergiju,
  izracunajMaxStitova,
  izracunajPrestigeMnozitelj,
  izracunajSansuZaDobitak,
  modifikatorBlagaZaUsko,
  JACKPOT_BONUS,
  GAMBLE_MAX,
  GAMBLE_WIN_P,
  izracunajXpVrtnje,
  serifDrziRed,
  izracunajMaxEnergiju,
} from "@/lib/game/economy";
import { delay } from "@/lib/game/helpers";
import { playSfx, vibrate } from "@/lib/game/audio";
import { haptika, osjeti, smanjenPokret } from "@/lib/game/feel";
import { pustiLet } from "@/lib/game/let";
import { serif, dodajXpLiku, jacina, imaBuff, imaManu, kaubaOd } from "@/lib/game/ljudi";
import { tjedanSad } from "@/lib/game/tjedan";
import { alatLv, POJACALO_PER_LV, SKULL_GOLD_LOSS, NIZ_TRAJE_MS, winStreakMnozitelj } from "@/lib/game/tuning";
import { dohvatiAktivniDogadaj } from "@/lib/game/sezonalniDogadaji";
import { ocijeniVrtnju } from "@/lib/game/ocjena";
import { baciKolo } from "@/lib/game/bacanje";
import { dogadaj } from "@/lib/game/analitika";
import { vodicKolo, vodicPlijen } from "@/lib/game/vodic";
import {
  BESPLATNE_KUPI,
  naplatiBonusKupnju,
  BESPLATNE_NASUMICE_N,
  BESPLATNE_NASUMICE_P,
  EXPAND_ZNAKOVI,
  KNJIGA_SKUP_CILJ,
  KNJIGA_ULOG,
  KNJIGA_ZNACKA_PLUS,
  expandStupove,
  izaberiExpand,
  jeExpandZnak,
  knjigaBroj,
  prazanDobitak,
  vrtnjeZaKnjige,
  zbrojiDobitak,
} from "@/lib/game/knjiga";
import type { Dobitak, SimbolId } from "@/lib/game/types";
import type { SezonalniDogadaj } from "@/lib/game/sezonalniDogadaji";

const busy = { current: false };

function poolZaSpin(
  dogadaj: SezonalniDogadaj | null,
  usko: Parameters<typeof modifikatorBlagaZaUsko>[0],
  lucky: boolean,
): SimbolId[] {
  return izgradiTezinskiPool({
    ...modifikatorBlagaZaUsko(usko),
    ...(dogadaj?.modifikatorBlaga ?? {}),
    ...(lucky ? { wild: 7, energy: 1.2 } : {}),
  });
}

function primijeniPlijen(d: Dobitak) {
  const gs = useGameStore.getState();
  const baterija = gs.razine.baterija || 0;
  const energijaPoslije = dodajEnergiju(gs.energija, d.energija, baterija, true);
  const energijaStvarno = Math.max(0, energijaPoslije - gs.energija);
  pustiLet({
    zlato: d.zlato,
    dijamanti: d.dijamanti,
    drvo: d.drvo,
    kamen: d.kamen,
    zeljezo: d.zeljezo,
    energija: energijaStvarno,
    stitovi: d.stitovi,
  });
  const maxStitova = izracunajMaxStitova(gs.razine.oklop || 0);
  useGameStore.setState((s) => ({
    zlato: s.zlato + d.zlato,
    dijamanti: s.dijamanti + d.dijamanti,
    energija: dodajEnergiju(s.energija, d.energija, baterija, true),
    stitovi: Math.min(maxStitova, s.stitovi + d.stitovi),
    resursi: {
      drvo: s.resursi.drvo + d.drvo,
      kamen: s.resursi.kamen + d.kamen,
      zeljezo: s.resursi.zeljezo + d.zeljezo,
    },
    ukupnoZlata: d.zlato > 0 ? s.ukupnoZlata + d.zlato : s.ukupnoZlata,
  }));
  vodicPlijen();
  if (d.zlato > 0) {
    gs.azurirajMisiju("zlato", d.zlato);
    gs.azurirajKlanZadatak("zlato", d.zlato);
    useGameStore.getState().provjeriDostignuca();
  }
  if (d.linije > 0) {
    gs.azurirajMisiju("dobitak", d.linije);
    gs.azurirajKlanZadatak("dobitak", d.linije);
  }
}

/**
 * Idempotent credit of the pending base-spin win. The pending slot is cleared
 * BEFORE the reward is applied (synchronously), so any repeated call — StrictMode
 * double effects, AUTO timers, remounts — finds nothing and credits nothing.
 * Returns true only for the single call that actually credited.
 */
export function naplatiDobitak(opts: { automatski?: boolean } = {}): boolean {
  const ss = useSlotStore.getState();
  const d = ss.dobitakNaCekanju;
  if (!d) return false;
  // Clear pending BEFORE credit (idempotent). Display amount is presentational only.
  const razina = razinaDobitka(d, ss.ulog);
  useSlotStore.setState({
    dobitakNaCekanju: null,
    gambleCount: 0,
    prikazDobitka: { razina, zlato: d.zlato, key: (ss.prikazDobitka?.key ?? 0) + 1 },
  });
  playSfx("collect");
  vibrate(20);
  primijeniPlijen(d);
  // Auto-credit right after a spin keeps the spin's own message and win lines visible.
  if (!opts.automatski) {
    useGameStore.setState({ poruka: "DOBITAK PREUZET!" });
    useSlotStore.getState().setDobitnaPolja([]);
  }
  useGameStore.getState().spremi();
  return true;
}

export function useSlotMachine() {
  const preuzmiDobitak = useCallback(() => {
    naplatiDobitak();
  }, []);

  const igrajGamble = useCallback((odabranaBoja: "red" | "black") => {
    const pending = useSlotStore.getState().dobitakNaCekanju;
    if (!pending) return;
    const already = useSlotStore.getState().gambleCount;
    if (already >= GAMBLE_MAX) {
      useGameStore.setState({
        poruka: "MAKSIMALNO 3 UDVOSTRUČENJA — PREUZMI DOBITAK",
      });
      return;
    }
    const pogodak = Math.random() < GAMBLE_WIN_P;
    const izvucenaKarta: "red" | "black" = pogodak
      ? odabranaBoja
      : odabranaBoja === "red"
        ? "black"
        : "red";
    flash(
      izvucenaKarta === "red" ? "rgba(244, 63, 94, 0.45)" : "rgba(100, 100, 110, 0.55)",
      "slot",
    );
    if (pogodak) {
      playSfx("win");
      const nextCount = already + 1;
      useSlotStore.setState({
        gambleCount: nextCount,
        dobitakNaCekanju: {
          zlato: pending.zlato * 2,
          dijamanti: pending.dijamanti * 2,
          energija: pending.energija * 2,
          stitovi: pending.stitovi * 2,
          drvo: pending.drvo * 2,
          kamen: pending.kamen * 2,
          zeljezo: pending.zeljezo * 2,
          linije: pending.linije,
        },
      });
      useGameStore.setState({
        poruka:
          nextCount >= GAMBLE_MAX
            ? `POGODAK! ${izvucenaKarta === "red" ? "CRVENA" : "CRNA"}! ×2 — PREUZMI DOBITAK`
            : `POGODAK! IZVUČENA JE ${izvucenaKarta === "red" ? "CRVENA" : "CRNA"}! ×2!`,
      });
      useGameStore.getState().spremi();
    } else {
      playSfx("attack");
      useSlotStore.getState().setDobitakNaCekanju(null);
      useSlotStore.getState().setDobitnaPolja([]);
      useGameStore.setState({
        poruka: `GUBITAK! IZVUČENA JE ${izvucenaKarta === "red" ? "CRVENA" : "CRNA"}.`,
      });
      useGameStore.getState().spremi();
    }
  }, []);

  const kreniKnjigu = useCallback((znak?: SimbolId) => {
    const ss = useSlotStore.getState();
    if (ss.knjigaFaza !== "uvod" || ss.vrti) return;
    const pick = znak && (EXPAND_ZNAKOVI as readonly string[]).includes(znak) ? znak : izaberiExpand();
    useGameStore.setState({
      besplatneExpand: pick,
      poruka: "Znak se širi niz stup.",
    });
    useSlotStore.setState({
      knjigaFaza: "igra",
      knjigaLonac: prazanDobitak(),
      expandPolja: [],
    });
    playSfx("collect");
    vibrate(18);
  }, []);

  const zatvoriKnjigu = useCallback(() => {
    useSlotStore.setState({
      knjigaFaza: null,
      expandPolja: [],
      knjigaLonac: prazanDobitak(),
    });
    useGameStore.setState({
      besplatneVrtnje: 0,
      besplatneExpand: null,
      poruka: "Knjiga se zatvara.",
    });
  }, []);

  const kupiBesplatne = useCallback((znak?: SimbolId | null) => {
    const gs = useGameStore.getState();
    const ss = useSlotStore.getState();
    if (ss.vrti || ss.raidAktivan || ss.dobitakNaCekanju) return;
    if (gs.besplatneVrtnje > 0 || ss.knjigaFaza) {
      useGameStore.setState({ poruka: "Knjiga je već otvorena." });
      return;
    }
    const pick = znak && jeExpandZnak(znak) ? znak : null;
    const naplata = naplatiBonusKupnju(gs.dijamanti, gs.igracRazina, ss.ulog, !!pick);
    if (!naplata.ok) {
      useGameStore.setState({ poruka: `Skupo. Bonus ×${ss.ulog} traži ${naplata.cijena} dijamanata.` });
      return;
    }
    const c = naplata.cijena;
    playSfx("collect");
    vibrate(22);
    useGameStore.setState((s) => ({
      dijamanti: s.dijamanti - c,
      besplatneVrtnje: BESPLATNE_KUPI.n,
      besplatneUlog: ss.ulog,
      besplatneExpand: pick,
      knjigaSkup: 0,
      poruka: pick ? `Bonus. Znak ${pick}.` : "Bonus. Osam vrtnji.",
    }));
    useSlotStore.setState({
      knjigaFaza: "uvod",
      knjigaLonac: prazanDobitak(),
      expandPolja: [],
      autoVrtnja: false,
    });
    flash("rgba(232, 176, 74, 0.4)", "slot");
    useGameStore.getState().azurirajMisiju("knjiga");
    useGameStore.getState().azurirajKlanZadatak("knjiga");
  }, []);

  const zavrtiMasinu = useCallback(async () => {
    if (busy.current) return;
    const ss = useSlotStore.getState();
    if (ss.raidAktivan) return;
    if (ss.knjigaFaza === "uvod" || ss.knjigaFaza === "kraj") return;
    // A win left pending (old save, interrupted spin) is credited once, never dropped.
    if (ss.dobitakNaCekanju) naplatiDobitak();
    const gs = useGameStore.getState();
    const { ulog, turboRezim } = ss;
    const jeLucky = gs.luckySpinCounter === 1 && gs.besplatneVrtnje <= 0;
    const jeBonus = gs.besplatneVrtnje > 0;
    const jeFreeSpin = jeLucky || jeBonus;
    const luckyUlozi = jeLucky ? uloziZaMax(izracunajMaxEnergiju(gs.razine.baterija || 0)) : [];
    const luckyUlog = jeLucky ? (luckyUlozi[Math.floor(Math.random() * Math.max(1, luckyUlozi.length))] ?? 1) : ulog;
    const ulogPay = jeBonus ? Math.max(1, gs.besplatneUlog || KNJIGA_ULOG) : jeLucky ? luckyUlog : ulog;
    const expandZnak = jeBonus ? gs.besplatneExpand : null;
    if (ss.vrti || (!jeFreeSpin && gs.energija < ulog)) {
      if (!ss.vrti) useGameStore.setState({ poruka: "NEDOVOLJNO ENERGIJE" });
      return;
    }

    busy.current = true;
    const novaVrtnja = gs.ukupnoVrtnji + 1;
    const bonusOstalo = jeBonus ? gs.besplatneVrtnje - 1 : gs.besplatneVrtnje;
    useGameStore.setState((s) => ({
      energija: jeFreeSpin ? s.energija : Math.max(0, s.energija - ulog),
      ukupnoVrtnji: novaVrtnja,
      luckySpinCounter: jeBonus
        ? s.luckySpinCounter
        : jeLucky
          ? LUCKY_SPIN_INTERVAL
          : s.luckySpinCounter - 1,
      besplatneVrtnje: bonusOstalo,
      poruka: jeLucky
        ? `SRETNA · ×${luckyUlog}`
        : jeBonus
          ? expandZnak
            ? `KNJIGA · JOŠ ${bonusOstalo}`
            : `PRAŠINA · JOŠ ${bonusOstalo}`
          : "VRTNJA...",
    }));
    useGameStore.getState().azurirajMisiju("spin");
    useGameStore.getState().azurirajKlanZadatak("spin");
    useGameStore.getState().provjeriDostignuca();
    if (jeLucky) useGameStore.getState().azurirajMisiju("luckySpin");

    useSlotStore.setState({
      vrti: true,
      winCelebration: null,
      dobitnaPolja: [],
      dobitneLinije: [],
      expandPolja: [],
      gambleCount: 0,
      spinningCols: [true, true, true, true, true],
    });
    playSfx("spin");
    dogadaj("spin");

    const reduce = smanjenPokret();
    const spinDelay = reduce ? 0 : turboRezim ? 220 : 500;
    let stopDelay = turboRezim ? 110 : 220;
    if (reduce) stopDelay = 0;
    const finalDelay = reduce ? 0 : turboRezim ? 40 : 120;

    const aktivniDogadaj = dohvatiAktivniDogadaj();
    const kauba = kaubaOd(gs);
    const simbolPool = poolZaSpin(aktivniDogadaj, kauba.usko, jeLucky);

    try {
      const gs2 = useGameStore.getState();
      const wildBoostLevel = alatLv("wildBoost", gs2.razine.wildBoost || 0);
      const wildBoostChance = wildBoostLevel * WILD_BOOST_CHANCE_PER_LEVEL;
      const sansaZaDobitak =
        izracunajSansuZaDobitak(gs2.razine.sreca || 0) + jacina(gs2.ljudi, "sreca") * 0.008;
      const prestigeMnozitelj = izracunajPrestigeMnozitelj(gs2.prestigeRazina);
      const eventMnozitelj = aktivniDogadaj?.bonusMnozitelj ?? 1.0;
      const ulazOcjene = {
        ulog: ulogPay,
        pojacalo: alatLv("pojacalo", gs2.razine.pojacalo || 0) * POJACALO_PER_LV + jacina(gs2.ljudi, "plijen") * 0.03,
        prestige: prestigeMnozitelj,
        event: eventMnozitelj,
        bonus: jeBonus,
      };

      let noviSimboli = baciKolo(Math.random, {
        pool: simbolPool,
        lucky: jeLucky,
        wildBoost: wildBoostChance,
        sansa: sansaZaDobitak,
        expand: expandZnak,
      });
      const namjesteno = vodicKolo();
      if (namjesteno) noviSimboli = namjesteno;
      let expandPoljaGotova: number[] = [];
      if (expandZnak) {
        const rasireno = expandStupove(noviSimboli, expandZnak);
        if (rasireno.polja.length > 0) {
          noviSimboli = rasireno.simboli;
          expandPoljaGotova = rasireno.polja;
        }
      }

      let ocjena = ocijeniVrtnju(noviSimboli, { ...ulazOcjene, streak: 1 });
      const imaLinije = ocjena.polja.length > 0;
      const sljedeciNiz = imaLinije ? gs2.winStreak + 1 : 0;
      const streakM = winStreakMnozitelj(sljedeciNiz);
      if (imaLinije && streakM !== 1) ocjena = ocijeniVrtnju(noviSimboli, { ...ulazOcjene, streak: streakM });

      const ukupnoZlato = ocjena.zlato;
      const ukupnoDijamanata = ocjena.dijamanti;
      const ukupnoEnergije = ocjena.energija;
      const ukupnoStitova = ocjena.stitovi;
      const resursiDobitak = { drvo: ocjena.drvo, kamen: ocjena.kamen, zeljezo: ocjena.zeljezo };
      const linijaDobitnih = ocjena.linije;
      const jackpotLinija = ocjena.jackpot;
      const osvojeneLinije = ocjena.linijePolja;
      const dobitneCelije = ocjena.celije;
      const dobijenaPoljaPrivremena = ocjena.polja;
      const dobijeniXp = izracunajXpVrtnje(ulogPay, dobitneCelije, jeFreeSpin);
      useGameStore.getState().dodajXp(dobijeniXp);
      const brojLubanja = noviSimboli.filter((s) => s === "skull").length;
      const knjigaNaKolu = knjigaBroj(noviSimboli);
      let slavlje: "win" | "jackpot" | "skull" | null = null;
      let poljaPrikaz: number[] = [];
      let linijePrikaz: number[][] = [];

      if (jeBonus && knjigaNaKolu > 0) {
        const plus = knjigaNaKolu * KNJIGA_ZNACKA_PLUS;
        const rec = knjigaNaKolu === 1 ? `Značka. +${plus} vrtnje.` : `Značke. +${plus} vrtnji.`;
        useGameStore.setState((s) => {
          const ostalo = s.besplatneVrtnje + plus;
          return { besplatneVrtnje: ostalo, poruka: `${rec} Još ${ostalo}.` };
        });
        useSlotStore.getState().setZnackaFlash(`${rec} Još ${useGameStore.getState().besplatneVrtnje}.`);
      }

      if (dobijenaPoljaPrivremena.length > 0) {
        const jedinstvenaPolja = [...new Set(dobijenaPoljaPrivremena)];
        const noviWinStreak = gs2.winStreak + 1;
        const srecanMetak = useGameStore.getState().metakDogadaj;
        const zlatoBuff =
          srecanMetak && srecanMetak.do > Date.now() && srecanMetak.id === "sreca" && ukupnoZlato > 0
            ? Math.ceil(ukupnoZlato * 1.5)
            : ukupnoZlato;
        const pending: Dobitak = {
          zlato: zlatoBuff,
          dijamanti: ukupnoDijamanata,
          energija: ukupnoEnergije,
          stitovi: ukupnoStitova,
          drvo: resursiDobitak.drvo,
          kamen: resursiDobitak.kamen,
          zeljezo: resursiDobitak.zeljezo,
          linije: linijaDobitnih,
        };
        useGameStore.setState({ winStreak: noviWinStreak, winStreakDo: Date.now() + NIZ_TRAJE_MS });
        if (noviWinStreak >= 3) useGameStore.getState().azurirajMisiju("streak");
        useGameStore.getState().uhvatiPotjernicu({
          lucky: jeLucky || tjedanSad().vrsta === "sajam",
          linije: linijaDobitnih,
          jackpot: jackpotLinija,
        });
        if (jeBonus) {
          primijeniPlijen(pending);
          useSlotStore.setState({
            knjigaLonac: zbrojiDobitak(useSlotStore.getState().knjigaLonac, pending),
          });
        } else {
          useSlotStore.setState({ dobitakNaCekanju: pending, gambleCount: 0 });
        }
        useGameStore.setState({
          poruka: jackpotLinija
            ? `JACKPOT! 5 U NIZU! ×${JACKPOT_BONUS} BONUS · +${dobijeniXp} XP`
            : `DOBITAK! +${dobijeniXp} XP`,
        });
        slavlje = jackpotLinija ? "jackpot" : "win";
        poljaPrikaz = jedinstvenaPolja;
        linijePrikaz = osvojeneLinije;
      } else if (brojLubanja >= 3 && !jeBonus) {
        const gs3 = useGameStore.getState();
        let novaPoruka = "";
        let noviStitovi = gs3.stitovi;
        let ostecenja = gs3.ostecenja;
        let novoZlato = gs3.zlato;
        let otvoriRaid = false;
        if (gs3.stitovi <= 0) {
          const gubitakZlata = Math.floor(gs3.zlato * (SKULL_GOLD_LOSS * brojLubanja));
          novoZlato = Math.max(0, gs3.zlato - gubitakZlata);
          noviStitovi = 0;
          const izgradeneINeostecene = ZGRADE.filter(
            (zg) => zg.tip === "resurs" && gs3.gradevine[zg.id] > 0 && !gs3.ostecenja[zg.id],
          );
          if (brojLubanja >= 4 && izgradeneINeostecene.length > 0) {
            const tko = serif(gs3.ljudi);
            const drzi =
              serifDrziRed(gs3.gradevine.ured || 0, tko?.razina ?? 0, gs3.stanovnici) +
              (tko && imaBuff(tko, "obrana") ? 0.1 : 0) +
              (tko && imaManu(tko, "obrana") ? -0.08 : 0) +
              jacina(gs3.ljudi, "red") * 0.04 +
              gs3.zamjenici.filter((z) => z.spreman).length * 0.06;
            if (tko && Math.random() < drzi) {
              novaPoruka = `${tko.ime} je zaustavio pljačku.`;
              useGameStore.setState({
                ljudi: gs3.ljudi.map((lik) => (lik.id === tko.id ? dodajXpLiku(lik, 8) : lik)),
              });
            } else {
              const meta = izgradeneINeostecene[Math.floor(Math.random() * izgradeneINeostecene.length)]!;
              ostecenja = { ...gs3.ostecenja, [meta.id]: true };
              otvoriRaid = true;
              novaPoruka = `KATASTROFA! −${gubitakZlata} zlata I OŠTEĆENA ${meta.naziv.toUpperCase()}!`;
            }
          } else {
            novaPoruka = `NAPAD! ODUZETO ${gubitakZlata} ZLATA`;
          }
        } else {
          const steta = Math.min(gs3.stitovi, Math.floor(brojLubanja / 2) || 1);
          noviStitovi = gs3.stitovi - steta;
          novaPoruka = `Štit je držao. −${steta}.`;
          const tko = serif(gs3.ljudi);
          if (tko) {
            useGameStore.setState({
              ljudi: gs3.ljudi.map((lik) => (lik.id === tko.id ? dodajXpLiku(lik, 4) : lik)),
            });
          }
        }
        const skullP = noviSimboli.map((v, i) => (v === "skull" ? i : null)).filter((v): v is number => v !== null);
        useGameStore.setState({ winStreak: 0, winStreakDo: 0, stitovi: noviStitovi, zlato: novoZlato, ostecenja, poruka: novaPoruka });
        if (otvoriRaid || noviStitovi !== gs3.stitovi) useGameStore.getState().osvjeziProtok();
        useSlotStore.setState({ raidAktivan: otvoriRaid });
        if (otvoriRaid) dogadaj("raid");
        slavlje = "skull";
        poljaPrikaz = skullP;
        linijePrikaz = [];
      } else {
        useGameStore.setState({ winStreak: 0, winStreakDo: 0, poruka: `NEMA DOBITKA · +${dobijeniXp} XP` });
      }

      if (!jeBonus && !useSlotStore.getState().raidAktivan) {
        const skupPrije = useGameStore.getState().knjigaSkup;
        const otvoriKnjigu = (n: number, rec: string) => {
          useGameStore.setState({
            knjigaSkup: 0,
            besplatneVrtnje: n,
            besplatneUlog: ulogPay,
            besplatneExpand: null,
            poruka: rec,
          });
          useSlotStore.setState({ knjigaFaza: "uvod", knjigaLonac: prazanDobitak(), autoVrtnja: false });
          useGameStore.getState().azurirajMisiju("knjiga");
          useGameStore.getState().azurirajKlanZadatak("knjiga");
        };
        if (knjigaNaKolu >= KNJIGA_SKUP_CILJ) {
          otvoriKnjigu(vrtnjeZaKnjige(knjigaNaKolu), `Pet znački u prašini. ${vrtnjeZaKnjige(knjigaNaKolu)} vrtnji.`);
        } else if (knjigaNaKolu > 0) {
          const skup = Math.min(KNJIGA_SKUP_CILJ, skupPrije + knjigaNaKolu);
          if (skup >= KNJIGA_SKUP_CILJ) otvoriKnjigu(vrtnjeZaKnjige(3), `Pet znački u prašini. ${vrtnjeZaKnjige(3)} vrtnji.`);
          else useGameStore.setState({ knjigaSkup: skup, poruka: `Knjiga u prašini. ${skup}/${KNJIGA_SKUP_CILJ}.` });
        } else if (!jeLucky && Math.random() < BESPLATNE_NASUMICE_P) {
          useGameStore.setState({
            besplatneVrtnje: BESPLATNE_NASUMICE_N,
            besplatneUlog: ulogPay,
            besplatneExpand: null,
            poruka: "Prašina donosi četiri vrtnje.",
          });
          useSlotStore.setState({ knjigaFaza: "igra" });
        }
      }

      if (jeBonus && useGameStore.getState().besplatneVrtnje <= 0) {
        if (expandZnak) {
          useSlotStore.setState({ knjigaFaza: "kraj" });
          useGameStore.setState({ besplatneExpand: null, poruka: "Knjiga se zatvara." });
        } else {
          useSlotStore.setState({ knjigaFaza: null });
        }
      }

      useGameStore.getState().spremi();

      await delay(spinDelay);
      const skoro = !reduce && !turboRezim && !!simbolSkoro(noviSimboli);
      if (reduce) {
        useSlotStore.setState({
          simboli: noviSimboli.slice(),
          spinningCols: [false, false, false, false, false],
          expandPolja: expandPoljaGotova,
        });
      } else {
        const landBuf = useSlotStore.getState().simboli.slice();
        for (let i = 0; i < 5; i++) {
          for (let row = 0; row < 3; row++) landBuf[row * 5 + i] = noviSimboli[row * 5 + i]!;
          const cols = [...useSlotStore.getState().spinningCols];
          cols[i] = false;
          useSlotStore.setState({ simboli: landBuf.slice(), spinningCols: cols });
          haptika("kolut");
          const zadnji = i === 4 ? stopDelay + (skoro ? 170 : turboRezim ? 24 : 48) : stopDelay;
          await delay(zadnji);
        }
        useSlotStore.getState().setSimboli(noviSimboli);
        if (expandPoljaGotova.length > 0) {
          useSlotStore.setState({ expandPolja: expandPoljaGotova });
          await delay(turboRezim ? 70 : 140);
        }
        await delay(finalDelay);
      }

      if (slavlje === "jackpot") {
        osjeti("jackpot");
        hitstop(80, "slot");
        flash("rgba(251, 191, 36, 0.32)", "slot");
        shake("soft", "slot");
        playSfx("jackpot", { bezFeel: true });
        useSlotStore.setState({ dobitnaPolja: poljaPrikaz, dobitneLinije: linijePrikaz, winCelebration: "jackpot" });
      } else if (slavlje === "win") {
        osjeti("win");
        hitstop(40, "slot");
        flash("rgba(232, 176, 74, 0.22)", "slot");
        shake("soft", "slot");
        playSfx("win", { bezFeel: true });
        useSlotStore.setState({ dobitnaPolja: poljaPrikaz, dobitneLinije: linijePrikaz, winCelebration: "win" });
      } else if (slavlje === "skull") {
        osjeti("skull");
        hitstop(120, "slot");
        shake("skull", "slot");
        flash("rgba(244, 63, 94, 0.45)", "slot");
        playSfx("skull");
        useSlotStore.setState({ dobitnaPolja: poljaPrikaz, dobitneLinije: [], winCelebration: "skull" });
      }
      // Base-spin win is credited automatically once the outcome is shown.
      naplatiDobitak({ automatski: true });
    } finally {
      useSlotStore.setState({
        spinningCols: [false, false, false, false, false],
        vrti: false,
      });
      busy.current = false;
    }
  }, []);

  return { zavrtiMasinu, preuzmiDobitak, igrajGamble, kupiBesplatne, kreniKnjigu, zatvoriKnjigu };
}
