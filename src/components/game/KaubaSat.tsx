import { useSekunda } from "@/lib/game/sat";

function napredak(start: number, kraj: number, sad: number) {
  const span = Math.max(1, kraj - start);
  return Math.max(0, Math.min(1, (sad - start) / span));
}

function kratko(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(s / 60);
  return `${min}:${String(s % 60).padStart(2, "0")}`;
}

export function TrakaGradnje({ start, kraj }: { start: number; kraj: number }) {
  const sad = useSekunda(true);
  return <i style={{ width: `${Math.round(napredak(start, kraj, sad) * 100)}%` }} />;
}

export function RokGradnje({ kraj }: { kraj: number }) {
  const sad = useSekunda(true);
  return <>{`Gradi se ${kratko(kraj - sad)}`}</>;
}
