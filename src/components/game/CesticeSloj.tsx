import { useEffect, useRef } from "react";
import {
  cesticeTrebaCrtati,
  cesticeZive,
  nacrtaCestice2d,
  primiPendingUBazen,
  slusajCesticeFeel,
  tickCestice,
} from "@/lib/game/cestice";
import { pokreniCesticeGpu, type GpuSok } from "@/lib/game/cesticeGpu";
import { FEEL_EVENT } from "@/lib/game/feel";
import { zakaziHod } from "@/lib/game/pokret";

export function CesticeSloj() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const skiniFeel = slusajCesticeFeel();
    let gpu: GpuSok | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let last = performance.now();
    let ziv = true;
    let prljav = false;
    let radi = false;
    let odjavi = () => {};

    const velicina = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      const bw = Math.max(1, Math.round(cssW * dpr));
      const bh = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      return { cssW, cssH, dpr };
    };

    const tick = (now: number) => {
      const { cssW, cssH, dpr } = velicina();
      let dt = (now - last) / 1000;
      last = now;
      if (document.documentElement.classList.contains("feel-stop")) dt = 0;
      if (document.visibilityState === "hidden") return false;
      const treba = cesticeTrebaCrtati();
      if (treba) prljav = true;
      if (!treba && !prljav) {
        canvas.classList.remove("is-zivo");
        return false;
      }
      canvas.classList.add("is-zivo");
      if (gpu) {
        if (gpu.nacin !== "compute") {
          primiPendingUBazen();
          tickCestice(dt);
        }
        if (prljav) gpu.kreni(dt, cssW, cssH);
        if (!treba) prljav = false;
        return treba || prljav;
      }
      if (!ctx2d) return treba;
      primiPendingUBazen();
      tickCestice(dt);
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      if (cesticeZive() === 0) return false;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      nacrtaCestice2d(ctx2d);
      return true;
    };

    const budi = () => {
      if (!ziv || radi) return;
      radi = true;
      last = performance.now();
      odjavi = zakaziHod((now) => {
        const jos = tick(now);
        if (!jos) {
          radi = false;
          canvas.classList.remove("is-zivo");
        }
        return jos;
      });
    };

    const onFeel = () => budi();
    const onVis = () => {
      if (document.visibilityState === "visible" && cesticeTrebaCrtati()) budi();
    };
    window.addEventListener(FEEL_EVENT, onFeel);
    document.addEventListener("visibilitychange", onVis);

    void pokreniCesticeGpu(canvas).then((g) => {
      if (!ziv) {
        g?.ugasi();
        return;
      }
      if (g) gpu = g;
      else ctx2d = canvas.getContext("2d", { alpha: true });
      canvas.dataset.backend = gpu ? (gpu.nacin === "compute" ? "gpu-compute" : "gpu") : "2d";
      if (cesticeTrebaCrtati()) budi();
    });

    return () => {
      ziv = false;
      odjavi();
      window.removeEventListener(FEEL_EVENT, onFeel);
      document.removeEventListener("visibilitychange", onVis);
      skiniFeel();
      gpu?.ugasi();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="cestice-sloj pointer-events-none"
      data-testid="cestice-sloj"
      data-backend="ceka"
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 60, width: "100%", height: "100%" }}
    />
  );
}
