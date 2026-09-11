import { useLive } from "@/lib/multiplayer";

export function LiveTicker() {
  const ticker = useLive().ticker;
  if (!ticker) return null;
  return (
    <p className="obavijest-ticker max-w-full truncate rounded-full border border-gold/45 bg-void/90 px-3 py-1 text-center text-[11px] font-bold tracking-wide text-gold shadow-[0_6px_18px_rgb(0_0_0_/_0.45)]">
      {ticker}
    </p>
  );
}
