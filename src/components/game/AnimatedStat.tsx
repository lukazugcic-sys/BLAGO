import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimatedStat({
  value,
  className,
  children,
}: {
  value: number;
  className?: string;
  children: ReactNode;
}) {
  const prev = useRef(value);
  const [pop, setPop] = useState(false);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (prev.current === value) return;
    const d = value - prev.current;
    prev.current = value;
    setDelta(d);
    setPop(true);
    const t = setTimeout(() => {
      setPop(false);
      setDelta(0);
    }, 900);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className={cn("header-chip", className, pop && "stat-pop")}>
      {children}
      {pop && delta !== 0 && (
        <span className={cn("stat-delta", delta < 0 && "stat-delta-minus")}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}
