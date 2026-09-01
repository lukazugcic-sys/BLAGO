import { Lock, Trophy } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { MissionCard } from "./MissionCard";
import { DailyStreakCard } from "./DailyRewardModal";
import { NagradaPikseli } from "./NagradaPikseli";
import { DOSTIGNUCA } from "@/lib/game/constants";
import { ART } from "@/lib/game/art";
import { ArtTraka } from "./ArtTraka";
import { cn } from "@/lib/utils";

export function MissionsScreen() {
  const [prikazDostignuca, setPrikazDostignuca] = useState(false);
  const misije = useGameStore((s) => s.misije);
  const dostignucaDone = useGameStore((s) => s.dostignucaDone);
  const ukupnoVrtnji = useGameStore((s) => s.ukupnoVrtnji);
  const ukupnoZlata = useGameStore((s) => s.ukupnoZlata);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);

  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-2">
      <ArtTraka src={ART.misije} label="Zadaci" />
      <div className="mb-3 flex rounded-xl border border-line bg-panel p-1">
        <button
          type="button"
          onClick={() => setPrikazDostignuca(false)}
          className={cn(
            "min-h-11 flex-1 rounded-lg text-xs font-bold tracking-wide",
            !prikazDostignuca ? "bg-ink/10 text-quest" : "text-dim",
          )}
        >
          ZADACI
        </button>
        <button
          type="button"
          onClick={() => setPrikazDostignuca(true)}
          className={cn(
            "min-h-11 flex-1 rounded-lg text-xs font-bold tracking-wide",
            prikazDostignuca ? "bg-ink/10 text-gold" : "text-dim",
          )}
        >
          DOSTIGNUĆA
        </button>
      </div>

      {!prikazDostignuca ? (
        <>
          <DailyStreakCard />
          <h2 className="mb-4 ml-1 mt-2 text-sm font-bold tracking-widest text-ink uppercase">
            Dnevni zadaci
          </h2>
          {misije.map((m) => (
            <MissionCard key={`${m.id}-${m.tip}-${m.cilj}`} misija={m} />
          ))}
        </>
      ) : (
        <>
          <h2 className="mb-4 ml-1 mt-2 text-sm font-bold tracking-widest text-ink uppercase">
            Dostignuća
          </h2>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Stat label="Ukupno vrtnji" value={ukupnoVrtnji} />
            <Stat label="Zlato zarađeno" value={ukupnoZlata} color="text-gold" />
            <Stat label="Prestige" value={prestigeRazina} color="text-prestige" />
          </div>
          {DOSTIGNUCA.map((d) => {
            const otkljucano = !!dostignucaDone[d.id];
            return (
              <article
                key={d.id}
                className={cn(
                  "mb-3.5 rounded-2xl border bg-panel p-5",
                  otkljucano ? "border-gold bg-gold/10" : "border-line",
                )}
              >
                <div className="mb-3 flex items-center gap-3.5">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-lg border",
                      otkljucano ? "border-gold/50 bg-gold/15" : "border-dim/40 bg-dim/10",
                    )}
                  >
                    {otkljucano ? (
                      <Trophy className="size-6 text-gold" strokeWidth={2} />
                    ) : (
                      <Lock className="size-6 text-dim" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <h3 className={cn("text-base font-bold", otkljucano ? "text-gold" : "text-ink")}>
                      {d.naziv}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-dim">{d.opis}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-line pt-3.5">
                  <NagradaPikseli nagrada={d.nagrada} />
                  <span
                    className={cn(
                      "rounded-lg px-4 py-2 text-[11px] font-bold",
                      otkljucano ? "bg-gold/20 text-gold" : "bg-panel-2 text-dim",
                    )}
                  >
                    {otkljucano ? "OTKLJUCANO" : `CILJ: ${d.cilj}`}
                  </span>
                </div>
              </article>
            );
          })}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3 text-center">
      <p className="mb-1 text-[10px] font-semibold text-dim">{label}</p>
      <p className={cn("text-base font-bold tabular-nums", color ?? "text-ink")}>{value}</p>
    </div>
  );
}
