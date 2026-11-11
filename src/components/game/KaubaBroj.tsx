import { useRef } from "react";
import { Smile, Users } from "lucide-react";
import { kaubaOd } from "@/lib/game/ljudi";
import { playSfx } from "@/lib/game/audio";
import { idi } from "@/lib/game/tokMeni";
import { useGameStore } from "@/lib/stores/gameStore";

export function KaubaBroj() {
  const gradevine = useGameStore((s) => s.gradevine);
  const ljudi = useGameStore((s) => s.ljudi);
  const segrti = useGameStore((s) => s.segrti);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const potkoveDo = useGameStore((s) => s.potkoveDo);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const travaDo = useGameStore((s) => s.travaDo);
  const celijaBroj = useGameStore((s) => s.celijaBroj);
  const trend = useRef({ zadnji: -1, smjer: 0 as -1 | 0 | 1 });
  const kauba = kaubaOd({
    gradevine,
    stanovnici,
    ljudi,
    segrti,
    zamjenici,
    konjiBroj,
    konjiDuznost,
    govedaBroj,
    govedaDuznost,
    sijenoDo,
    potkoveDo,
    kisaDo,
    travaDo,
    celijaBroj,
  });
  if (trend.current.zadnji < 0) trend.current.zadnji = kauba.sreca;
  else if (kauba.sreca >= trend.current.zadnji + 1) trend.current = { zadnji: kauba.sreca, smjer: 1 };
  else if (kauba.sreca <= trend.current.zadnji - 1) trend.current = { zadnji: kauba.sreca, smjer: -1 };
  const n = Math.max(0, Math.floor(stanovnici));
  const smjer = trend.current.smjer > 0 ? "raste" : trend.current.smjer < 0 ? "pada" : "miruje";
  return (
    <button
      type="button"
      className="karta-info"
      data-testid="karta-info"
      aria-label={`${n} kauboja, sreća ${kauba.sreca} posto, ${smjer}. Otvori kauboje.`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        playSfx("button");
        idi({ ruke: true });
      }}
    >
      {/* 0.9.178 (t459u): ikona + broj, bez riječi i pilule (riječi su u aria-label) */}
      <span className="karta-info-dio is-kauboji">
        <span className="kk-ik" aria-hidden>
          <Users className="kk-sjena" strokeWidth={3.6} />
          <Users className="kk-glif" strokeWidth={2} />
        </span>
        <b>{n}</b>
      </span>
      <span className="karta-info-dio is-sreca" data-smjer={smjer}>
        <span className="kk-ik" aria-hidden>
          <Smile className="kk-sjena" strokeWidth={3.6} />
          <Smile className="kk-glif" strokeWidth={2} />
        </span>
        <b>{kauba.sreca}%</b>
        {smjer === "miruje" ? null : (
          <i className="karta-info-trend" aria-hidden>
            {smjer === "raste" ? "▲" : "▼"}
          </i>
        )}
      </span>
    </button>
  );
}
