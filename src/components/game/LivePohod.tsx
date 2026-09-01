import { useState } from "react";
import { Radio, Users, WifiOff } from "lucide-react";
import { useLive, sanitizeRoom } from "@/lib/multiplayer";
import { useGameStore } from "@/lib/stores/gameStore";
import { formatHud } from "@/lib/game/helpers";
import { playSfx } from "@/lib/game/audio";
import { SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";

const CHEER = ["JUHU!", "JACKPOT!", "POHOD!", "ČUVAJ OSTAVU", "POZDRAV", "HAHA"] as const;

export function LivePohod() {
  const live = useLive();
  const ime = useGameStore((s) => s.imeIgraca);
  const postaviIme = useGameStore((s) => s.postaviIme);
  const [kod, setKod] = useState(live.room);
  const [imeTxt, setImeTxt] = useState(ime);

  const spojeni = live.cowboys.filter((c) => c.connected).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Radio className="size-5 text-gold" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-widest text-gold uppercase">Živi pohod</h2>
          <p className="text-[10px] font-bold tracking-wider text-dim uppercase">
            {live.joined
              ? spojeni > 0
                ? `${spojeni} kauboj${spojeni === 1 ? "" : "a"} na vezi · soba ${live.room}`
                : `Soba ${live.room} · čekam družinu`
              : "Spajam se…"}
          </p>
        </div>
        <span
          className={cn(
            "size-2.5 rounded-full",
            live.joined ? "bg-volt shadow-[0_0_8px_var(--color-volt)]" : "bg-dim",
          )}
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-widest text-dim uppercase">Tvoje ime</span>
        <div className="flex gap-1.5">
          <input
            value={imeTxt}
            maxLength={16}
            onChange={(e) => setImeTxt(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-3 py-2 text-sm font-bold text-ink outline-none focus:border-gold/60"
          />
          <button
            type="button"
            onClick={() => {
              const n = imeTxt.trim().slice(0, 16);
              if (!n) return;
              postaviIme(n);
              playSfx("button");
            }}
            className="rounded-xl border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wider text-gold uppercase"
          >
            Spremi
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-widest text-dim uppercase">
          Soba (dijeli kod s prijateljem)
        </span>
        <div className="flex gap-1.5">
          <input
            value={kod}
            maxLength={12}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            className="min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-3 py-2 font-mono text-sm font-bold tracking-[0.2em] text-gold outline-none focus:border-gold/60"
          />
          <button
            type="button"
            onClick={() => {
              live.joinRoom(sanitizeRoom(kod));
              playSfx("button");
            }}
            className="rounded-xl border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wider text-gold uppercase"
          >
            Uđi
          </button>
        </div>
      </label>

      <div className="flex flex-wrap gap-1.5">
        {CHEER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => live.sendChat(c)}
            className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gold uppercase"
          >
            {c}
          </button>
        ))}
      </div>

      {live.cowboys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-8 text-center">
          <Users className="size-8 text-dim" />
          <p className="text-sm font-bold text-ink">Nema kauboja u sobi</p>
          <p className="max-w-[16rem] text-[11px] font-bold leading-relaxed text-dim">
            Otvori BLAGO na drugom telefonu ili daj prijatelju kod sobe.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {live.cowboys.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-2xl border border-line bg-void/55 px-2.5 py-2"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  c.connected ? "bg-volt" : "bg-dim",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{c.ime}</p>
                <p className="text-[10px] font-bold tracking-wider text-dim uppercase">
                  lv {c.razina}
                  {c.rttMs != null ? ` · ${c.rttMs}ms` : ""}
                </p>
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-gold">
                <img src={SYMBOL_ART.gold} alt="" className="size-3.5" draggable={false} />
                {formatHud(c.zlato)}
              </span>
              {c.stitovi > 0 && (
                <img src={SYMBOL_ART.shield} alt="" className="size-4" draggable={false} />
              )}
              {!c.connected && <WifiOff className="size-3.5 text-dim" />}
            </li>
          ))}
        </ul>
      )}

      {live.feed.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line pt-2">
          {live.feed
            .slice()
            .reverse()
            .slice(0, 8)
            .map((f) => (
              <li key={f.id} className="text-[11px] font-bold text-ink/80">
                {f.text}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
