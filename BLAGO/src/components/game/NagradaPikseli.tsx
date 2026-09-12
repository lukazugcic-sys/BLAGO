import { SYMBOL_ART } from "@/lib/game/art";
import { stavkeNagrade } from "@/lib/game/daily";
import { formatNum } from "@/lib/game/helpers";
import type { Nagrada } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

export function NagradaPikseli({
  nagrada,
  compact,
}: {
  nagrada: Nagrada;
  compact?: boolean;
}) {
  const stavke = stavkeNagrade(nagrada);
  if (!stavke.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center justify-center", compact ? "flex-col gap-0.5" : "gap-1.5")}>
      {stavke.map((s) => (
        <span
          key={s.key}
          className={cn(
            "inline-flex items-center gap-0.5 font-bold tabular-nums text-ink",
            compact ? "text-[10px] leading-none" : "rounded-full bg-void/55 px-1.5 py-1 text-xs",
          )}
        >
          <IconBadge
            src={SYMBOL_ART[s.art]}
            size={compact ? "xs" : "sm"}
            className={s.art === "energy" ? "iko-energy" : undefined}
          />
          {formatNum(s.iznos)}
        </span>
      ))}
    </span>
  );
}
