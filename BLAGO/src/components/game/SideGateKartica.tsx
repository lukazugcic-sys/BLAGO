import { Lock } from "lucide-react";
import { otvoriCiljZgradu } from "@/lib/game/sljedeciCilj";
import { SIDE_GATE_OPIS, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function SideGateKartica({
  naslov,
  klasa,
}: {
  naslov?: string;
  klasa?: string;
}) {
  return (
    <article
      className={cn(
        "mb-3 rounded-2xl border border-line bg-panel p-4 text-center shadow-panel",
        klasa,
      )}
    >
      <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-line bg-void/60 text-dim">
        <Lock className="size-4" strokeWidth={2.4} />
      </span>
      <p className="text-[10px] font-bold tracking-[0.22em] text-dim uppercase">
        {naslov ?? "Još zatvoreno"}
      </p>
      <p className="mt-2 text-sm font-bold text-ink">{SIDE_GATE_REC}</p>
      <p className="mt-1 text-xs font-bold leading-snug text-dim">{SIDE_GATE_OPIS}</p>
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          otvoriCiljZgradu("kuca");
        }}
        className="mt-3 min-h-11 w-full rounded-xl bg-gold px-3 text-xs font-bold tracking-widest text-void uppercase"
      >
        Na Kuću
      </button>
    </article>
  );
}
