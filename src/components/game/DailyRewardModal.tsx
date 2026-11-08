import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { DNEVNE_NAGRADE } from "@/lib/game/constants";
import { cycleDay, formatCountdown, msDoZagrebaPonoci, stavkeNagrade } from "@/lib/game/daily";
import { ponoviDnevniSat } from "@/lib/stores/sliceDan";
import { SYMBOL_ART, ART } from "@/lib/game/art";
import { NagradaPikseli } from "./NagradaPikseli";
import { IconBadge } from "./IconBadge";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";
import { portalKorijen } from "@/lib/game/portal";

export function DailyRewardModal() {
  const prikaz = useGameStore((s) => s.prikazDnevneNagrade);
  const dnevnaNagrada = useGameStore((s) => s.dnevnaNagrada);
  const dnevniStreak = useGameStore((s) => s.dnevniStreak);
  const preuzetoDanas = useGameStore((s) => s.preuzetoDanas);
  const dnevnaPotvrda = useGameStore((s) => s.dnevnaPotvrda);
  const preuzmiDnevniBonus = useGameStore((s) => s.preuzmiDnevniBonus);
  const sakrijDnevnuNagradu = useGameStore((s) => s.sakrijDnevnuNagradu);

  useEffect(() => {
    if (!prikaz) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") sakrijDnevnuNagradu();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [prikaz, sakrijDnevnuNagradu]);

  if (!prikaz || !dnevnaNagrada || preuzetoDanas) return null;
  if (typeof document === "undefined") return null;

  const danCiklusa = cycleDay(dnevniStreak);

  return createPortal(
    <div
      className="modal-pozadina fixed inset-0 z-[80] flex items-end justify-center bg-void/80 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-title"
      onClick={sakrijDnevnuNagradu}
    >
      <div
        className="modal-ulaz w-full max-w-sm rounded-t-2xl border border-gold/55 bg-panel p-5 shadow-[0_12px_40px_color-mix(in_oklab,var(--color-gold)_22%,transparent)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-3 h-28 overflow-hidden rounded-xl border border-gold/40">
          <img src={ART.prase} alt="" className="size-full object-cover object-[center_30%]" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <IconBadge src={SYMBOL_ART.gold} size="md" />
          <div className="min-w-0 flex-1">
            <h2 id="daily-title" className="font-display text-xl font-semibold tracking-widest text-gold">
              Dnevna nagrada
            </h2>
            <p className="text-[11px] font-bold tracking-wide text-dim">
              Dan {danCiklusa} / 7 · niz {dnevniStreak}
            </p>
          </div>
          <button
            type="button"
            onClick={sakrijDnevnuNagradu}
            className="flex size-11 items-center justify-center text-dim"
            aria-label="Kasnije"
          >
            <X className="size-5" />
          </button>
        </div>

        <TjedniKalendar streak={dnevniStreak} claimed={false} potvrda={dnevnaPotvrda} />

        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-center">
          <p className="mb-2 text-[10px] font-bold tracking-widest text-gold uppercase">Danas dobivaš</p>
          <NagradaPikseli nagrada={dnevnaNagrada.nagrada} />
        </div>

        <button
          type="button"
          data-testid="dnevna-preuzmi"
          disabled={!dnevnaPotvrda}
          onClick={preuzmiDnevniBonus}
          className="mt-4 min-h-12 w-full rounded-xl bg-gold py-4 text-base font-bold tracking-widest text-void transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
        >
          PREUZMI
        </button>
        <button
          type="button"
          onClick={sakrijDnevnuNagradu}
          className="mt-2 min-h-11 w-full text-xs font-bold tracking-widest text-dim uppercase"
        >
          Kasnije · ostaje u Zadacima
        </button>
      </div>
    </div>,
    portalKorijen(),
  );
}

export function DailyStreakCard() {
  const dnevniStreak = useGameStore((s) => s.dnevniStreak);
  const preuzetoDanas = useGameStore((s) => s.preuzetoDanas);
  const dnevnaPotvrda = useGameStore((s) => s.dnevnaPotvrda);
  const dnevniSat = useGameStore((s) => s.dnevniSat);
  const dnevniSatLokal = useGameStore((s) => s.dnevniSatLokal);
  const dnevnaNagrada = useGameStore((s) => s.dnevnaNagrada);
  const preuzmiDnevniBonus = useGameStore((s) => s.preuzmiDnevniBonus);
  const otvoriDnevnuNagradu = useGameStore((s) => s.otvoriDnevnuNagradu);
  const osvjeziDnevnu = useGameStore((s) => s.osvjeziDnevnu);
  const [ostalo, setOstalo] = useState("…");

  useEffect(() => {
    if (!dnevnaPotvrda || !preuzetoDanas) return;
    const tick = () => {
      const now = new Date(dnevniSat + (Date.now() - dnevniSatLokal));
      setOstalo(formatCountdown(msDoZagrebaPonoci(now)));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [dnevnaPotvrda, preuzetoDanas, dnevniSat, dnevniSatLokal]);

  return (
    <article className="mb-3.5 rounded-2xl border border-gold/40 bg-panel p-4 shadow-panel">
      <div className="mb-3 flex items-center gap-2">
        <IconBadge src={SYMBOL_ART.gold} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-widest text-gold uppercase">Kalendar nagrada</h3>
          <p className="text-[11px] font-bold text-dim">
            {!dnevnaPotvrda
              ? "Čekam sat poslužitelja"
              : preuzetoDanas
                ? `Dođi sutra · sljedeća za ${ostalo}`
                : `Dan ${cycleDay(dnevniStreak)} spreman za preuzimanje`}
          </p>
        </div>
      </div>
      <TjedniKalendar streak={dnevniStreak} claimed={preuzetoDanas} potvrda={dnevnaPotvrda} />
      {!dnevnaPotvrda && (
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            ponoviDnevniSat();
            osvjeziDnevnu();
          }}
          className="mt-3 min-h-11 w-full rounded-lg border border-gold/40 text-sm font-bold tracking-widest text-gold"
        >
          PONOVI
        </button>
      )}
      {dnevnaPotvrda && !preuzetoDanas && dnevnaNagrada && (
        <button
          type="button"
          data-testid="dnevna-preuzmi"
          onClick={() => {
            playSfx("button");
            preuzmiDnevniBonus();
          }}
          className="mt-3 min-h-11 w-full rounded-lg bg-gold text-sm font-bold tracking-widest text-void"
        >
          PREUZMI DANAS
        </button>
      )}
      {dnevnaPotvrda && !preuzetoDanas && !dnevnaNagrada && (
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            otvoriDnevnuNagradu();
          }}
          className="mt-3 min-h-11 w-full rounded-lg border border-gold/40 text-sm font-bold tracking-widest text-gold"
        >
          OTVORI
        </button>
      )}
    </article>
  );
}

