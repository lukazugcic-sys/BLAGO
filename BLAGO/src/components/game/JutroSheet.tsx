import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "@/lib/stores/gameStore";
import { LikAvatar } from "./LikAvatar";
import { NagradaPikseli } from "./NagradaPikseli";
import { jutroGotovo, jutroSveUzeto, type JutarnjiPosao } from "@/lib/game/jutro";
import { formatCountdown, msUntilMidnight } from "@/lib/game/daily";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

function useMidnightCountdown(active: boolean) {
  const [ostalo, setOstalo] = useState(() => formatCountdown(msUntilMidnight()));
  useEffect(() => {
    if (!active) return;
    const tick = () => setOstalo(formatCountdown(msUntilMidnight()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [active]);
  return ostalo;
}

function SutraCta({ className }: { className?: string }) {
  const ostalo = useMidnightCountdown(true);
  return (
    <div className={cn("rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-center", className)}>
      <p className="text-sm font-bold tracking-wide text-gold">Dođi sutra</p>
      <p className="mt-0.5 text-[11px] font-bold tabular-nums text-ink/80">
        Sljedeće jutro za {ostalo}
      </p>
    </div>
  );
}

function Kartica({ p, naTab }: { p: JutarnjiPosao; naTab?: (id: "automat" | "selo") => void }) {
  const ljudi = useGameStore((s) => s.ljudi);
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const uzmi = useGameStore((s) => s.uzmiJutarnju);
  const dajDrvo = useGameStore((s) => s.dajIvuDrvo);
  const lik = ljudi.find((l) => l.id === p.likId);
  const gotovo = jutroGotovo(p);
  const mozeDrvo = p.tip === "drvo" && !gotovo && drvo >= p.cilj;

  const akcija = () => {
    playSfx("button");
    if (gotovo && !p.uzeto) {
      uzmi(p.id);
      return;
    }
    if (p.tip === "drvo") {
      dajDrvo();
      return;
    }
    if (p.tip === "spin") {
      useGameStore.getState().skloniJutro();
      naTab?.("automat");
    }
    if (p.tip === "selo") {
      useGameStore.getState().skloniJutro();
      naTab?.("selo");
    }
  };

  const label = p.uzeto
    ? "GOTOVO"
    : gotovo
      ? "HVALA"
      : p.tip === "drvo"
        ? mozeDrvo
          ? `DAJ ${p.cilj} DRVA`
          : `TREBA ${p.cilj} DRVA`
        : p.tip === "spin"
          ? "VRTI"
          : "IDI U KAUBU";

  return (
    <article className={cn("rounded-2xl border p-3", p.uzeto ? "border-quest/40 bg-quest/10" : gotovo ? "border-quest bg-quest/15" : "border-line bg-panel-2")}>
      <div className="flex items-start gap-2.5">
        <span className="kauba-chip-avatar shrink-0">
          {lik ? <LikAvatar p={lik} mood={p.uzeto ? "mir" : "krov"} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-wide text-gold uppercase">{p.likIme}</p>
          <p className="text-sm font-bold leading-snug text-ink">{p.rec}</p>
        </div>
        <p className="shrink-0 text-[11px] font-bold tabular-nums text-dim">
          {Math.min(p.cilj, p.trenutno)}/{p.cilj}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-void">
        <div className={cn("h-full rounded-full", gotovo ? "bg-quest" : "bg-gold")} style={{ width: `${Math.min(100, (p.trenutno / p.cilj) * 100)}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <NagradaPikseli nagrada={p.nagrada} />
        <button
          type="button"
          disabled={p.uzeto || (p.tip === "drvo" && !gotovo && !mozeDrvo)}
          onClick={akcija}
          className={cn(
            "min-h-10 rounded-lg px-3 text-[11px] font-bold tracking-wide",
            p.uzeto ? "bg-panel text-dim" : gotovo || mozeDrvo || p.tip !== "drvo" ? "bg-quest text-void" : "bg-panel text-dim",
          )}
        >
          {label}
        </button>
      </div>
    </article>
  );
}

export function JutroSheet({ naTab }: { naTab?: (id: "automat" | "selo") => void }) {
  const jutro = useGameStore((s) => s.jutro);
  const list = useGameStore((s) => s.jutroList);
  const dnevna = useGameStore((s) => s.prikazDnevneNagrade);
  const skloni = useGameStore((s) => s.skloniJutro);
  const sveUzeto = jutroSveUzeto(jutro);

  if (typeof document === "undefined" || !list || dnevna || !jutro.length) return null;

  if (sveUzeto) {
    return createPortal(
      <div className="modal-pozadina fixed inset-0 z-[70] flex items-end justify-center bg-void/75 p-4 sm:items-center">
        <div className="modal-ulaz max-h-[min(40rem,90dvh)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-panel p-5">
          <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">Jutros u kaubi</p>
          <h2 className="font-display mt-1 text-xl text-gold">Jutro je gotovo</h2>
          <p className="mt-1 text-xs font-bold text-ink/70">Kauba je mirna. Tri posla su obavljena.</p>
          <SutraCta className="mt-4" />
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              skloni();
            }}
            className="mt-4 min-h-11 w-full rounded-full border border-line bg-panel-2 text-xs font-bold tracking-widest text-ink uppercase"
          >
            Zatvori
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  const otvoreno = jutro.filter((p) => !p.uzeto).length;

  return createPortal(
    <div className="modal-pozadina fixed inset-0 z-[70] flex items-end justify-center bg-void/75 p-4 sm:items-center">
      <div className="modal-ulaz max-h-[min(40rem,90dvh)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-panel p-5">
        <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">Jutros u kaubi</p>
        <h2 className="font-display mt-1 text-xl text-gold">Tri posla</h2>
        <p className="mt-1 text-xs font-bold text-ink/70">Kata, Ivo i Boro čekaju. Dva minuta.</p>
        <div className="mt-3 flex flex-col gap-2">
          {jutro.map((p) => (
            <Kartica key={p.id} p={p} naTab={naTab} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            skloni();
          }}
          className="mt-4 min-h-11 w-full rounded-full border border-line bg-panel-2 text-xs font-bold tracking-widest text-ink uppercase"
        >
          {otvoreno ? `Kreni · ${otvoreno} ostalo` : "Zatvori"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function JutroTraka({ naTab }: { naTab?: (id: "automat" | "selo") => void }) {
  const jutro = useGameStore((s) => s.jutro);
  const otvori = useGameStore((s) => s.otvoriJutro);
  const ljudi = useGameStore((s) => s.ljudi);
  const sveUzeto = jutro.length > 0 && jutroSveUzeto(jutro);
  const ostaloCd = useMidnightCountdown(sveUzeto);

  if (!jutro.length) return null;

  if (sveUzeto) {
    return (
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          otvori();
        }}
        className="flex w-full items-center gap-2 rounded-xl border border-quest/35 bg-quest/10 px-2.5 py-1.5 text-left"
      >
        <span className="flex -space-x-1.5">
          {jutro.map((p) => {
            const lik = ljudi.find((l) => l.id === p.likId);
            return (
              <span key={p.id} className="kauba-chip-avatar size-7 opacity-40">
                {lik ? <LikAvatar p={lik} mood="mir" /> : null}
              </span>
            );
          })}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-wide text-quest uppercase">Jutros gotovo</span>
          <span className="block truncate text-xs font-bold text-ink">
            Dođi sutra · za {ostaloCd}
          </span>
        </span>
        <span className="text-[11px] font-bold tabular-nums text-dim">3/3</span>
      </button>
    );
  }

  const spremno = jutro.filter((p) => jutroGotovo(p) && !p.uzeto).length;
  const ostalo = jutro.filter((p) => !p.uzeto).length;

  return (
    <button
      type="button"
      onClick={() => {
        playSfx("button");
        otvori();
      }}
      className="flex w-full items-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-2.5 py-1.5 text-left"
    >
      <span className="flex -space-x-1.5">
        {jutro.map((p) => {
          const lik = ljudi.find((l) => l.id === p.likId);
          return (
            <span key={p.id} className={cn("kauba-chip-avatar size-7", p.uzeto && "opacity-40")}>
              {lik ? <LikAvatar p={lik} mood={p.uzeto ? "mir" : "krov"} /> : null}
            </span>
          );
        })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-wide text-gold uppercase">Jutros</span>
        <span className="block truncate text-xs font-bold text-ink">
          {spremno > 0 ? `${spremno} spremno` : `${ostalo} posla čeka`}
        </span>
      </span>
      <span className="text-[11px] font-bold tabular-nums text-dim">{3 - ostalo}/3</span>
    </button>
  );
}

export function JutroPopis({ naTab }: { naTab?: (id: "automat" | "selo") => void }) {
  const jutro = useGameStore((s) => s.jutro);
  if (!jutro.length) return null;
  const sveUzeto = jutroSveUzeto(jutro);

  return (
    <div className="mb-3 flex flex-col gap-2">
      <p className="ml-1 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Jutros</p>
      {sveUzeto ? (
        <>
          <SutraCta />
          <p className="px-1 text-[11px] font-bold text-dim">Tri posla obavljena. Nova u ponoć.</p>
        </>
      ) : (
        jutro.map((p) => <Kartica key={p.id} p={p} naTab={naTab} />)
      )}
    </div>
  );
}
