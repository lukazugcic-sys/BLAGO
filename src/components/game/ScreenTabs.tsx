import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";

export function ScreenTabs<T extends string>({
  tabs,
  value,
  onChange,
  dolje,
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  dolje?: boolean;
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
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (aktivan) return;
              playSfx("button");
              onChange(t.id);
            }}
            className={cn(
              "min-h-10 flex-1 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors duration-150",
              aktivan ? "bg-gold/20 text-gold" : "text-dim",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
