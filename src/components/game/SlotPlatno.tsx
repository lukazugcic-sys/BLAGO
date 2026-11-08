import { useEffect, useRef } from "react";
import { ghostCol, simbolSkoro } from "@/lib/game/slotFx";
import { korakStupca, kreniSlijetanje, kreniVrtnju, noviHod, type HodStupca } from "@/lib/game/slotHod";
import { pokreniSlotGl, type SlotGl } from "@/lib/game/slotGl";
import { pokreniSlotGpu } from "@/lib/game/slotGpu";
import { zakaziHod } from "@/lib/game/pokret";
import { ucitajHodJezgru } from "@/lib/game/hodJezgra";
import { useSlotStore } from "@/lib/stores/slotStore";
import type { SimbolId } from "@/lib/game/types";

export function SlotPlatno({
  onSpreman,
  onPokret,
}: {
  onSpreman: (da: boolean) => void;
  onPokret: (da: boolean) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spinningCols = useSlotStore((s) => s.spinningCols);
  const simboli = useSlotStore((s) => s.simboli);
  const spreman = useRef(false);
  const gl = useRef<SlotGl | null>(null);
  const hod = useRef<HodStupca[]>([0, 1, 2, 3, 4].map(() => noviHod()));
  const ghosts = useRef(hod.current.map((_, c) => ghostCol(c)));
  const ids = useRef<SimbolId[][]>([[], [], [], [], []]);
  const zadnji = useRef(0);
  const odjavi = useRef<(() => void) | null>(null);
  const pokret = useRef(false);
  const onPokretRef = useRef(onPokret);
  onPokretRef.current = onPokret;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onSpreman(false);
      return;
    }
    ucitajHodJezgru();
    let ziv = true;
    void pokreniSlotGpu(canvas).then(async (gpu) => {
      const g = gpu ?? (await pokreniSlotGl(canvas));
      if (!ziv) {
        g?.ugasi();
        return;
      }
      gl.current = g;
      spreman.current = !!g;
      canvas.dataset.backend = gpu ? "webgpu" : g ? "webgl" : "css";
      onSpreman(!!g);
    });
    return () => {
      ziv = false;
      odjavi.current?.();
      gl.current?.ugasi();
      gl.current = null;
      spreman.current = false;
    };
  }, [onSpreman]);

  useEffect(() => {
    const sljedeci: SimbolId[][] = [0, 1, 2, 3, 4].map((c) => [
      simboli[c] ?? "gold",
      simboli[c + 5] ?? "gold",
      simboli[c + 10] ?? "gold",
    ]);
    const now = performance.now();
    let ziv = false;
    for (let c = 0; c < 5; c++) {
      const h = hod.current[c]!;
      const vrti = !!spinningCols[c];
      if (vrti && h.mode !== "spin") kreniVrtnju(h, now, useSlotStore.getState().turboRezim);
      if (!vrti && h.mode === "spin") {
        const turbo = useSlotStore.getState().turboRezim;
        const svi: SimbolId[] = [];
        for (let row = 0; row < 3; row++) {
          for (let k = 0; k < 5; k++) svi[row * 5 + k] = sljedeci[k]![row]!;
        }
        const tease = !turbo && c === 4 ? simbolSkoro(svi) : null;
        const ms = turbo ? 140 : tease ? 420 : 300;
        kreniSlijetanje(h, ghosts.current[c]!, sljedeci[c]!, now, ms, tease);
      }
      ids.current[c] = sljedeci[c]!;
      if (h.mode !== "idle") ziv = true;
    }
    if (!spreman.current || !gl.current) {
      if (pokret.current) {
        pokret.current = false;
        onPokretRef.current(false);
      }
      return;
    }
    if (ziv !== pokret.current) {
      pokret.current = ziv;
      onPokretRef.current(ziv);
    }
    if (!ziv) return;
    zadnji.current = now;
    odjavi.current?.();
    const tick = (t: number) => {
      const dt = Math.min(0.05, Math.max(0, (t - zadnji.current) / 1000));
      zadnji.current = t;
      let jos = false;
      for (let c = 0; c < 5; c++) {
        if (korakStupca(hod.current[c]!, t, dt, c)) jos = true;
      }
      const canvas = ref.current;
      const box = canvas?.parentElement?.getBoundingClientRect();
      if (canvas && box && gl.current) {
        gl.current.crtaj(hod.current, ghosts.current, ids.current, box.width, box.height);
      }
      if (!jos) {
        pokret.current = false;
        onPokretRef.current(false);
        return false;
      }
      return true;
    };
    odjavi.current = zakaziHod(tick);
    return () => {
      odjavi.current?.();
      odjavi.current = null;
    };
  }, [spinningCols, simboli]);

  return (
    <canvas
      ref={ref}
      className="slot-gl"
      data-testid="slot-gl"
      data-backend="ceka"
      aria-hidden
    />
  );
}
