import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";

export function ScreenTabs<T extends string>({
  tabs,
  value,
  onChange,
  dolje,
  locked,
  onLocked,
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  dolje?: boolean;
  /** Soft-gate: tab stays visible but muted until unlocked. */
  locked?: Partial<Record<T, boolean>>;
  onLocked?: (id: T) => void;
}) {
  return (
    <div
      className={cn(
        "flex rounded-xl border border-line bg-panel p-1",
        dolje ? "mt-3 mb-0" : "mb-3",
      )}
    >
      {tabs.map((t) => {
        const aktivan = value === t.id;
        const zakljucan = !!locked?.[t.id];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (aktivan) return;
              playSfx("button");
              if (zakljucan) {
                onLocked?.(t.id);
                onChange(t.id);
                return;
              }
              onChange(t.id);
            }}
            className={cn(
              "relative min-h-10 flex-1 rounded-lg text-xs font-bold tracking-wide uppercase transition-[colors,opacity] duration-150",
              aktivan
                ? "bg-gold/20 text-gold"
                : zakljucan
                  ? "text-dim/50 opacity-75"
                  : "text-dim",
            )}
            aria-disabled={zakljucan || undefined}
          >
            <span className="inline-flex items-center justify-center gap-1">
              {zakljucan && (
                <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-void/40 text-gold/70">
                  <Lock className="size-2.5 shrink-0" strokeWidth={2.8} />
                </span>
              )}
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
