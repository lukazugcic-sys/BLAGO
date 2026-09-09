import { Volume2, VolumeX, Maximize2, Minimize2, Crown } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useLive } from "@/lib/multiplayer";
import { AnimatedStat } from "./AnimatedStat";
import { AuthChip } from "./AuthChip";
import { BetaSheet } from "./BetaSheet";
import { izracunajMaxStitova, izracunajPotrebniXp } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { SYMBOL_ART } from "@/lib/game/art";
import { IconBadge } from "./IconBadge";

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
  const stitovi = useGameStore((s) => s.stitovi);
  const oklop = useGameStore((s) => s.razine.oklop || 0);
  const preuzetoDanas = useGameStore((s) => s.preuzetoDanas);
  const otvoriDnevnuNagradu = useGameStore((s) => s.otvoriDnevnuNagradu);
  const live = useLive();
  const online = live.cowboys.filter((c) => c.connected).length;
  const [beta, setBeta] = useState(false);

  const maxStitova = izracunajMaxStitova(oklop);
  const potrebanXp = izracunajPotrebniXp(igracRazina);
  const xpPct = Math.min(100, (xp / Math.max(1, potrebanXp)) * 100);

  return (
    <header className="z-10 shrink-0 border-b border-line bg-void/92 px-2.5 pb-1.5 pt-[max(0.3rem,env(safe-area-inset-top))]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="xp-nivo relative flex size-8 shrink-0 items-center justify-center text-xs font-bold text-void">
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
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setBeta(true)}
            className="flex h-8 items-center gap-1 rounded-full border border-gold/45 bg-gold/15 px-2 text-[9px] font-bold tracking-wider text-gold uppercase"
            aria-label="Beta info"
          >
            <span
              className={
                live.joined && online > 0
                  ? "size-1.5 rounded-full bg-volt"
                  : live.joined
                    ? "size-1.5 rounded-full bg-gold"
                    : "size-1.5 rounded-full bg-dim"
              }
            />
            beta
            {online > 0 ? ` ${online}` : ""}
          </button>
          {!preuzetoDanas && (
            <button
              type="button"
              onClick={otvoriDnevnuNagradu}
              aria-label="Dnevna nagrada"
              className="relative flex size-8 items-center justify-center rounded-full border border-gold/55 bg-gold/20"
            >
              <IconBadge src={SYMBOL_ART.gold} size="xs" />
              <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-gold" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Uključi zvuk" : "Isključi zvuk"}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-panel-2 text-dim"
          >
            {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </button>
          {canNativeFs && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={nativeFs ? "Izlaz iz punog ekrana" : "Puni ekran"}
              className="flex size-8 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold"
            >
              {nativeFs ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          )}
          <AuthChip />
        </div>
      </div>

      <div className="flex gap-1.5">
        <div className="grid min-w-0 flex-[2] grid-cols-2 gap-1">
          <Chip value={zlato} icon={SYMBOL_ART.gold} />
          <Chip value={dijamanti} icon={SYMBOL_ART.gem} />
        </div>
        <div className="grid min-w-0 flex-[4] grid-cols-4 gap-1">
          <Chip value={drvo} icon={SYMBOL_ART.wood} />
          <Chip value={kamen} icon={SYMBOL_ART.stone} />
          <Chip value={zeljezo} icon={SYMBOL_ART.iron} />
          <Chip value={stitovi} icon={SYMBOL_ART.shield} suffix={`/${maxStitova}`} />
        </div>
      </div>
      <BetaSheet open={beta} onClose={() => setBeta(false)} />
    </header>
  );
}

function Chip({
  value,
  icon,
  suffix,
}: {
  value: number;
  icon: string;
  suffix?: string;
}) {
  return (
    <AnimatedStat
      value={value}
      className="flex h-8 min-w-0 items-center justify-center gap-1 rounded-full border border-line bg-panel px-1.5"
    >
      <IconBadge src={icon} size="xs" />
      <span className="text-[11px] font-bold tabular-nums leading-none text-ink">
        {formatHud(value)}
        {suffix ?? ""}
      </span>
    </AnimatedStat>
  );
}
