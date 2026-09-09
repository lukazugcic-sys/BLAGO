import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function VideoLoop({
  src,
  className,
  poster,
  style,
}: {
  src: string;
  className?: string;
  poster?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ide, setIde] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const play = () => {
      void el.play().then(() => setIde(true)).catch(() => setIde(false));
    };
    const stop = () => {
      el.pause();
      setIde(false);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.08) play();
        else stop();
      },
      { threshold: [0, 0.08, 0.4] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [src]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={style} aria-hidden>
      {poster ? (
        <img
          src={poster}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover object-[center_42%]"
        />
      ) : null}
      <video
        ref={ref}
        className={cn(
          "absolute inset-0 size-full object-cover object-[center_42%] transition-opacity duration-300",
          ide ? "opacity-100" : "opacity-0",
        )}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
