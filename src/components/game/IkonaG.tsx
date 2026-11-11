import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 0.9.179 (t465u): jedna lebdeća ikona za cijeli GUI — ista kao donji izbornik karte
 * (linijska ikona 24 px, potez 2, ispod tamna deblja kopija 1 px niže umjesto CSS sjene).
 * Natpis (`rijec`) je sitna riječ ispod ikone; pristupačnost nosi gumb (aria-label/title).
 */
export function IkonaG({ ikona: Ikona, rijec, className }: { ikona: LucideIcon; rijec?: string; className?: string }) {
  return (
    <span className={cn("g179-ik", className)} aria-hidden>
      <span className="g179-ik-glif">
        <Ikona className="g179-sjena" strokeWidth={3.6} />
        <Ikona className="g179-glif" strokeWidth={2} />
      </span>
      {rijec ? <span className="g179-rijec">{rijec}</span> : null}
    </span>
  );
}
