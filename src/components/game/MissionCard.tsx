import { Check, Target } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { NagradaPikseli } from "./NagradaPikseli";
import type { Misija } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function MissionCard({ misija }: { misija: Misija }) {
  const preuzmiNagraduMisije = useGameStore((s) => s.preuzmiNagraduMisije);
  const napredakPostotak = Math.min(100, (misija.trenutno / misija.cilj) * 100);
  const gotovo = misija.trenutno >= misija.cilj;

  return (
    <article
      className={cn(
        "mb-3.5 rounded-2xl border bg-panel p-5 shadow-panel",
        gotovo ? "border-quest" : "border-line",
      )}
    >
      <div className="mb-4 flex items-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full border",
            gotovo ? "border-quest/50 bg-quest/15" : "border-dim/40 bg-dim/10",
          )}
        >
          {gotovo ? (
            <Check className="size-6 text-quest" strokeWidth={3} />
          ) : (
            <Target className="size-6 text-dim" />
          )}
        </div>
        <div className="min-w-0 flex-1 pl-4">
          <h3 className={cn("text-base font-bold", gotovo ? "text-quest" : "text-ink")}>
            {misija.opis}
          </h3>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-void">
            <div
              className={cn("h-full rounded-full", gotovo ? "bg-quest" : "bg-xp")}
              style={{ width: `${napredakPostotak}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] font-bold tabular-nums text-dim">
            {Math.floor(misija.trenutno)} / {misija.cilj}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-dim">NAGRADA</span>
          <NagradaPikseli nagrada={misija.nagrada} />
        </div>
        <button
          type="button"
          disabled={!gotovo}
          onClick={() => preuzmiNagraduMisije(misija.id, misija.nagrada)}
          className={cn(
            "min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide",
            gotovo ? "bg-quest text-void" : "bg-panel-2 text-dim opacity-50",
          )}
        >
          PREUZMI
        </button>
      </div>
    </article>
  );
}
