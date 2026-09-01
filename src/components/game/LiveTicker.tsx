import { useLive } from "@/lib/multiplayer";

export function LiveTicker() {
  const ticker = useLive().ticker;
  if (!ticker) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.6rem] z-30 flex justify-center px-3">
      <p className="max-w-full truncate rounded-full border border-gold/45 bg-void/90 px-3 py-1 text-[11px] font-bold tracking-wide text-gold shadow-[0_6px_18px_rgb(0_0_0_/_0.45)]">
        {ticker}
      </p>
    </div>
  );
}
