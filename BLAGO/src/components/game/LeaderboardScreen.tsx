import { useEffect, useState } from "react";
import { Crown, Trophy, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGameStore } from "@/lib/stores/gameStore";
import { LJESTVICA_GHOSTS } from "@/lib/game/constants";
import { listLeaderboard } from "@/lib/game/cloud";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { formatNum } from "@/lib/game/helpers";
import { cn } from "@/lib/utils";
import type { LjestvicaRed } from "@/lib/game/types";

const MEDALJE = ["text-gold", "text-stone", "text-quest"];

export function LeaderboardScreen({ embedded = false }: { embedded?: boolean }) {
  const user = useCurrentUser();
  const localUid = useGameStore((s) => s.uid);
  const mojUid = user?.id ?? localUid;
  const imeIgraca = useGameStore((s) => s.imeIgraca);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const prestigeRazina = useGameStore((s) => s.prestigeRazina);
  const ukupnoZlata = useGameStore((s) => s.ukupnoZlata);
  const ukupnoVrtnji = useGameStore((s) => s.ukupnoVrtnji);
  const klan = useGameStore((s) => s.klan);
  const [live, setLive] = useState<LjestvicaRed[] | null>(null);

  useEffect(() => {
    if (!user) {
      setLive(null);
      return;
    }
    let cancelled = false;
    void listLeaderboard()
      .then((rows) => {
        if (!cancelled) setLive(rows);
      })
      .catch(() => {
        if (!cancelled) setLive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const me: LjestvicaRed = {
    uid: mojUid ?? "me",
    imeIgraca: imeIgraca || "Igrač",
    igracRazina,
    prestigeRazina,
    ukupnoZlata,
    ukupnoVrtnji,
    klanNaziv: klan.naziv,
  };

  const igraci = (live && live.length > 0 ? live : [...LJESTVICA_GHOSTS, me])
    .filter((r, i, arr) => arr.findIndex((x) => x.uid === r.uid) === i)
    .concat(live && live.some((r) => r.uid === me.uid) ? [] : live ? [me] : [])
    .sort((a, b) => {
      if (b.prestigeRazina !== a.prestigeRazina) return b.prestigeRazina - a.prestigeRazina;
      return b.ukupnoZlata - a.ukupnoZlata;
    });

  return (
    <div className={embedded ? "" : "mx-auto w-full max-w-lg px-3 pb-8 pt-3"}>
      <div className="mb-4 flex items-center gap-2.5 border-b border-line pb-4">
        <Trophy className="size-5 text-gold" strokeWidth={2} />
        <h2 className="flex-1 text-sm font-bold tracking-widest text-gold uppercase">
          Globalna ljestvica
        </h2>
      </div>
      <p className="mb-3 text-xs text-dim">
        {user ? (
          "Živi poredak igrača. Prijavljeni se spremaju u oblak."
        ) : (
          <>
            Lokalni poredak.{" "}
            <Link to="/login" className="font-bold text-gold">
              Prijavi se
            </Link>{" "}
            za pravu ljestvicu.
          </>
        )}
      </p>
      <div className="flex flex-col gap-2">
        {igraci.map((item, index) => {
          const ja = item.uid === mojUid || item.uid === "me";
          return (
            <div
              key={item.uid}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                ja ? "border-volt/50 bg-volt/10" : "border-line bg-panel",
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs font-bold",
                  index < 3 ? MEDALJE[index] : "border-line text-dim",
                )}
              >
                {index === 0 ? <Crown className="size-3.5" strokeWidth={2.5} /> : index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-bold", ja ? "text-volt" : "text-ink")}>
                  {item.imeIgraca}
                  {ja ? " (ti)" : ""}
                </p>
                {item.klanNaziv ? (
                  <p className="text-[11px] font-semibold text-clan">{item.klanNaziv}</p>
                ) : null}
              </div>
              <div className="text-right">
                {item.prestigeRazina > 0 && (
                  <p className="text-xs font-bold text-prestige">* {item.prestigeRazina}</p>
                )}
                <p className="text-[11px] font-semibold text-dim">Lv {item.igracRazina}</p>
                <p className="text-xs font-bold tabular-nums text-gold">
                  {formatNum(item.ukupnoZlata)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-dim">
        <User className="size-3" />
        {user ? "Spremljeno na racun." : "Tvoj napredak se sprema na ovom uredaju."}
      </p>
    </div>
  );
}
