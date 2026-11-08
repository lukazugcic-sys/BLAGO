import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Beef,
  BrickWall,
  CloudRain,
  Dices,
  Home,
  Landmark,
  LayoutGrid,
  Leaf,
  ScrollText,
  Shirt,
  Star,
  Store,
  Swords,
  Tent,
  Wine,
  Hammer,
  Repeat,
  Gem,
  Flag,
  Radio,
  ArrowLeftRight,
  Crown,
  Crosshair,
} from "lucide-react";
import { playSfx } from "@/lib/game/audio";
import { tokMeniPolukrug, tokMeniRaspored, type TokMeniIkona, type TokMeniStavka } from "@/lib/game/tokMeni";
import { cn } from "@/lib/utils";
import { portalKorijen } from "@/lib/game/portal";

const IKONE: Record<TokMeniIkona, ReactNode> = {
  pregled: <LayoutGrid className="size-4" strokeWidth={2.4} />,
  zgrade: <Landmark className="size-4" strokeWidth={2.4} />,
  almanah: <ScrollText className="size-4" strokeWidth={2.4} />,
  pohod: <Swords className="size-4" strokeWidth={2.4} />,
  travar: <Leaf className="size-4" strokeWidth={2.4} />,
  kisa: <CloudRain className="size-4" strokeWidth={2.4} />,
  salun: <Wine className="size-4" strokeWidth={2.4} />,
  konji: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M7 7.5c0-3 2.2-5 5-5s5 2 5 5v6.5" />
      <path d="M7 14.5V18M17 14.5V18" />
      <path d="M9.2 10.2h.01M12 10.2h.01M14.8 10.2h.01" strokeWidth="3" />
    </svg>
  ),
  krdo: <Beef className="size-4" strokeWidth={2.4} />,
  trgovina: <Store className="size-4" strokeWidth={2.4} />,
  igraj: <Dices className="size-4" strokeWidth={2.4} />,
  zid: <BrickWall className="size-4" strokeWidth={2.4} />,
  kauba: <Home className="size-4" strokeWidth={2.4} />,
  zadaci: <ScrollText className="size-4" strokeWidth={2.4} />,
  trznica: <Store className="size-4" strokeWidth={2.4} />,
  auto: <Repeat className="size-4" strokeWidth={2.4} />,
  bonus: <Gem className="size-4" strokeWidth={2.4} />,
  kronika: <ScrollText className="size-4" strokeWidth={2.4} />,
  cilj: <Flag className="size-4" strokeWidth={2.4} />,
  nalog: <ScrollText className="size-4" strokeWidth={2.4} />,
  zvijezda: <Star className="size-4" strokeWidth={2.4} />,
  karavana: <Tent className="size-4" strokeWidth={2.4} />,
  uzivo: <Radio className="size-4" strokeWidth={2.4} />,
  burza: <ArrowLeftRight className="size-4" strokeWidth={2.4} />,
  alati: <Hammer className="size-4" strokeWidth={2.4} />,
  izgled: <Shirt className="size-4" strokeWidth={2.4} />,
  kruna: <Crown className="size-4" strokeWidth={2.4} />,
  metci: <Crosshair className="size-4" strokeWidth={2.4} />,
};

export function TokIkonica({ id }: { id: TokMeniIkona }) {
  return IKONE[id];
}

export function TokRadial({
  x,
  y,
  sirina,
  visina,
  stavke,
  onOdabir,
  onZatvori,
  polukrug = false,
}: {
  x: number;
  y: number;
  sirina: number;
  visina: number;
  stavke: TokMeniStavka[];
  onOdabir: (s: TokMeniStavka) => void;
  onZatvori: () => void;
  polukrug?: boolean;
}) {
  if (typeof document === "undefined") return null;
  const dolje = y > visina * 0.45;
  const { krug, tocke } = (polukrug || dolje ? tokMeniPolukrug : tokMeniRaspored)(x, y, stavke.length, sirina, visina);
  return createPortal(
    <div
      className={cn("tok-radial", (polukrug || dolje) && "tok-radial-polukrug")}
      role="menu"
      aria-label="Prečice"
      data-testid="tok-radial"
      data-n={stavke.length}
    >
      <button type="button" className="tok-radial-poz" aria-label="Zatvori prečace" onClick={onZatvori} />
      <div className="tok-radial-os" style={{ left: x, top: y }}>
        {krug && <span className="tok-radial-prsten" aria-hidden />}
        {!krug && <span className="tok-radial-luk" aria-hidden />}
        {stavke.map((s, i) => {
          const t = tocke[i] ?? { dx: 0, dy: 0 };
          return (
            <span
              key={s.id}
              className="tok-radial-mjesto"
              style={{ transform: `translate(${t.dx}px, ${t.dy}px)` }}
            >
              <button
                type="button"
                role="menuitem"
                data-testid={`tok-precica-${s.id}`}
                aria-label={`${s.naziv}. ${s.rec}`}
                className="tok-radial-stavka"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => {
                  playSfx("button");
                  onOdabir(s);
                }}
              >
                {IKONE[s.ikona]}
                <span>{s.naziv}</span>
              </button>
            </span>
          );
        })}
      </div>
    </div>,
          portalKorijen(),
  );
}
