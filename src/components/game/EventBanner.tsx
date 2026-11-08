import { useState } from "react";
import { X, Sparkles, Flame, TreePine, Sun } from "lucide-react";
import type { SezonalniDogadaj } from "@/lib/game/sezonalniDogadaji";

const ZNAK: Record<string, typeof Sparkles> = {
  lubanja: Flame,
  bor: TreePine,
  vatromet: Sparkles,
  sunce: Sun,
};

export function EventBanner({
  dogadaj,
  kompaktna,
}: {
  dogadaj: SezonalniDogadaj | null;
  kompaktna?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  if (!dogadaj || hidden) return null;
  const Icon = ZNAK[dogadaj.znak] ?? Sparkles;

  return (
    <div
      className={
        kompaktna
          ? "event-banner flex items-center gap-1.5 rounded-lg border px-2 py-1"
          : "event-banner mb-2 flex items-center gap-2 rounded-lg border px-3 py-2"
      }
      style={{
        background: "linear-gradient(180deg, #6a4328, #2b1814)",
        borderColor: "#ffd24a88",
        color: "#fff4d4",
      }}
    >
      <Icon className={kompaktna ? "size-3.5 shrink-0" : "size-4 shrink-0"} style={{ color: dogadaj.boja }} />
      <span
        className={kompaktna ? "text-[10px] font-bold tracking-wide uppercase" : "text-xs font-bold tracking-wide uppercase"}
        style={{ color: dogadaj.boja }}
      >
        {dogadaj.naziv}
      </span>
      <span className="min-w-0 flex-1 truncate text-[10px] text-dim/85">{dogadaj.opis}</span>
      <span className="shrink-0 text-[10px] font-bold" style={{ color: dogadaj.boja }}>
        ×{dogadaj.bonusMnozitelj}
      </span>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="p-0.5 text-dim/80"
        aria-label="Zatvori banner"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
