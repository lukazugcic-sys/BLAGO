import { useCallback } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { flash, shake, hitstop } from "@/lib/context/UIContext";
import {
  SVO_BLAGO,
  BLAGO,
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
import { serif, dodajXpLiku, jacina, imaBuff, imaManu, kaubaOd } from "@/lib/game/ljudi";
import { tjedanSad } from "@/lib/game/tjedan";
import { alatLv, POJACALO_PER_LV, SKULL_GOLD_LOSS, LUCKY_WILD_P, rasponNiza, minNiz, linijaMnozitelj } from "@/lib/game/tuning";
import { dohvatiAktivniDogadaj } from "@/lib/game/sezonalniDogadaji";
import {
  BESPLATNE_KUPI,
  cijenaBesplatnih,
  BESPLATNE_NASUMICE_N,
  BESPLATNE_NASUMICE_P,
  EXPAND_ZNAKOVI,
  KNJIGA_PLIJEN,
  KNJIGA_SKUP_CILJ,
  KNJIGA_ULOG,
  KNJIGA_ZNACKA_PLUS,
  expandStupove,
  izaberiExpand,
  knjigaBroj,
  posadiExpandStupove,
  posadiKnjige,
  prazanDobitak,
  rasponStupova,
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
  const maxStitova = izracunajMaxStitova(gs.razine.oklop || 0);
  useGameStore.setState((s) => ({
    zlato: s.zlato + d.zlato,
    dijamanti: s.dijamanti + d.dijamanti,
    energija: dodajEnergiju(s.energija, d.energija, gs.razine.baterija || 0, true),
    stitovi: Math.min(maxStitova, s.stitovi + d.stitovi),
    resursi: {
      drvo: s.resursi.drvo + d.drvo,
      kamen: s.resursi.kamen + d.kamen,
      zeljezo: s.resursi.zeljezo + d.zeljezo,
    },
    ukupnoZlata: d.zlato > 0 ? s.ukupnoZlata + d.zlato : s.ukupnoZlata,
  }));
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

export function useSlotMachine() {
  const preuzmiDobitak = useCallback(() => {
    const ss = useSlotStore.getState();
    const d = ss.dobitakNaCekanju;
    if (!d) return;
    playSfx("collect");
    vibrate(20);
    primijeniPlijen(d);
    useGameStore.setState({ poruka: "DOBITAK PREUZET!" });
    useSlotStore.getState().setDobitakNaCekanju(null);
    useSlotStore.getState().setDobitnaPolja([]);
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
    } else {
      playSfx("attack");
      useSlotStore.getState().setDobitakNaCekanju(null);
      useSlotStore.getState().setDobitnaPolja([]);
      useGameStore.setState({
        poruka: `GUBITAK! IZVUČENA JE ${izvucenaKarta === "red" ? "CRVENA" : "CRNA"}.`,
      });
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

  const kupiBesplatne = useCallback(() => {
    const gs = useGameStore.getState();
    const ss = useSlotStore.getState();
    if (ss.vrti || ss.raidAktivan || ss.dobitakNaCekanju) return;
    if (gs.besplatneVrtnje > 0 || ss.knjigaFaza) {
      useGameStore.setState({ poruka: "Knjiga je već otvorena." });
      return;
    }
    const c = { dijamanti: cijenaBesplatnih(gs.igracRazina), n: BESPLATNE_KUPI.n };
    if (gs.dijamanti < c.dijamanti) {
      useGameStore.setState({ poruka: "Skupo. Treba dijamante." });
      return;
    }
    playSfx("collect");
    vibrate(22);
    useGameStore.setState((s) => ({
      dijamanti: s.dijamanti - c.dijamanti,
      besplatneVrtnje: c.n,
      besplatneUlog: ss.ulog,
      besplatneExpand: null,
      knjigaSkup: 0,
      poruka: "Osam vrtnji. Plaćeno dijamantima.",
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
    if (ss.dobitakNaCekanju || ss.raidAktivan) return;
    if (ss.knjigaFaza === "uvod" || ss.knjigaFaza === "kraj") return;
    const gs = useGameStore.getState();
    const { ulog, turboRezim } = ss;
    const jeLucky = gs.luckySpinCounter === 1 && gs.besplatneVrtnje <= 0;
    const jeBonus = gs.besplatneVrtnje > 0;
    const jeFreeSpin = jeLucky || jeBonus;
    const luckyUlozi = jeLucky ? uloziZaMax(izracunajMaxEnergiju(gs.razine.baterija || 0)) : [];
    const luckyUlog = jeLucky ? (luckyUlozi[Math.floor(Math.random() * Math.max(1, luckyUlozi.length))] ?? 1) : ulog;
    const ulogPay = jeBonus ? KNJIGA_ULOG : jeLucky ? luckyUlog : ulog;
    const expandZnak = jeBonus ? gs.besplatneExpand : null;
    if (ss.vrti || (!jeFreeSpin && gs.energija < ulog)) {
      if (!ss.vrti) useGameStore.setState({ poruka: "NEDOVOLJNO ENERGIJE" });
      return;
    }

    busy.current = true;
    const novaVrtnja = gs.ukupnoVrtnji + 1;
    const bonusOstalo = jeBonus ? gs.besplatneVrtnje - 1 : gs.besplatneVrtnje;
    useGameStore.setState((s) => ({
      energija: jeFreeSpin ? s.energija : s.energija - ulog,
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
            ? `KNJIGA · JOŠ ${gs.besplatneVrtnje}`
            : `PRAŠINA · JOŠ ${gs.besplatneVrtnje}`
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
    vibrate(12);

    const spinDelay = turboRezim ? 220 : 420;
    const stopDelay = turboRezim ? 70 : 140;
    const finalDelay = turboRezim ? 90 : 160;

    const aktivniDogadaj = dohvatiAktivniDogadaj();
    const kauba = kaubaOd(gs);
    const simbolPool = poolZaSpin(aktivniDogadaj, kauba.usko, jeLucky);

    await delay(spinDelay);

    try {
      const gs2 = useGameStore.getState();
      const wildBoostLevel = alatLv("wildBoost", gs2.razine.wildBoost || 0);
      const wildBoostChance = wildBoostLevel * WILD_BOOST_CHANCE_PER_LEVEL;
      const sansaZaDobitak =
        izracunajSansuZaDobitak(gs2.razine.sreca || 0) + jacina(gs2.ljudi, "sreca") * 0.008;
      const prestigeMnozitelj = izracunajPrestigeMnozitelj(gs2.prestigeRazina);
      const winStreakMultiplier = 1;
      const eventMnozitelj = aktivniDogadaj?.bonusMnozitelj ?? 1.0;

      let noviSimboli: SimbolId[] = Array(15)
        .fill(null)
        .map(() => {
          const luckyWild = jeLucky && Math.random() < LUCKY_WILD_P;
          if (luckyWild || Math.random() < wildBoostChance) return "wild";
          return simbolPool[Math.floor(Math.random() * simbolPool.length)]!;
        });

      if (jeLucky) {
        const extra = 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < extra; k++) {
          noviSimboli[Math.floor(Math.random() * 15)] = "wild";
        }
      }

      const linije = [
        [5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4],
        [10, 11, 12, 13, 14],
        [0, 6, 12, 8, 4],
        [10, 6, 2, 8, 14],
      ];

      if (!expandZnak && Math.random() < sansaZaDobitak) {
        const ponudjenoBlago = SVO_BLAGO.filter(
          (s) => s !== "skull" && s !== "gem" && s !== "knjiga",
        );
        const dob = ponudjenoBlago[Math.floor(Math.random() * ponudjenoBlago.length)]!;
        const rLinija = linije[Math.floor(Math.random() * linije.length)]!;
        const raspon = rasponNiza(dob);
        raspon.forEach((i) => {
          noviSimboli[rLinija[i]!] = dob;
        });
      }

      if (!expandZnak) noviSimboli = posadiKnjige(noviSimboli);
      if (expandZnak) {
        noviSimboli = posadiExpandStupove(noviSimboli, expandZnak, rasponStupova(expandZnak));
        noviSimboli = posadiKnjige(noviSimboli, undefined, undefined, expandZnak);
      }

      const landBuf = useSlotStore.getState().simboli.slice();
      for (let i = 0; i < 5; i++) {
        for (let row = 0; row < 3; row++) {
          landBuf[row * 5 + i] = noviSimboli[row * 5 + i]!;
        }
        const cols = [...useSlotStore.getState().spinningCols];
        cols[i] = false;
        useSlotStore.setState({
          simboli: landBuf.slice(),
          spinningCols: cols,
        });
        await delay(stopDelay);
      }

      useSlotStore.getState().setSimboli(noviSimboli);

      if (expandZnak) {
        await delay(turboRezim ? 70 : 160);
        const rasireno = expandStupove(noviSimboli, expandZnak);
        if (rasireno.polja.length > 0) {
          playSfx("collect");
          const buf = noviSimboli.slice();
          const polja: number[] = [];
          for (let col = 0; col < 5; col++) {
            const cells = [col, col + 5, col + 10];
            if (!cells.some((i) => noviSimboli[i] === expandZnak)) continue;
            for (const i of cells) {
              buf[i] = expandZnak;
              polja.push(i);
              useSlotStore.setState({
                simboli: buf.slice(),
                expandPolja: polja.slice(),
              });
              await delay(turboRezim ? 28 : 55);
            }
          }
          noviSimboli = buf;
          flash("rgba(232, 176, 74, 0.28)", "slot");
          vibrate(16);
          await delay(turboRezim ? 80 : 160);
        }
      }

      await delay(finalDelay);

      let ukupnoZlato = 0;
      let ukupnoDijamanata = 0;
      let ukupnoEnergije = 0;
      let ukupnoStitova = 0;
      const resursiDobitak = { drvo: 0, kamen: 0, zeljezo: 0 };
      const dobijenaPoljaPrivremena: number[] = [];
      let linijaDobitnih = 0;
      let jackpotLinija = false;
      const osvojeneLinije: number[][] = [];
      let dobitneCelije = 0;

      linije.forEach((linija) => {
        let targetSymbol: SimbolId = noviSimboli[linija[0]!]!;
        if (targetSymbol === "wild") {
          for (let i = 1; i < 5; i++) {
            if (noviSimboli[linija[i]!] !== "wild") {
              targetSymbol = noviSimboli[linija[i]!]!;
              break;
            }
          }
        }
        if (targetSymbol === "skull" || targetSymbol === "knjiga") return;

        let consecutiveCount = 0;
        for (let i = 0; i < 5; i++) {
          const cell = noviSimboli[linija[i]!]!;
          if (cell === targetSymbol || cell === "wild") consecutiveCount++;
          else break;
        }

        if (consecutiveCount >= minNiz(targetSymbol)) {
          linijaDobitnih++;
          const isAllWilds = targetSymbol === "wild";
          const isJackpot = consecutiveCount === 5;
          if (isJackpot) jackpotLinija = true;
          const detalji = isAllWilds ? BLAGO.gem : BLAGO[targetSymbol];
          const multiplier = linijaMnozitelj(consecutiveCount);
          const jackpotBonus = isJackpot ? JACKPOT_BONUS : 1;
          dobitneCelije += consecutiveCount;

          if (targetSymbol === "shield" && !isAllWilds) {
            ukupnoStitova += (ulogPay >= 10 ? 2 : 1) * Math.max(1, consecutiveCount - 1);
          } else if (targetSymbol === "energy" && !isAllWilds) {
            const vrtnje = consecutiveCount === 5 ? 5 : consecutiveCount === 4 ? 4 : 0;
            ukupnoEnergije += vrtnje * Math.max(1, ulogPay);
          } else if (targetSymbol === "gem" || isAllWilds) {
            const gemAmt = Math.max(
              1,
              Math.floor(
                (isAllWilds ? 2 : 1) *
                  (1 + ulogPay * 0.15) *
                  multiplier *
                  jackpotBonus *
                  prestigeMnozitelj *
                  winStreakMultiplier *
                  eventMnozitelj,
              ),
            );
            ukupnoDijamanata += gemAmt;
          } else {
            const kolicina = Math.floor(
              detalji.baza *
                ulogPay *
                multiplier *
                jackpotBonus *
                (1 + alatLv("pojacalo", gs2.razine.pojacalo || 0) * POJACALO_PER_LV + jacina(gs2.ljudi, "plijen") * 0.03) *
                prestigeMnozitelj *
                winStreakMultiplier *
                eventMnozitelj,
            );
            if (targetSymbol === "gold") ukupnoZlato += kolicina;
            else if (detalji.tip === "drvo" || detalji.tip === "kamen" || detalji.tip === "zeljezo") {
              resursiDobitak[detalji.tip] += kolicina;
            }
          }
          linija.slice(0, consecutiveCount).forEach((idx) => dobijenaPoljaPrivremena.push(idx));
          osvojeneLinije.push(linija.slice(0, consecutiveCount));
        }
      });

      const dobijeniXp = izracunajXpVrtnje(ulogPay, dobitneCelije, jeFreeSpin);
      if (jeBonus) {
        ukupnoZlato = Math.floor(ukupnoZlato * KNJIGA_PLIJEN);
        ukupnoDijamanata = ukupnoDijamanata > 0 ? Math.max(1, Math.floor(ukupnoDijamanata * KNJIGA_PLIJEN)) : 0;
        resursiDobitak.drvo = Math.floor(resursiDobitak.drvo * KNJIGA_PLIJEN);
        resursiDobitak.kamen = Math.floor(resursiDobitak.kamen * KNJIGA_PLIJEN);
        resursiDobitak.zeljezo = Math.floor(resursiDobitak.zeljezo * KNJIGA_PLIJEN);
      }
      useGameStore.getState().dodajXp(dobijeniXp);
      const brojLubanja = noviSimboli.filter((s) => s === "skull").length;
      const knjigaNaKolu = knjigaBroj(noviSimboli);
      if (jeBonus && knjigaNaKolu > 0) {
        const plus = knjigaNaKolu * KNJIGA_ZNACKA_PLUS;
        useGameStore.setState((s) => ({
          besplatneVrtnje: s.besplatneVrtnje + plus,
          poruka: knjigaNaKolu === 1 ? "Značka. Još 2 vrtnje." : `Značke. Još ${plus} vrtnji.`,
        }));
        playSfx("collect");
      }

      if (dobijenaPoljaPrivremena.length > 0) {
        const jedinstvenaPolja = [...new Set(dobijenaPoljaPrivremena)];
        const noviWinStreak = gs2.winStreak + 1;
        const pending: Dobitak = {
          zlato: ukupnoZlato,
          dijamanti: ukupnoDijamanata,
          energija: ukupnoEnergije,
          stitovi: ukupnoStitova,
          drvo: resursiDobitak.drvo,
          kamen: resursiDobitak.kamen,
          zeljezo: resursiDobitak.zeljezo,
          linije: linijaDobitnih,
        };
        useGameStore.setState({ winStreak: noviWinStreak });
        if (noviWinStreak >= 3) useGameStore.getState().azurirajMisiju("streak");
        useGameStore.getState().uhvatiPotjernicu({
          lucky: jeLucky || tjedanSad().vrsta === "sajam",
          linije: linijaDobitnih,
          jackpot: jackpotLinija,
        });

        if (jeBonus) {
          primijeniPlijen(pending);
          useSlotStore.setState({
            dobitnaPolja: jedinstvenaPolja,
            dobitneLinije: osvojeneLinije,
            knjigaLonac: zbrojiDobitak(useSlotStore.getState().knjigaLonac, pending),
          });
        } else {
          useSlotStore.setState({
            dobitnaPolja: jedinstvenaPolja,
            dobitneLinije: osvojeneLinije,
            dobitakNaCekanju: pending,
            gambleCount: 0,
          });
        }

        if (jackpotLinija) {
          hitstop(80, "slot");
          flash("rgba(251, 191, 36, 0.32)", "slot");
          shake("soft", "slot");
          playSfx("jackpot");
          vibrate(40);
          useSlotStore.getState().setWinCelebration("jackpot");
          useGameStore.setState({
            poruka: `JACKPOT! 5 U NIZU! ×${JACKPOT_BONUS} BONUS · +${dobijeniXp} XP`,
          });
        } else {
          hitstop(40, "slot");
          flash("rgba(232, 176, 74, 0.22)", "slot");
          shake("soft", "slot");
          playSfx("win");
          vibrate(18);
          useSlotStore.getState().setWinCelebration("win");
          useGameStore.setState({ poruka: `DOBITAK! +${dobijeniXp} XP` });
        }
      } else if (brojLubanja >= 3 && !jeBonus) {
        hitstop(120, "slot");
        shake("skull", "slot");
        const gs3 = useGameStore.getState();
        let novaPoruka = "";
        let noviStitovi = gs3.stitovi;
        let ostecenja = gs3.ostecenja;
        let novoZlato = gs3.zlato;
        let otvoriRaid = false;
        if (gs3.stitovi <= 0) {
          flash("rgba(244, 63, 94, 0.55)", "slot");
          playSfx("skull");
          vibrate(50);
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
                ljudi: gs3.ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 8) : p)),
              });
            } else {
              const meta =
                izgradeneINeostecene[Math.floor(Math.random() * izgradeneINeostecene.length)]!;
              ostecenja = { ...gs3.ostecenja, [meta.id]: true };
              otvoriRaid = true;
              novaPoruka = `KATASTROFA! −${gubitakZlata} zlata I OŠTEĆENA ${meta.naziv.toUpperCase()}!`;
            }
          } else {
            novaPoruka = `NAPAD! ODUZETO ${gubitakZlata} ZLATA`;
          }
        } else {
          flash("rgba(34, 211, 238, 0.4)", "slot");
          playSfx("skull");
          vibrate(24);
          const steta = Math.min(gs3.stitovi, Math.floor(brojLubanja / 2) || 1);
          noviStitovi = gs3.stitovi - steta;
          novaPoruka = `Štit je držao. −${steta}.`;
          const tko = serif(gs3.ljudi);
          if (tko) {
            useGameStore.setState({
              ljudi: gs3.ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 4) : p)),
            });
          }
        }
        const skullP = noviSimboli
          .map((v, i) => (v === "skull" ? i : null))
          .filter((v): v is number => v !== null);
        useGameStore.setState({
          winStreak: 0,
          stitovi: noviStitovi,
          zlato: novoZlato,
          ostecenja,
          poruka: novaPoruka,
        });
        if (otvoriRaid) useGameStore.getState().osvjeziProtok(["pozar>selo"]);
        else if (noviStitovi !== gs3.stitovi) useGameStore.getState().osvjeziProtok(["oklop>selo"]);
        useSlotStore.setState({
          dobitnaPolja: skullP,
          dobitneLinije: [],
          winCelebration: "skull",
          raidAktivan: otvoriRaid,
        });
      } else {
        useGameStore.setState({ winStreak: 0, poruka: `NEMA DOBITKA · +${dobijeniXp} XP` });
      }

      if (!jeBonus && !useSlotStore.getState().raidAktivan) {
        const skupPrije = useGameStore.getState().knjigaSkup;
        const rasiriKnjigu = async (n: number) => {
          useGameStore.setState({
            knjigaSkup: KNJIGA_SKUP_CILJ,
            poruka: "Pet znački u prašini.",
          });
          shake("hard", "slot");
          hitstop(90, "slot");
          flash("rgba(232, 176, 74, 0.38)", "slot");
          playSfx("jackpot");
          vibrate(40);
          await delay(turboRezim ? 280 : 580);
          useGameStore.setState({
            knjigaSkup: 0,
            besplatneVrtnje: n,
            besplatneUlog: ulogPay,
            besplatneExpand: null,
            poruka: `Pet znački u prašini. ${n} vrtnji.`,
          });
          useSlotStore.setState({
            knjigaFaza: "uvod",
            knjigaLonac: prazanDobitak(),
            autoVrtnja: false,
          });
          useGameStore.getState().azurirajMisiju("knjiga");
          useGameStore.getState().azurirajKlanZadatak("knjiga");
        };
        if (knjigaNaKolu >= KNJIGA_SKUP_CILJ) {
          await rasiriKnjigu(vrtnjeZaKnjige(knjigaNaKolu));
        } else if (knjigaNaKolu > 0) {
          const skup = Math.min(KNJIGA_SKUP_CILJ, skupPrije + knjigaNaKolu);
          playSfx("collect");
          vibrate(14);
          if (skup >= KNJIGA_SKUP_CILJ) {
            await rasiriKnjigu(vrtnjeZaKnjige(3));
          } else {
            useGameStore.setState({
              knjigaSkup: skup,
              poruka: `Knjiga u prašini. ${skup}/${KNJIGA_SKUP_CILJ}.`,
            });
          }
        } else if (!jeLucky && Math.random() < BESPLATNE_NASUMICE_P) {
          useGameStore.setState({
            besplatneVrtnje: BESPLATNE_NASUMICE_N,
            besplatneUlog: ulogPay,
            besplatneExpand: null,
            poruka: "Prašina donosi četiri vrtnje.",
          });
          useSlotStore.setState({ knjigaFaza: "igra" });
          flash("rgba(232, 176, 74, 0.32)", "slot");
          playSfx("win");
        }
      }

      if (jeBonus && useGameStore.getState().besplatneVrtnje <= 0) {
        if (expandZnak) {
          useSlotStore.setState({ knjigaFaza: "kraj" });
          useGameStore.setState({
            besplatneExpand: null,
            poruka: "Knjiga se zatvara.",
          });
        } else {
          useSlotStore.setState({ knjigaFaza: null });
        }
      }
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
