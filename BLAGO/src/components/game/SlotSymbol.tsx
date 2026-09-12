import { memo } from "react";
import type { SimbolId } from "@/lib/game/types";
import { BLAGO } from "@/lib/game/constants";
import { SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";

export const SlotSymbol = memo(function SlotSymbol({
  id,
  win,
  skullHit,
  spinning,
  expanding,
}: {
  id: SimbolId;
  win?: boolean;
  skullHit?: boolean;
  spinning?: boolean;
  expanding?: boolean;
}) {
  const meta = BLAGO[id];
  return (
    <span
      className={cn(
        "slot-token relative flex aspect-square w-full items-center justify-center",
        id === "gold" && "slot-token-gold",
        id === "energy" && "slot-token-energy",
        id === "knjiga" && "slot-knjiga",
        spinning && "reel-spinning",
        expanding && "slot-expand",
        win && !skullHit && "slot-win",
        skullHit && "slot-skull",
      )}
      style={{
        color: meta.boja,
        ["--sym" as string]: meta.boja,
      }}
    >
      <img
        src={SYMBOL_ART[id]}
        alt=""
        width={64}
        height={64}
        draggable={false}
        decoding="async"
        className="slot-art relative z-[1] object-contain select-none"
      />
      {win && !skullHit && (
        <>
          <span className="slot-win-ring" aria-hidden />
          <span className="slot-win-sheen" aria-hidden />
        </>
      )}
      {skullHit && (
        <>
          <span className="slot-skull-vein" aria-hidden />
          <span className="slot-skull-flash" aria-hidden />
        </>
      )}
      {id === "knjiga" && (
        <>
          <span className="slot-znacka-sjaj" aria-hidden />
          <span className="slot-znacka-zraka" aria-hidden />
        </>
      )}
      <span className="slot-token-shine" aria-hidden />
    </span>
  );
});
