import { Dices, Home, ScrollText, Store, Flag } from "lucide-react";
import { TABOVI, type TabId } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";

const ICONS = {
  automat: Dices,
  selo: Home,
  misije: ScrollText,
  trznica: Store,
  ceh: Flag,
} as const;

const COLOR: Record<string, string> = {
  volt: "bg-volt text-void shadow-[0_0_16px_color-mix(in_oklab,var(--color-volt)_45%,transparent)]",
  wood: "bg-wood text-void",
  quest: "bg-quest text-void",
  gold: "bg-gold text-void",
  clan: "bg-clan text-void",
};

export function AppNav({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
}) {
  return (
    <nav className="relative z-20 shrink-0 bg-void px-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1">
      <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-line bg-void/95 p-1 shadow-[0_8px_28px_rgb(0_0_0_/_0.55)]">
        {TABOVI.map((t) => {
          const Icon = ICONS[t.id];
          const aktivan = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                playSfx("button");
                onTab(t.id);
              }}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-[background,color,transform] duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-[0.92]",
                aktivan ? cn(COLOR[t.boja], "nav-bounce") : "text-dim",
              )}
              aria-current={aktivan ? "page" : undefined}
              aria-label={t.label}
            >
              <span className={cn("nav-iko", aktivan ? "bg-void/18" : "bg-ink/8")}>
                <Icon className="size-3.5 shrink-0" strokeWidth={aktivan ? 2.6 : 2} />
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
