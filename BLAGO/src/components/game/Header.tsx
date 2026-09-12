import { Volume2, VolumeX, Maximize2, Minimize2, Crown, User, Settings } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useLive } from "@/lib/multiplayer";
import { AnimatedStat } from "./AnimatedStat";
import { AuthChip } from "./AuthChip";
import { BetaSheet } from "./BetaSheet";
import { izracunajPotrebniXp } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { SYMBOL_ART } from "@/lib/game/art";
import { IconBadge } from "./IconBadge";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";

const CHIP_META = [
  { icon: SYMBOL_ART.gold, label: "zlato", fullName: "zlato" },
  { icon: SYMBOL_ART.gem, label: "dij.", fullName: "dijamanti" },
  { icon: SYMBOL_ART.wood, label: "drvo", fullName: "drvo" },
  { icon: SYMBOL_ART.stone, label: "kamen", fullName: "kamen" },
  { icon: SYMBOL_ART.iron, label: "žel.", fullName: "željezo" },
] as const;

export function Header({
  muted,
  onToggleMute,
  nativeFs,
  canNativeFs,
  onToggleFullscreen,
}: {
  muted: boolean;
  onToggleMute: () => void;
  nativeFs: boolean;
  canNativeFs: boolean;
  onToggleFullscreen: () => void;
}) {
  const igracRazina = useGameStore((s) => s.igracRazina);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const krunjenja = useGameStore((s) => s.krunjenja);
  const xp = useGameStore((s) => s.xp);
  const zadnjiXp = useGameStore((s) => s.zadnjiXp);
  const xpFlash = useGameStore((s) => s.xpFlash);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const dijamanti = useGameStore((s) => s.dijamanti);
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const kamen = useGameStore((s) => Math.floor(s.resursi.kamen));
  const zeljezo = useGameStore((s) => Math.floor(s.resursi.zeljezo));
  const preuzetoDanas = useGameStore((s) => s.preuzetoDanas);
  const otvoriDnevnuNagradu = useGameStore((s) => s.otvoriDnevnuNagradu);
  const stitovi = useGameStore((s) => s.stitovi);
  const live = useLive();
  const online = useMemo(
    () => live.cowboys.reduce((n, c) => n + (c.connected ? 1 : 0), 0),
    [live.cowboys],
  );
  const [beta, setBeta] = useState(false);
  const [karta, setKarta] = useState(false);

  const potrebanXp = izracunajPotrebniXp(igracRazina);
  const xpPct = Math.min(100, (xp / Math.max(1, potrebanXp)) * 100);

  useEffect(() => {
    if (!karta) return;
    const zatvori = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".kru-okvir") || t?.closest?.(".karta-izbornik")) return;
      setKarta(false);
    };
    window.addEventListener("pointerdown", zatvori);
    return () => window.removeEventListener("pointerdown", zatvori);
  }, [karta]);

  return (
    <header className="z-20 shrink-0 border-b border-line bg-void/92 px-2.5 pb-1.5 pt-[max(0.3rem,env(safe-area-inset-top))]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="kru-sivi relative flex size-8 shrink-0 items-center justify-center text-xs font-bold text-ink">
          {igracRazina}
          {(prestigeRazina > 0 || krunjenja > 0) && (
            <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-prestige text-[7px] font-bold text-void">
              {krunjenja > 0 ? krunjenja : <Crown className="size-2" strokeWidth={2.5} />}
            </span>
          )}
        </div>
        <div className="xp-traka relative h-7 min-w-0 flex-1">
          <div className="xp-traka-tijelo">
            <div className="xp-traka-punjenje" style={{ width: `${xpPct}%` }} />
            <span className="xp-traka-sjaj" aria-hidden />
            <span className="xp-traka-broj">
              {formatHud(xp)}/{formatHud(potrebanXp)} XP
            </span>
          </div>
          {xpFlash > 0 && zadnjiXp > 0 && (
            <span
              key={xpFlash}
              className="xp-float pointer-events-none absolute -top-0.5 right-2 text-[10px] font-bold text-xp"
            >
              +{zadnjiXp}
            </span>
          )}
        </div>
        <div className="kru-stit" aria-label="Štitovi">
          {stitovi}
        </div>
        <div className="kru-okvir relative">
          <button
            type="button"
            aria-label="Izbornik"
            aria-expanded={karta}
            onClick={() => {
              playSfx("button");
              setKarta((v) => !v);
            }}
            className="kru-sivi kru-sredina"
          >
            <Settings className="kru-bijeli-zup size-3.5" strokeWidth={2.4} />
            <span className="kru-zupcanik" aria-hidden />
          </button>
          {!preuzetoDanas && (
            <button
              type="button"
              onClick={otvoriDnevnuNagradu}
              aria-label="Dnevna nagrada"
              className="kru-dan"
            >
              <IconBadge src={SYMBOL_ART.gold} size="xs" />
            </button>
          )}
          {karta && (
            <div className="karta-izbornik">
              <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Karta</p>
              <button
                type="button"
                onClick={() => {
                  setBeta(true);
                  setKarta(false);
                }}
                className="karta-red"
                aria-label="Beta info"
              >
                <span
                  className={
                    live.joined && online > 0
                      ? "size-1.5 rounded-full bg-volt"
                      : "size-1.5 rounded-full bg-gold"
                  }
                />
                Beta{online > 0 ? ` · ${online}` : ""}
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                className="karta-red"
                aria-label={muted ? "Uključi zvuk" : "Isključi zvuk"}
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {muted ? "Bez zvuka" : "Zvuk"}
              </button>
              {canNativeFs && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="karta-red"
                  aria-label={nativeFs ? "Izlaz iz punog ekrana" : "Puni ekran"}
                >
                  {nativeFs ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                  {nativeFs ? "Uži ekran" : "Puni ekran"}
                </button>
              )}
              <div className="karta-red">
                <User className="size-3.5" />
                <span className="min-w-0 flex-1">Profil</span>
                <AuthChip />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        <Chip value={zlato} {...CHIP_META[0]!} />
        <Chip value={dijamanti} {...CHIP_META[1]!} />
        <Chip value={drvo} {...CHIP_META[2]!} />
        <Chip value={kamen} {...CHIP_META[3]!} />
        <Chip value={zeljezo} {...CHIP_META[4]!} />
      </div>
      <BetaSheet open={beta} onClose={() => setBeta(false)} />
    </header>
  );
}

const Chip = memo(function Chip({
  value,
  icon,
  label,
  fullName,
}: {
  value: number;
  icon: string;
  label: string;
  fullName: string;
}) {
  const [otkriven, setOtkriven] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const otkrij = () => {
    setOtkriven(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOtkriven(false), 1800);
  };

  return (
    <AnimatedStat
      value={value}
      className="relative flex h-9 min-w-0 flex-col items-center justify-center gap-0 rounded-full border border-line bg-panel px-1 py-0.5"
    >
      <button
        type="button"
        onClick={otkrij}
        className="flex w-full min-w-0 flex-col items-center justify-center gap-0 rounded-full outline-none active:scale-[0.97] touch-manipulation"
        title={fullName}
        aria-label={`${fullName}: ${formatHud(value)}`}
        aria-expanded={otkriven}
      >
        <span className="flex min-w-0 items-center justify-center gap-0.5">
          <IconBadge src={icon} size="xs" />
          <span className="text-[11px] font-bold tabular-nums leading-none text-ink">
            {formatHud(value)}
          </span>
        </span>
        <span
          className={cn(
            "chip-ime pointer-events-none absolute inset-x-0 bottom-0 truncate text-center text-[8px] font-bold leading-none tracking-[0.1em] text-dim uppercase",
            otkriven ? "chip-ime-on" : "chip-ime-off",
          )}
          aria-hidden={!otkriven}
        >
          {label}
        </span>
      </button>
    </AnimatedStat>
  );
});
