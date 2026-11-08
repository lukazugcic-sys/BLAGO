import { useRef } from "react";
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
      aria-label={`${n} kauboja, zadovoljstvo ${kauba.sreca} posto. Otvori kauboje.`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        playSfx("button");
        idi({ ruke: true });
      }}
    >
      <b>{n}</b>
      <span>{n === 1 ? "kauboj" : "kauboja"}</span>
      <span className="karta-info-raz" aria-hidden>·</span>
      <span>sreća</span>
      <b>{kauba.sreca}%</b>
      <span className="karta-info-raz" aria-hidden>·</span>
      <span>{smjer}</span>
    </button>
  );
}