function TjedniKalendar({
  streak,
  claimed,
  potvrda,
}: {
  streak: number;
  claimed: boolean;
  potvrda: boolean;
}) {
  const danCiklusa = cycleDay(Math.max(1, streak || 1));
  const sedmi = DNEVNE_NAGRADE[6]!;
  const sedmiRec = stavkeNagrade(sedmi.nagrada)
    .map((s) => `${s.iznos} ${s.key}`)
    .join(" · ");
  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {DNEVNE_NAGRADE.map((d) => {
          const current = potvrda && d.dan === danCiklusa;
          const done = potvrda && (claimed ? d.dan <= danCiklusa : d.dan < danCiklusa);
          const locked = !current && !done;
          return (
            <div
              key={d.dan}
              aria-current={current ? "date" : undefined}
              className={cn(
                "flex min-h-[5.25rem] flex-col items-center justify-start gap-0.5 rounded-lg border px-0.5 pt-1.5",
                current && !claimed && "nagrada-dan-spreman border-gold bg-gold/20",
                current && claimed && "border-xp bg-xp/15",
                done && !current && "border-xp/40 bg-xp/10",
                locked && "border-line bg-void/40 opacity-70",
                d.dan === 7 && "ring-1 ring-gold/50",
              )}
            >
              <span
                className={cn(
                  "text-[9px] font-bold tabular-nums",
                  current ? "text-gold" : done ? "text-xp" : "text-dim",
                )}
              >
                {d.dan}
              </span>
              {done ? <Check className="size-3 text-xp" aria-label="preuzeto" /> : null}
              <DanIkone nagrada={d.nagrada} />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] font-bold tracking-wide text-gold">Dan 7 · {sedmiRec}</p>
    </div>
  );
}

function DanIkone({ nagrada }: { nagrada: (typeof DNEVNE_NAGRADE)[number]["nagrada"] }) {
  const stavke = stavkeNagrade(nagrada);
  return (
    <span className="flex flex-col items-center gap-0.5">
      {stavke.map((s) => (
        <IconBadge key={s.key} src={SYMBOL_ART[s.art]} size="xs" />
      ))}
    </span>
  );
}
