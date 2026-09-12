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
        "side-gate relative mb-3 overflow-hidden rounded-2xl border border-line/60 bg-panel/70 p-4 text-center shadow-panel",
        klasa,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/25 via-transparent to-void/40"
        aria-hidden
      />
      <span className="relative mx-auto mb-2.5 flex size-11 items-center justify-center rounded-full border border-gold/25 bg-void/55 text-gold/80 shadow-[0_0_18px_color-mix(in_oklab,var(--color-void)_55%,transparent)]">
        <Lock className="size-4" strokeWidth={2.2} />
      </span>
      <p className="relative text-[10px] font-bold tracking-[0.22em] text-dim/80 uppercase">
        {naslov ?? "Još zatvoreno"}
      </p>
      <p className="relative mt-2 text-sm font-bold text-ink/90">{SIDE_GATE_REC}</p>
      <p className="relative mt-1 text-xs font-bold leading-snug text-dim/85">{SIDE_GATE_OPIS}</p>
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          otvoriCiljZgradu("kuca");
        }}
        className="relative mt-3.5 min-h-11 w-full rounded-xl border border-gold/40 bg-gold/90 px-3 text-xs font-bold tracking-widest text-void uppercase shadow-[0_0_16px_color-mix(in_oklab,var(--color-gold)_28%,transparent)] transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        Na Kuću
      </button>
    </article>
  );
}
