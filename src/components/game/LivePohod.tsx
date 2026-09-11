import { useState } from "react";
import { Radio, WifiOff } from "lucide-react";
import { useLive, sanitizeRoom } from "@/lib/multiplayer";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { formatHud } from "@/lib/game/helpers";
import { playSfx } from "@/lib/game/audio";
import { IconBadge } from "./IconBadge";
import { SYMBOL_ART } from "@/lib/game/art";
import { cn } from "@/lib/utils";
import { SUSJEDI, serifKaoLik } from "@/lib/game/susjedi";
import { LikAvatar } from "./LikAvatar";
import { tjedanSad } from "@/lib/game/tjedan";
import { hrpeIzResursa, jeTerminal } from "@/lib/game/raids";

const CHEER = ["POZDRAV", "JAŠI", "ČUVAJ"] as const;
const KOD_SLOVA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function noviKod() {
  let s = "";
  for (let i = 0; i < 5; i++) s += KOD_SLOVA[Math.floor(Math.random() * KOD_SLOVA.length)];
  return s;
}

export function LivePohod() {
  const live = useLive();
  const ime = useGameStore((s) => s.imeIgraca);
  const postaviIme = useGameStore((s) => s.postaviIme);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const [kod, setKod] = useState(live.room);
  const [imeTxt, setImeTxt] = useState(ime);
  const [kopirano, setKopirano] = useState(false);
  const metaTjedna = tjedanSad().susjed?.uid;

  const spojeni = live.cowboys.filter((c) => c.connected).length;

  const kopiraj = async () => {
    try {
      await navigator.clipboard.writeText(live.room);
      setKopirano(true);
      playSfx("button");
      window.setTimeout(() => setKopirano(false), 1400);
    } catch {
      playSfx("button");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Radio className="size-5 text-gold" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-widest text-gold uppercase">Uživo</h2>
          <p className="text-[10px] font-bold tracking-wider text-dim uppercase">
            {live.joined
              ? spojeni > 0
                ? `${spojeni} kauboj${spojeni === 1 ? "" : "a"} na vezi · tabor ${live.room}`
                : `Tabor ${live.room} · čekam prijatelja`
              : "Kopita u daljini…"}
          </p>
        </div>
        <span
          className={cn(
            "size-2.5 rounded-full",
            live.joined ? "bg-volt shadow-[0_0_8px_var(--color-volt)] pohod-pulse" : "bg-dim",
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
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-3 py-2 text-sm font-bold text-ink outline-none focus:border-gold/60"
          />
          <button
            type="button"
            onClick={() => {
              const n = imeTxt.trim().slice(0, 16);
              if (!n) return;
              postaviIme(n);
              playSfx("button");
            }}
            className="min-h-11 rounded-xl border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wider text-gold uppercase"
          >
            Spremi
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-widest text-dim uppercase">Kod tabora — reci ga prijatelju</span>
        <div className="flex gap-1.5">
          <input
            value={kod}
            maxLength={12}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-void/70 px-3 py-2 font-mono text-sm font-bold tracking-[0.2em] text-gold outline-none focus:border-gold/60"
          />
          <button
            type="button"
            onClick={() => {
              live.joinRoom(sanitizeRoom(kod));
              playSfx("button");
            }}
            className="min-h-11 rounded-xl border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wider text-gold uppercase"
          >
            Uđi
          </button>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => void kopiraj()}
            className="min-h-9 rounded-full border border-line bg-panel-2 px-3 text-[10px] font-bold tracking-wide text-ink uppercase"
          >
            {kopirano ? "U džepu" : "Kopiraj kod"}
          </button>
          <button
            type="button"
            onClick={() => {
              const n = noviKod();
              setKod(n);
              live.joinRoom(n);
              playSfx("button");
            }}
            className="min-h-9 rounded-full border border-line bg-panel-2 px-3 text-[10px] font-bold tracking-wide text-ink uppercase"
          >
            Novi tabor
          </button>
        </div>
      </label>

      <div className="flex flex-wrap gap-1.5">
        {CHEER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => live.sendChat(c)}
            className="min-h-9 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gold uppercase"
          >
            {c}
          </button>
        ))}
      </div>

      {live.pohod && live.pohod.faza !== "kraj" && (
        <div className="live-duel-traka rounded-xl border border-ruby/50 bg-ruby/10 px-3 py-2">
          <p className="text-[10px] font-bold tracking-widest text-ruby uppercase">
            {live.pohod.faza === "ceka"
              ? "Kopita u daljini"
              : live.pohod.faza === "poziv"
                ? "Juriš na ostavu"
                : live.pohod.faza === "serif"
                  ? "Šerif na ulici"
                  : "Dvoboj"}
          </p>
          <p className="text-sm font-bold text-ink">
            {live.pohod.uloga === "napadac" ? `Jašeš na ${live.pohod.ime}` : `${live.pohod.ime} juriša`}
          </p>
        </div>
      )}

      {live.posjet && (
        <div className="live-duel-traka rounded-xl border border-gold/50 bg-gold/10 px-3 py-2">
          <p className="text-[10px] font-bold tracking-widest text-gold uppercase">Posjet</p>
          <p className="text-sm font-bold text-ink">
            {live.posjet.uloga === "gost"
              ? live.posjet.faza === "ceka"
                ? `Čekaš kapiju ${live.posjet.ime}`
                : `U taboru ${live.posjet.ime}`
              : `${live.posjet.ime} je u taboru`}
          </p>
        </div>
      )}

      {live.trojac && live.trojac.faza !== "kraj" && (
        <div className="live-duel-traka rounded-xl border border-gold/50 bg-gold/10 px-3 py-2">
          <p className="text-[10px] font-bold tracking-widest text-gold uppercase">Trojac</p>
          <p className="text-sm font-bold text-ink">
            {live.trojac.ime} · {live.trojac.meta.ime} · šerif {live.trojac.meta.serif}
          </p>
        </div>
      )}

      {live.cowboys.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold tracking-widest text-gold uppercase">Susjedne kaube</p>
          <ul className="flex flex-col gap-1.5">
            {SUSJEDI.map((s) => (
              <li
                key={s.uid}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-2.5 py-2",
                  s.uid === metaTjedna ? "border-ruby/60 bg-ruby/15" : "border-line bg-void/55",
                )}
              >
                <span className="kauba-chip-avatar shrink-0">
                  <LikAvatar p={serifKaoLik(s)} mood="mir" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{s.kauba}</p>
                  <p className="text-[10px] font-bold tracking-wider text-dim uppercase">Šerif {s.serif}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {live.cowboys.map((c) => (
            <li
              key={c.id}
              className={cn(
                "live-cowboy flex flex-wrap items-center gap-2 rounded-2xl border px-2.5 py-2",
                c.connected ? "border-line bg-void/55" : "border-ruby/40 bg-ruby/10",
              )}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  c.connected ? "bg-volt pohod-pulse" : c.failed ? "bg-ruby" : "bg-dim",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{c.ime}</p>
                <p className="text-[10px] font-bold tracking-wider text-dim uppercase">
                  lv {c.razina}
                  {c.kat ? ` · ${c.kat}` : ""}
                  {c.ljudi > 0 ? ` · ${c.ljudi}` : ""}
                  {c.jahanje > 0 ? " · jaše" : ""}
                  {c.ophodnja > 0 ? " · ophodnja" : ""}
                  {c.failed ? " · veza pala" : !c.connected ? " · prašina" : ""}
                </p>
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-gold">
                <IconBadge src={SYMBOL_ART.gold} size="xs" />
                {formatHud(c.zlato)}
              </span>
              {c.stitovi > 0 && <IconBadge src={SYMBOL_ART.shield} size="xs" />}
              {!c.connected && <WifiOff className="size-3.5 text-dim" />}
              {c.connected && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("button");
                      live.pozoviPosjet(c.id, c.ime);
                    }}
                    className="min-h-9 rounded-full border border-gold/50 bg-gold/10 px-2.5 text-[10px] font-bold tracking-wide text-gold uppercase"
                  >
                    Posjeti
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("attack");
                      live.pozoviTrojac(c.id, c.ime);
                    }}
                    className="min-h-9 rounded-full border border-gold/50 bg-gold/15 px-2.5 text-[10px] font-bold tracking-wide text-gold uppercase"
                  >
                    Trojac
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("button");
                      live.dar(c.id, "drvo");
                    }}
                    className="min-h-9 rounded-full border border-wood/50 bg-wood/15 px-2.5 text-[10px] font-bold tracking-wide text-wood uppercase"
                  >
                    Drvo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("button");
                      live.dar(c.id, "zlato");
                    }}
                    className="min-h-9 rounded-full border border-gold/50 bg-gold/10 px-2.5 text-[10px] font-bold tracking-wide text-gold uppercase"
                  >
                    Zlato
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("attack");
                      const h = hrpeIzResursa({ drvo: c.drvo, kamen: c.kamen, zeljezo: c.zeljezo });
                      if (jeTerminal(h)) {
                        useGameStore.setState({ poruka: `${c.ime}: ostava je prazna.` });
                        return;
                      }
                      live.pozoviPohod(c.id, c.ime, h);
                      setRaidAktivan(true);
                    }}
                    className="min-h-9 rounded-full bg-ruby px-2.5 text-[10px] font-bold tracking-wide text-ink uppercase"
                  >
                    Pohod
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          playSfx("button");
          setRaidAktivan(true);
        }}
        className="min-h-11 rounded-xl bg-ruby px-3 text-xs font-bold tracking-widest text-ink"
      >
        Pohod na susjede
      </button>

      {live.feed.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line pt-2">
          {live.feed
            .slice()
            .reverse()
            .slice(0, 8)
            .map((f) => (
              <li key={f.id} className="live-feed-red text-[11px] font-bold text-ink/80">
                {f.text}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
