import { Volume2, VolumeX, Maximize2, Minimize2, Crown, Settings } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useLive } from "@/lib/multiplayer";
import { AnimatedStat } from "./AnimatedStat";
import { BetaSheet } from "./BetaSheet";
import { izracunajPotrebniXp } from "@/lib/game/economy";
import { formatHud } from "@/lib/game/helpers";
import { SYMBOL_ART } from "@/lib/game/art";
import { IconBadge } from "./IconBadge";
import { cn } from "@/lib/utils";
import { playSfx } from "@/lib/game/audio";
import { TOK_HOLD_PX, IDI_EVENT, idi, tokMeniEkran, tokMeniZaResurs, type TokMeniStavka } from "@/lib/game/tokMeni";
import { HOLD_UI_MS, holdDosta, postaviVibraciju, vibracijaJeUkljucena } from "@/lib/game/feel";
import { postaviStatistiku, statistikaJeUkljucena, ucitajStatistiku } from "@/lib/game/analitika";
import { imeJePrazno, imeZaNatpis, pozdravIgraca, velicinaImena } from "@/lib/game/ime";
import { useVodic, vodicPreskoci, vodicUpute } from "@/lib/game/vodic";
import { useBroj } from "@/lib/game/useBroj";
import { TokRadial } from "./TokRadial";
import { useSlotStore } from "@/lib/stores/slotStore";

const CHIP_META = [
  { icon: SYMBOL_ART.gold, label: "zlato", fullName: "zlato", klasa: "chip-zlato" },
  { icon: SYMBOL_ART.gem, label: "dijamanti", fullName: "dijamanti", klasa: "chip-dijamant" },
  { icon: SYMBOL_ART.wood, label: "drvo", fullName: "drvo", klasa: "chip-drvo" },
  { icon: SYMBOL_ART.stone, label: "kamen", fullName: "kamen", klasa: "chip-kamen" },
  { icon: SYMBOL_ART.iron, label: "željezo", fullName: "željezo", klasa: "chip-zeljezo" },
] as const;

function ImeNaDodir({
  ime,
  children,
  className,
  klasa,
  onHold,
}: {
  ime: string;
  children: ReactNode;
  className?: string;
  klasa?: string;
  onHold?: (x: number, y: number) => void;
}) {
  const [otkriven, setOtkriven] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hold = useRef<{ x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [drzi, setDrzi] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const otkrij = () => {
    setOtkriven(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOtkriven(false), 1800);
  };

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        if (!onHold) return;
        if (hold.current?.timer) window.clearTimeout(hold.current.timer);
        setDrzi(true);
        hold.current = {
          x: e.clientX,
          y: e.clientY,
          opened: false,
          start: Date.now(),
          timer: window.setTimeout(() => {
            const h = hold.current;
            if (!h) return;
            h.opened = true;
            setDrzi(false);
            onHold(h.x, h.y);
          }, HOLD_UI_MS),
        };
      }}
      onPointerMove={(e) => {
        const h = hold.current;
        if (!h || h.opened) return;
        if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOK_HOLD_PX) {
          window.clearTimeout(h.timer);
          hold.current = null;
          setDrzi(false);
        }
      }}
      onPointerUp={() => {
        const h = hold.current;
        if (h?.timer) window.clearTimeout(h.timer);
        const opened = h?.opened || (!!h && holdDosta(h.start, HOLD_UI_MS));
        if (opened && h && !h.opened) {
          h.opened = true;
          setDrzi(false);
          hold.current = null;
          onHold?.(h.x, h.y);
          return;
        }
        hold.current = null;
        setDrzi(false);
        if (!opened) otkrij();
      }}
      onPointerCancel={() => {
        const h = hold.current;
        if (!h || h.opened) return;
        window.clearTimeout(h.timer);
        hold.current = null;
        setDrzi(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn("relative shrink-0 rounded-full outline-none touch-manipulation", drzi && "chip-drzi", className)}
      title={ime}
      aria-label={ime}
      aria-expanded={otkriven}
    >
      {children}
      <span className={cn("chip-ime", klasa, otkriven ? "chip-ime-on" : "chip-ime-off")} aria-hidden={!otkriven}>
        {ime}
      </span>
    </button>
  );
}

