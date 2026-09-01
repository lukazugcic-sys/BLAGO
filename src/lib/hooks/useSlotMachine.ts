import { useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { flash, shake, hitstop } from "@/lib/context/UIContext";
import {
  SVO_BLAGO,
  BLAGO,
  LUCKY_SPIN_INTERVAL,
  MAX_WIN_STREAK,
  STREAK_BONUS_PER_WIN,
  WILD_BOOST_CHANCE_PER_LEVEL,
  ZGRADE,
  izgradiTezinskiPool,
} from "@/lib/game/constants";
import {
  izracunajMaxEnergiju,
  izracunajMaxStitova,
  izracunajPrestigeMnozitelj,
  izracunajSansuZaDobitak,
  LINE_MULT,
  JACKPOT_BONUS,
  GAMBLE_MAX,
  GAMBLE_WIN_P,
  izracunajXpVrtnje,
} from "@/lib/game/economy";
import { delay } from "@/lib/game/helpers";
import { playSfx, vibrate } from "@/lib/game/audio";
import { dohvatiAktivniDogadaj } from "@/lib/game/sezonalniDogadaji";
import type { Dobitak, SimbolId } from "@/lib/game/types";
import type { SezonalniDogadaj } from "@/lib/game/sezonalniDogadaji";

const BAZA_POOL = izgradiTezinskiPool();

const poolZa = (dogadaj: SezonalniDogadaj | null): SimbolId[] =>
  dogadaj?.modifikatorBlaga ? izgradiTezinskiPool(dogadaj.modifikatorBlaga) : BAZA_POOL;

export function useSlotMachine() {
  const busy = useRef(false);

  const preuzmiDobitak = useCallback(() => {
    const ss = useSlotStore.getState();
    const d = ss.dobitakNaCekanju;
    if (!d) return;
    playSfx("collect");
    vibrate(20);
    const gs = useGameStore.getState();
    const maxStitova = izracunajMaxStitova(gs.razine.oklop || 0);
    const maxEnergija = izracunajMaxEnergiju(gs.razine.baterija || 0);
    useGameStore.setState((s) => ({
      zlato: s.zlato + d.zlato,
      dijamanti: s.dijamanti + d.dijamanti,
      energija: Math.min(maxEnergija, s.energija + d.energija),
      stitovi: Math.min(maxStitova, s.stitovi + d.stitovi),
      resursi: {
        drvo: s.resursi.drvo + d.drvo,
        kamen: s.resursi.kamen + d.kamen,
        zeljezo: s.resursi.zeljezo + d.zeljezo,
      },
      ukupnoZlata: d.zlato > 0 ? s.ukupnoZlata + d.zlato : s.ukupnoZlata,
      poruka: "DOBITAK PREUZET!",
    }));
    if (d.zlato > 0) {
      gs.azurirajMisiju("zlato", d.zlato);
      gs.azurirajKlanZadatak("zlato", d.zlato);
      const ukupno = useGameStore.getState().ukupnoZlata;
      useGameStore.getState().provjeriDostignuca(undefined, ukupno, undefined, undefined);
    }
    if (d.linije > 0) {
      gs.azurirajMisiju("dobitak", d.linije);
      gs.azurirajKlanZadatak("dobitak", d.linije);
    }
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

  const zavrtiMasinu = useCallback(async () => {
    if (busy.current) return;
    const ss = useSlotStore.getState();
    if (ss.dobitakNaCekanju || ss.raidAktivan) return;
    const gs = useGameStore.getState();
    const { ulog, turboRezim } = ss;
    const jeFreeSpin = gs.luckySpinCounter === 1;
    if (ss.vrti || (!jeFreeSpin && gs.energija < ulog)) {
      if (!ss.vrti) useGameStore.setState({ poruka: "NEDOVOLJNO ENERGIJE" });
      return;
    }

    busy.current = true;
    const novaVrtnja = gs.ukupnoVrtnji + 1;
    useGameStore.setState((s) => ({
      energija: jeFreeSpin ? s.energija : s.energija - ulog,
      ukupnoVrtnji: novaVrtnja,
      luckySpinCounter: jeFreeSpin ? LUCKY_SPIN_INTERVAL : s.luckySpinCounter - 1,
      poruka: jeFreeSpin ? "SRETNA VRTNJA! BESPLATNO!" : "VRTNJA...",
    }));
    useGameStore.getState().azurirajMisiju("spin");
    useGameStore.getState().azurirajKlanZadatak("spin");
    useGameStore.getState().provjeriDostignuca(novaVrtnja, undefined, undefined, undefined);
    if (jeFreeSpin) useGameStore.getState().azurirajMisiju("luckySpin");

    useSlotStore.setState({
      vrti: true,
      winCelebration: null,
      dobitnaPolja: [],
      dobitneLinije: [],
      gambleCount: 0,
      spinningCols: [true, true, true, true, true],
    });
    playSfx("spin");
    vibrate(12);

    const spinDelay = turboRezim ? 180 : 380;
    const stopDelay = turboRezim ? 70 : 140;
    const finalDelay = turboRezim ? 90 : 160;

    const aktivniDogadaj = dohvatiAktivniDogadaj();
    const simbolPool = poolZa(aktivniDogadaj);
    const scrambleBuf = useSlotStore.getState().simboli.slice();
    const scramble = setInterval(() => {
      const spinning = useSlotStore.getState().spinningCols;
      for (let col = 0; col < 5; col++) {
        if (!spinning[col]) continue;
        for (let row = 0; row < 3; row++) {
          scrambleBuf[row * 5 + col] = simbolPool[Math.floor(Math.random() * simbolPool.length)]!;
        }
      }
      useSlotStore.getState().setSimboli(scrambleBuf.slice());
    }, 70);

    await delay(spinDelay);

    try {
      const gs2 = useGameStore.getState();
      const wildBoostLevel = gs2.razine.wildBoost || 0;
      const wildBoostChance = wildBoostLevel * WILD_BOOST_CHANCE_PER_LEVEL;
      const sansaZaDobitak = izracunajSansuZaDobitak(gs2.razine.sreca || 0);
      const prestigeMnozitelj = izracunajPrestigeMnozitelj(gs2.prestigeRazina);
      const winStreakMultiplier =
        1 + Math.min(gs2.winStreak, MAX_WIN_STREAK) * STREAK_BONUS_PER_WIN;
      const eventMnozitelj = aktivniDogadaj?.bonusMnozitelj ?? 1.0;

      const noviSimboli: SimbolId[] = Array(15)
        .fill(null)
        .map(() => {
          if (Math.random() < wildBoostChance) return "wild";
          return simbolPool[Math.floor(Math.random() * simbolPool.length)]!;
        });

      const linije = [
        [5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4],
        [10, 11, 12, 13, 14],
        [0, 6, 12, 8, 4],
        [10, 6, 2, 8, 14],
      ];

      if (Math.random() < sansaZaDobitak) {
        const ponudjenoBlago = SVO_BLAGO.filter((s) => s !== "skull" && s !== "gem");
        const dob = ponudjenoBlago[Math.floor(Math.random() * ponudjenoBlago.length)]!;
        const rLinija = linije[Math.floor(Math.random() * linije.length)]!;
        const rand = Math.random();
        const raspon = rand > 0.97 ? [0, 1, 2, 3, 4] : rand > 0.78 ? [0, 1, 2, 3] : [0, 1, 2];
        raspon.forEach((i) => {
          noviSimboli[rLinija[i]!] = dob;
        });
      }

      for (let i = 0; i < 5; i++) {
        for (let row = 0; row < 3; row++) {
          scrambleBuf[row * 5 + i] = noviSimboli[row * 5 + i]!;
        }
        const cols = [...useSlotStore.getState().spinningCols];
        cols[i] = false;
        useSlotStore.setState({
          simboli: scrambleBuf.slice(),
          spinningCols: cols,
        });
        await delay(stopDelay);
      }

      clearInterval(scramble);
      useSlotStore.getState().setSimboli(noviSimboli);
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
        if (targetSymbol === "skull") return;

        let consecutiveCount = 0;
        for (let i = 0; i < 5; i++) {
          const cell = noviSimboli[linija[i]!]!;
          if (cell === targetSymbol || cell === "wild") consecutiveCount++;
          else break;
        }

        if (consecutiveCount >= 3) {
          linijaDobitnih++;
          const isAllWilds = targetSymbol === "wild";
          const isJackpot = consecutiveCount === 5;
          if (isJackpot) jackpotLinija = true;
          const detalji = isAllWilds ? BLAGO.gem : BLAGO[targetSymbol];
          const multiplier =
            consecutiveCount === 5
              ? LINE_MULT[5]
              : consecutiveCount === 4
                ? LINE_MULT[4]
                : LINE_MULT[3];
          const jackpotBonus = isJackpot ? JACKPOT_BONUS : 1;
          dobitneCelije += consecutiveCount;

          if (targetSymbol === "shield" && !isAllWilds) {
            ukupnoStitova += (ulog >= 10 ? 2 : 1) * (consecutiveCount - 2);
          } else if (targetSymbol === "energy" && !isAllWilds) {
            ukupnoEnergije += Math.max(
              1,
              Math.floor(
                detalji.baza *
                  ulog *
                  0.5 *
                  multiplier *
                  prestigeMnozitelj *
                  winStreakMultiplier *
                  eventMnozitelj,
              ),
            );
          } else if (targetSymbol === "gem" || isAllWilds) {
            const gemAmt = Math.floor(
              (isAllWilds ? 5 : detalji.baza) *
                (ulog * 0.1) *
                multiplier *
                jackpotBonus *
                prestigeMnozitelj *
                winStreakMultiplier *
                eventMnozitelj,
            );
            ukupnoDijamanata += gemAmt;
          } else {
            const kolicina = Math.floor(
              detalji.baza *
                ulog *
                multiplier *
                jackpotBonus *
                (1 + (gs2.razine.pojacalo || 0) * 0.1) *
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

      const dobijeniXp = izracunajXpVrtnje(ulog, dobitneCelije, jeFreeSpin);
      useGameStore.getState().dodajXp(dobijeniXp);
      const brojLubanja = noviSimboli.filter((s) => s === "skull").length;

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
        useSlotStore.setState({
          dobitnaPolja: jedinstvenaPolja,
          dobitneLinije: osvojeneLinije,
          dobitakNaCekanju: pending,
          gambleCount: 0,
        });
        useGameStore.setState({ winStreak: noviWinStreak });
        if (noviWinStreak >= 3) useGameStore.getState().azurirajMisiju("streak");

        if (jackpotLinija) {
          hitstop(140, "slot");
          flash("rgba(251, 191, 36, 0.62)", "slot");
          shake("hard", "slot");
          playSfx("jackpot");
          vibrate(40);
          useSlotStore.getState().setWinCelebration("jackpot");
          useGameStore.setState({
            poruka: `JACKPOT! 5 U NIZU! ×${JACKPOT_BONUS} BONUS${gs2.winStreak > 0 ? ` + ${Math.round((winStreakMultiplier - 1) * 100)}% NIZ` : ""} · +${dobijeniXp} XP`,
          });
        } else if (noviWinStreak >= 3) {
          hitstop(90, "slot");
          flash("rgba(232, 176, 74, 0.42)", "slot");
          shake("soft", "slot");
          playSfx("win");
          vibrate(22);
          useSlotStore.getState().setWinCelebration("win");
          useGameStore.setState({
            poruka: `NIZ ×${noviWinStreak}! +${Math.round((winStreakMultiplier - 1) * 100)}% BONUS · +${dobijeniXp} XP`,
          });
        } else {
          hitstop(70, "slot");
          flash("rgba(232, 176, 74, 0.38)", "slot");
          shake("soft", "slot");
          playSfx("win");
          vibrate(18);
          useSlotStore.getState().setWinCelebration("win");
          useGameStore.setState({ poruka: `DOBITAK! +${dobijeniXp} XP` });
        }
      } else if (brojLubanja >= 3) {
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
          const gubitakZlata = Math.floor(gs3.zlato * (0.05 * brojLubanja));
          novoZlato = Math.max(0, gs3.zlato - gubitakZlata);
          noviStitovi = 0;
          const izgradeneINeostecene = ZGRADE.filter(
            (zg) => gs3.gradevine[zg.id] > 0 && !gs3.ostecenja[zg.id],
          );
          if (brojLubanja >= 4 && izgradeneINeostecene.length > 0) {
            const meta =
              izgradeneINeostecene[Math.floor(Math.random() * izgradeneINeostecene.length)]!;
            ostecenja = { ...gs3.ostecenja, [meta.id]: true };
            otvoriRaid = true;
            novaPoruka = `KATASTROFA! −${gubitakZlata} zlata I OŠTEĆENA ${meta.naziv.toUpperCase()}!`;
          } else {
            novaPoruka = `NAPAD! ODUZETO ${gubitakZlata} ZLATA`;
          }
        } else {
          flash("rgba(34, 211, 238, 0.4)", "slot");
          playSfx("skull");
          vibrate(24);
          const steta = Math.min(gs3.stitovi, Math.floor(brojLubanja / 2) || 1);
          noviStitovi = gs3.stitovi - steta;
          novaPoruka = `OBRANA AKTIVNA! −${steta} ŠTITA`;
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
    } finally {
      clearInterval(scramble);
      useSlotStore.setState({
        spinningCols: [false, false, false, false, false],
        vrti: false,
      });
      busy.current = false;
    }
  }, []);

  return { zavrtiMasinu, preuzmiDobitak, igrajGamble };
}
