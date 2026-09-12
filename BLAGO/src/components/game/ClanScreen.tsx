import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useGameStore } from "@/lib/stores/gameStore";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { createClan, donateClan, joinClan } from "@/lib/game/cloud";
import { Flag, Gift, Swords, Target, Trophy } from "lucide-react";
import { NagradaPikseli } from "./NagradaPikseli";
import { SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

const DONACIJA_IZNOS = 200;

export function ClanScreen({ embedded = false }: { embedded?: boolean }) {
  const user = useCurrentUser();
  const zlato = useGameStore((s) => s.zlato);
  const klan = useGameStore((s) => s.klan);
  const osnujiKlan = useGameStore((s) => s.osnujiKlan);
  const doniraiUKlan = useGameStore((s) => s.doniraiUKlan);
  const preuzmiKlanNagradu = useGameStore((s) => s.preuzmiKlanNagradu);
  const refreshKlanZadatke = useGameStore((s) => s.refreshKlanZadatke);
  const [imeTxt, setImeTxt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (klan.naziv) refreshKlanZadatke();
  }, [klan.naziv, refreshKlanZadatke]);

  const osnuj = async () => {
    const naziv = imeTxt.trim();
    if (naziv.length < 2) return;
    setErr(null);
    setBusy(true);
    try {
      if (user) {
        const k = await createClan({ data: naziv });
        useGameStore.setState({ klan: k, poruka: `KLAN "${naziv.toUpperCase()}" OSNOVAN!` });
      } else {
        osnujiKlan(naziv);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Klan već postoji");
    } finally {
      setBusy(false);
    }
  };

  const pridruzi = async () => {
    const naziv = imeTxt.trim();
    if (naziv.length < 2 || !user) return;
    setErr(null);
    setBusy(true);
    try {
      const k = await joinClan({ data: naziv });
      useGameStore.setState({ klan: k, poruka: `PRIDRUŽEN KLANU "${k.naziv.toUpperCase()}"` });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Klan nije pronađen");
    } finally {
      setBusy(false);
    }
  };

  const doniraj = async () => {
    if (zlato < DONACIJA_IZNOS) return;
    if (user) {
      try {
        await donateClan({ data: DONACIJA_IZNOS });
      } catch {
        /* local fallback */
      }
    }
    doniraiUKlan(DONACIJA_IZNOS);
  };

  if (!klan.naziv) {
    return (
      <div
        className={
          embedded
            ? "flex flex-col items-center px-4 py-10 text-center"
            : "mx-auto flex w-full max-w-lg flex-col items-center px-8 py-16 text-center"
        }
      >
        <Flag className="size-14 text-clan" strokeWidth={1.6} />
        <h2 className="mt-5 text-2xl font-bold text-ink">Nemaš klan</h2>
        <p className="mt-2 mb-7 text-sm text-dim">
          {user
            ? "Osnuj klan ili se pridruži."
            : "Osnuj lokalni klan, ili se prijavi za dijeljeni ceh."}
        </p>
        <input
          value={imeTxt}
          onChange={(e) => setImeTxt(e.target.value)}
          maxLength={24}
          placeholder="Ime klana (min. 2 slova)"
          className="mb-3 min-h-12 w-full rounded-lg border border-line bg-panel px-4 text-sm font-semibold text-ink placeholder:text-dim"
        />
        {err && <p className="mb-3 text-xs font-bold text-ruby">{err}</p>}
        <button
          type="button"
          disabled={busy || imeTxt.trim().length < 2}
          onClick={() => void osnuj()}
          className="min-h-12 w-full rounded-lg bg-gold text-sm font-bold tracking-wide text-void disabled:opacity-40"
        >
          OSNUJ KLAN
        </button>
        {user ? (
          <button
            type="button"
            disabled={busy || imeTxt.trim().length < 2}
            onClick={() => void pridruzi()}
            className="mt-2 min-h-12 w-full rounded-lg border border-clan/50 bg-clan/15 text-sm font-bold tracking-wide text-clan disabled:opacity-40"
          >
            PRIDRUŽI SE
          </button>
        ) : (
          <p className="mt-4 text-xs text-dim">
            <Link to="/login" className="font-bold text-gold">
              Prijavi se
            </Link>{" "}
            za dijeljeni ceh.
          </p>
        )}
      </div>
    );
  }

  const xpZaRazinu = klan.razina * 1000;
  const xpPostotak = Math.min(1, klan.xp / xpZaRazinu);

  return (
    <div className={embedded ? "" : "mx-auto w-full max-w-lg px-3 pb-8 pt-3"}>
      <article className="mb-3.5 rounded-2xl border border-clan/40 bg-panel p-5">
        <div className="mb-4 flex items-center gap-3.5">
          <Swords className="size-7 text-clan" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-wide text-clan">{klan.naziv}</h2>
            <p className="text-xs text-dim">Razina {klan.razina}</p>
          </div>
          <span className="rounded-md bg-clan/20 px-2.5 py-1.5 text-xs font-bold text-clan">
            {klan.xp} / {xpZaRazinu} XP
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-clan" style={{ width: `${xpPostotak * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={() => void doniraj()}
          disabled={zlato < DONACIJA_IZNOS}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/15 text-xs font-bold tracking-wide text-gold disabled:opacity-40"
        >
          <IconBadge src={SYMBOL_ART.gold} size="xs" />
          DONIRAJ {DONACIJA_IZNOS} ZLATA
        </button>
      </article>

      <h3 className="mb-3 ml-1 text-sm font-bold tracking-widest text-ink uppercase">Tjedni zadaci</h3>
      {klan.zadaci.map((z) => {
        const postotak = Math.min(1, z.trenutno / Math.max(1, z.cilj));
        const mozePrimiti = z.zavrseno && !z.preuzeto;
        return (
          <article
            key={z.id}
            className={cn(
              "mb-3 rounded-xl border bg-panel p-4",
              z.zavrseno && !z.preuzeto ? "border-clan/70" : "border-line",
              z.preuzeto && "opacity-45",
            )}
          >
            <div className="mb-3 flex items-start gap-2.5">
              {z.zavrseno ? (
                <Trophy className="size-4 shrink-0 text-clan" strokeWidth={2.5} />
              ) : (
                <Target className="size-4 shrink-0 text-dim" strokeWidth={2.5} />
              )}
              <p className={cn("text-sm font-semibold leading-snug", z.preuzeto ? "text-dim" : "text-ink")}>
                {z.opis}
              </p>
            </div>
            <div className="mb-1 h-1 overflow-hidden rounded-full bg-ink/10">
              <div
                className={cn("h-full rounded-full", z.zavrseno ? "bg-clan" : "bg-xp")}
                style={{ width: `${postotak * 100}%` }}
              />
            </div>
            <p className="mb-2.5 text-[11px] tabular-nums text-dim">
              {z.trenutno} / {z.cilj}
            </p>
            <div className="flex items-center justify-between border-t border-line pt-2.5">
              <NagradaPikseli nagrada={z.nagrada} />
              {mozePrimiti && (
                <button
                  type="button"
                  onClick={() => preuzmiKlanNagradu(z.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-clan px-3.5 py-2.5 text-xs font-bold text-void"
                >
                  <Gift className="size-3.5" strokeWidth={2.5} />
                  PREUZMI
                </button>
              )}
              {z.preuzeto && <span className="text-xs font-semibold text-clan">Preuzeto</span>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
