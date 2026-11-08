import { useEffect, useState } from "react";
import { SYMBOL_ART } from "@/lib/game/art";
import { LET_EVENT, type LetCips } from "@/lib/game/let";
import { smanjenPokret } from "@/lib/game/feel";

type Let = { id: number; src: string; x: number; y: number };

const RED: Array<{ kljuc: keyof LetCips; src: string; chip: string }> = [
  { kljuc: "zlato", src: SYMBOL_ART.gold, chip: "zlato" },
  { kljuc: "dijamanti", src: SYMBOL_ART.gem, chip: "dijamanti" },
  { kljuc: "drvo", src: SYMBOL_ART.wood, chip: "drvo" },
  { kljuc: "kamen", src: SYMBOL_ART.stone, chip: "kamen" },
  { kljuc: "zeljezo", src: SYMBOL_ART.iron, chip: "željezo" },
  { kljuc: "energija", src: SYMBOL_ART.energy, chip: "energija" },
  { kljuc: "stitovi", src: SYMBOL_ART.shield, chip: "štitovi" },
];

let broj = 1;

function ciljZa(chip: string) {
  const el = document.querySelector(`[data-chip="${chip}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function LetSloj() {
  const [letovi, setLetovi] = useState<Let[]>([]);

  useEffect(() => {
    const onLet = (e: Event) => {
      if (smanjenPokret()) return;
      const d = (e as CustomEvent<{ cips: LetCips; x: number; y: number }>).detail;
      if (!d?.cips) return;
      const novi: Let[] = [];
      let i = 0;
      for (const red of RED) {
        if ((d.cips[red.kljuc] || 0) <= 0) continue;
        const cilj = ciljZa(red.chip);
        if (!cilj) continue;
        const id = broj++;
        const x = d.x + (i - 1) * 18;
        const y = d.y;
        novi.push({ id, src: red.src, x, y });
        i += 1;
        window.setTimeout(() => {
          const el = document.querySelector(`[data-let="${id}"]`) as HTMLElement | null;
          if (!el) return;
          const cx = (x + cilj.x) / 2;
          const cy = Math.min(y, cilj.y) - 72;
          const frames: Keyframe[] = [];
          for (let s = 0; s <= 14; s++) {
            const t = s / 14;
            const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * cilj.x;
            const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * cilj.y;
            frames.push({
              transform: `translate3d(${px}px, ${py}px, 0) scale(${1 - t * 0.2})`,
              opacity: t < 0.82 ? 1 : 1 - (t - 0.82) / 0.18,
            });
          }
          el.animate(frames, { duration: Math.min(600, 420 + i * 40), easing: "linear", fill: "forwards" });
        }, 20);
      }
      if (!novi.length) return;
      setLetovi((s) => [...s, ...novi].slice(-12));
      window.setTimeout(() => {
        const ids = new Set(novi.map((n) => n.id));
        setLetovi((s) => s.filter((n) => !ids.has(n.id)));
      }, 720);
    };
    window.addEventListener(LET_EVENT, onLet);
    return () => window.removeEventListener(LET_EVENT, onLet);
  }, []);

  if (!letovi.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      {letovi.map((l) => (
        <img
          key={l.id}
          data-let={l.id}
          src={l.src}
          alt=""
          draggable={false}
          className="let-ikona"
          width={28}
          height={28}
          style={{ transform: `translate3d(${l.x}px, ${l.y}px, 0)` }}
        />
      ))}
    </div>
  );
}
