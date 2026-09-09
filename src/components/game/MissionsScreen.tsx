import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/lib/stores/gameStore";
import { MissionCard } from "./MissionCard";
import { DailyStreakCard } from "./DailyRewardModal";
import { JutroPopis } from "./JutroSheet";
import { NagradaPikseli } from "./NagradaPikseli";
import { DOSTIGNUCA, napredakDostignuca, snapshotDostignuca } from "@/lib/game/dostignuca";
import { SYMBOL_ART } from "@/lib/game/art";
import { IconBadge } from "./IconBadge";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MissionsScreen() {
  const [prikazDostignuca, setPrikazDostignuca] = useState(false);
  const misije = useGameStore((s) => s.misije);

  const spremni = misije.filter((m) => m.trenutno >= m.cilj).length;
  const red = [...misije].sort((a, b) => Number(b.trenutno >= b.cilj) - Number(a.trenutno >= a.cilj));

  return (
    <div className="mx-auto w-full max-w-lg px-3 pb-8 pt-2">
      <div className="mb-3 flex rounded-xl border border-line bg-panel p-1">
        <button
          type="button"
          onClick={() => setPrikazDostignuca(false)}
          className={cn(
            "min-h-11 flex-1 rounded-lg text-xs font-bold tracking-wide",
            !prikazDostignuca ? "bg-ink/10 text-quest" : "text-dim",
          )}
        >
          NALOZI
        </button>
        <button
          type="button"
          onClick={() => setPrikazDostignuca(true)}
          className={cn(
            "min-h-11 flex-1 rounded-lg text-xs font-bold tracking-wide",
            prikazDostignuca ? "bg-ink/10 text-gold" : "text-dim",
          )}
        >
          ZVIJEZDE
        </button>
      </div>

      {!prikazDostignuca ? (
        <>
          <JutroPopis />
          <div className="mb-2 flex items-end justify-between gap-2">
            <h2 className="ml-1 text-sm font-bold tracking-widest text-ink uppercase">Nalozi</h2>
            <p className="text-[11px] font-bold tabular-nums text-quest">
              {spremni > 0 ? `${spremni} spremno` : `${misije.length} u tijeku`}
            </p>
          </div>
          {red.map((m, i) => (
            <div key={`${m.id}-${m.tip}-${m.cilj}`} className="hub-kartica" style={{ animationDelay: `${i * 50}ms` }}>
              <MissionCard misija={m} />
            </div>
          ))}
          <DailyStreakCard />
        </>
      ) : (
        <ZvijezdeLista />
      )}
    </div>
  );
}

function ZvijezdeLista() {
  const done = useGameStore((s) => s.dostignucaDone);
  const ulaz = useGameStore(useShallow(snapshotDostignuca));
  const broj = DOSTIGNUCA.reduce((a, d) => a + (done[d.id] ? 1 : 0), 0);

  return (
    <>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="ml-1 text-sm font-bold tracking-widest text-ink uppercase">Zvijezde kaube</h2>
        <p className="text-[11px] font-bold tabular-nums text-gold">
          {broj}/{DOSTIGNUCA.length}
        </p>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Stat label="Kola" value={ulaz.ukupnoVrtnji} />
        <Stat label="Zlato" value={ulaz.ukupnoZlata} color="text-gold" />
        <Stat label="Kruna" value={ulaz.prestigeRazina} color="text-prestige" />
      </div>
      {DOSTIGNUCA.map((d) => {
        const otkljucano = !!done[d.id];
        const n = napredakDostignuca(ulaz, d);
        const pct = Math.min(100, Math.round((n.trenutno / Math.max(1, n.cilj)) * 100));
        return (
          <article
            key={d.id}
            className={cn(
              "mb-2 rounded-xl border bg-panel p-3.5",
              otkljucano ? "border-gold bg-gold/10" : "border-line",
            )}
          >
            <div className="mb-2 flex items-center gap-3">
              <IconBadge src={SYMBOL_ART[d.art]} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className={cn("text-sm font-bold", otkljucano ? "text-gold" : "text-ink")}>{d.naziv}</h3>
                <p className="text-xs leading-snug text-dim">{d.opis}</p>
              </div>
            </div>
            <span className="zid-traka mb-2 block h-1.5 overflow-hidden rounded-full bg-void">
              <span
                className={cn("block h-full rounded-full", otkljucano ? "bg-gold" : "bg-dim")}
                style={{ width: `${pct}%` }}
              />
            </span>
            <div className="flex items-center justify-between gap-2">
              <NagradaPikseli nagrada={d.nagrada} compact />
              <span
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-bold",
                  otkljucano ? "bg-gold/20 text-gold" : "bg-panel-2 text-dim",
                )}
              >
                {otkljucano ? "Stoji" : `${Math.min(n.trenutno, n.cilj)}/${n.cilj}`}
              </span>
            </div>
          </article>
        );
      })}
    </>
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
