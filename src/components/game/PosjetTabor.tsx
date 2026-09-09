import { createPortal } from "react-dom";
import { useLive } from "@/lib/multiplayer";
import { ART, SYMBOL_ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import { formatHud } from "@/lib/game/helpers";
import { IconBadge } from "./IconBadge";

const HUB: Array<{ id: "krov" | "jelo" | "zabava" | "voda" | "posao" | "red" | "konjiHub" | "zdravlje"; naziv: string }> = [
  { id: "krov", naziv: "Krov" },
  { id: "jelo", naziv: "Jelo" },
  { id: "zabava", naziv: "Salun" },
  { id: "voda", naziv: "Voda" },
  { id: "posao", naziv: "Posao" },
  { id: "red", naziv: "Red" },
  { id: "konjiHub", naziv: "Konji" },
  { id: "zdravlje", naziv: "Lijek" },
];

export function PosjetTabor() {
  const live = useLive();
  const p = live.posjet;
  if (!p || typeof document === "undefined") return null;

  if (p.uloga === "domacin" && p.faza === "unutra") {
    return (
      <div className="posjet-domacin-traka" role="status">
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Gost</span>
          <span className="block truncate text-sm font-bold text-ink">{p.ime} pije u taboru.</span>
        </span>
        <button
          type="button"
          onClick={() => {
            playSfx("attack");
            live.pozoviTrojac(p.peerId, p.ime);
          }}
          className="min-h-9 rounded-lg bg-gold px-2.5 text-[10px] font-bold tracking-wide text-void uppercase"
        >
          Jašite
        </button>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            live.odjasiPosjet();
          }}
          className="min-h-9 rounded-lg border border-line bg-panel-2 px-2.5 text-[10px] font-bold text-ink uppercase"
        >
          Izbaci
        </button>
      </div>
    );
  }

  if (p.uloga !== "gost") return null;
  if (p.faza !== "ceka" && p.faza !== "unutra") return null;

  const t = p.tabor;

  return createPortal(
    <div
      className="modal-pozadina fixed inset-0 z-[88] flex items-end justify-center bg-void/80 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="posjet-title"
    >
      <div className="modal-ulaz flex max-h-[min(40rem,92dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/45 bg-panel shadow-[0_18px_50px_rgb(0_0_0_/_0.55)]">
        <div
          className="relative h-24 shrink-0 overflow-hidden sm:h-28"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent, color-mix(in oklab, var(--color-void) 88%, #0e2a28)), url(${ART.seloPoster})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="posjet-prasina" aria-hidden />
        </div>
        <div className="flex items-center gap-2 px-4 pt-3">
          <h2 id="posjet-title" className="flex-1 text-base font-bold tracking-widest text-gold uppercase">
            {p.faza === "ceka" ? "Kapija" : t?.kat ?? "Tabor"}
          </h2>
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              live.odjasiPosjet();
            }}
            className="flex size-11 items-center justify-center rounded-lg text-lg text-dim"
            aria-label="Odjaši"
          >
            ×
          </button>
        </div>

        {p.faza === "ceka" && (
          <div className="px-5 pb-6 pt-2">
            <p className="text-center text-sm font-bold text-ink">{p.ime} čuje kopita.</p>
            <p className="mt-1 text-center text-xs font-bold text-dim">Pušta te ili zatvara kapiju.</p>
            <div className="pohod-ceka-tacke mt-4 flex justify-center gap-1.5" aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {p.faza === "unutra" && t && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-1">
            <p className="text-sm font-bold text-ink">
              {t.ime} · {t.kat} · lv {t.razina}
            </p>
            <p className="mt-0.5 text-xs font-bold text-dim">{t.moodRec}</p>
            <p className="mt-1 text-[11px] font-bold tracking-wide text-gold uppercase">
              {t.ljudi} ljudi · {t.konji} konja
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums text-gold">
                <IconBadge src={SYMBOL_ART.gold} size="xs" />
                {formatHud(t.zlato)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums text-wood">
                <IconBadge src={SYMBOL_ART.wood} size="xs" />
                {formatHud(t.drvo)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums text-stone">
                <IconBadge src={SYMBOL_ART.stone} size="xs" />
                {formatHud(t.kamen)}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums text-iron">
                <IconBadge src={SYMBOL_ART.iron} size="xs" />
                {formatHud(t.zeljezo)}
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-4 gap-1.5">
              {HUB.map((h) => {
                const v = Math.max(0, Math.min(1, t[h.id] ?? 0));
                return (
                  <li key={h.id} className="rounded-lg border border-line bg-void/50 px-1.5 py-1.5">
                    <p className="text-[9px] font-bold tracking-wider text-dim uppercase">{h.naziv}</p>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-void">
                      <span
                        className="block h-full rounded-full bg-gold"
                        style={{ width: `${Math.round(v * 100)}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
            {p.cin && <p className="posjet-cin mt-3 text-center text-xs font-bold text-gold">{p.cin}</p>}
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => live.cinPosjet("pozdrav")}
                className="min-h-11 rounded-xl border border-gold/40 bg-gold/10 text-[11px] font-bold tracking-wider text-gold uppercase"
              >
                Pozdrav
              </button>
              <button
                type="button"
                onClick={() => live.cinPosjet("salun")}
                className="min-h-11 rounded-xl border border-gold/40 bg-gold/10 text-[11px] font-bold tracking-wider text-gold uppercase"
              >
                Salun · 6g
              </button>
              <button
                type="button"
                onClick={() => live.cinPosjet("pomoc")}
                className="min-h-11 rounded-xl border border-wood/45 bg-wood/10 text-[11px] font-bold tracking-wider text-wood uppercase"
              >
                Pomozi
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx("attack");
                  live.pozoviTrojac(p.peerId, p.ime);
                }}
                className="min-h-11 rounded-xl bg-gold text-[11px] font-bold tracking-wider text-void uppercase"
              >
                Jašite
              </button>
            </div>
            <button
              type="button"
              onClick={() => live.cinPosjet("izdaj")}
              className="mt-1.5 min-h-11 w-full rounded-xl bg-ruby text-[11px] font-bold tracking-widest text-ink uppercase"
            >
              Izdaj tabor
            </button>
            <button
              type="button"
              onClick={() => live.odjasiPosjet()}
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-panel-2 text-[11px] font-bold tracking-widest text-dim uppercase"
            >
              Odjaši
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
