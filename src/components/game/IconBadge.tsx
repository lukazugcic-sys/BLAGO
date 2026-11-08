import type { CSSProperties } from "react";
import { artSrc } from "@/lib/game/art";
import { cn } from "@/lib/utils";

const PX = { xs: 20, sm: 24, md: 40, lg: 48 } as const;
const SIZES = {
  xs: "size-5",
  sm: "size-6",
  md: "size-10",
  lg: "size-12",
} as const;

const TONE: Record<string, string> = {
  gold: "#ffd24a",
  energy: "#ff7a12",
  wood: "#a35a22",
  stone: "#cfd3d8",
  iron: "#b56a42",
  gem: "#9b4dff",
  shield: "#3d8bff",
  skull: "#ff6b73",
  wild: "#2ec85a",
  knjiga: "#e8c36a",
  znacka: "#e8c36a",
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
  const simbol = Object.keys(TONE).find((k) => src.includes(k));
  return (
    <span
      className={cn(
        "iko",
        zap && "iko-energy",
        zlato && "iko-gold",
        simbol && `iko-${simbol}`,
        SIZES[size],
        className,
      )}
      data-simbol={simbol}
      style={tone ? ({ ["--sym"]: tone } as CSSProperties) : undefined}
      aria-hidden
    >
      <img
        src={artSrc(src)}
        alt=""
        width={PX[size]}
        height={PX[size]}
        loading="lazy"
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