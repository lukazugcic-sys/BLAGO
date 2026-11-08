import { Crown } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { IconBadge } from "./IconBadge";
import { PrikazCijene } from "./PrikazCijene";
import { ALATI } from "@/lib/game/constants";
import { ALAT_MAX, alatCijena, alatLv, type AlatId } from "@/lib/game/tuning";
import { cijenaUzKrunu } from "@/lib/game/economy";
import { RESURS_ART, SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";

export function UpgradesScreen({ embedded = false }: { embedded?: boolean }) {
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const razine = useGameStore((s) => s.razine);
  const krunjenja = useGameStore((s) => s.krunjenja);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const kupiAlat = useGameStore((s) => s.kupiAlat);

  return (
    <div className={embedded ? "" : "mx-auto w-full max-w-lg px-3 pb-8 pt-3"}>
      <h2 className="mb-2 ml-1 text-sm font-bold tracking-widest text-ink uppercase">
        Alati i sposobnosti
      </h2>
      <article className={cn("mb-3 rounded-2xl border border-prestige/50 bg-prestige/10 px-4 py-3", embedded && "trznica-kruna")}>
        <p className="flex items-center gap-2 text-sm font-bold text-prestige">
          <Crown className="size-4" strokeWidth={2.5} />
          {krunjenja === 0 ? "Nema krunjenja" : krunjenja === 1 ? "1 krunjenje" : `${krunjenja} krunjenja`}
        </p>
        <p className="mt-1 text-[11px] font-bold leading-snug text-ink/70">
          {krunjenja < 1
            ? "Kruni kaubu kad je selo puno. Onda dižeš alat."
            : "Svaka nadogradnja uzima jedno krunjenje."}
        </p>
      </article>
      <div className={embedded ? "trznica-mreza" : undefined}>
      {ALATI.map((p) => {
        const lv = alatLv(p.id as AlatId, razine[p.id] || 0);
        const max = ALAT_MAX[p.id as AlatId];
        const jeMax = lv >= max;
        const zl = cijenaUzKrunu(alatCijena(p.cZlato, lv), prestigeRazina);
        const ka = cijenaUzKrunu(alatCijena(p.cKamen, lv), prestigeRazina);
        const ze = cijenaUzKrunu(alatCijena(p.cZeljezo, lv), prestigeRazina);
        const imaKrunu = krunjenja >= 1;
        const moze = !jeMax && imaKrunu && zlato >= zl && resursi.kamen >= ka && resursi.zeljezo >= ze;
        return (
          <article key={p.id} className={cn(embedded ? "trznica-kartica" : "mb-3.5 rounded-2xl border border-line bg-panel p-5 shadow-panel")}>
            <div className="mb-4 flex items-center">
              <IconBadge src={SYMBOL_ART[p.art]} />
              <div className="min-w-0 flex-1 px-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-ink">{p.n}</h3>
                  <span className="rounded-sm bg-ink/5 px-2.5 py-1 text-[11px] font-bold tabular-nums text-gear">
                    RAZ. {lv}/{max}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-dim">{p.d}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
              {jeMax ? (
                <p className="text-xs font-bold tracking-wide text-gold">STROP</p>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold tabular-nums",
                      imaKrunu ? "bg-prestige/20 text-prestige" : "bg-ruby/15 text-ruby",
                    )}
                  >
                    <Crown className="size-3.5" strokeWidth={2.5} />
                    1
                  </span>
                  <PrikazCijene src={RESURS_ART.zlato} iznos={zl} trenutno={zlato} />
                  <PrikazCijene src={RESURS_ART.kamen} iznos={ka} trenutno={resursi.kamen} />
                  <PrikazCijene src={RESURS_ART.zeljezo} iznos={ze} trenutno={resursi.zeljezo} />
                </div>
              )}
              <button
                type="button"
                disabled={jeMax}
                onClick={() => kupiAlat(p)}
                className={cn(
                  "min-h-11 rounded-lg px-5 py-3 text-xs font-bold tracking-wide",
                  jeMax ? "bg-[#4a4038] text-[#f3e6c8]" : moze ? "bg-gear text-void" : "bg-[#4a4038] text-[#f3e6c8]",
                )}
              >
                {jeMax ? "MAX" : imaKrunu ? "NADOGRADI" : "KRUNA"}
              </button>
            </div>
          </article>
        );
      })}
      </div>
    </div>
  );
}
