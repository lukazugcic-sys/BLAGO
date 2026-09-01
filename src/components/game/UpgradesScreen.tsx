import { useGameStore } from "@/lib/stores/gameStore";
import { IconBadge } from "./IconBadge";
import { PrikazCijene } from "./PrikazCijene";
import { ALATI } from "@/lib/game/constants";
import { RESURS_ART, SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";

export function UpgradesScreen({ embedded = false }: { embedded?: boolean }) {
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const razine = useGameStore((s) => s.razine);
  const kupiAlat = useGameStore((s) => s.kupiAlat);

  return (
    <div className={embedded ? "" : "mx-auto w-full max-w-lg px-3 pb-8 pt-3"}>
      <h2 className="mb-4 ml-1 text-sm font-bold tracking-widest text-ink uppercase">
        Alati i sposobnosti
      </h2>
      {ALATI.map((p) => {
        const mult = Math.pow(1.6, razine[p.id] || 0);
        const zl = Math.floor(p.cZlato * mult);
        const ka = Math.floor(p.cKamen * mult);
        const ze = Math.floor(p.cZeljezo * mult);
        const moze = zlato >= zl && resursi.kamen >= ka && resursi.zeljezo >= ze;
        return (
          <article key={p.id} className="mb-3.5 rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="mb-4 flex items-center">
              <IconBadge src={SYMBOL_ART[p.art]} />
              <div className="min-w-0 flex-1 px-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-ink">{p.n}</h3>
                  <span className="rounded-sm bg-ink/5 px-2.5 py-1 text-[11px] font-bold tabular-nums text-gear">
                    LVL {razine[p.id] || 0}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-dim">{p.d}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <PrikazCijene src={RESURS_ART.zlato} iznos={zl} trenutno={zlato} />
                <PrikazCijene src={RESURS_ART.kamen} iznos={ka} trenutno={resursi.kamen} />
                <PrikazCijene src={RESURS_ART.zeljezo} iznos={ze} trenutno={resursi.zeljezo} />
              </div>
              <button
                type="button"
                onClick={() => kupiAlat(p)}
                className={cn(
                  "min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide",
                  moze ? "bg-gear text-void" : "bg-panel-2 text-dim",
                )}
              >
                NADOGRADI
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
