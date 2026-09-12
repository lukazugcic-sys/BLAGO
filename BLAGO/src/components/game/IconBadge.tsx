import type { CSSProperties } from "react";
import { artSrc } from "@/lib/game/art";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5",
  sm: "size-6",
  md: "size-10",
  lg: "size-12",
} as const;

const TONE: Record<string, string> = {
  gold: "#ffd24a",
  energy: "#ff6a18",
  wood: "#f4a24a",
  stone: "#e0b070",
  iron: "#7aa0c8",
  gem: "#ff5ab4",
  shield: "#5ec8ff",
  skull: "#ff6b73",
  wild: "#5ee06a",
};

function toneOd(src: string) {
  const key = Object.keys(TONE).find((k) => src.includes(k));
  return key ? TONE[key] : undefined;
}

export function IconBadge({
  src,
  size = "lg",
  className,
}: {
  src: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const zap = src.includes("energy");
  const zlato = src.includes("gold");
  const tone = toneOd(src);
  return (
    <span
      className={cn("iko", zap && "iko-energy", zlato && "iko-gold", SIZES[size], className)}
      style={tone ? ({ ["--sym"]: tone } as CSSProperties) : undefined}
      aria-hidden
    >
      <img
        src={artSrc(src)}
        alt=""
        draggable={false}
        decoding="async"
        onError={(e) => {
          const el = e.currentTarget;
          if (el.dataset.retried) return;
          el.dataset.retried = "1";
          el.src = artSrc(src).split("?")[0];
        }}
      />
    </span>
  );
}