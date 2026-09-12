import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function VideoLoop({
  src,
  className,
  poster,
  style,
  force,
  rate = 1,
}: {
  src: string;
  className?: string;
  poster?: string;
  style?: CSSProperties;
  force?: boolean;
  rate?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const v0 = useRef<HTMLVideoElement>(null);
  const v1 = useRef<HTMLVideoElement>(null);
  const akt = useRef<0 | 1>(0);
  const mijenja = useRef(false);
  const [sloj, setSloj] = useState<0 | 1>(0);
  const [ide, setIde] = useState(false);
  const [vidljiv, setVidljiv] = useState(!!force);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const pokriven = entry.intersectionRatio < 0.28;
        setVidljiv(force ? entry.isIntersecting && !pokriven : entry.isIntersecting && entry.intersectionRatio >= 0.28);
      },
      { threshold: [0, 0.12, 0.28, 0.5, 0.8] },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [src, force]);

  useEffect(() => {
    akt.current = 0;
    mijenja.current = false;
    setSloj(0);
    setIde(false);
  }, [src]);

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
          className="absolute inset-0 size-full object-cover object-center"
        />
      ) : null}
      {vidljiv ? (
        <>
          <video
            ref={v0}
            className={cn(
              "absolute inset-0 size-full object-cover object-center",
              "video-loop-sloj",
              sloj === 0 && ide ? "video-loop-vidljiv" : "video-loop-skrit",
            )}
            muted
            playsInline
            preload="auto"
            poster={poster}
            onTimeUpdate={() => preslozi(0)}
          >
            <source src={src} type="video/mp4" />
          </video>
          <video
            ref={v1}
            className={cn(
              "absolute inset-0 size-full object-cover object-center",
              "video-loop-sloj",
              sloj === 1 && ide ? "video-loop-vidljiv" : "video-loop-skrit",
            )}
            muted
            playsInline
            preload="auto"
            poster={poster}
            onTimeUpdate={() => preslozi(1)}
          >
            <source src={src} type="video/mp4" />
          </video>
        </>
      ) : null}
    </div>
  );
}
