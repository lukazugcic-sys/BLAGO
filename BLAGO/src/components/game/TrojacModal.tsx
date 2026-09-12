import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLive } from "@/lib/multiplayer";
import { jeLegalniPotez, potezIzDelte, type Hrpe, type NimPotez, type TrojacTko } from "@/lib/game/raids";
import { ART, SYMBOL_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { delay } from "@/lib/game/helpers";
import { hitstop, shake } from "@/lib/context/UIContext";
import { cn } from "@/lib/utils";

const HRPA_ART = [SYMBOL_ART.wood, SYMBOL_ART.stone, SYMBOL_ART.iron] as const;
const HRPA_IME = ["Drvo", "Kamen", "Željezo"] as const;

function npcDelayMs() {
  if (typeof window === "undefined") return 80;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 280;
}

export function TrojacModal() {
  const live = useLive();
  const t = live.trojac;
  const [leaving, setLeaving] = useState<NimPotez | null>(null);
  const [hover, setHover] = useState<{ hrpa: number; skini: number } | null>(null);
  const hrpeRef = useRef<Hrpe>([0, 0, 0]);
  const lock = useRef(false);

  useEffect(() => {
    if (!t || t.faza === "poziv") {
      setLeaving(null);
      lock.current = false;
      return;
    }
    const delta = potezIzDelte(hrpeRef.current, t.hrpe);
    if (delta && t.naPotezu !== (t.uloga === "vodja" ? "vodja" : "saveznik")) {
      setLeaving(delta);
      const id = window.setTimeout(() => setLeaving(null), npcDelayMs());
      hrpeRef.current = t.hrpe;
      return () => window.clearTimeout(id);
    }
    hrpeRef.current = t.hrpe;
  }, [t]);

  if (!t || t.faza === "poziv" || typeof document === "undefined") return null;

  const hrpe = t.hrpe;
  const moj: TrojacTko = t.uloga;
  const igrac = t.faza === "igra" && t.naPotezu === moj && !lock.current;
  const recNaPotezu =
    t.naPotezu === "serif"
      ? `Šerif ${t.meta.serif} bira`
      : t.naPotezu === moj
        ? "Ti biraš hrpu"
        : `${t.ime} bira`;

  const odigraj = async (potez: NimPotez) => {
    if (!igrac || !jeLegalniPotez(hrpe, potez) || lock.current) return;
    lock.current = true;
    playSfx("attack");
    hitstop(50);
    shake("soft");
    setLeaving(potez);
    await delay(npcDelayMs());
    setLeaving(null);
    live.igrajTrojac(potez);
    lock.current = false;
  };

  const zatvori = () => {
    if (t.faza === "igra") live.bjeziTrojac();
    else live.odbijTrojac();
  };

  const pobjeda = t.faza === "kraj" && t.pobjednik === moj;
  const serif = t.faza === "kraj" && t.pobjednik === "serif";

  return createPortal(
    <div
      className="modal-pozadina fixed inset-0 z-[91] flex items-center justify-center bg-void/85 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trojac-title"
    >
      <div className="modal-ulaz flex max-h-[min(42rem,92dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/50 bg-panel shadow-[0_18px_50px_rgb(0_0_0_/_0.55)]">
        <div
          className="relative h-16 shrink-0 overflow-hidden sm:h-20"
          style={{
            backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--color-void) 15%, transparent), color-mix(in oklab, var(--color-void) 92%, #0e2a28)), url(${ART.raid})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <div className="flex items-center gap-2.5 px-4 pt-3">
          <img src={SYMBOL_ART.skull} alt="" className="village-pixel size-7" draggable={false} />
          <h2 id="trojac-title" className="flex-1 text-base font-bold tracking-widest text-gold uppercase">
            {t.faza === "ceka" ? "Jato" : t.faza === "kraj" ? "Prašina" : "Trojac"}
          </h2>
          <button
            type="button"
            onClick={zatvori}
            className="flex size-11 items-center justify-center rounded-lg text-lg text-dim"
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>

        {t.faza === "ceka" && (
          <div className="px-5 pb-6 pt-2">
            <p className="text-center text-sm font-bold text-ink">{t.ime} čuje jato.</p>
            <p className="mt-1 text-center text-xs font-bold text-dim">
              Meta {t.meta.ime}. Šerif {t.meta.serif}.
            </p>
            <div className="pohod-ceka-tacke mt-4 flex justify-center gap-1.5" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {t.faza === "kraj" && (
          <div className="px-5 pb-5 pt-2">
            <p className="mb-3 text-sm font-bold text-ink">
              {pobjeda
                ? `Zadnji žeton. Vreće idu tvom sedlu. ${t.meta.ime} šuti.`
                : serif
                  ? `Šerif ${t.meta.serif} uzima zadnji žeton. Jato ide prazno.`
                  : `${t.ime} uzima zadnji žeton. Ti jašeš prazan.`}
            </p>
            {pobjeda && (
              <p className="mb-3 text-xs font-bold text-gold">Plijen u ostavi. Broji vreće.</p>
            )}
            <button
              type="button"
              onClick={() => {
                playSfx("button");
                live.odbijTrojac();
              }}
              className="min-h-12 w-full rounded-xl bg-gold py-3 text-sm font-bold tracking-widest text-void"
            >
              U TABOR
            </button>
          </div>
        )}

        {t.faza === "igra" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-1">
            <div className="trojac-duel mb-2 grid grid-cols-3 gap-1 rounded-xl border border-line bg-void/50 px-2 py-1.5">
              <p className={cn("text-center text-[10px] font-bold tracking-wide uppercase", t.naPotezu === "vodja" ? "text-gold pohod-potez-ti" : "text-dim")}>
                {t.uloga === "vodja" ? "Ti" : t.ime}
              </p>
              <p className={cn("text-center text-[10px] font-bold tracking-wide uppercase", t.naPotezu === "saveznik" ? "text-gold pohod-potez-ti" : "text-dim")}>
                {t.uloga === "saveznik" ? "Ti" : t.saveznikTu ? t.ime : "—"}
              </p>
              <p className={cn("text-center text-[10px] font-bold tracking-wide uppercase", t.naPotezu === "serif" ? "text-ice pohod-potez-ti" : "text-ruby")}>
                {t.meta.serif}
              </p>
            </div>
            <p className="mb-2 text-xs leading-relaxed text-dim" aria-live="polite">
              {t.meta.rec} {igrac ? "Dodirni žeton — uzimaš njega i sve iznad. Zadnji nosi sve." : recNaPotezu + ". Čekaj."}
            </p>
            <div className="relative grid grid-cols-3 gap-2">
              <span className="pohod-prasina-ploca" aria-hidden />
              {HRPA_IME.map((label, hi) => {
                const n = hrpe[hi] ?? 0;
                return (
                  <div key={label} className="flex flex-col rounded-xl border border-line bg-panel-2 p-2">
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <img src={HRPA_ART[hi]} alt="" className="village-pixel size-5" draggable={false} />
                      <span className="text-xs font-bold tracking-wide text-ink uppercase">{label}</span>
                    </div>
                    <div
                      className="flex min-h-40 flex-col items-center justify-end gap-0.5"
                      onPointerLeave={() => setHover(null)}
                    >
                      {n <= 0 && <span className="text-xs font-bold text-dim">prazno</span>}
                      {Array.from({ length: n }, (_, fromTop) => {
                        const skini = fromTop + 1;
                        const uzimam = igrac && hover?.hrpa === hi && skini <= hover.skini;
                        const leti = leaving?.hrpa === hi && skini <= leaving.skini;
                        return (
                          <button
                            key={`${hi}-${fromTop}-${n}`}
                            type="button"
                            disabled={!igrac}
                            aria-label={`Uzmi ${skini} s hrpe ${label}`}
                            onPointerEnter={() => {
                              if (igrac) setHover({ hrpa: hi, skini });
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!igrac) return;
                              void odigraj({ hrpa: hi as 0 | 1 | 2, skini });
                              setHover(null);
                            }}
                            className={cn(
                              "nim-token flex size-11 items-center justify-center rounded-full",
                              uzimam && "nim-token-take",
                              t.naPotezu === "serif" && "nim-token-npc",
                              leti && "nim-token-leti",
                            )}
                          >
                            <img src={HRPA_ART[hi]} alt="" className="village-pixel size-8" draggable={false} />
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-center text-xs font-bold tabular-nums text-dim">{n}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[10px] font-bold tracking-wide text-dim uppercase">
              Zadnji žeton nosi sve. Prijatelj ili šerif.
            </p>
            <button
              type="button"
              onClick={() => {
                playSfx("button");
                live.bjeziTrojac();
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-line bg-panel-2 text-xs font-bold tracking-widest text-dim uppercase"
            >
              Bježi
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
