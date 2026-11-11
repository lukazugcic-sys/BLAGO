import { useEffect, useMemo, useRef, useState } from "react";
import { TekstResursa } from "@/components/game/Iznos";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore, type KnjigaFaza } from "@/lib/stores/slotStore";
import { useSlotMachine } from "@/lib/hooks/useSlotMachine";
import { SlotReel } from "./SlotReel";
import {
  uloziZaMax,
  sestUloga,
} from "@/lib/game/constants";
import { izracunajMaxEnergiju, raspolozenjeKaube, uskoVrtnjaRec } from "@/lib/game/economy";
import { nizAkoVrijedi, winStreakMnozitelj } from "@/lib/game/tuning";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { WinCelebration } from "./WinCelebration";
import { KnjigaIgra } from "./KnjigaIgra";
import { PrikazCijene } from "./PrikazCijene";
import { kaubaOd } from "@/lib/game/ljudi";
import { cijenaBonusKupnje, KNJIGA_SKUP_CILJ, BESPLATNE_ZNAK_DIJAMANT, EXPAND_ZNAKOVI } from "@/lib/game/knjiga";
import type { SimbolId } from "@/lib/game/types";
import { SYMBOL_ART } from "@/lib/game/art";
import { jeSerifovaPoruka } from "./ObavijestSloj";

const AUTO_HOLD_MS = 480;

