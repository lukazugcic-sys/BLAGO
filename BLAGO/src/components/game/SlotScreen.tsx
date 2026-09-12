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
import { GAMBLE_MAX, izracunajEnergijaRegenMs, izracunajMaxEnergiju, raspolozenjeKaube, uskoVrtnjaRec } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { cn } from "@/lib/utils";
import { playSfx, vibrate } from "@/lib/game/audio";
import { WinCelebration } from "./WinCelebration";
import { KnjigaIgra } from "./KnjigaIgra";
import { PrikazCijene } from "./PrikazCijene";
import { kaubaOd } from "@/lib/game/ljudi";
import { cijenaBesplatnih, KNJIGA_SKUP_CILJ, BESPLATNE_KUPI } from "@/lib/game/knjiga";
import { jutroGotovo, type JutarnjiPosao } from "@/lib/game/jutro";
import { SYMBOL_ART } from "@/lib/game/art";
import { jeSerifovaPoruka } from "./ObavijestSloj";
import { SljedeciCiljCard } from "./SljedeciCiljCard";

const AUTO_HOLD_MS = 480;

function rijecEnergije(n: number) {
  if (n === 1) return "1 energija";
  return `${n} energije`;
}

function formatEta(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

function etaDoEnergije(
  energija: number,
  treba: number,
  zadnjaTick: number,
  regenMs: number,
  now: number,
) {
  const need = Math.max(0, Math.ceil(treba - energija));
  if (need <= 0) return 0;
  const nextIn = Math.max(0, zadnjaTick + regenMs - now);
  return nextIn + (need - 1) * regenMs;
}

/** Najveći ulog koji stane u trenutnu energiju (ispod trenutnog). */
function najveciDostupanUlog(ulozi: number[], energija: number, ulog: number) {
  const e = Math.max(0, Math.floor(energija));
  return [...ulozi].reverse().find((u) => u <= e && u < ulog) ?? null;
}

function jutroSEnergijom(list: JutarnjiPosao[]) {
  return list.find((p) => jutroGotovo(p) && !p.uzeto && (p.nagrada.energija || 0) > 0) ?? null;
}

function jutroSpremnoBilo(list: JutarnjiPosao[]) {
  return list.find((p) => jutroGotovo(p) && !p.uzeto) ?? null;
}

export function SlotScreen() {
  const energija = useGameStore((s) => Math.floor(s.energija));
  const baterija = useGameStore((s) => s.razine.baterija || 0);
  const zadnjaEnergijaTick = useGameStore((s) => s.zadnjaEnergijaTick);
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
  const jutro = useGameStore((s) => s.jutro);
  const otvoriJutro = useGameStore((s) => s.otvoriJutro);
  const uzmiJutarnju = useGameStore((s) => s.uzmiJutarnju);
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
  const kauba = useMemo(
    () => kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost }),
    [gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost],
  );
  const vrtnjaRec = uskoVrtnjaRec(kauba.usko);
  const moodRec = raspolozenjeKaube(kauba).rec;
  const gambleOstalo = Math.max(0, GAMBLE_MAX - gambleCount);
  const gambleZakljucan = gambleOstalo <= 0;
  const imaPlijen = !!dobitakNaCekanju && !autoVrtnja;
  const kupiCijena = cijenaBesplatnih(igracRazina);

  const holdT = useRef<number | null>(null);
  const holdDone = useRef(false);
  const [drzim, setDrzim] = useState(false);
  const [kupiOtvoren, setKupiOtvoren] = useState(false);
  const [etaMs, setEtaMs] = useState(0);
  const [etaJednaMs, setEtaJednaMs] = useState(0);

  const energijaNedostaje = !jeFreeSpin && energija < ulog;
  const trebaDoUloga = Math.max(0, ulog - energija);
  const smanjiNa = useMemo(
    () => (energijaNedostaje ? najveciDostupanUlog(ulozi, energija, ulog) : null),
    [energijaNedostaje, ulozi, energija, ulog],
  );
  const sest = useMemo(() => {
    const baza = sestUloga(ulozi, ulog);
    if (smanjiNa == null || baza.includes(smanjiNa)) return baza;
    // Predloženi ulog uvijek vidljiv u redu.
    return [smanjiNa, ...baza.filter((u) => u !== smanjiNa)].slice(0, 6);
  }, [ulozi, ulog, smanjiNa]);
  const jutroEnergija = useMemo(
    () => (energijaNedostaje ? jutroSEnergijom(jutro) : null),
    [energijaNedostaje, jutro],
  );
  const jutroSpremno = useMemo(
    () => (energijaNedostaje && !jutroEnergija ? jutroSpremnoBilo(jutro) : null),
    [energijaNedostaje, jutro, jutroEnergija],
  );
  const mozeSmanjiti = smanjiNa != null && !vrti && !raidAktivan && !knjigaOtvorena && !imaPlijen;
  /** Gumb nije mrtav zid: SMANJI ili čekaj. */
  const gumbNiskaEnergijaAkcija = energijaNedostaje && !autoVrtnja && (mozeSmanjiti || !!jutroEnergija);
  const gumbZakljucan =
    raidAktivan ||
    knjigaOtvorena ||
    (!autoVrtnja && (vrti || (energijaNedostaje && !mozeSmanjiti && !jutroEnergija)));

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const gs = useGameStore.getState();
      const e = Math.floor(gs.energija);
      const rMs = izracunajEnergijaRegenMs(gs.razine.baterija || 0);
      const ul = useSlotStore.getState().ulog;
      const free = gs.luckySpinCounter === 1 || gs.besplatneVrtnje > 0;
      const tickAt = gs.zadnjaEnergijaTick || now;
      if (free || e >= ul) {
        setEtaMs(0);
      } else {
        setEtaMs(etaDoEnergije(e, ul, tickAt, rMs, now));
      }
      if (free || e >= 1) {
        setEtaJednaMs(0);
      } else {
        setEtaJednaMs(etaDoEnergije(e, 1, tickAt, rMs, now));
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [energija, ulog, zadnjaEnergijaTick, baterija, jeFreeSpin, besplatneVrtnje, luckySpinCounter]);

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
      {!imaPlijen && !winCelebration && knjigaFaza !== "igra" && !knjigaOtvorena && (
        <SljedeciCiljCard kompaktna />
      )}

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
          kupiCijena={kupiCijena}
          kupiN={BESPLATNE_KUPI.n}
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
          <div className="flex flex-col items-end gap-0.5">
            <PrikazCijene src={SYMBOL_ART.gem} iznos={kupiCijena} trenutno={dijamanti} />
            <p className="text-[10px] font-bold text-dim">
              {BESPLATNE_KUPI.n} besplatnih vrtnji · dijamanti
            </p>
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
          <div className="flex flex-col gap-1">
            <div className="ulozi-red">
              {sest.map((op) => {
                const staze = !jeFreeSpin && energija >= op;
                const predlozen = smanjiNa === op;
                return (
                <button
                  key={op}
                  type="button"
                  title={`×${op} · ${rijecEnergije(op)}${staze ? "" : " · nema energije"}`}
                  aria-label={`Ulog ×${op}, košta ${rijecEnergije(op)}`}
                  aria-pressed={ulog === op}
                  onClick={() => {
                    playSfx("button");
                    setUlog(op);
                  }}
                  className={cn(
                    "min-h-10 min-w-11 rounded-full border px-3 py-2 text-sm font-bold transition-transform duration-150 ease-out active:scale-[0.96]",
                    ulog === op
                      ? "border-ruby bg-ruby text-ink"
                      : predlozen
                        ? "border-energy bg-energy/20 text-energy ring-1 ring-energy/50"
                        : staze || jeFreeSpin
                          ? "border-line bg-panel text-dim"
                          : "border-line/50 bg-panel/50 text-dim/50",
                  )}
                >
                  ×{op}
                </button>
                );
              })}
            </div>
            <p
              className={cn(
                "text-center text-[10px] font-bold tracking-wide",
                energijaNedostaje ? "text-energy" : "text-dim",
              )}
            >
              ×{ulog} · {rijecEnergije(ulog)}
              <span className="font-semibold opacity-70"> · isplata ×{ulog}</span>
            </p>
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
            // Niska energija: SMANJI je primarna akcija, ne spin.
            if (!jeFreeSpin && energija < ulog) {
              holdDone.current = false;
              return;
            }
            if (vrti) return;
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
            if (!jeFreeSpin && energija < ulog) {
              if (smanjiNa != null) {
                playSfx("button");
                setUlog(smanjiNa);
                useGameStore.setState({ poruka: `SMANJENO NA ×${smanjiNa}` });
                return;
              }
              if (jutroEnergija) {
                playSfx("button");
                uzmiJutarnju(jutroEnergija.id);
                return;
              }
              return;
            }
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
                  : gumbNiskaEnergijaAkcija
                    ? "zavrti-wiggle bg-gold shadow-[0_0_20px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
                    : "zavrti-wiggle bg-energy shadow-[0_0_24px_color-mix(in_oklab,var(--color-energy)_50%,transparent)]",
            !imaPlijen && gumbZakljucan && "scale-[0.98] opacity-50 shadow-none",
          )}
        >
          <span className={cn("zavrti-hold-fill", drzim && "ide")} />
          <span className="relative z-10">
            {imaPlijen
              ? "PREUZMI"
              : autoVrtnja
                ? energijaNedostaje
                  ? "ČEKAM"
                  : "AUTO"
                : vrti
                  ? "VRTIM..."
                  : energijaNedostaje
                    ? smanjiNa != null
                      ? `SMANJI ×${smanjiNa}`
                      : jutroEnergija
                        ? `UZMI +${jutroEnergija.nagrada.energija || 0}`
                        : "PUNI SE"
                    : "ZAVRTI"}
          </span>
        </button>
        <div className="mt-1 flex flex-col items-center gap-1">
          <p
            className={cn(
              "text-center text-sm font-bold tabular-nums",
              energija > maxEnergija ? "text-volt" : "text-energy",
            )}
            aria-label={`Energija ${formatHud(energija)} od ${formatHud(maxEnergija)}`}
          >
            <span className="mr-1.5 text-[10px] font-bold tracking-[0.18em] text-dim uppercase">
              Energija
            </span>
            {formatHud(energija)}
            <span className="text-dim">/{formatHud(maxEnergija)}</span>
          </p>
          {energijaNedostaje && (
            <div className="flex w-full max-w-sm flex-col items-center gap-1.5">
              <p className="text-center text-[11px] font-bold text-energy/90">
                {energija <= 0
                  ? `Puni se do ${formatHud(maxEnergija)} · ×1 za ${etaJednaMs > 0 ? formatEta(etaJednaMs) : "…"}`
                  : `Do ×${ulog}: još ${trebaDoUloga} · ${etaMs > 0 ? formatEta(etaMs) : "…"}`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {smanjiNa != null && (
                  <button
                    type="button"
                    data-testid="smanji-ulog"
                    onClick={() => {
                      playSfx("button");
                      setUlog(smanjiNa);
                      useGameStore.setState({ poruka: `SMANJENO NA ×${smanjiNa}` });
                    }}
                    className="min-h-9 rounded-full border border-energy bg-energy/20 px-3 text-[11px] font-bold tracking-wide text-energy"
                  >
                    Smanji na ×{smanjiNa} · vrti sad
                  </button>
                )}
                {jutroEnergija && (
                  <button
                    type="button"
                    data-testid="uzmi-jutro-energija"
                    onClick={() => {
                      playSfx("button");
                      uzmiJutarnju(jutroEnergija.id);
                    }}
                    className="min-h-9 rounded-full border border-quest bg-quest/20 px-3 text-[11px] font-bold tracking-wide text-quest"
                  >
                    Uzmi jutro · +{jutroEnergija.nagrada.energija} energije
                  </button>
                )}
                {!jutroEnergija && jutroSpremno && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("button");
                      otvoriJutro();
                    }}
                    className="min-h-9 rounded-full border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wide text-gold"
                  >
                    Jutros · nagrada čeka
                  </button>
                )}
                {smanjiNa == null && !jutroEnergija && !jutroSpremno && (
                  <p className="text-center text-[10px] font-bold text-dim">
                    Vrati se za malo · ili KUPI vrtnje dijamantima
                  </p>
                )}
              </div>
            </div>
          )}
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
  sakrijKupnju,
  plati,
  kupiCijena,
  kupiN,
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
  kupiCijena: number;
  kupiN: number;
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
              title={plati ? `Plati ${kupiCijena} dijamanta za ${kupiN} vrtnji` : `Kupi ${kupiN} besplatnih vrtnji`}
              className={cn("knjiga-kupi", (mozeKupiti || !plati) && !zakljucan && "knjiga-kupi-moze")}
            >
              {plati ? `PLATI ${kupiCijena}` : `KUPI ${kupiN}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
