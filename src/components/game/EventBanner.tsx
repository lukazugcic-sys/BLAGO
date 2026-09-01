import { useState } from "react";
import { X, Sparkles, Flame, TreePine, Sun } from "lucide-react";
import type { SezonalniDogadaj } from "@/lib/game/sezonalniDogadaji";

const ZNAK: Record<string, typeof Sparkles> = {
  lubanja: Flame,
  bor: TreePine,
  vatromet: Sparkles,
  sunce: Sun,
};

export function EventBanner({ dogadaj }: { dogadaj: SezonalniDogadaj | null }) {
  const [hidden, setHidden] = useState(false);
  if (!dogadaj || hidden) return null;
  const Icon = ZNAK[dogadaj.znak] ?? Sparkles;

  return (
    <div
      className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{
        backgroundColor: `${dogadaj.boja}22`,
        borderColor: `${dogadaj.boja}80`,
        backgroundImage: `linear-gradient(90deg, color-mix(in oklab, var(--color-void) 70%, transparent), color-mix(in oklab, var(--color-void) 45%, transparent)), url(/art/polje.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Icon className="size-4 shrink-0" style={{ color: dogadaj.boja }} />
      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: dogadaj.boja }}>
        {dogadaj.naziv}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-dim">{dogadaj.opis}</span>
      <span className="shrink-0 text-xs font-bold" style={{ color: dogadaj.boja }}>
        ×{dogadaj.bonusMnozitelj}
      </span>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="p-1 text-dim"
        aria-label="Zatvori banner"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
