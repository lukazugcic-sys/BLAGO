import { tjedanSad } from "@/lib/game/tjedan";
import { useGameStore } from "@/lib/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function TjedanTraka({ ceker, kompaktna }: { ceker?: boolean; kompaktna?: boolean }) {
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
        "flex items-center gap-2 rounded-xl border",
        kompaktna ? "px-2.5 py-1.5" : "mb-3 rounded-2xl px-3 py-2.5",
        sajam ? "border-gold/40 bg-gold/8" : "border-ruby/40 bg-ruby/8",
      )}
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-bold tracking-[0.18em] uppercase",
            kompaktna ? "text-[9px]" : "text-[10px]",
            sajam ? "text-gold" : "text-ruby",
          )}
        >
          {t.naziv} · još {t.dani} {t.dani === 1 ? "dan" : "dana"}
        </span>
        <span
          className={cn(
            "block font-bold text-ink/90",
            kompaktna ? "truncate text-[11px] leading-snug" : "text-xs",
          )}
        >
          {t.rec}
        </span>
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
