import { Dices, Home, Lock, ScrollText, Store } from "lucide-react";
import { TABOVI, type TabId } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { useGameStore } from "@/lib/stores/gameStore";

const ICONS = {
  automat: Dices,
  selo: Home,
  misije: ScrollText,
  trznica: Store,
} as const;

const COLOR: Record<string, string> = {
  volt: "bg-volt text-void shadow-[0_0_16px_color-mix(in_oklab,var(--color-volt)_45%,transparent)]",
  wood: "bg-wood text-void",
  quest: "bg-quest text-void",
  gold: "bg-gold text-void",
};

/** Tabs that compete with the early core loop until first house. */
const SIDE_TAB: Partial<Record<TabId, boolean>> = {
  trznica: true,
};

export function AppNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
}) {
  const kuca = useGameStore((s) => s.gradevine.kuca || 0);
  const setPoruka = useGameStore((s) => s.setPoruka);
  const otkljucan = jeSideOtkljucan({ kuca });

  return (
    <nav className="relative z-20 shrink-0 bg-void px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1">
      <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-line bg-void/95 p-1 shadow-[0_8px_28px_rgb(0_0_0_/_0.55)]">
        {TABOVI.map((t) => {
          const Icon = ICONS[t.id];
          const aktivan = tab === t.id;
          const zakljucan = !otkljucan && !!SIDE_TAB[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                playSfx("button");
                if (zakljucan) setPoruka(SIDE_GATE_REC);
                onTab(t.id);
              }}
              className={cn(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-[background,color,transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-[0.92]",
                aktivan
                  ? cn(COLOR[t.boja], "nav-bounce")
                  : zakljucan
                    ? "text-dim/45 opacity-70"
                    : "text-dim",
              )}
              aria-current={aktivan ? "page" : undefined}
              aria-label={zakljucan ? `${t.label} · ${SIDE_GATE_REC}` : t.label}
            >
              <span
                className={cn(
                  "nav-iko relative",
                  aktivan ? "bg-void/18" : zakljucan ? "bg-ink/5" : "bg-ink/8",
                )}
              >
                <Icon
                  className={cn("size-3.5 shrink-0", zakljucan && !aktivan && "opacity-55")}
                  strokeWidth={aktivan ? 2.6 : 2}
                />
                {zakljucan && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full border border-line/50 bg-void/90 text-gold/75"
                    aria-hidden
                  >
                    <Lock className="size-2" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-[10px] font-bold leading-none tracking-normal uppercase">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
