import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ART, HUB_ART, HUB_VIDEO } from "@/lib/game/art";
import { POTREBE_META, type KaubaUsko } from "@/lib/game/economy";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { TOK_HOLD_MS, TOK_HOLD_PX, type TokCvorId, type TokMeniStavka } from "@/lib/game/tokMeni";
import { holdDosta, osjeti } from "@/lib/game/feel";
import type { DanDoba } from "@/lib/game/ljudi";
import { useGameStore } from "@/lib/stores/gameStore";
import { TokIkonica } from "./TokRadial";
import { KaubaZivaUlica } from "./KaubaZivaUlica";
import { VideoLoop } from "./VideoLoop";
import { Lock } from "lucide-react";
import { useSekunda } from "@/lib/game/sat";

function kadri(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fn();
    return;
  }
  doc.startViewTransition(() => fn());
}

function fmtOstalo(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(s / 60);
  return `${min}:${String(s % 60).padStart(2, "0")}`;
}

function imePrstena(id: TokCvorId) {
  if (id === "selo") return "";
  return POTREBE_META.find((p) => p.id === id)?.naziv ?? "";
}

export function KaubaScena({
  id,
  doba,
  meni,
  imeNaselja,
  onHold,
  onTap,
  onOdabir,
  onZatvori,
  ziva = true,
}: {
  id: TokCvorId;
  doba: DanDoba;
  meni: TokMeniStavka[] | null;
  imeNaselja: string;
  onHold: () => void;
  onTap: () => void;
  onOdabir: (s: TokMeniStavka) => void;
  onZatvori: () => void;
  ziva?: boolean;
}) {
  const hold = useRef<{ x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);
  const meniOd = useRef(0);
  const metci = useGameStore((s) => s.metci);
  const metakRed = useGameStore((s) => s.metakRed);
  const dogadaj = useGameStore((s) => s.metakDogadaj);
  const sad = useSekunda(!!dogadaj);
  const biloMetaka = useRef(metci);
  const [okret, setOkret] = useState(false);

  const trg = id === "selo";
  const video = trg ? null : HUB_VIDEO[id];
  const poster = trg ? ART.ulica : (HUB_ART[id] ?? ART.ulica);
  const ime = imePrstena(id);
  void imeNaselja;

  useEffect(() => {
    return () => {
      if (hold.current?.timer) window.clearTimeout(hold.current.timer);
    };
  }, []);

  useEffect(() => {
    if (metci < biloMetaka.current) {
      setOkret(true);
      const t = window.setTimeout(() => setOkret(false), 240);
      biloMetaka.current = metci;
      return () => window.clearTimeout(t);
    }
    biloMetaka.current = metci;
  }, [metci]);

  useEffect(() => {
    if (meni) meniOd.current = Date.now();
  }, [meni]);

  const kreni = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (hold.current?.timer) window.clearTimeout(hold.current.timer);
    hold.current = {
      x: e.clientX,
      y: e.clientY,
      opened: false,
      start: Date.now(),
      timer: window.setTimeout(() => {
        const h = hold.current;
        if (!h) return;
        h.opened = true;
        playSfx("button");
        osjeti("hold");
        onHold();
      }, TOK_HOLD_MS),
    };
  };

  const pomak = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hold.current;
    if (!h || h.opened) return;
    if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > TOK_HOLD_PX) {
      window.clearTimeout(h.timer);
      hold.current = null;
    }
  };

  const pusti = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const h = hold.current;
    if (h?.timer) window.clearTimeout(h.timer);
    const opened = h?.opened || (!!h && holdDosta(h.start, TOK_HOLD_MS));
    if (opened && h && !h.opened) {
      h.opened = true;
      playSfx("button");
      osjeti("hold");
      onHold();
      hold.current = null;
      return;
    }
    hold.current = null;
    if (opened) return;
    if (meni) {
      onZatvori();
      return;
    }
    onTap();
  };

  const odustani = () => {
    const h = hold.current;
    if (!h || h.opened) return;
    window.clearTimeout(h.timer);
    hold.current = null;
  };

  const n = meni?.length ?? 0;

  return (
    <div className="kauba-scena" data-testid="kauba-ulica" data-dio={id} data-trg={trg ? "1" : "0"}>
      <div
        className={cn("kauba-scena-slika mreza-dio-prikaz", `kauba-doba-${doba}`)}
        data-testid="mreza-video"
        data-dio={id}
      >
        {/* The overview map owns its terrain; do not mount the legacy poster underneath it. */}
        {!trg && (
          <div key={id} className="mreza-dio-kadar kauba-kadar" aria-hidden>
            {video ? (
              <VideoLoop src={video} poster={poster} rate={0.5} force fit="cover" />
            ) : (
              <img src={poster} alt="" draggable={false} decoding="async" width={720} height={960} />
            )}
          </div>
        )}
        <span className={`kauba-doba-veil kauba-doba-${doba}`} aria-hidden />
        {trg ? <KaubaZivaUlica ziva={ziva} /> : null}
      </div>

      {meni && (
        <button
          type="button"
          className="kauba-krug-poz"
          aria-label="Zatvori izbornik"
          onClick={() => {
            if (Date.now() - meniOd.current < 240) return;
            onZatvori();
          }}
        />
      )}
      <div className={cn("kauba-scena-donji is-maknut", meni && "on")}>
        <div className={cn("kauba-prsten-omot", meni && "on")}>
          {meni && (
            <div className="kauba-krug" data-testid="tok-radial" style={{ "--n": n } as CSSProperties} role="menu" aria-label="Dijelovi kaube">
              {meni.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  data-testid={`tok-precica-${s.id}`}
                  aria-label={`${s.naziv}. ${s.rec}`}
                  className={cn("kauba-krug-stavka", s.zakljucano && "is-zakljucano")}
                  style={{ "--i": i, animationDelay: `${i * 28}ms` } as CSSProperties}
                  onClick={() => {
                    playSfx("button");
                    onOdabir(s);
                  }}
                >
                  <span className="kauba-krug-iko" style={{ "--i": i } as CSSProperties}>
                    <TokIkonica id={s.ikona} />
                  </span>
                  {s.zakljucano ? <Lock className="kauba-krug-lokot" aria-hidden /> : null}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            data-testid="kauba-prsten"
            data-hub={id}
            aria-label={
              metci > 0
                ? `Prsten. ${metci} metaka. Magazin ${metakRed} od 24. Kratko pucaj, drži za izbornik.`
                : "Prazan bubanj. Drži za izbornik."
            }
            aria-haspopup="menu"
            aria-expanded={!!meni}
            onPointerDown={kreni}
            onPointerMove={pomak}
            onPointerUp={pusti}
            onPointerCancel={odustani}
            onContextMenu={(e) => e.preventDefault()}
            className={cn("kauba-prsten", meni && "on", okret && "puca", metci < 1 && "prazan", dogadaj && "buff")}
          >
            <span className={cn("bubanj", okret && "okret")} aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="bubanj-rupa" style={{ "--i": i } as CSSProperties}>
                  <span className={cn("bubanj-metak", i < Math.min(6, metci) && "pun")} />
                </span>
              ))}
              <span className="bubanj-os">{metci}</span>
            </span>
            <span className="bubanj-bljesak" aria-hidden />
            <span className="bubanj-dim" aria-hidden />
          </button>
        </div>
        {dogadaj ? (
          <span className="prsten-buff">
            {dogadaj.naziv}
            <small>
              {dogadaj.rec}
              {" · još "}
              {fmtOstalo(dogadaj.do - sad)}
            </small>
          </span>
        ) : (
          <span className="prsten-buff prsten-buff-cekaj">1 sretan metak · {metakRed}/24</span>
        )}
        {ime ? <span className="kauba-prsten-ime">{ime}</span> : null}
      </div>
    </div>
  );
}

export function kadriScena(fn: () => void) {
  kadri(fn);
}

export function jeScenaHub(id: string): id is KaubaUsko {
  return POTREBE_META.some((p) => p.id === id);
}
