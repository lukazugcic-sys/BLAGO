import { ART, HUB_ART, HUB_VIDEO, ZGRADA_ART } from "@/lib/game/art";
import { hubZaZgradu } from "@/lib/game/economy";
import type { KaubaUsko } from "@/lib/game/economy";
import type { Gradevine, Gradnja, Karavana, Ostecenja } from "@/lib/game/types";
import type { DanDoba } from "@/lib/game/ljudi";
import { VideoLoop } from "./VideoLoop";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

const GRAD: Array<{
  id: keyof Gradevine;
  x: number;
  y: number;
  w: number;
  od?: number;
}> = [
  { id: "mlin", x: 4, y: 28, w: 16 },
  { id: "cisterna", x: 12, y: 42, w: 12 },
  { id: "travar", x: 6, y: 52, w: 13 },
  { id: "lov", x: 3, y: 62, w: 14 },
  { id: "farma", x: 14, y: 58, w: 16 },
  { id: "staja", x: 22, y: 66, w: 16 },
  { id: "staza", x: 10, y: 74, w: 14 },
  { id: "korali", x: 20, y: 78, w: 14 },
  { id: "tor", x: 28, y: 76, w: 15 },
  { id: "banja", x: 32, y: 68, w: 13 },
  { id: "kuca", x: 34, y: 48, w: 15, od: 1 },
  { id: "mesnica", x: 38, y: 58, w: 13 },
  { id: "trgovina", x: 42, y: 42, w: 13 },
  { id: "kuca", x: 46, y: 50, w: 14, od: 3 },
  { id: "salun", x: 48, y: 46, w: 16 },
  { id: "bunar", x: 44, y: 64, w: 11 },
  { id: "ured", x: 54, y: 40, w: 14 },
  { id: "blok", x: 56, y: 52, w: 14, od: 1 },
  { id: "banka", x: 62, y: 38, w: 14 },
  { id: "pekara", x: 60, y: 54, w: 13 },
  { id: "kuca", x: 66, y: 48, w: 14, od: 2 },
  { id: "ordinacija", x: 70, y: 36, w: 13 },
  { id: "pilana", x: 76, y: 30, w: 16 },
  { id: "kamenolom", x: 84, y: 26, w: 15 },
  { id: "rudnik", x: 90, y: 18, w: 14 },
];

export function HubPrikaz({
  hub,
  doba,
  gori,
}: {
  hub: KaubaUsko;
  doba: DanDoba;
  gori: boolean;
}) {
  return (
    <div className={cn("hub-prikaz", `kauba-doba-${doba}`, gori && "kauba-mood-gori")}>
      <VideoLoop src={HUB_VIDEO[hub] ?? HUB_VIDEO.krov} poster={HUB_ART[hub] ?? HUB_ART.krov} rate={0.48} />
      <div className="kauba-doba-veil pointer-events-none absolute inset-0" aria-hidden />
      {gori && <span className="kauba-vatra" />}
    </div>
  );
}

export function TaborGrad({
  gradevine,
  ostecenja,
  gradnje,
  karavana,
  doba,
  fokus,
  onZgrada,
}: {
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  gradnje: Gradnja[];
  karavana: Karavana | null;
  doba: DanDoba;
  fokus: KaubaUsko;
  onZgrada: (id: keyof Gradevine) => void;
}) {
  return (
    <div className={cn("tabor-grad", `kauba-doba-${doba}`)}>
      <img src={ART.ulica} alt="" draggable={false} className="tabor-grad-tlo" />
      <span className="tabor-cesta" aria-hidden />
      <div className="kauba-doba-veil pointer-events-none absolute inset-0" aria-hidden />
      {GRAD.map((z, i) => {
        const lv = gradevine[z.id] || 0;
        const gradi = gradnje.some((g) => g.zgrada === z.id);
        if (lv < (z.od ?? 1) && !gradi) return null;
        const gori = !!ostecenja[z.id];
        const hub = hubZaZgradu(z.id);
        const art = ZGRADA_ART[z.id] ?? ZGRADA_ART.kuca;
        return (
          <button
            key={`${z.id}-${z.od ?? 0}-${i}`}
            type="button"
            aria-label={z.id}
            onClick={() => {
              playSfx("button");
              onZgrada(z.id);
            }}
            className={cn(
              "tabor-zgrada",
              gori && "tabor-zgrada-gori",
              gradi && "tabor-zgrada-gradi",
              hub === fokus && "tabor-zgrada-fokus",
            )}
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%` }}
          >
            <img src={art} alt="" draggable={false} />
          </button>
        );
      })}
      {karavana && (
        <div className="tabor-kola" aria-hidden>
          <img src={ART.kola} alt="" draggable={false} />
          <span>{karavana.vozacIme} → {karavana.ciljIme}</span>
        </div>
      )}
    </div>
  );
}