export function SlotScreen() {
  const energija = useGameStore((s) => Math.floor(s.energija));
  const baterija = useGameStore((s) => s.razine.baterija || 0);
  const gradevine = useGameStore((s) => s.gradevine);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const luckySpinCounter = useGameStore((s) => s.luckySpinCounter);
  const knjigaSkup = useGameStore((s) => s.knjigaSkup);
  const besplatneVrtnje = useGameStore((s) => s.besplatneVrtnje);
  const dijamanti = useGameStore((s) => s.dijamanti);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const poruka = useGameStore((s) => s.poruka);
  const winStreak = useGameStore((s) => s.winStreak);
  const winStreakDo = useGameStore((s) => s.winStreakDo);

  const winCelebration = useSlotStore((s) => s.winCelebration);
  const prikazDobitka = useSlotStore((s) => s.prikazDobitka);

  const vrti = useSlotStore((s) => s.vrti);
  const ulog = useSlotStore((s) => s.ulog);
  const dobitakNaCekanju = useSlotStore((s) => s.dobitakNaCekanju);
  const turboRezim = useSlotStore((s) => s.turboRezim);
  const setUlog = useSlotStore((s) => s.setUlog);
  const setTurboRezim = useSlotStore((s) => s.setTurboRezim);

  const raidAktivan = useSlotStore((s) => s.raidAktivan);
  const autoVrtnja = useSlotStore((s) => s.autoVrtnja);
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  const setAutoVrtnja = useSlotStore((s) => s.setAutoVrtnja);
  const { zavrtiMasinu, preuzmiDobitak, kupiBesplatne } = useSlotMachine();

  const jeFreeSpin = luckySpinCounter === 1 || besplatneVrtnje > 0;
  const knjigaOtvorena = knjigaFaza === "uvod" || knjigaFaza === "kraj";
  const maxEnergija = izracunajMaxEnergiju(baterija);
  const ulozi = useMemo(() => uloziZaMax(maxEnergija), [maxEnergija]);
  const sest = useMemo(() => sestUloga(ulozi, ulog), [ulozi, ulog]);
  const kauba = useMemo(
    () => kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost }),
    [gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost],
  );
  const vrtnjaRec = uskoVrtnjaRec(kauba.usko);
  const moodRec = raspolozenjeKaube(kauba).rec;
  const gumbZakljucan =
    raidAktivan ||
    knjigaOtvorena ||
    (!autoVrtnja && (vrti || (!jeFreeSpin && energija < ulog)));
  // 0.9.172: bonus cijena = osnovna × trenutni ulog (isti helper kao naplata)
  const kupiCijena = cijenaBonusKupnje(igracRazina, ulog);
  const kupiCijenaZnak = cijenaBonusKupnje(igracRazina, ulog, true);
  const mozeKupiti = dijamanti >= kupiCijena;
  const mozeKupitiZnak = dijamanti >= kupiCijenaZnak;

  const holdT = useRef<number | null>(null);
  const holdDone = useRef(false);
  const [drzim, setDrzim] = useState(false);
  const [kupiOtvoren, setKupiOtvoren] = useState(false);
  const [bonusZnak, setBonusZnak] = useState<SimbolId | null>(null);
  const plati = kupiOtvoren;
  const zakljucan = gumbZakljucan;

  const prestaniDrzati = () => {
    if (holdT.current != null) {
      window.clearTimeout(holdT.current);
      holdT.current = null;
    }
    setDrzim(false);
  };

  useEffect(() => {
    if (knjigaOtvorena || knjigaFaza === "igra") setKupiOtvoren(false);
  }, [knjigaOtvorena, knjigaFaza]);

  useEffect(() => {
    if (dobitakNaCekanju && !vrti) preuzmiDobitak();
  }, [dobitakNaCekanju, vrti, preuzmiDobitak]);

  useEffect(() => {
    if (!ulozi.includes(ulog)) {
      const next = [...ulozi].reverse().find((u) => u <= maxEnergija) ?? ulozi[0] ?? 1;
      setUlog(next);
    }
  }, [ulozi, ulog, maxEnergija, setUlog]);

  useEffect(() => {
    if (!autoVrtnja) return;
    if (raidAktivan) {
      setAutoVrtnja(false);
      return;
    }
    if (knjigaFaza === "uvod" || knjigaFaza === "kraj") return;
    if (vrti) return;
    if (dobitakNaCekanju) {
      const t = window.setTimeout(() => preuzmiDobitak(), 700);
      return () => window.clearTimeout(t);
    }
    const gs = useGameStore.getState();
    const besplatna = gs.luckySpinCounter === 1 || gs.besplatneVrtnje > 0;
    if (!besplatna && gs.energija < ulog) {
      useGameStore.setState({ poruka: "PUNI SE ENERGIJA…" });
      return;
    }
    const t = window.setTimeout(() => void zavrtiMasinu(), 220);
    return () => window.clearTimeout(t);
  }, [autoVrtnja, vrti, dobitakNaCekanju, raidAktivan, ulog, energija, knjigaFaza, preuzmiDobitak, zavrtiMasinu, setAutoVrtnja]);

  const sretnaAuto = useRef(false);
  useEffect(() => {
    if (raidAktivan) {
      sretnaAuto.current = false;
      return;
    }
    if (autoVrtnja) return;
    if (knjigaFaza === "uvod" || knjigaFaza === "kraj") {
      sretnaAuto.current = false;
      return;
    }
    if (jeFreeSpin && !vrti && !dobitakNaCekanju) {
      sretnaAuto.current = true;
      const t = window.setTimeout(() => void zavrtiMasinu(), 480);
      return () => window.clearTimeout(t);
    }
    if (sretnaAuto.current && dobitakNaCekanju && !vrti) {
      const t = window.setTimeout(() => {
        preuzmiDobitak();
        sretnaAuto.current = false;
      }, 900);
      return () => window.clearTimeout(t);
    }
    if (sretnaAuto.current && !jeFreeSpin && !vrti && !dobitakNaCekanju) {
      sretnaAuto.current = false;
    }
  }, [jeFreeSpin, vrti, dobitakNaCekanju, raidAktivan, autoVrtnja, knjigaFaza, zavrtiMasinu, preuzmiDobitak]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      const slot = useSlotStore.getState();
      if (slot.raidAktivan) return;
      if (slot.knjigaFaza === "uvod" || slot.knjigaFaza === "kraj") return;
      if (slot.autoVrtnja) {
        slot.setAutoVrtnja(false);
        playSfx("button");
        return;
      }
      if (slot.dobitakNaCekanju) preuzmiDobitak();
      else void zavrtiMasinu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preuzmiDobitak, zavrtiMasinu]);

  return (
    <div
      className={cn(
        "slot-fx-host relative mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden px-3 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1",
        (knjigaFaza === "igra" || knjigaOtvorena) && "slot-fx-knjiga",
      )}
    >
      <KnjigaIgra />

      <div className="slot-kolo-omot relative flex min-h-0 w-full items-center justify-center overflow-hidden">
        <WinCelebration />
        <div
          className={cn(
            "slot-kolo slot-kolo--frameless w-full",
            (knjigaFaza === "igra" || knjigaSkup > 0) && "slot-kolo-knjiga",
            knjigaSkup > 0 && knjigaFaza !== "igra" && "slot-kolo-skup",
            winCelebration === "jackpot" && "reel-frame-jackpot",
            winCelebration === "win" && "reel-frame-win",
            winCelebration === "skull" && "reel-frame-skull",
          )}
        >
          <span className="slot-lampa slot-lampa-l" aria-hidden />
          <span className="slot-ploca" data-testid="slot-ploca" aria-hidden>BLAGO</span>
          <span className="slot-lampa slot-lampa-d" aria-hidden />
          <span className="slot-prasina" aria-hidden />
          <div className="slot-kolo-okvir">
            <div className="slot-kolo-bunar">
              <SlotReel />
            </div>
          </div>
        </div>
      </div>

      <div className="zavrti-traka slot-dock-casino slot-dock-171 slot-dock-172 flex w-full shrink-0 flex-col" data-testid="slot-dock-171">
        <div className="slot-dock-info" role="status" aria-live="polite">
          <div className={cn("slot-ticker", !(prikazDobitka && prikazDobitka.zlato > 0) && "is-prazan")}>
            <span className="slot-ticker-oznaka">Dobitak</span>
            <span>{prikazDobitka && prikazDobitka.zlato > 0 ? `+${Math.floor(prikazDobitka.zlato).toLocaleString("hr-HR")}` : "—"}</span>
          </div>
          <p className="slot-mnozitelj" title="Ulog množi isplatu">
            Ulog ×{ulog}
          </p>
          <p
            className={cn(
              "slot-energija tabular-nums",
              energija > maxEnergija ? "text-volt" : "text-energy",
            )}
            aria-label={`Energija ${Math.min(energija, maxEnergija)} od ${maxEnergija}`}
            data-chip="energija"
          >
            {Math.min(energija, maxEnergija)}/{maxEnergija}
            {energija > maxEnergija ? ` +${energija - maxEnergija}` : ""}
          </p>
        </div>
        {/* 0.9.172: ZAVRTI centre anchored from screen bottom where the old ×2..×15 strip sat (see .slot-dock-dno) */}
        <div className="slot-zavrti-slot" data-testid="zavrti-slot">
          <button
            type="button"
            data-testid="zavrti"
            disabled={gumbZakljucan}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.pointerType === "mouse" && e.button !== 0) return;
              if (raidAktivan || knjigaOtvorena) return;
              (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
              if (autoVrtnja) {
                holdDone.current = false;
                return;
              }
              if (vrti || (!jeFreeSpin && energija < ulog)) return;
              holdDone.current = false;
              setDrzim(true);
              holdT.current = window.setTimeout(() => {
                holdDone.current = true;
                setDrzim(false);
                playSfx("button");
                vibrate(18);
                setAutoVrtnja(true);
                void zavrtiMasinu();
              }, AUTO_HOLD_MS);
            }}
            onPointerUp={() => {
              const gotovo = holdDone.current;
              prestaniDrzati();
              if (useSlotStore.getState().autoVrtnja && !gotovo) {
                setAutoVrtnja(false);
                playSfx("button");
                return;
              }
              if (gotovo || raidAktivan || knjigaOtvorena) return;
              void zavrtiMasinu();
            }}
            onPointerCancel={prestaniDrzati}
            className={cn(
              "slot-zavrti zavrti-usko relative mx-auto flex min-h-11 touch-manipulation items-center justify-center overflow-hidden rounded-full px-8 py-3 font-display text-xl tracking-[0.16em] text-void select-none transition-transform duration-150 ease-out active:scale-[0.94]",
              autoVrtnja
                  ? "zavrti-auto bg-gold"
                  : jeFreeSpin
                    ? "zavrti-wiggle bg-xp shadow-[0_0_24px_color-mix(in_oklab,var(--color-xp)_45%,transparent)]"
                    : "zavrti-wiggle bg-energy shadow-[0_0_24px_color-mix(in_oklab,var(--color-energy)_50%,transparent)]",
              gumbZakljucan && "scale-[0.98] opacity-50 shadow-none",
            )}
          >
            <span className={cn("zavrti-hold-fill", drzim && "ide")} />
            <span className="relative z-10">
              {autoVrtnja
                  ? !jeFreeSpin && energija < ulog
                    ? "ČEKAM"
                    : "AUTO"
                  : vrti
                    ? "VRTIM..."
                    : "ZAVRTI"}
            </span>
          </button>
        </div>

        <div className="slot-dock-dno" data-testid="slot-dock-dno">
        <div className="slot-dock">
          <div className="ulozi-red">
            {sest.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => {
                  playSfx("button");
                  setUlog(op);
                }}
                className={cn(
                  "ulozi-cip min-h-11 min-w-11 rounded-full border px-2.5 py-2 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.96]",
                  ulog === op
                    ? "border-ruby bg-ruby text-ink"
                    : "border-line bg-panel text-dim",
                )}
              >
                ×{op}
              </button>
            ))}
          </div>
        </div>
        <div className="slot-sporedno">
          {poruka && !jeSerifovaPoruka(poruka) && knjigaFaza !== "igra" && !knjigaOtvorena && (
            <p className="slot-poruka"><TekstResursa tekst={poruka} /></p>
          )}
          {(vrtnjaRec || nizAkoVrijedi(winStreak, winStreakDo) > 0) && (
            <p className="slot-hint">
              {vrtnjaRec ? `${moodRec} ${vrtnjaRec}` : ""}
              {vrtnjaRec && nizAkoVrijedi(winStreak, winStreakDo) > 0 ? " · " : ""}
              {nizAkoVrijedi(winStreak, winStreakDo) > 0
                ? `Niz ${nizAkoVrijedi(winStreak, winStreakDo)} ×${winStreakMnozitelj(nizAkoVrijedi(winStreak, winStreakDo)).toLocaleString("hr-HR")}`
                : ""}
            </p>
          )}
          <div className="slot-alat-red">
            <div className="slot-bonus">
              <button type="button" aria-label="Bonus izbornik" onClick={() => setKupiOtvoren((v) => !v)}>
                BONUS
              </button>
              {kupiOtvoren &&
                EXPAND_ZNAKOVI.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={cn("slot-bonus-znak", bonusZnak === id && "on")}
                    aria-label={`Znak ${id}`}
                    aria-pressed={bonusZnak === id}
                    onClick={() => setBonusZnak(id)}
                  >
                    {SYMBOL_ART[id] ? <img src={SYMBOL_ART[id]} alt="" draggable={false} /> : id}
                  </button>
                ))}
              <button
                type="button"
                className="slot-bonus-plati"
                disabled={(!plati && zakljucan) || !mozeKupitiZnak}
                aria-label={`Bonus sa znakom, ${kupiCijenaZnak} dijamanata`}
                onClick={() => {
                  if (zakljucan || !mozeKupitiZnak) return;
                  kupiBesplatne(bonusZnak);
                  setKupiOtvoren(false);
                }}
              >
                {BESPLATNE_ZNAK_DIJAMANT ? `Znak ${kupiCijenaZnak}` : "Bez znaka"}
              </button>
            </div>
            <KnjigaTraka
              skup={knjigaSkup}
              ostalo={besplatneVrtnje}
              faza={knjigaFaza}
              turbo={turboRezim}
              zakljucan={vrti || raidAktivan || !!dobitakNaCekanju || knjigaOtvorena || besplatneVrtnje > 0}
              sakrijKupnju={knjigaOtvorena || knjigaFaza === "igra"}
              mozeKupiti={mozeKupiti}
              cijena={kupiCijena}
              mnozitelj={ulog}
              plati={kupiOtvoren}
              onTurbo={() => {
                playSfx("button");
                setTurboRezim(!turboRezim);
              }}
              onKupi={() => {
                playSfx("button");
                if (!mozeKupiti) return;
                if (!kupiOtvoren) {
                  setKupiOtvoren(true);
                  return;
                }
                kupiBesplatne();
                setKupiOtvoren(false);
              }}
            />
            {kupiOtvoren && !knjigaOtvorena && knjigaFaza !== "igra" && (
              <div className="slot-kupi-cijena">
                <PrikazCijene src={SYMBOL_ART.gem} iznos={kupiCijena} trenutno={dijamanti} />
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function KnjigaTraka({
  skup,
  ostalo,
  faza,
  turbo,
  zakljucan,
  mozeKupiti,
  cijena,
  mnozitelj,
  sakrijKupnju,
  plati,
  onKupi,
  onTurbo,
}: {
  skup: number;
  ostalo: number;
  faza: KnjigaFaza;
  turbo: boolean;
  zakljucan: boolean;
  mozeKupiti: boolean;
  cijena: number;
  mnozitelj: number;
  sakrijKupnju: boolean;
  plati: boolean;
  onKupi: () => void;
  onTurbo: () => void;
}) {
  const prije = useRef(skup);
  const [slam, setSlam] = useState<number | null>(null);
  useEffect(() => {
    if (skup > prije.current) {
      setSlam(skup - 1);
      const t = window.setTimeout(() => setSlam(null), 520);
      prije.current = skup;
      return () => window.clearTimeout(t);
    }
    prije.current = skup;
  }, [skup]);
  return (
    <div className={cn("knjiga-traka", faza === "igra" && "knjiga-traka-igra")}>
      <div className="knjiga-bunari">
        {Array.from({ length: KNJIGA_SKUP_CILJ }, (_, i) => (
          <span
            key={i}
            className={cn(
              "knjiga-bunar",
              i < skup && "knjiga-bunar-pun",
              slam === i && "knjiga-bunar-slam",
            )}
          >
            <img src={SYMBOL_ART.knjiga} alt="" draggable={false} />
          </span>
        ))}
      </div>
      {ostalo > 0 && faza === "igra" ? (
        <span className="knjiga-ostalo">Još {ostalo}</span>
      ) : (
        <div className="knjiga-desno">
          <button
            type="button"
            onClick={onTurbo}
            className={cn(
              "knjiga-turbo",
              turbo && "knjiga-turbo-on",
            )}
          >
            TURBO
          </button>
          {!sakrijKupnju && (
            <button
              type="button"
              disabled={zakljucan || !mozeKupiti}
              onClick={onKupi}
              data-testid="bonus-kupi"
              data-cijena={cijena}
              aria-label={`${plati ? "Plati" : "Kupi"} bonus ×${mnozitelj}: ${cijena} dijamanata`}
              className={cn("knjiga-kupi", mozeKupiti && !zakljucan ? "knjiga-kupi-moze" : "knjiga-kupi-nemoze")}
            >
              {plati ? "PLATI" : "KUPI"}
              <span className="knjiga-kupi-cijena">
                <img src={SYMBOL_ART.gem} alt="" draggable={false} />
                {cijena}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