export function Header({
  muted,
  onToggleMute,
  nativeFs,
  canNativeFs,
  onToggleFullscreen,
}: {
  muted: boolean;
  onToggleMute: () => void;
  nativeFs: boolean;
  canNativeFs: boolean;
  onToggleFullscreen: () => void;
}) {
  const igracRazina = useGameStore((s) => s.igracRazina);
  const imeIgraca = useGameStore((s) => s.imeIgraca);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const krunjenja = useGameStore((s) => s.krunjenja);
  const xp = useGameStore((s) => s.xp);
  const zadnjiXp = useGameStore((s) => s.zadnjiXp);
  const xpFlash = useGameStore((s) => s.xpFlash);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const dijamanti = useGameStore((s) => s.dijamanti);
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const kamen = useGameStore((s) => Math.floor(s.resursi.kamen));
  const zeljezo = useGameStore((s) => Math.floor(s.resursi.zeljezo));
  const preuzetoDanas = useGameStore((s) => s.preuzetoDanas);
  const otvoriDnevnuNagradu = useGameStore((s) => s.otvoriDnevnuNagradu);
  const stitovi = useGameStore((s) => s.stitovi);
  const stitoviBroj = useBroj(stitovi, "štitovi");
  const [vib, setVib] = useState(() => vibracijaJeUkljucena());
  const [stat, setStat] = useState(true);
  useEffect(() => {
    ucitajStatistiku();
    setStat(statistikaJeUkljucena());
  }, []);
  const live = useLive();
  const online = useMemo(
    () => live.cowboys.reduce((n, c) => n + (c.connected ? 1 : 0), 0),
    [live.cowboys],
  );
  const [beta, setBeta] = useState(false);
  const [karta, setKarta] = useState(false);
  const [upute, setUpute] = useState(false);
  const vodic = useVodic();
  const [meni, setMeni] = useState<{
    id: "zlato" | "dijamanti" | "drvo" | "kamen" | "željezo" | "štitovi";
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const headRef = useRef<HTMLElement>(null);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);

  const otvoriResurs = (
    id: "zlato" | "dijamanti" | "drvo" | "kamen" | "željezo" | "štitovi",
    x: number,
    y: number,
  ) => {
    playSfx("button");
    const ekran = tokMeniEkran(x, y);
    setMeni({
      id,
      x: ekran.x,
      y: ekran.y,
      w: ekran.w,
      h: ekran.h,
    });
  };

  const naResurs = (s: TokMeniStavka) => {
    setMeni(null);
    const a = s.akcija;
    if (a.vrsta === "tab") idi({ tab: a.tab });
    else if (a.vrsta === "hub") idi({ tab: "selo", hub: a.hub });
    else if (a.vrsta === "pohod") setRaidAktivan(true);
    else if (a.vrsta === "trg") idi({ tab: "selo", trg: true });
  };

  const natpisImena = imeJePrazno(imeIgraca) ? "Kauboj" : imeZaNatpis(imeIgraca);
  const potrebanXp = izracunajPotrebniXp(igracRazina);
  const xpPct = Math.min(100, (xp / Math.max(1, potrebanXp)) * 100);

  useEffect(() => {
    const zatvori = () => setKarta(false);
    window.addEventListener(IDI_EVENT, zatvori);
    window.addEventListener("blago-tab", zatvori);
    window.addEventListener("blago-zatvori-izbornik", zatvori);
    return () => {
      window.removeEventListener(IDI_EVENT, zatvori);
      window.removeEventListener("blago-tab", zatvori);
      window.removeEventListener("blago-zatvori-izbornik", zatvori);
    };
  }, []);

  useEffect(() => {
    if (!karta) return;
    const zatvori = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".kru-okvir") || t?.closest?.(".karta-izbornik")) return;
      setKarta(false);
    };
    window.addEventListener("pointerdown", zatvori);
    return () => window.removeEventListener("pointerdown", zatvori);
  }, [karta]);

  return (
    <header
      ref={headRef}
      className="z-20 shrink-0 overflow-visible border-b border-line bg-void/92 px-2.5 pb-1.5 hdr-gore"
    >
      <div className="relative z-40 mb-1.5 flex items-center gap-1.5">
        <ImeNaDodir ime="razina">
          <div className="kru-sivi relative flex size-8 shrink-0 items-center justify-center text-xs font-bold text-ink" title={natpisImena}>
            {igracRazina}
            {(prestigeRazina > 0 || krunjenja > 0) && (
              <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-prestige text-[7px] font-bold text-void">
                {krunjenja > 0 ? krunjenja : <Crown className="size-2" strokeWidth={2.5} />}
              </span>
            )}
          </div>
        </ImeNaDodir>
        <span
          className={cn(
            "shrink-0 font-bold tracking-wide text-gold uppercase",
            natpisImena.length > 10 && "max-w-[5.5rem] truncate",
          )}
          style={{ fontSize: velicinaImena(imeIgraca) }}
          data-testid="ime-igraca"
        >
          {natpisImena}
        </span>
        <div className="xp-traka relative h-7 min-w-0 flex-1">
          <div className="xp-traka-tijelo">
            <div className="xp-traka-punjenje" style={{ width: `${xpPct}%` }} />
            <span className="xp-traka-sjaj" aria-hidden />
            <span className="xp-traka-broj">
              {formatHud(xp)}/{formatHud(potrebanXp)} XP
            </span>
          </div>
          {xpFlash > 0 && zadnjiXp > 0 && (
            <span
              key={xpFlash}
              className="xp-float pointer-events-none absolute -top-0.5 right-2 text-[10px] font-bold text-xp"
            >
              +{zadnjiXp}
            </span>
          )}
        </div>
        <ImeNaDodir ime="štitovi" klasa="chip-ime-desno" onHold={(x, y) => otvoriResurs("štitovi", x, y)}>
          <div className="kru-stit" aria-hidden data-chip="štitovi">
            {stitoviBroj}
          </div>
        </ImeNaDodir>
        <div className="kru-okvir relative">
          <button
            type="button"
            aria-label="Izbornik"
            aria-expanded={karta}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playSfx("button");
              setKarta((v) => !v);
            }}
            className="kru-sivi kru-sredina"
          >
            <Settings className="kru-bijeli-zup size-3.5" strokeWidth={2.4} />
            <span className="kru-zupcanik" aria-hidden />
          </button>
          {!preuzetoDanas && (
            <button
              type="button"
              onClick={otvoriDnevnuNagradu}
              aria-label="Dnevna nagrada"
              className="kru-dan"
            >
              <IconBadge src={SYMBOL_ART.gold} size="xs" />
            </button>
          )}
          {karta && (
            <div className="karta-izbornik">
              <p className="mb-1 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Izbornik</p>
              <p className="mb-2 truncate text-xs font-bold text-ink">{pozdravIgraca(imeIgraca)}</p>
              <button
                type="button"
                onClick={() => setUpute((v) => !v)}
                className="karta-red"
                aria-expanded={upute}
                aria-label="Upute"
              >
                Upute
              </button>
              {upute && (
                <div style={{ flex: "0 0 auto", maxHeight: "9rem", overflowY: "auto" }}>
                  {vodicUpute().map((u) => (
                    <p key={u.naslov} className="px-1 py-1 text-[11px] font-bold leading-snug text-ink/85">
                      {u.naslov}
                      {u.rec ? <span className="mt-0.5 block font-semibold text-ink/70">{u.rec}</span> : null}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUpute(false)}
                    className="karta-red"
                    aria-label="Zatvori upute"
                  >
                    Zatvori upute
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setBeta(true);
                  setKarta(false);
                }}
                className="karta-red"
                aria-pressed={beta}
                aria-label="Beta, verzija i probni alati"
              >
                <span
                  className={
                    live.joined && online > 0
                      ? "size-1.5 rounded-full bg-volt"
                      : "size-1.5 rounded-full bg-gold"
                  }
                />
                <span>
                  Beta
                  <small>{beta ? "Otvoreno" : "Verzija i probni alati"}</small>
                </span>
              </button>
              <button
                type="button"
                data-lock-pan
                onPointerUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("blago-postavke"));
                  onToggleMute();
                }}
                className="karta-red"
                aria-label={muted ? "Uključi zvuk" : "Isključi zvuk"}
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {muted ? "Bez zvuka" : "Zvuk"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !vibracijaJeUkljucena();
                  postaviVibraciju(next);
                  setVib(next);
                }}
                className="karta-red"
                aria-pressed={vib}
                aria-label={vib ? "Isključi vibraciju" : "Uključi vibraciju"}
              >
                <span className={vib ? "size-1.5 rounded-full bg-gold" : "size-1.5 rounded-full border border-dim"} />
                {vib ? "Vibracija" : "Bez vibracije"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !statistikaJeUkljucena();
                  postaviStatistiku(next);
                  setStat(next);
                }}
                className="karta-red"
                aria-pressed={stat}
                aria-label={stat ? "Isključi anonimnu statistiku" : "Uključi anonimnu statistiku"}
              >
                <span className={stat ? "size-1.5 rounded-full bg-gold" : "size-1.5 rounded-full border border-dim"} />
                Anonimna statistika
              </button>
              {vodic.korak !== "gotovo" && !vodic.staro && (
                <button
                  type="button"
                  onClick={() => {
                    vodicPreskoci();
                    setKarta(false);
                    setUpute(false);
                  }}
                  className="karta-red"
                  aria-label="Preskoči vodič"
                >
                  Preskoči vodič
                </button>
              )}
              {canNativeFs && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="karta-red"
                  aria-label={nativeFs ? "Izlaz iz punog ekrana" : "Puni ekran"}
                >
                  {nativeFs ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                  {nativeFs ? "Uži ekran" : "Puni ekran"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hud-resursi relative z-10 grid grid-cols-5 gap-0.5 overflow-visible">
        <Chip value={zlato} {...CHIP_META[0]!} onHold={(x, y) => otvoriResurs("zlato", x, y)} />
        <Chip value={dijamanti} {...CHIP_META[1]!} onHold={(x, y) => otvoriResurs("dijamanti", x, y)} />
        <Chip value={drvo} {...CHIP_META[2]!} onHold={(x, y) => otvoriResurs("drvo", x, y)} />
        <Chip value={kamen} {...CHIP_META[3]!} onHold={(x, y) => otvoriResurs("kamen", x, y)} />
        <Chip value={zeljezo} {...CHIP_META[4]!} onHold={(x, y) => otvoriResurs("željezo", x, y)} />
      </div>
      {meni && (
        <TokRadial
          x={meni.x}
          y={meni.y}
          sirina={meni.w}
          visina={meni.h}
          stavke={tokMeniZaResurs(meni.id)}
          polukrug
          onOdabir={naResurs}
          onZatvori={() => setMeni(null)}
        />
      )}
      <BetaSheet open={beta} onClose={() => setBeta(false)} />
    </header>
  );
}

const Chip = memo(function Chip({
  value,
  icon,
  fullName,
  klasa,
  onHold,
}: {
  value: number;
  icon: string;
  label: string;
  fullName: string;
  klasa?: string;
  onHold?: (x: number, y: number) => void;
}) {
  const broj = useBroj(value, fullName);
  const [otkriven, setOtkriven] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hold = useRef<{ x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const [drzi, setDrzi] = useState(false);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const otkrij = () => {
    setOtkriven(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOtkriven(false), 1800);
  };

  return (
    <AnimatedStat
      value={value}
      chip={fullName}
      className={cn(
        "relative flex h-9 min-w-0 flex-col items-center justify-center gap-0 overflow-visible rounded-full border border-line bg-panel px-0.5 py-0.5",
        klasa,
        drzi && "chip-drzi",
      )}
    >
      <button
        type="button"
        onPointerDown={(e) => {
          if (!onHold) return;
          if (hold.current?.timer) window.clearTimeout(hold.current.timer);
          setDrzi(true);
          hold.current = {
            x: e.clientX,
            y: e.clientY,
            opened: false,
            start: Date.now(),
            timer: window.setTimeout(() => {
              const h = hold.current;
              if (!h) return;
              h.opened = true;
              setDrzi(false);
              onHold(h.x, h.y);
            }, HOLD_UI_MS),
          };
        }}
        onPointerMove={(e) => {
          const h = hold.current;
          if (!h || h.opened) return;
          if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOK_HOLD_PX) {
            window.clearTimeout(h.timer);
            hold.current = null;
            setDrzi(false);
          }
        }}
        onPointerUp={() => {
          const h = hold.current;
          if (h?.timer) window.clearTimeout(h.timer);
          const opened = h?.opened || (!!h && holdDosta(h.start, HOLD_UI_MS));
          if (opened && h && !h.opened) {
            h.opened = true;
            setDrzi(false);
            hold.current = null;
            onHold?.(h.x, h.y);
            return;
          }
          hold.current = null;
          setDrzi(false);
          if (!opened) otkrij();
        }}
        onPointerCancel={() => {
          const h = hold.current;
          if (!h || h.opened) return;
          window.clearTimeout(h.timer);
          hold.current = null;
          setDrzi(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="flex h-full min-h-9 w-full min-w-0 flex-col items-center justify-center gap-0 rounded-full outline-none touch-manipulation"
        title={fullName}
        aria-label={`${fullName}: ${formatHud(value)}`}
        aria-expanded={otkriven}
      >
        <span className="flex min-w-0 items-center justify-center gap-0.5">
          <IconBadge src={icon} size="xs" className="!size-4 shrink-0" />
          <span className="min-w-0 truncate text-[12px] font-bold tabular-nums leading-none text-ink">
            {formatHud(broj)}
          </span>
        </span>
        <span
          className={cn("chip-ime", otkriven ? "chip-ime-on" : "chip-ime-off")}
          aria-hidden={!otkriven}
        >
          {fullName}
        </span>
      </button>
    </AnimatedStat>
  );
});
