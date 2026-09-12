import { useGameStore } from "@/lib/stores/gameStore";
import { NagradaPikseli } from "./NagradaPikseli";
import { LikAvatar } from "./LikAvatar";
import { nalogOd, tkoZaNalog } from "@/lib/game/ljudi";
import type { Misija } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function MissionCard({ misija }: { misija: Misija }) {
  const preuzmiNagraduMisije = useGameStore((s) => s.preuzmiNagraduMisije);
  const ljudi = useGameStore((s) => s.ljudi);
  const napredakPostotak = Math.min(100, (misija.trenutno / misija.cilj) * 100);
  const gotovo = misija.trenutno >= misija.cilj;
  const tko = ljudi.find((p) => p.id === misija.likId) ?? tkoZaNalog(ljudi, misija.tip);
  const rec = tko ? nalogOd(tko, misija.tip, misija.cilj) : misija.opis;

  return (
    <article
      className={cn(
        "mb-2 rounded-xl border bg-panel p-3 shadow-panel",
        gotovo ? "zadatak-spreman border-quest" : "border-line",
      )}
    >
      <div className="mb-2 flex items-start gap-2.5">
        <span className={cn("kauba-chip-avatar shrink-0", gotovo && "ring-2 ring-quest")}>
          {tko ? <LikAvatar p={tko} mood={gotovo ? "mir" : "krov"} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10px] font-bold tracking-wide uppercase", gotovo ? "text-quest" : "text-gold")}>
            {tko ? `${tko.ime} · ${tko.posao}` : "Nalog"}
          </p>
          <h3 className={cn("text-sm font-bold leading-snug", gotovo ? "text-quest" : "text-ink")}>{rec}</h3>
        </div>
        <p className="shrink-0 text-[11px] font-bold tabular-nums text-dim">
          {Math.floor(misija.trenutno)}/{misija.cilj}
        </p>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-void">
        <div
          className={cn("h-full rounded-full potreba-traka", gotovo ? "bg-quest" : "bg-gold")}
          style={{ width: `${napredakPostotak}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <NagradaPikseli nagrada={misija.nagrada} />
        <button
          type="button"
          disabled={!gotovo}
          onClick={() => preuzmiNagraduMisije(misija.id, misija.nagrada)}
          className={cn(
            "min-h-10 rounded-lg px-3 text-xs font-bold tracking-wide",
            gotovo ? "bg-quest text-void" : "bg-panel-2 text-dim opacity-50",
          )}
        >
          {gotovo ? "HVALA" : "U TIJEKU"}
        </button>
      </div>
    </article>
  );
}