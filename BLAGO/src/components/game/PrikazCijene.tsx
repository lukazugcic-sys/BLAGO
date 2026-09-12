import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

export function PrikazCijene({
  src,
  iznos,
  trenutno,
}: {
  src: string;
  iznos: number;
  trenutno: number;
}) {
  if (!iznos || iznos <= 0) return null;
  const nedostaje = trenutno < iznos;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold tabular-nums",
        nedostaje ? "bg-ruby/15 text-ruby" : "bg-ink/5 text-ink",
      )}
    >
      <IconBadge src={src} size="xs" />
      {iznos}
    </span>
  );
}
