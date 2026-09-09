import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useSlotMachine } from "@/lib/hooks/useSlotMachine";
import { useSeasonalEvent } from "@/lib/hooks/useSeasonalEvent";
import { SlotReel } from "./SlotReel";
import { EventBanner } from "./EventBanner";
import { TjedanTraka } from "./TjedanTraka";
import { JutroTraka } from "./JutroSheet";
import { NagradaPikseli } from "./NagradaPikseli";
import {
  LUCKY_SPIN_INTERVAL,
  uloziZaMax,
} from "@/lib/game/constants";
import { GAMBLE_MAX, izracunajMaxEnergiju, raspolozenjeKaube, uskoVrtnjaRec } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { WinCelebration } from "./WinCelebration";
import { kaubaOd } from "@/lib/game/ljudi";

const AUTO_HOLD_MS = 480;

export function SlotScreen() {
  const poruka = useGameStore((s) => s.poruka);
  const energija = useGameStore((s) => Math.floor(s.energija));
  const baterija = useGameStore((s) => s.razine.baterija || 0);
  const gradevine = useGameStore((s) => s.gradevine);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const luckySpinCounter = useGameStore((s) => s.luckySpinCounter);
  const winStreak = useGameStore((s) => s.winStreak);
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
  const setAutoVrtnja = useSlotStore((s) => s.setAutoVrtnja);
  const { zavrtiMasinu, preuzmiDobitak, igrajGamble } = useSlotMachine();

  const jeFreeSpin = luckySpinCounter === 1;
  const maxEnergija = izracunajMaxEnergiju(baterija);
  const ulozi = useMemo(() => uloziZaMax(maxEnergija), [maxEnergija]);
  const kauba = useMemo(
    () => kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo }),
    [gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo],
  );
  const vrtnjaRec = uskoVrtnjaRec(kauba.usko);
  const moodRec = raspolozenjeKaube(kauba).rec;
  const gumbZakljucan =
    raidAktivan || (!autoVrtnja && (vrti || (!jeFreeSpin && energija < ulog)));
  const gambleOstalo = Math.max(0, GAMBLE_MAX - gambleCount);
  const gambleZakljucan = gambleOstalo <= 0;
  const imaPlijen = !!dobitakNaCekanju && !autoVrtnja;
  const alarm = /NAPAD|ODUZETO|STAO|GORI|OPASNOST|NEDOVOLJNO|NEDOSTAJU|LEVEL UP/.test(poruka);

  const holdT = useRef<number | null>(null);
  const holdDone = useRef(false);
  const [drzim, setDrzim] = useState(false);

  const prestaniDrzati = () => {
    if (holdT.current != null) {
      window.clearTimeout(holdT.current);
      holdT.current = null;
    }
    setDrzim(false);
  };

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
    if (vrti) return;
    if (dobitakNaCekanju) {
      const t = window.setTimeout(() => preuzmiDobitak(), 700);
      return () => window.clearTimeout(t);
    }
    const gs = useGameStore.getState();
    const besplatna = gs.luckySpinCounter === 1;
    if (!besplatna && gs.energija < ulog) {
      useGameStore.setState({ poruka: "PUNI SE ENERGIJA…" });
      return;
    }
    const t = window.setTimeout(() => void zavrtiMasinu(), 220);
    return () => window.clearTimeout(t);
  }, [autoVrtnja, vrti, dobitakNaCekanju, raidAktivan, ulog, energija, preuzmiDobitak, zavrtiMasinu, setAutoVrtnja]);

  const sretnaAuto = useRef(false);
  useEffect(() => {
    if (raidAktivan) {
      sretnaAuto.current = false;
      return;
    }
    if (autoVrtnja) return;
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
  }, [jeFreeSpin, vrti, dobitakNaCekanju, raidAktivan, autoVrtnja, zavrtiMasinu, preuzmiDobitak]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      const slot = useSlotStore.getState();
      if (slot.raidAktivan) return;
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
    <div className="slot-fx-host relative mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden px-3 pb-2 pt-2">
      <WinCelebration />
      {!imaPlijen && <TjedanTraka />}
      {!imaPlijen && <div className="mb-2"><JutroTraka /></div>}
      {!imaPlijen && <EventBanner dogadaj={aktivniDogadaj} />}

      <p
        className={cn(
          "mb-2 shrink-0 truncate text-center text-xs font-bold tracking-wide uppercase",
          alarm ? "text-ruby" : "text-dim",
        )}
      >
        {poruka}
      </p>

      <div
        className={cn(
          "flex w-full justify-center",
          imaPlijen ? "min-h-0 flex-1 items-center overflow-hidden" : "mb-2 shrink-0",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border p-1.5",
            imaPlijen ? "w-[min(78%,20rem)]" : "w-full p-2",
            winCelebration === "jackpot" && "reel-frame-jackpot border-gold",
            winCelebration === "win" && "reel-frame-win border-gold/70",
            winCelebration === "skull" && "reel-frame-skull border-ruby",
            !winCelebration &&
              "border-gold/50 bg-panel shadow-[0_12px_40px_color-mix(in_oklab,var(--color-gold)_22%,transparent)]",
          )}
        >
          <div className="h-full overflow-hidden rounded-xl border-2 border-void/40 bg-void p-1.5">
            <SlotReel compact={imaPlijen} />
          </div>
        </div>
      </div>

      {dobitakNaCekanju ? (
        <div className="w-full shrink-0 rounded-2xl border border-gold/70 bg-gold/10 px-3 py-2.5 text-center">
          <p className="mb-1 text-[10px] font-bold tracking-widest text-dim uppercase">
            Trenutni plijen
          </p>
          <div className="mb-1.5">
            <NagradaPikseli nagrada={dobitakNaCekanju} />
          </div>
          <p className="mb-1.5 text-[11px] font-semibold text-dim">
            {gambleZakljucan
              ? "Udvostručenja iskorištena — preuzmi dobitak"
              : `Još ${gambleOstalo} udvostručenja (48%)`}
          </p>
          <div className="mb-2 grid grid-cols-2 gap-2">
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
          <button
            type="button"
            className="min-h-11 w-full rounded-xl bg-volt py-2.5 text-sm font-bold tracking-wide text-void transition-transform duration-150 ease-out active:scale-[0.96]"
            onClick={preuzmiDobitak}
          >
            PREUZMI
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col justify-end gap-2">
          {vrtnjaRec && (
            <p className="px-1 text-center text-[11px] font-bold leading-snug text-gold">
              {moodRec} {vrtnjaRec}
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-xp/20 bg-xp/10">
              <div
                className="h-full rounded-full bg-xp transition-[width] duration-300"
                style={{
                  width: `${((LUCKY_SPIN_INTERVAL - luckySpinCounter) / LUCKY_SPIN_INTERVAL) * 100}%`,
                }}
              />
            </div>
            <span
              className={cn(
                "shrink-0 text-xs font-bold tabular-nums",
                jeFreeSpin ? "text-volt" : "text-dim",
              )}
            >
              {jeFreeSpin ? "SRETNA" : `Sretna ${luckySpinCounter}`}
            </span>
            {winStreak >= 2 && (
              <span className="shrink-0 rounded-md border border-quest/40 bg-quest/15 px-2 py-1 text-[11px] font-bold text-quest">
                NIZ ×{winStreak}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playSfx("button");
                setTurboRezim(!turboRezim);
              }}
              className={cn(
                "inline-flex min-h-9 items-center gap-1 rounded-md border px-2.5 text-[11px] font-bold tracking-wide",
                turboRezim
                  ? "border-volt bg-volt text-void"
                  : "border-line bg-panel text-dim",
              )}
            >
              <Zap className="size-3.5" strokeWidth={2.5} />
              TURBO
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {ulozi.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => {
                  playSfx("button");
                  setUlog(op);
                }}
                className={cn(
                  "min-h-11 min-w-14 rounded-full border px-4 py-2.5 text-base font-bold transition-transform duration-150 ease-out active:scale-[0.96]",
                  ulog === op
                    ? "border-ruby bg-ruby text-ink"
                    : "border-line bg-panel text-dim",
                )}
              >
                ×{op}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="zavrti"
            disabled={gumbZakljucan}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.pointerType === "mouse" && e.button !== 0) return;
              if (raidAktivan) return;
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
              if (gotovo || raidAktivan) return;
              void zavrtiMasinu();
            }}
            onPointerCancel={prestaniDrzati}
            className={cn(
              "relative flex min-h-12 w-full touch-manipulation items-center justify-center overflow-hidden rounded-2xl py-3.5 font-display text-xl tracking-[0.22em] text-void select-none transition-transform duration-150 ease-out active:scale-[0.94]",
              autoVrtnja
                ? "zavrti-auto bg-gold"
                : jeFreeSpin
                  ? "zavrti-wiggle bg-xp shadow-[0_0_24px_color-mix(in_oklab,var(--color-xp)_45%,transparent)]"
                  : "zavrti-wiggle bg-energy shadow-[0_0_24px_color-mix(in_oklab,var(--color-energy)_50%,transparent)]",
              gumbZakljucan && "scale-[0.98] opacity-50 shadow-none",
            )}
          >
            <span className={cn("zavrti-hold-fill", drzim && "ide")} />
            <span className="absolute left-3 z-10 inline-flex min-h-7 items-center rounded-full bg-void/35 px-2 py-0.5 text-xs font-bold tabular-nums text-ink">
              {formatHud(energija)}/{formatHud(maxEnergija)}
            </span>
            <span className="relative z-10 px-16">
              {autoVrtnja
                ? !jeFreeSpin && energija < ulog
                  ? "ČEKAM"
                  : "AUTO"
                : vrti
                  ? "VRTIM..."
                  : jeFreeSpin
                    ? "SRETNA"
                    : "ZAVRTI"}
            </span>
            {autoVrtnja ? (
              <span className="absolute right-5 z-10 rounded-full bg-void/25 px-2 py-1 text-xs font-bold tracking-widest">
                STOP
              </span>
            ) : (
              !jeFreeSpin && (
                <span className="absolute right-5 z-10 inline-flex items-center gap-0.5 rounded-full bg-void/20 px-2 py-1 text-xs font-bold">
                  −{ulog}
                </span>
              )
            )}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-dim">
            {autoVrtnja
              ? !jeFreeSpin && energija < ulog
                ? "Čeka energiju — auto ide dalje sam"
                : "Dodirni za stop"
              : "Drži ZAVRTI za auto · razmaknica"}
          </p>
        </div>
      )}
    </div>
  );
}
