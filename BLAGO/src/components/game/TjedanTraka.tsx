import { tjedanSad } from "@/lib/game/tjedan";
import { useGameStore } from "@/lib/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function TjedanTraka({ ceker }: { ceker?: boolean }) {
  const t = tjedanSad();
  const kljuc = useGameStore((s) => s.tjedanKljuc);
  const uzet = useGameStore((s) => s.tjedanCeker);
  const pohod = useGameStore((s) => s.tjedanPohod);
  const uzmi = useGameStore((s) => s.uzmiSajamCeker);
  const isti = !kljuc || kljuc === t.kljuc;
  const sajam = t.vrsta === "sajam";

  return (
    <article
      className={cn(
        "mb-3 flex items-center gap-2 rounded-2xl border px-3 py-2.5",
        sajam ? "border-gold/50 bg-gold/10" : "border-ruby/50 bg-ruby/10",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[10px] font-bold tracking-[0.2em] uppercase", sajam ? "text-gold" : "text-ruby")}>
          {t.naziv} · još {t.dani} {t.dani === 1 ? "dan" : "dana"}
        </span>
        <span className="block text-xs font-bold text-ink">{t.rec}</span>
      </span>
      {ceker && sajam && isti && (
        <button
          type="button"
          disabled={uzet}
          onClick={() => {
            playSfx("collect");
            uzmi();
          }}
          className={cn(
            "min-h-10 shrink-0 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase",
            uzet ? "bg-void text-dim" : "bg-gold text-void",
          )}
        >
          {uzet ? "Uzeto" : "Ceker"}
        </button>
      )}
      {!sajam && isti && pohod && (
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-quest uppercase">Gotovo</span>
      )}
    </article>
  );
}