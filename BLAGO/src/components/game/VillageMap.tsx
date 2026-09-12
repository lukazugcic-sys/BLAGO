import { useState, type CSSProperties } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { useSlotStore } from "@/lib/stores/slotStore";
import { ZGRADE, seloNaMaxu } from "@/lib/game/constants";
import { ART } from "@/lib/game/art";
import { playSfx } from "@/lib/game/audio";
import type { TabId } from "@/lib/game/constants";
import type { Gradevine } from "@/lib/game/types";
import { BuildingCard } from "./BuildingCard";
import { cn } from "@/lib/utils";

type ZgradaId = keyof Gradevine;
type PinId = ZgradaId | "plaza" | "dvorac" | "trziste";

const PINS: Array<{
  id: PinId;
  n: number;
  x: number;
  y: number;
  label: string;
  boja: string;
}> = [
  { id: "plaza", n: 1, x: 62.5, y: 52.3, label: "Trg", boja: "#ffc43a" },
  { id: "dvorac", n: 2, x: 73, y: 36.3, label: "Dvorac", boja: "#6ec9b8" },
  { id: "trziste", n: 3, x: 39, y: 42.2, label: "Tržnica", boja: "#f0a03a" },
  { id: "pilana", n: 4, x: 20.2, y: 34.2, label: "Pilana", boja: "#e08a3c" },
  { id: "kamenolom", n: 5, x: 35.2, y: 16.7, label: "Kamenolom", boja: "#d4c4a8" },
  { id: "rudnik", n: 6, x: 80.7, y: 20.3, label: "Rudnik", boja: "#ece2cc" },
];

export function VillageMap({ onGoto }: { onGoto?: (tab: TabId) => void }) {
  const otkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const setPoruka = useGameStore((s) => s.setPoruka);
  const [odabrano, setOdabrano] = useState<PinId | null>(null);
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const kvalitetaSela = useGameStore((s) => s.kvalitetaSela);
  const izvrsiPrestige = useGameStore((s) => s.izvrsiPrestige);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const gori = Object.values(ostecenja).some(Boolean);
  const spremanZaPrestige = seloNaMaxu(gradevine);

  const tap = (id: PinId) => {
    playSfx("button");
    setOdabrano((cur) => (cur === id ? null : id));
  };

  const zgrada = ZGRADE.find((z) => z.id === odabrano);

  return (
    <section className="village-map relative mb-3 overflow-hidden rounded-2xl border border-line">
      <div className="village-scroll">
        <div className="village-stage">
        <img src={ART.village} alt="Karta sela" className="village-stage-img" draggable={false} />

        <video
          className="village-clip"
          style={{ left: "12%", top: "28%", width: "26%", height: "12%" }}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={ART.tractor} type="video/mp4" />
        </video>
        <video
          className="village-clip village-clip-round"
          style={{ left: "53%", top: "47%", width: "16%", height: "11%" }}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={ART.vatra} type="video/mp4" />
        </video>
        {spremanZaPrestige && (
          <video
            className="village-clip village-clip-glow"
            style={{ left: "48%", top: "44%", width: "28%", height: "16%" }}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          >
            <source src={ART.duga} type="video/mp4" />
          </video>
        )}

        {PINS.map((p) => {
          const lv = p.id in gradevine ? gradevine[p.id as ZgradaId] : 0;
          const fire = p.id in ostecenja && ostecenja[p.id as ZgradaId];
          return (
            <button
              key={p.id}
              type="button"
              className={cn("village-pin", odabrano === p.id && "is-on", fire && "is-fire")}
              style={{ left: `${p.x}%`, top: `${p.y}%`, "--pin": p.boja } as CSSProperties}
              onClick={() => tap(p.id)}
              aria-label={p.label}
            >
              <span className="village-pin-n">{p.n}</span>
              {lv > 0 && <span className="village-pin-lv">{lv}</span>}
            </button>
          );
        })}
        </div>
      </div>

      <div className="village-map-bar">
        <p className="text-[11px] font-bold tracking-[0.28em] text-gold uppercase">Tvoje selo</p>
        <p className="text-xs font-bold text-ink/90">
          Kvaliteta {Math.round(kvalitetaSela)} · dodirni broj
        </p>
      </div>

      {odabrano && (
        <div className="village-sheet">
          {zgrada ? (
            <BuildingCard zgrada={zgrada} compact />
          ) : odabrano === "plaza" ? (
            <div className="rounded-2xl border border-gold/40 bg-panel p-4">
              <p className="text-[11px] font-bold tracking-[0.28em] text-gold uppercase">Trg</p>
              <p className="mt-1 text-sm font-bold text-ink">Srce sela. Krunidba daje krunjenje za alate.</p>
              {spremanZaPrestige ? (
                <button
                  type="button"
                  onClick={() => {
                    playSfx("jackpot");
                    izvrsiPrestige();
                    setOdabrano(null);
                  }}
                  className="mt-3 min-h-11 w-full rounded-lg bg-prestige text-sm font-bold text-void"
                >
                  IZVRŠI KRUNIDBU
                </button>
              ) : (
                <p className="mt-2 text-xs font-bold text-dim">Selo mora biti na vrhu. Onda krunidba.</p>
              )}
            </div>
          ) : odabrano === "dvorac" ? (
            <div className="rounded-2xl border border-clan/40 bg-panel p-4">
              <p className="text-[11px] font-bold tracking-[0.28em] text-clan uppercase">Dvorac</p>
              <p className="mt-1 text-sm font-bold text-ink">Ovdje živi družina i kreće pohod.</p>
              <div className="mt-3 flex gap-2">
                {gori && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("attack");
                      setRaidAktivan(true);
                    }}
                    className="min-h-11 flex-1 rounded-lg bg-ruby text-xs font-bold text-ink"
                  >
                    POHOD
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-quest/40 bg-panel p-4">
              <p className="text-[11px] font-bold tracking-[0.28em] text-quest uppercase">Tržnica</p>
              <p className="mt-1 text-sm font-bold text-ink">Mjenjačnica, alati i izgled kaube.</p>
              <button
                type="button"
                onClick={() => {
                  if (!otkljucan) {
                    setPoruka(SIDE_GATE_REC);
                    return;
                  }
                  onGoto?.("trznica");
                }}
                className="mt-3 min-h-11 w-full rounded-lg bg-quest text-sm font-bold text-void"
              >
                {otkljucan ? "OTVORI TRŽNICU" : SIDE_GATE_REC}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
