import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function VideoLoop({
  src,
  className,
  poster,
  style,
  force,
  rate = 1,
  fit = "cover",
}: {
  src: string;
  className?: string;
  poster?: string;
  style?: CSSProperties;
  force?: boolean;
  rate?: number;
  fit?: "cover" | "contain";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const v0 = useRef<HTMLVideoElement>(null);
  const v1 = useRef<HTMLVideoElement>(null);
  const akt = useRef<0 | 1>(0);
  const mijenja = useRef(false);
  const [sloj, setSloj] = useState<0 | 1>(0);
  const [ide, setIde] = useState(false);
  const [vidljiv, setVidljiv] = useState(!!force);
  const kadar = fit === "contain" ? "object-contain object-center" : "object-cover object-center";

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const primijeni = (intersecting: boolean, ratio: number) => {
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const pokazi = !hidden && intersecting && (force || ratio >= 0.28);
      setVidljiv((bilo) => {
        if (pokazi) return true;
        if (hidden || !intersecting || ratio < 0.08) return false;
        return bilo;
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        primijeni(entry.isIntersecting, entry.intersectionRatio);
      },
      { threshold: [0, 0.12, 0.28, 0.5, 0.8] },
    );
    io.observe(wrap);
    const onVis = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vis =
        r.bottom > 0 && r.top < (window.innerHeight || 0) && r.right > 0 && r.left < (window.innerWidth || 0);
      const h = Math.max(1, r.height);
      primijeni(vis, vis ? Math.min(1, Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)) / h) : 0);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src, force]);

  useEffect(() => {
    akt.current = 0;
    mijenja.current = false;
    setSloj(0);
    setIde(false);
  }, [src]);

  useEffect(() => {
    const utisaj = () => {
      for (const el of [v0.current, v1.current]) {
        if (!el) continue;
        el.muted = true;
        el.volume = 0;
      }
    };
    utisaj();
    window.addEventListener("blago-mute", utisaj);
    return () => window.removeEventListener("blago-mute", utisaj);
  }, [src, vidljiv]);

  useEffect(() => {
    const primijeni = (el: HTMLVideoElement | null) => {
      if (!el) return;
      const r = Number.isFinite(rate) && rate > 0 ? rate : 1;
      if (el.playbackRate !== r) el.playbackRate = r;
    };
    const a = v0.current;
    const b = v1.current;
    if (!vidljiv) {
      a?.pause();
      b?.pause();
      setIde(false);
      return;
    }
    const start = a ?? b;
    if (!start) return;
    start.load();
    if (b && b !== start) b.load();
    primijeni(a);
    primijeni(b);
    const onPlay = () => primijeni(start);
    start.addEventListener("play", onPlay);
    start.addEventListener("loadedmetadata", onPlay);
    void start.play().then(() => {
      primijeni(start);
      setIde(true);
    }).catch(() => setIde(false));
    return () => {
      start.removeEventListener("play", onPlay);
      start.removeEventListener("loadedmetadata", onPlay);
      a?.pause();
      b?.pause();
    };
  }, [src, vidljiv, rate]);

  const blizuKraja = (el: HTMLVideoElement) => {
    const d = el.duration;
    if (!d || !Number.isFinite(d) || d < 0.4) return false;
    return el.currentTime >= d - 0.16;
  };

  const preslozi = (sa: 0 | 1) => {
    if (mijenja.current || sa !== akt.current) return;
    const stari = sa === 0 ? v0.current : v1.current;
    if (!stari || !blizuKraja(stari)) return;
    const drugi: 0 | 1 = sa === 0 ? 1 : 0;
    const next = drugi === 0 ? v0.current : v1.current;
    if (!next) return;
    mijenja.current = true;
    try {
      next.currentTime = 0.04;
    } catch {
      /* ignore */
    }
    const r = Number.isFinite(rate) && rate > 0 ? rate : 1;
    if (next.playbackRate !== r) next.playbackRate = r;
    void next.play().then(() => {
      if (next.playbackRate !== r) next.playbackRate = r;
      akt.current = drugi;
      setSloj(drugi);
      window.setTimeout(() => {
        stari.pause();
        try {
          stari.currentTime = 0.04;
        } catch {
          /* ignore */
        }
        mijenja.current = false;
      }, 140);
    }).catch(() => {
      mijenja.current = false;
    });
  };

  return (
    <div ref={wrapRef} className={cn("absolute inset-0 overflow-hidden", className)} style={style} aria-hidden>
      {poster ? (
        <img
          src={poster}
          alt=""
          draggable={false}
          className={cn("absolute inset-0 size-full", kadar)}
        />
      ) : null}
      {vidljiv ? (
        <>
          <video
            ref={v0}
            src={src}
            className={cn(
              "absolute inset-0 size-full",
              kadar,
              "video-loop-sloj",
              sloj === 0 && ide ? "video-loop-vidljiv" : "video-loop-skrit",
            )}
            muted
            playsInline
            preload="auto"
            poster={poster}
            onTimeUpdate={() => preslozi(0)}
          />
          <video
            ref={v1}
            src={src}
            className={cn(
              "absolute inset-0 size-full",
              kadar,
              "video-loop-sloj",
              sloj === 1 && ide ? "video-loop-vidljiv" : "video-loop-skrit",
            )}
            muted
            playsInline
            preload="auto"
            poster={poster}
            onTimeUpdate={() => preslozi(1)}
          />
        </>
      ) : null}
    </div>
  );
}
