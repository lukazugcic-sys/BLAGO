import { ART, HUB_ART, HUB_VIDEO } from "@/lib/game/art";
import { POTREBE_META, type KaubaUsko } from "@/lib/game/economy";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import type { DanDoba } from "@/lib/game/ljudi";
import { VideoLoop } from "./VideoLoop";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { TOK_HOLD_MS, TOK_HOLD_PX } from "@/lib/game/tokMeni";
import { holdDosta, osjeti } from "@/lib/game/feel";

const DIO_NAZIV: Record<string, string> = {
  selo: "Trg",
  oklop: "Oklop",
  stav: "Šerif",
  pozar: "Požar",
  ruke: "Kauboji",
};

export function dioNaziv(id: string) {
  return DIO_NAZIV[id] ?? POTREBE_META.find((p) => p.id === id)?.naziv ?? id;
}

export function KaubaDio({
  id,
  rec,
  doba,
  poster,
  onHold,
  children,
}: {
  id: string;
  rec: string;
  doba: DanDoba;
  poster?: string;
  onHold?: (x: number, y: number) => void;
  children: ReactNode;
}) {
  const video = HUB_VIDEO[id] ?? (id === "selo" ? ART.seloVideo : undefined);
  const slika = poster ?? HUB_ART[id] ?? HUB_ART.selo;
  const naslov = dioNaziv(id);
  const hold = useRef<{ x: number; y: number; timer: number; opened: boolean; start: number } | null>(null);

  const kreni = (e: PointerEvent<HTMLButtonElement>) => {
    if (!onHold) return;
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
        onHold(h.x, h.y);
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

  const pusti = () => {
    const h = hold.current;
    if (h?.timer) window.clearTimeout(h.timer);
    const opened = h?.opened || (!!h && holdDosta(h.start, TOK_HOLD_MS));
    if (opened && h && !h.opened && onHold) {
      h.opened = true;
      playSfx("button");
      osjeti("hold");
      onHold(h.x, h.y);
    }
    hold.current = null;
  };

  return (
    <div className="kauba-dio" data-testid="kauba-dio" data-dio={id}>
      <div className="kauba-dio-skrol">
        <div
          className={cn("kauba-dio-hero", `kauba-doba-${doba}`)}
          data-testid="kauba-dio-hero"
        >
          {video ? (
            <VideoLoop src={video} poster={slika} rate={0.52} force fit="cover" />
          ) : (
            <img src={slika} alt="" className="kauba-dio-slika" draggable={false} />
          )}
          <span className="kauba-dio-sumrak" aria-hidden />
          <p className="kauba-dio-naslov">{naslov}</p>
          <button
            type="button"
            className="kauba-dio-drzi"
            data-testid="kauba-dio-drzi"
            aria-label={`${naslov}. Drži za prečice.`}
            onPointerDown={kreni}
            onPointerMove={pomak}
            onPointerUp={pusti}
            onPointerCancel={() => {
              const h = hold.current;
              if (!h || h.opened) return;
              window.clearTimeout(h.timer);
              hold.current = null;
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
        <div className="kauba-dio-info" data-testid="kauba-dio-info">
          {rec ? <p className="kauba-dio-rec">{rec}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function jeKaubaUsko(id: string): id is KaubaUsko {
  return POTREBE_META.some((p) => p.id === id);
}
