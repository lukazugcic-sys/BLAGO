import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore, type KnjigaFaza } from "@/lib/stores/slotStore";
import { useSlotMachine } from "@/lib/hooks/useSlotMachine";
import { useSeasonalEvent } from "@/lib/hooks/useSeasonalEvent";
import { SlotReel } from "./SlotReel";
import { EventBanner } from "./EventBanner";
import { TjedanTraka } from "./TjedanTraka";
import { JutroTraka } from "./JutroSheet";
import { NagradaPikseli } from "./NagradaPikseli";
import {
  uloziZaMax,
  sestUloga,
} from "@/lib/game/constants";
import { GAMBLE_MAX, izracunajMaxEnergiju, raspolozenjeKaube, uskoVrtnjaRec } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { WinCelebration } from "./WinCelebration";
import { KnjigaIgra } from "./KnjigaIgra";
import { PrikazCijene } from "./PrikazCijene";
import { kaubaOd } from "@/lib/game/ljudi";
import { cijenaBesplatnih, KNJIGA_SKUP_CILJ } from "@/lib/game/knjiga";
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
  const aktivniDogadaj = useSeasonalEvent();

  const winCelebration = useSlotStore((s) => s.winCelebration);

  const vrti = useSlotStore((s) => s.vrti);
  const ulog = useSlotStore((s) => s.ulog);
  const dobitakNaCekanju = useSlotStore((s) => s.dobitakNaCekanju);
  const turboRezim = useSlotStore((s) => s.turboRezim);
  const gambleCount = useSlotStore((s) => s.gambleCount);
  const setUlog = useSlotStore((s) => s.setUlog);
  const setTurboRezim = useSlotStore((s) => s.setTurboRezim);

  const raidAktivan = useSlotStore((s) => s.raidAktivan);
  const autoVrtnja = useSlotStore((s) => s.autoVrtnja);
  const knjigaFaza = useSlotStore((s) => s.knjigaFaza);
  const setAutoVrtnja = useSlotStore((s) => s.setAutoVrtnja);
  const { zavrtiMasinu, preuzmiDobitak, igrajGamble, kupiBesplatne } = useSlotMachine();

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
  const gambleOstalo = Math.max(0, GAMBLE_MAX - gambleCount);
  const gambleZakljucan = gambleOstalo <= 0;
  const imaPlijen = !!dobitakNaCekanju && !autoVrtnja;
  const kupiCijena = cijenaBesplatnih(igracRazina);

  const holdT = useRef<number | null>(null);
  const holdDone = useRef(false);
  const [drzim, setDrzim] = useState(false);
  const [kupiOtvoren, setKupiOtvoren] = useState(false);

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
      {!imaPlijen && !winCelebration && knjigaFaza !== "igra" && !knjigaOtvorena && <TjedanTraka />}
      {!imaPlijen && !winCelebration && knjigaFaza !== "igra" && !knjigaOtvorena && <div className="mb-1.5"><JutroTraka /></div>}
      {!imaPlijen && !winCelebration && knjigaFaza !== "igra" && !knjigaOtvorena && <EventBanner dogadaj={aktivniDogadaj} />}

      <div className="slot-kolo-omot relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
        <WinCelebration />
        <div
          className={cn(
            "slot-kolo",
            imaPlijen ? "slot-kolo-uzak" : "w-full",
            (knjigaFaza === "igra" || knjigaSkup > 0) && "slot-kolo-knjiga",
            knjigaSkup > 0 && knjigaFaza !== "igra" && "slot-kolo-skup",
            winCelebration === "jackpot" && "reel-frame-jackpot",
            winCelebration === "win" && "reel-frame-win",
            winCelebration === "skull" && "reel-frame-skull",
          )}
        >
          <span className="slot-zakovica slot-zakovica-tl" aria-hidden />
          <span className="slot-zakovica slot-zakovica-tr" aria-hidden />
          <span className="slot-zakovica slot-zakovica-bl" aria-hidden />
          <span className="slot-zakovica slot-zakovica-br" aria-hidden />
          <span className="slot-lampa slot-lampa-l" aria-hidden />
          <span className="slot-ploca">BLAGO</span>
          <span className="slot-lampa slot-lampa-d" aria-hidden />
          <span className="slot-prasina" aria-hidden />
          <div className="slot-kolo-okvir">
            <div className="slot-kolo-bunar">
              <SlotReel compact={imaPlijen} />
            </div>
          </div>
        </div>
      </div>

      <div className="zavrti-traka flex w-full shrink-0 flex-col gap-1.5">
        {poruka && !jeSerifovaPoruka(poruka) && knjigaFaza !== "igra" && !knjigaOtvorena && (
          <p className="slot-poruka">{poruka}</p>
        )}
        {vrtnjaRec && !imaPlijen && (
          <p className="px-1 text-center text-[11px] font-bold leading-snug text-gold">
            {moodRec} {vrtnjaRec}
          </p>
        )}
        {!imaPlijen && (
        <KnjigaTraka
          skup={knjigaSkup}
          ostalo={besplatneVrtnje}
          faza={knjigaFaza}
          turbo={turboRezim}
          zakljucan={vrti || raidAktivan || !!dobitakNaCekanju || knjigaOtvorena || besplatneVrtnje > 0}
          sakrijKupnju={knjigaOtvorena || knjigaFaza === "igra"}
          mozeKupiti={dijamanti >= kupiCijena}
          plati={kupiOtvoren}
          onTurbo={() => {
            playSfx("button");
            setTurboRezim(!turboRezim);
          }}
          onKupi={() => {
            playSfx("button");
            if (!kupiOtvoren) {
              setKupiOtvoren(true);
              return;
            }
            kupiBesplatne();
            setKupiOtvoren(false);
          }}
        />
        )}
        {kupiOtvoren && !knjigaOtvorena && knjigaFaza !== "igra" && !imaPlijen && (
          <div className="flex flex-wrap justify-end gap-1">
            <PrikazCijene src={SYMBOL_ART.gem} iznos={kupiCijena} trenutno={dijamanti} />
          </div>
        )}
        {imaPlijen && dobitakNaCekanju ? (
          <div className="plijen-traka">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-dim uppercase">
              Trenutni plijen
            </p>
            <div className="mb-1">
              <NagradaPikseli nagrada={dobitakNaCekanju} />
            </div>
            <p className="mb-1.5 text-[11px] font-semibold text-dim">
              {gambleZakljucan
                ? "Udvostručenja gotova. Preuzmi dobitak."
                : `Još ${gambleOstalo} udvostručenja (48%)`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={gambleZakljucan}
                className="min-h-11 rounded-xl bg-ruby py-2.5 text-sm font-bold tracking-wide text-ink transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
                onClick={() => igrajGamble("red")}
              >
                CRVENA (×2)
              </button>
              <button
                type="button"
                disabled={gambleZakljucan}
                className="min-h-11 rounded-xl border-2 border-line bg-panel-2 py-2.5 text-sm font-bold tracking-wide text-ink transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
                onClick={() => igrajGamble("black")}
              >
                CRNA (×2)
              </button>
            </div>
          </div>
        ) : (
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
                  "min-h-10 min-w-11 rounded-full border px-3 py-2 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.96]",
                  ulog === op
                    ? "border-ruby bg-ruby text-ink"
                    : "border-line bg-panel text-dim",
                )}
              >
                ×{op}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          data-testid="zavrti"
          disabled={imaPlijen ? false : gumbZakljucan}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (imaPlijen) return;
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
            if (imaPlijen) {
              prestaniDrzati();
              preuzmiDobitak();
              return;
            }
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
            "zavrti-usko relative mx-auto flex min-h-12 touch-manipulation items-center justify-center overflow-hidden rounded-2xl px-8 py-3.5 font-display text-xl tracking-[0.22em] text-void select-none transition-transform duration-150 ease-out active:scale-[0.94]",
            imaPlijen
              ? "bg-volt"
              : autoVrtnja
                ? "zavrti-auto bg-gold"
                : jeFreeSpin
                  ? "zavrti-wiggle bg-xp shadow-[0_0_24px_color-mix(in_oklab,var(--color-xp)_45%,transparent)]"
                  : "zavrti-wiggle bg-energy shadow-[0_0_24px_color-mix(in_oklab,var(--color-energy)_50%,transparent)]",
            !imaPlijen && gumbZakljucan && "scale-[0.98] opacity-50 shadow-none",
          )}
        >
          <span className={cn("zavrti-hold-fill", drzim && "ide")} />
          <span className="relative z-10">
            {imaPlijen
              ? "PREUZMI"
              : autoVrtnja
                ? !jeFreeSpin && energija < ulog
                  ? "ČEKAM"
                  : "AUTO"
                : vrti
                  ? "VRTIM..."
                  : "ZAVRTI"}
          </span>
        </button>
        <p
          className={cn(
            "mt-1 text-center text-sm font-bold tabular-nums",
            energija > maxEnergija ? "text-volt" : "text-energy",
          )}
        >
          {formatHud(energija)}
        </p>
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
              disabled={zakljucan || (plati && !mozeKupiti)}
              onClick={onKupi}
              className={cn("knjiga-kupi", (mozeKupiti || !plati) && !zakljucan && "knjiga-kupi-moze")}
            >
              {plati ? "PLATI" : "KUPI"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
